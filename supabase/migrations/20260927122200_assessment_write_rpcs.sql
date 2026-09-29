alter table quickscreen_v2.assessments drop constraint if exists assessments_check;
alter table quickscreen_v2.assessments add constraint assessments_correction_guard
  check (length(trim(correction_note)) > 0 or created_at = updated_at or status in ('completed', 'in_progress'));

create or replace function quickscreen_v2.save_assessment_draft(
  p_assessment_id uuid,
  p_note text,
  p_answers jsonb,
  p_notes jsonb
) returns void language plpgsql security invoker set search_path = quickscreen_v2, public as $$
declare
  v_assessment quickscreen_v2.assessments%rowtype;
  v_answer jsonb;
  v_field quickscreen_v2.test_fields%rowtype;
  v_side text;
begin
  select * into v_assessment from quickscreen_v2.assessments
    where assessment_id = p_assessment_id and owner_id = auth.uid() and status = 'in_progress' for update;
  if not found then raise exception 'assessment_not_editable'; end if;
  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_notes, '[]'::jsonb)) <> 'array' then raise exception 'invalid_payload'; end if;

  for v_answer in select value from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) loop
    select f.* into v_field from quickscreen_v2.test_fields f
      join quickscreen_v2.screen_tests st on st.screen_test_id = f.screen_test_id
      where f.test_field_id = v_answer->>'fieldId' and st.screen_type_id = v_assessment.screen_type_id;
    if not found then raise exception 'invalid_test_field'; end if;
    v_side := coalesce(v_answer->>'side', 'none');
    if (v_field.side_mode = 'none' and v_side <> 'none')
      or (v_field.side_mode = 'bilateral' and v_side not in ('left', 'right')) then raise exception 'invalid_answer_side'; end if;
    if not exists (select 1 from quickscreen_v2.answer_options o
      where o.answer_option_id = v_answer->>'answerId' and o.answer_set_id = v_field.answer_set_id and o.is_active) then raise exception 'invalid_answer_option'; end if;
  end loop;

  delete from quickscreen_v2.assessment_answers where assessment_id = p_assessment_id;
  insert into quickscreen_v2.assessment_answers (assessment_id, test_field_id, side, attempt_number, answer_option_id, numeric_value)
  select p_assessment_id, f.test_field_id, coalesce(item->>'side', 'none'), coalesce((item->>'attemptNumber')::smallint, 1), o.answer_option_id, o.numeric_value
  from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
  join quickscreen_v2.test_fields f on f.test_field_id = item->>'fieldId'
  join quickscreen_v2.answer_options o on o.answer_option_id = item->>'answerId';

  delete from quickscreen_v2.assessment_test_notes where assessment_id = p_assessment_id and author_id = auth.uid();
  insert into quickscreen_v2.assessment_test_notes (assessment_id, test_id, author_id, note)
  select p_assessment_id, item->>'testId', auth.uid(), trim(item->>'note')
  from jsonb_array_elements(coalesce(p_notes, '[]'::jsonb)) item
  where length(trim(coalesce(item->>'note', ''))) > 0;

  update quickscreen_v2.assessments set note = coalesce(p_note, '') where assessment_id = p_assessment_id;
end;
$$;

create or replace function quickscreen_v2.complete_assessment_v2(p_assessment_id uuid)
returns jsonb language plpgsql security invoker set search_path = quickscreen_v2, public as $$
declare
  v_assessment quickscreen_v2.assessments%rowtype;
  v_missing text;
  v_total integer;
begin
  select * into v_assessment from quickscreen_v2.assessments
    where assessment_id = p_assessment_id and owner_id = auth.uid() and status = 'in_progress' for update;
  if not found then raise exception 'assessment_not_editable'; end if;

  select f.label_pl into v_missing
  from quickscreen_v2.test_fields f
  join quickscreen_v2.screen_tests st on st.screen_test_id = f.screen_test_id
  where st.screen_type_id = v_assessment.screen_type_id and st.is_active and f.is_scoring_input
    and exists (select 1 from unnest(case when f.side_mode = 'bilateral' then array['left','right']::text[] else array['none']::text[] end) expected(side))
    and not exists (select 1 from unnest(case when f.side_mode = 'bilateral' then array['left','right']::text[] else array['none']::text[] end) expected(side)
      where exists (select 1 from quickscreen_v2.assessment_answers a where a.assessment_id = p_assessment_id and a.test_field_id = f.test_field_id and a.side = expected.side))
  limit 1;
  if v_missing is not null then raise exception 'missing_answer:%', v_missing; end if;

  insert into quickscreen_v2.applied_effects (assessment_id, effect_rule_id, source_answer_id, target_screen_test_id, before_score, after_score, reason_pl)
  select p_assessment_id, rule.effect_rule_id, answer.answer_id, rule.target_screen_test_id,
    coalesce(base.score, 0), rule.effect_value,
    replace(rule.reason_template, '{side}', case answer.side when 'left' then 'lewej' when 'right' then 'prawej' else 'bez wskazania' end)
  from quickscreen_v2.effect_rules rule
  join quickscreen_v2.assessment_answers answer on answer.test_field_id = rule.source_test_field_id
    and answer.assessment_id = p_assessment_id and answer.answer_option_id = rule.trigger_answer_option_id
  left join lateral (
    select case when source_step.calculation_type = 'best_attempt_single' then max(a.numeric_value) else min(a.numeric_value) end as score
    from quickscreen_v2.assessment_answers a
    join quickscreen_v2.test_fields source_field on source_field.test_field_id = a.test_field_id
    join quickscreen_v2.screen_tests source_step on source_step.screen_test_id = source_field.screen_test_id
    where a.assessment_id = p_assessment_id and source_step.screen_test_id = rule.target_screen_test_id
  ) base on true
  where rule.screen_type_id = v_assessment.screen_type_id and rule.is_active
    and (rule.source_side_condition in ('any','none') or rule.source_side_condition = answer.side);

  select coalesce(sum(case when effect.effect_value is not null then effect.effect_value else scores.base_score end), 0)
    into v_total
  from (
    select step.screen_test_id,
      case when step.calculation_type = 'best_attempt_single' then max(answer.numeric_value) else min(answer.numeric_value) end as base_score
    from quickscreen_v2.screen_tests step
    join quickscreen_v2.test_fields field on field.screen_test_id = step.screen_test_id and field.is_scoring_input
    join quickscreen_v2.assessment_answers answer on answer.test_field_id = field.test_field_id and answer.assessment_id = p_assessment_id
    where step.screen_type_id = v_assessment.screen_type_id and step.is_active and step.calculation_type not like 'status%'
    group by step.screen_test_id, step.calculation_type
  ) scores
  left join lateral (select max(effect_value) as effect_value from quickscreen_v2.applied_effects effect
    where effect.assessment_id = p_assessment_id and effect.target_screen_test_id = scores.screen_test_id) effect on true;

  update quickscreen_v2.assessments set status = 'completed', total_score = v_total,
    max_score = (select count(*) * 3 from quickscreen_v2.screen_tests step
      join quickscreen_v2.test_fields field on field.screen_test_id = step.screen_test_id and field.is_scoring_input
      join quickscreen_v2.answer_sets answer_set on answer_set.answer_set_id = field.answer_set_id and answer_set.code = 'score_0_3'
      where step.screen_type_id = v_assessment.screen_type_id and step.is_active)
    where assessment_id = p_assessment_id;
  return jsonb_build_object('assessmentId', p_assessment_id, 'totalScore', v_total);
end;
$$;

alter table quickscreen_v2.assessments disable trigger assessments_validate_owner;

with numeric_scores as (
  select assessment.assessment_id, step.screen_test_id,
    case when step.calculation_type = 'best_attempt_single' then max(answer.numeric_value) else min(answer.numeric_value) end as base_score
  from quickscreen_v2.assessments assessment
  join quickscreen_v2.screen_tests step on step.screen_type_id = assessment.screen_type_id and step.is_active and step.calculation_type not like 'status%'
  join quickscreen_v2.test_fields field on field.screen_test_id = step.screen_test_id and field.is_scoring_input
  join quickscreen_v2.answer_sets answer_set on answer_set.answer_set_id = field.answer_set_id and answer_set.code = 'score_0_3'
  join quickscreen_v2.assessment_answers answer on answer.test_field_id = field.test_field_id and answer.assessment_id = assessment.assessment_id
  where assessment.status = 'completed'
  group by assessment.assessment_id, step.screen_test_id, step.calculation_type
), totals as (
  select score.assessment_id,
    sum(coalesce(effect.after_score, score.base_score))::integer as total_score,
    (count(*) * 3)::integer as max_score
  from numeric_scores score
  left join lateral (select min(applied.after_score) as after_score from quickscreen_v2.applied_effects applied
    where applied.assessment_id = score.assessment_id and applied.target_screen_test_id = score.screen_test_id) effect on true
  group by score.assessment_id
)
update quickscreen_v2.assessments assessment
set total_score = totals.total_score, max_score = totals.max_score
from totals where totals.assessment_id = assessment.assessment_id and assessment.total_score is null;

alter table quickscreen_v2.assessments enable trigger assessments_validate_owner;

revoke all on function quickscreen_v2.save_assessment_draft(uuid,text,jsonb,jsonb) from public, anon;
revoke all on function quickscreen_v2.complete_assessment_v2(uuid) from public, anon;
grant execute on function quickscreen_v2.save_assessment_draft(uuid,text,jsonb,jsonb) to authenticated;
grant execute on function quickscreen_v2.complete_assessment_v2(uuid) to authenticated;

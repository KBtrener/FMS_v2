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
    select case when max(source_step.calculation_type) = 'best_attempt_single' then max(a.numeric_value) else min(a.numeric_value) end as score
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

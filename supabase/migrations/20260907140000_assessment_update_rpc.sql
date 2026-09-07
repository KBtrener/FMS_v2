create or replace function public.update_assessment(
  p_assessment_id uuid,
  p_assessment_date date,
  p_note text,
  p_correction_note text,
  p_answers jsonb,
  p_effects jsonb default '[]'::jsonb
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_answer jsonb;
begin
  if nullif(trim(coalesce(p_correction_note, '')), '') is null then raise exception 'correction_note_required'; end if;
  if not exists (select 1 from public.assessments where assessment_id = p_assessment_id and owner_id = auth.uid()) then raise exception 'assessment_not_found'; end if;
  delete from public.assessment_answers where assessment_id = p_assessment_id;
  delete from public.applied_effects where assessment_id = p_assessment_id;
  update public.assessments set assessment_date = p_assessment_date, note = coalesce(p_note, ''), correction_note = p_correction_note, updated_at = now() where assessment_id = p_assessment_id;
  for v_answer in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) loop
    insert into public.assessment_answers (assessment_id, test_field_id, side, attempt_number, answer_option_id, numeric_value, unit)
    values (p_assessment_id, v_answer->>'testFieldId', coalesce(v_answer->>'side', 'none'), coalesce((v_answer->>'attemptNumber')::smallint, 1), v_answer->>'answerOptionId', nullif(v_answer->>'numericValue','')::integer, nullif(v_answer->>'unit',''));
  end loop;
  for v_answer in select * from jsonb_array_elements(coalesce(p_effects, '[]'::jsonb)) loop
    insert into public.applied_effects (assessment_id, effect_rule_id, source_answer_id, target_screen_test_id, before_score, after_score, reason_pl)
    values (p_assessment_id, v_answer->>'effectRuleId', nullif(v_answer->>'sourceAnswerId','')::uuid, v_answer->>'targetScreenTestId', (v_answer->>'beforeScore')::integer, (v_answer->>'afterScore')::integer, v_answer->>'reasonPl');
  end loop;
  return p_assessment_id;
end;
$$;

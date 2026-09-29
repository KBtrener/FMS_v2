create or replace function quickscreen_v2.edit_assessment_v2(
  p_assessment_id uuid,
  p_assessment_date date,
  p_correction_note text,
  p_answers jsonb,
  p_notes jsonb,
  p_measurements jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer set search_path = quickscreen_v2, public as $$
declare
  v_assessment quickscreen_v2.assessments%rowtype;
  v_result jsonb;
  v_measurement jsonb;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if nullif(trim(coalesce(p_correction_note, '')), '') is null then raise exception 'correction_note_required'; end if;
  select * into v_assessment from quickscreen_v2.assessments
    where assessment_id = p_assessment_id and owner_id = auth.uid() and status = 'completed' for update;
  if not found then raise exception 'assessment_not_found_or_not_complete'; end if;
  if jsonb_typeof(coalesce(p_measurements, '[]'::jsonb)) <> 'array' then raise exception 'invalid_measurements'; end if;
  for v_measurement in select value from jsonb_array_elements(coalesce(p_measurements, '[]'::jsonb)) loop
    if v_measurement->>'measurementCode' not in ('shoulder_hand_length', 'shoulder_fist_gap')
      or coalesce(v_measurement->>'side', '') not in ('none', 'left', 'right')
      or nullif(v_measurement->>'valueCm', '') is null
      or ((v_measurement->>'measurementCode') = 'shoulder_hand_length' and (v_measurement->>'valueCm')::numeric <= 0)
      or ((v_measurement->>'measurementCode') = 'shoulder_fist_gap' and (v_measurement->>'valueCm')::numeric < 0)
      or (v_measurement->>'valueCm')::numeric > 100
      or ((v_measurement->>'measurementCode') = 'shoulder_hand_length' and v_measurement->>'side' <> 'none')
      or ((v_measurement->>'measurementCode') = 'shoulder_fist_gap' and v_measurement->>'side' not in ('left', 'right')) then
      raise exception 'invalid_measurement';
    end if;
  end loop;

  update quickscreen_v2.assessments set status = 'in_progress', assessment_date = p_assessment_date,
    correction_note = trim(p_correction_note), updated_at = now()
    where assessment_id = p_assessment_id;
  delete from quickscreen_v2.applied_effects where assessment_id = p_assessment_id;
  delete from quickscreen_v2.assessment_measurements where assessment_id = p_assessment_id;
  perform quickscreen_v2.save_assessment_draft(p_assessment_id, v_assessment.note, p_answers, p_notes);
  insert into quickscreen_v2.assessment_measurements (assessment_id, measurement_code, side, value_cm)
  select p_assessment_id, item->>'measurementCode', item->>'side', (item->>'valueCm')::numeric
  from jsonb_array_elements(coalesce(p_measurements, '[]'::jsonb)) item;
  select quickscreen_v2.complete_assessment_v2(p_assessment_id) into v_result;
  return v_result || jsonb_build_object('corrected', true);
end;
$$;

revoke all on function quickscreen_v2.edit_assessment_v2(uuid,date,text,jsonb,jsonb,jsonb) from public, anon;
grant execute on function quickscreen_v2.edit_assessment_v2(uuid,date,text,jsonb,jsonb,jsonb) to authenticated;

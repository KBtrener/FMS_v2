create or replace function quickscreen_v2.submit_assessment_sfma(
  p_assessment_id uuid,
  p_client_id uuid,
  p_screen_type_id text,
  p_assessment_date date,
  p_manual_version text,
  p_protocol_data jsonb
) returns jsonb language plpgsql security definer set search_path = quickscreen_v2, public as $$
declare
  v_result jsonb;
begin
  v_result := quickscreen_v2.submit_assessment_v3(
    p_assessment_id, p_client_id, p_screen_type_id, p_assessment_date,
    p_manual_version, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb
  );
  if coalesce((v_result->>'alreadyCompleted')::boolean, false) then return v_result; end if;
  update quickscreen_v2.assessments
    set protocol_data = p_protocol_data, total_score = null, max_score = null
    where assessment_id = p_assessment_id and owner_id = auth.uid() and status = 'completed';
  if not found then raise exception 'assessment_write_failed'; end if;
  return v_result || jsonb_build_object('totalScore', null, 'maximum', null);
end;
$$;

create or replace function quickscreen_v2.edit_assessment_sfma(
  p_assessment_id uuid,
  p_assessment_date date,
  p_correction_note text,
  p_protocol_data jsonb
) returns jsonb language plpgsql security definer set search_path = quickscreen_v2, public as $$
declare
  v_result jsonb;
begin
  v_result := quickscreen_v2.edit_assessment_v3(
    p_assessment_id, p_assessment_date, p_correction_note,
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb
  );
  update quickscreen_v2.assessments
    set protocol_data = p_protocol_data, total_score = null, max_score = null
    where assessment_id = p_assessment_id and owner_id = auth.uid() and status = 'completed';
  if not found then raise exception 'assessment_write_failed'; end if;
  return v_result || jsonb_build_object('totalScore', null, 'maximum', null);
end;
$$;

revoke all on function quickscreen_v2.submit_assessment_sfma(uuid,uuid,text,date,text,jsonb) from public, anon;
revoke all on function quickscreen_v2.edit_assessment_sfma(uuid,date,text,jsonb) from public, anon;
grant execute on function quickscreen_v2.submit_assessment_sfma(uuid,uuid,text,date,text,jsonb) to authenticated;
grant execute on function quickscreen_v2.edit_assessment_sfma(uuid,date,text,jsonb) to authenticated;

create or replace function quickscreen_v2.submit_assessment_v2(
  p_assessment_id uuid,
  p_client_id uuid,
  p_screen_type_id text,
  p_assessment_date date,
  p_manual_version text,
  p_answers jsonb,
  p_notes jsonb
) returns jsonb
language plpgsql security definer set search_path = quickscreen_v2, public as $$
declare
  v_existing quickscreen_v2.assessments%rowtype;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  select * into v_existing from quickscreen_v2.assessments
    where assessment_id = p_assessment_id for update;
  if found then
    if v_existing.owner_id <> auth.uid() then raise exception 'assessment_owner_mismatch'; end if;
    if v_existing.status = 'completed' then
      return jsonb_build_object('assessmentId', p_assessment_id, 'totalScore', v_existing.total_score, 'alreadyCompleted', true);
    end if;
    raise exception 'assessment_id_already_used';
  end if;
  if not exists (select 1 from quickscreen_v2.clients where client_id = p_client_id and owner_id = auth.uid() and not is_archived) then
    raise exception 'client_not_found';
  end if;
  insert into quickscreen_v2.assessments (assessment_id, owner_id, client_id, screen_type_id, assessment_date, manual_version, status)
  values (p_assessment_id, auth.uid(), p_client_id, p_screen_type_id, p_assessment_date, p_manual_version, 'in_progress');
  perform quickscreen_v2.save_assessment_draft(p_assessment_id, '', p_answers, p_notes);
  select quickscreen_v2.complete_assessment_v2(p_assessment_id) into v_result;
  return v_result;
end;
$$;

revoke all on function quickscreen_v2.submit_assessment_v2(uuid,uuid,text,date,text,jsonb,jsonb) from public, anon;
grant execute on function quickscreen_v2.submit_assessment_v2(uuid,uuid,text,date,text,jsonb,jsonb) to authenticated;
revoke all on function quickscreen_v2.save_assessment_draft(uuid,text,jsonb,jsonb) from public, anon, authenticated;
revoke all on function quickscreen_v2.complete_assessment_v2(uuid) from public, anon, authenticated;
revoke insert, update, delete on quickscreen_v2.assessments from authenticated;

-- Remove the seven known abandoned drafts present before this migration.
delete from quickscreen_v2.assessments where status = 'in_progress';

create or replace function quickscreen_v2.delete_completed_assessment(p_assessment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = quickscreen_v2, public
as $$
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if not exists (
    select 1 from quickscreen_v2.assessments
    where assessment_id = p_assessment_id and owner_id = auth.uid() and status = 'completed'
  ) then raise exception 'assessment_not_found'; end if;

  delete from quickscreen_v2.report_instance_sections
  where report_instance_id in (
    select report_instance_id from quickscreen_v2.report_instances where assessment_id = p_assessment_id
  );
  delete from quickscreen_v2.report_instances where assessment_id = p_assessment_id;
  delete from quickscreen_v2.assessments where assessment_id = p_assessment_id and owner_id = auth.uid();
  return true;
end;
$$;

revoke all on function quickscreen_v2.delete_completed_assessment(uuid) from public, anon;
grant execute on function quickscreen_v2.delete_completed_assessment(uuid) to authenticated;

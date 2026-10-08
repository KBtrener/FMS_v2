-- Optional Toe Touch floor distance, stored as raw bilateral measurements.
insert into quickscreen_v2.test_fields (
  test_field_id, screen_test_id, code, label_pl, answer_set_id, side_mode,
  attempt_mode, is_scoring_input, help_text, sort_order, field_type,
  measurement_unit, measurement_min, measurement_step, is_required
) values
('field_toe_touch_distance_cm','screen_test_toe_touch','toe_touch_distance_cm','Odległość od podłoża',null, 'bilateral','single',false,
 'Podaj odległość palców od podłoża. Strona oznacza nogę ustawioną z tyłu.',2,'measurement','cm',0,0.1,false)
on conflict (test_field_id) do update set
  label_pl=excluded.label_pl, side_mode=excluded.side_mode,
  is_scoring_input=false, field_type='measurement', measurement_unit='cm',
  measurement_min=0, measurement_step=0.1, is_required=false,
  help_text=excluded.help_text, sort_order=excluded.sort_order;

-- Transfer a completed assessment and all its dependent records by changing
-- the parent client reference in one database operation.
create or replace function quickscreen_v2.reassign_completed_assessment(
  p_assessment_id uuid,
  p_client_id uuid
) returns jsonb language plpgsql security definer set search_path = quickscreen_v2, public as $$
declare
  v_assessment quickscreen_v2.assessments%rowtype;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  perform 1 from quickscreen_v2.assessments
    where assessment_id=p_assessment_id and owner_id=auth.uid() and status='completed'
    for update;
  if not found then raise exception 'assessment_not_found_or_not_complete'; end if;
  if not exists(select 1 from quickscreen_v2.clients where client_id=p_client_id and owner_id=auth.uid() and not is_archived) then
    raise exception 'client_not_found';
  end if;
  update quickscreen_v2.report_instances set client_id=p_client_id where assessment_id=p_assessment_id;
  update quickscreen_v2.trainer_recommendations set client_id=p_client_id where assessment_id=p_assessment_id;
  update quickscreen_v2.assessments set client_id=p_client_id, updated_at=now()
    where assessment_id=p_assessment_id returning * into v_assessment;
  return jsonb_build_object('assessmentId',v_assessment.assessment_id,'clientId',v_assessment.client_id);
end;
$$;
revoke all on function quickscreen_v2.reassign_completed_assessment(uuid,uuid) from public, anon;
grant execute on function quickscreen_v2.reassign_completed_assessment(uuid,uuid) to authenticated;

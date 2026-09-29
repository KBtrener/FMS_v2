create table quickscreen_v2.assessment_measurements (
  measurement_id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references quickscreen_v2.assessments(assessment_id) on delete cascade,
  measurement_code text not null check (measurement_code in ('shoulder_hand_length', 'shoulder_fist_gap')),
  side text not null check (side in ('none', 'left', 'right')),
  value_cm numeric(6,2) not null check (
    value_cm <= 100 and
    ((measurement_code = 'shoulder_hand_length' and value_cm > 0) or
     (measurement_code = 'shoulder_fist_gap' and value_cm >= 0))
  ),
  created_at timestamptz not null default now(),
  unique (assessment_id, measurement_code, side),
  check (
    (measurement_code = 'shoulder_hand_length' and side = 'none')
    or (measurement_code = 'shoulder_fist_gap' and side in ('left', 'right'))
  )
);

alter table quickscreen_v2.assessment_measurements enable row level security;
grant select on quickscreen_v2.assessment_measurements to authenticated;
create policy assessment_measurements_owner on quickscreen_v2.assessment_measurements
  for all using (exists (
    select 1 from quickscreen_v2.assessments a
    where a.assessment_id = assessment_measurements.assessment_id and a.owner_id = auth.uid()
  )) with check (exists (
    select 1 from quickscreen_v2.assessments a
    where a.assessment_id = assessment_measurements.assessment_id and a.owner_id = auth.uid()
  ));

drop function quickscreen_v2.submit_assessment_v2(uuid,uuid,text,date,text,jsonb,jsonb);

create function quickscreen_v2.submit_assessment_v2(
  p_assessment_id uuid,
  p_client_id uuid,
  p_screen_type_id text,
  p_assessment_date date,
  p_manual_version text,
  p_answers jsonb,
  p_notes jsonb,
  p_measurements jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer set search_path = quickscreen_v2, public as $$
declare
  v_existing quickscreen_v2.assessments%rowtype;
  v_result jsonb;
  v_measurement jsonb;
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

  insert into quickscreen_v2.assessments (assessment_id, owner_id, client_id, screen_type_id, assessment_date, manual_version, status)
  values (p_assessment_id, auth.uid(), p_client_id, p_screen_type_id, p_assessment_date, p_manual_version, 'in_progress');
  perform quickscreen_v2.save_assessment_draft(p_assessment_id, '', p_answers, p_notes);
  insert into quickscreen_v2.assessment_measurements (assessment_id, measurement_code, side, value_cm)
  select p_assessment_id, item->>'measurementCode', item->>'side', (item->>'valueCm')::numeric
  from jsonb_array_elements(coalesce(p_measurements, '[]'::jsonb)) item;
  select quickscreen_v2.complete_assessment_v2(p_assessment_id) into v_result;
  return v_result;
end;
$$;

revoke all on function quickscreen_v2.submit_assessment_v2(uuid,uuid,text,date,text,jsonb,jsonb,jsonb) from public, anon;
grant execute on function quickscreen_v2.submit_assessment_v2(uuid,uuid,text,date,text,jsonb,jsonb,jsonb) to authenticated;

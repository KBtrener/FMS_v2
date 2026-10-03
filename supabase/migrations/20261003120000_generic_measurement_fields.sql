alter table quickscreen_v2.test_fields
  alter column answer_set_id drop not null,
  add column if not exists field_type text not null default 'choice',
  add column if not exists measurement_unit text,
  add column if not exists measurement_min numeric(14,4),
  add column if not exists measurement_max numeric(14,4),
  add column if not exists measurement_step numeric(14,4),
  add column if not exists is_required boolean not null default false;

alter table quickscreen_v2.test_fields
  add constraint test_fields_field_type_check check (field_type in ('choice', 'measurement')),
  add constraint test_fields_measurement_bounds_check check (
    (measurement_min is null or measurement_max is null or measurement_min <= measurement_max)
    and (measurement_step is null or measurement_step > 0)
  ),
  add constraint test_fields_type_definition_check check (
    (field_type = 'choice' and answer_set_id is not null and measurement_unit is null)
    or (field_type = 'measurement' and answer_set_id is null and nullif(trim(measurement_unit), '') is not null and not is_scoring_input)
  );

create table quickscreen_v2.assessment_field_measurements (
  measurement_id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references quickscreen_v2.assessments(assessment_id) on delete cascade,
  test_field_id text not null references quickscreen_v2.test_fields(test_field_id) on delete cascade,
  side text not null default 'none' check (side in ('left', 'right', 'none')),
  attempt_number smallint not null default 1 check (attempt_number between 1 and 3),
  numeric_value numeric(14,4) not null,
  unit text not null check (length(trim(unit)) between 1 and 24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, test_field_id, side, attempt_number)
);

create index assessment_field_measurements_assessment_idx
  on quickscreen_v2.assessment_field_measurements(assessment_id, test_field_id, side);
create trigger assessment_field_measurements_touch before update on quickscreen_v2.assessment_field_measurements
  for each row execute procedure quickscreen_v2.touch_updated_at();
alter table quickscreen_v2.assessment_field_measurements enable row level security;
grant select on quickscreen_v2.assessment_field_measurements to authenticated;
create policy assessment_field_measurements_owner on quickscreen_v2.assessment_field_measurements
  for all using (exists (
    select 1 from quickscreen_v2.assessments a
    where a.assessment_id = assessment_field_measurements.assessment_id and a.owner_id = auth.uid()
  )) with check (exists (
    select 1 from quickscreen_v2.assessments a
    where a.assessment_id = assessment_field_measurements.assessment_id and a.owner_id = auth.uid()
  ));

create or replace function quickscreen_v2.validate_field_measurements(
  p_assessment_id uuid,
  p_screen_type_id text,
  p_field_measurements jsonb
) returns void language plpgsql security invoker set search_path = quickscreen_v2, public as $$
declare
  v_item jsonb;
  v_field quickscreen_v2.test_fields%rowtype;
  v_side text;
  v_attempt smallint;
  v_value numeric;
  v_unit text;
begin
  if jsonb_typeof(coalesce(p_field_measurements, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid_field_measurements';
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_field_measurements, '[]'::jsonb)) loop
    select field.* into v_field
    from quickscreen_v2.test_fields field
    join quickscreen_v2.screen_tests step on step.screen_test_id = field.screen_test_id
    where field.test_field_id = v_item->>'fieldId'
      and field.field_type = 'measurement'
      and step.screen_type_id = p_screen_type_id
      and step.is_active;
    if not found then raise exception 'invalid_measurement_field'; end if;

    v_side := coalesce(v_item->>'side', 'none');
    v_attempt := coalesce(nullif(v_item->>'attemptNumber', '')::smallint, 1);
    v_value := nullif(v_item->>'value', '')::numeric;
    v_unit := nullif(trim(v_item->>'unit'), '');
    if (v_field.side_mode = 'none' and v_side <> 'none')
      or (v_field.side_mode = 'bilateral' and v_side not in ('left', 'right')) then
      raise exception 'invalid_measurement_side';
    end if;
    if v_attempt < 1 or v_attempt > 3 or (v_field.attempt_mode = 'single' and v_attempt <> 1) then
      raise exception 'invalid_measurement_attempt';
    end if;
    if v_value is null or v_unit is distinct from v_field.measurement_unit
      or (v_field.measurement_min is not null and v_value < v_field.measurement_min)
      or (v_field.measurement_max is not null and v_value > v_field.measurement_max) then
      raise exception 'invalid_measurement_value';
    end if;
  end loop;

  if exists (
    select 1
    from quickscreen_v2.screen_tests step
    join quickscreen_v2.test_fields field on field.screen_test_id = step.screen_test_id
    where step.screen_type_id = p_screen_type_id and step.is_active
      and field.field_type = 'measurement' and field.is_required
      and exists (
        select 1
        from unnest(case when field.side_mode = 'bilateral' then array['left', 'right'] else array['none'] end) expected(side)
        where not exists (
          select 1 from quickscreen_v2.assessment_field_measurements answer
          where answer.assessment_id = p_assessment_id and answer.test_field_id = field.test_field_id
            and answer.side = expected.side
        )
      )
  ) then raise exception 'missing_required_measurement'; end if;
end;
$$;

create or replace function quickscreen_v2.submit_assessment_v3(
  p_assessment_id uuid,
  p_client_id uuid,
  p_screen_type_id text,
  p_assessment_date date,
  p_manual_version text,
  p_answers jsonb,
  p_notes jsonb,
  p_field_measurements jsonb default '[]'::jsonb
) returns jsonb language plpgsql security definer set search_path = quickscreen_v2, public as $$
declare
  v_existing quickscreen_v2.assessments%rowtype;
  v_result jsonb;
  v_item jsonb;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  select * into v_existing from quickscreen_v2.assessments where assessment_id = p_assessment_id for update;
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
  for v_item in select value from jsonb_array_elements(coalesce(p_field_measurements, '[]'::jsonb)) loop
    insert into quickscreen_v2.assessment_field_measurements (assessment_id, test_field_id, side, attempt_number, numeric_value, unit)
    values (p_assessment_id, v_item->>'fieldId', coalesce(v_item->>'side', 'none'), coalesce(nullif(v_item->>'attemptNumber', '')::smallint, 1), (v_item->>'value')::numeric, trim(v_item->>'unit'));
  end loop;
  perform quickscreen_v2.validate_field_measurements(p_assessment_id, p_screen_type_id, p_field_measurements);
  select quickscreen_v2.complete_assessment_v2(p_assessment_id) into v_result;
  return v_result;
end;
$$;

create or replace function quickscreen_v2.edit_assessment_v3(
  p_assessment_id uuid,
  p_assessment_date date,
  p_correction_note text,
  p_answers jsonb,
  p_notes jsonb,
  p_field_measurements jsonb default '[]'::jsonb
) returns jsonb language plpgsql security definer set search_path = quickscreen_v2, public as $$
declare
  v_assessment quickscreen_v2.assessments%rowtype;
  v_result jsonb;
  v_item jsonb;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if nullif(trim(coalesce(p_correction_note, '')), '') is null then raise exception 'correction_note_required'; end if;
  select * into v_assessment from quickscreen_v2.assessments
    where assessment_id = p_assessment_id and owner_id = auth.uid() and status = 'completed' for update;
  if not found then raise exception 'assessment_not_found_or_not_complete'; end if;
  update quickscreen_v2.assessments set status = 'in_progress', assessment_date = p_assessment_date,
    correction_note = trim(p_correction_note), updated_at = now()
    where assessment_id = p_assessment_id;
  delete from quickscreen_v2.applied_effects where assessment_id = p_assessment_id;
  delete from quickscreen_v2.assessment_field_measurements where assessment_id = p_assessment_id;
  perform quickscreen_v2.save_assessment_draft(p_assessment_id, v_assessment.note, p_answers, p_notes);
  for v_item in select value from jsonb_array_elements(coalesce(p_field_measurements, '[]'::jsonb)) loop
    insert into quickscreen_v2.assessment_field_measurements (assessment_id, test_field_id, side, attempt_number, numeric_value, unit)
    values (p_assessment_id, v_item->>'fieldId', coalesce(v_item->>'side', 'none'), coalesce(nullif(v_item->>'attemptNumber', '')::smallint, 1), (v_item->>'value')::numeric, trim(v_item->>'unit'));
  end loop;
  perform quickscreen_v2.validate_field_measurements(p_assessment_id, v_assessment.screen_type_id, p_field_measurements);
  select quickscreen_v2.complete_assessment_v2(p_assessment_id) into v_result;
  return v_result || jsonb_build_object('corrected', true);
end;
$$;

revoke all on function quickscreen_v2.validate_field_measurements(uuid,text,jsonb) from public, anon;
revoke all on function quickscreen_v2.submit_assessment_v3(uuid,uuid,text,date,text,jsonb,jsonb,jsonb) from public, anon;
revoke all on function quickscreen_v2.edit_assessment_v3(uuid,date,text,jsonb,jsonb,jsonb) from public, anon;
grant execute on function quickscreen_v2.validate_field_measurements(uuid,text,jsonb) to authenticated;
grant execute on function quickscreen_v2.submit_assessment_v3(uuid,uuid,text,date,text,jsonb,jsonb,jsonb) to authenticated;
grant execute on function quickscreen_v2.edit_assessment_v3(uuid,date,text,jsonb,jsonb,jsonb) to authenticated;

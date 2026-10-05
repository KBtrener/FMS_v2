create table if not exists quickscreen_v2.assessment_additional_tests (
  additional_test_id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references quickscreen_v2.assessments(assessment_id) on delete cascade,
  protocol_code text not null check (protocol_code in ('quick_screen','fms','sfma')),
  test_code text not null check (length(trim(test_code)) between 1 and 120),
  source_version text not null check (length(trim(source_version)) between 1 and 120),
  result jsonb not null,
  side text not null default 'none' check (side in ('left','right','none')),
  measurements jsonb not null default '[]'::jsonb check (jsonb_typeof(measurements) = 'array'),
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now(),
  constraint assessment_additional_tests_unique unique (assessment_id, test_code, side)
);
create index if not exists assessment_additional_tests_history_idx
  on quickscreen_v2.assessment_additional_tests (assessment_id, test_code, side);
alter table quickscreen_v2.assessment_additional_tests enable row level security;
create policy assessment_additional_tests_owner on quickscreen_v2.assessment_additional_tests
  for all using (exists (select 1 from quickscreen_v2.assessments a where a.assessment_id = assessment_additional_tests.assessment_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from quickscreen_v2.assessments a where a.assessment_id = assessment_additional_tests.assessment_id and a.owner_id = auth.uid()));
grant select, insert, update, delete on quickscreen_v2.assessment_additional_tests to authenticated;

create or replace function quickscreen_v2.write_assessment_additional_tests(
  p_assessment_id uuid,
  p_client_id uuid,
  p_screen_type_id text,
  p_assessment_date date,
  p_manual_version text,
  p_answers jsonb,
  p_notes jsonb,
  p_measurements jsonb,
  p_field_measurements jsonb,
  p_protocol_data jsonb,
  p_additional_tests jsonb,
  p_is_edit boolean default false,
  p_correction_note text default null
) returns jsonb language plpgsql security definer set search_path = quickscreen_v2, public as $$
declare
  v_protocol text;
  v_item jsonb;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if jsonb_typeof(coalesce(p_additional_tests, '[]'::jsonb)) <> 'array' then raise exception 'invalid_additional_tests'; end if;
  select code into v_protocol from quickscreen_v2.screen_types where screen_type_id = p_screen_type_id and is_active;
  if not found or v_protocol not in ('quick_screen','fms','sfma') then raise exception 'invalid_protocol'; end if;
  if p_is_edit then
    v_result := case when v_protocol = 'sfma' then
      quickscreen_v2.edit_assessment_sfma(p_assessment_id,p_assessment_date,p_correction_note,coalesce(p_protocol_data,'{}'::jsonb))
      else case when v_protocol = 'quick_screen' then quickscreen_v2.edit_assessment_v2(p_assessment_id,p_assessment_date,p_correction_note,coalesce(p_answers,'[]'::jsonb),coalesce(p_notes,'[]'::jsonb),coalesce(p_measurements,'[]'::jsonb))
      else quickscreen_v2.edit_assessment_v3(p_assessment_id,p_assessment_date,p_correction_note,coalesce(p_answers,'[]'::jsonb),coalesce(p_notes,'[]'::jsonb),coalesce(p_field_measurements,'[]'::jsonb)) end end;
  else
    v_result := case when v_protocol = 'sfma' then
      quickscreen_v2.submit_assessment_sfma(p_assessment_id,p_client_id,p_screen_type_id,p_assessment_date,p_manual_version,coalesce(p_protocol_data,'{}'::jsonb))
      else case when v_protocol = 'quick_screen' then quickscreen_v2.submit_assessment_v2(p_assessment_id,p_client_id,p_screen_type_id,p_assessment_date,p_manual_version,coalesce(p_answers,'[]'::jsonb),coalesce(p_notes,'[]'::jsonb),coalesce(p_measurements,'[]'::jsonb))
      else quickscreen_v2.submit_assessment_v3(p_assessment_id,p_client_id,p_screen_type_id,p_assessment_date,p_manual_version,coalesce(p_answers,'[]'::jsonb),coalesce(p_notes,'[]'::jsonb),coalesce(p_field_measurements,'[]'::jsonb)) end end;
  end if;
  if not coalesce((v_result->>'alreadyCompleted')::boolean, false) then
    delete from quickscreen_v2.assessment_additional_tests where assessment_id = p_assessment_id;
    for v_item in select value from jsonb_array_elements(coalesce(p_additional_tests, '[]'::jsonb)) loop
      if v_item->>'protocolCode' is null or v_item->>'protocolCode' not in ('quick_screen','fms','sfma')
        or nullif(trim(v_item->>'testCode'),'') is null
        or nullif(trim(v_item->>'sourceVersion'),'') is null
        or v_item->'result' is null or jsonb_typeof(v_item->'result') <> 'object'
        or jsonb_typeof(coalesce(v_item->'measurements','[]'::jsonb)) <> 'array'
        or length(coalesce(v_item->>'note','')) > 2000 then raise exception 'invalid_additional_test'; end if;
      if v_item->>'protocolCode' in ('quick_screen','fms') and not exists (
        select 1 from quickscreen_v2.tests t join quickscreen_v2.screen_tests st on st.test_id=t.test_id join quickscreen_v2.screen_types s on s.screen_type_id=st.screen_type_id
        where t.code=v_item->>'testCode' and s.code=v_item->>'protocolCode' and st.is_active and t.is_active
      ) then raise exception 'invalid_additional_test_code'; end if;
      if v_item->>'protocolCode' = 'sfma' and v_item->>'testCode' not in ('sfma_cervicalFlexion','sfma_cervicalRotation','sfma_cervicalExtension','sfma_upperExtPattern1','sfma_upperExtPattern2','sfma_multiSegmentalFlexion','sfma_multiSegmentalExtension','sfma_multiSegmentalRotation','sfma_singleLegStance','sfma_armsDownDeepSquat') then raise exception 'invalid_additional_test_code'; end if;
      insert into quickscreen_v2.assessment_additional_tests(assessment_id,protocol_code,test_code,source_version,result,side,measurements,note)
      values(p_assessment_id,v_item->>'protocolCode',v_item->>'testCode',v_item->>'sourceVersion',v_item->'result',coalesce(v_item->>'side','none'),coalesce(v_item->'measurements','[]'::jsonb),coalesce(v_item->>'note',''));
    end loop;
  end if;
  return v_result;
end;
$$;
revoke all on function quickscreen_v2.write_assessment_additional_tests(uuid,uuid,text,date,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,boolean,text) from public, anon;
grant execute on function quickscreen_v2.write_assessment_additional_tests(uuid,uuid,text,date,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,boolean,text) to authenticated;

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','00000000-0000-0000-0000-000000000000','authenticated','authenticated','generic-protocol@example.invalid','x',now(),now(),now(),'{}','{}');
insert into quickscreen_v2.profiles (id,display_name)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Generic protocol test');
insert into quickscreen_v2.clients (client_id,owner_id,first_name,last_name,email)
values ('dddddddd-1111-4111-8111-dddddddddddd','dddddddd-dddd-4ddd-8ddd-dddddddddddd','Generic','Protocol','generic-protocol-client@example.invalid');

insert into quickscreen_v2.screen_types (screen_type_id,code,name,name_pl,name_en,is_active)
values ('screen_dev_generic','dev_generic','Development protocol fixture','Protokół deweloperski','Development protocol fixture',true);
insert into quickscreen_v2.tests (test_id,code,name,name_pl,name_en,description_short,criteria_summary,is_active)
values ('test_dev_single_score','dev_single_score','Development single score','Wynik deweloperski','Development single score','Test fixture only','Choose one score.',true);
insert into quickscreen_v2.screen_tests (screen_test_id,screen_type_id,test_id,sort_order,calculation_type,is_active)
values ('screen_test_dev_single_score','screen_dev_generic','test_dev_single_score',1,'best_attempt_single',true);
insert into quickscreen_v2.test_fields (test_field_id,screen_test_id,code,label_pl,answer_set_id,side_mode,attempt_mode,is_scoring_input,sort_order)
values ('field_dev_single_score','screen_test_dev_single_score','dev_single_score','Development score','answer_set_score_0_3','none','single',true,1);
insert into quickscreen_v2.test_fields (test_field_id,screen_test_id,code,label_pl,answer_set_id,side_mode,attempt_mode,is_scoring_input,sort_order,field_type,measurement_unit,measurement_min,measurement_max,measurement_step,is_required)
values ('field_dev_angle','screen_test_dev_single_score','dev_angle','Kąt deweloperski',null,'bilateral','single',false,2,'measurement','deg',0,180,0.1,true);

select set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',true);

do $$
declare
  v_result jsonb;
  v_screen_type text;
  v_test_code text;
  v_answer_code text;
  v_status text;
  v_total integer;
  v_max integer;
begin
  v_result := quickscreen_v2.submit_assessment_v3(
    'dddddddd-2222-4222-8222-dddddddddddd',
    'dddddddd-1111-4111-8111-dddddddddddd',
    'screen_dev_generic', current_date, null,
    '[{"fieldId":"field_dev_single_score","side":"none","attemptNumber":1,"answerId":"option_score_2"}]'::jsonb,
    '[{"testId":"test_dev_single_score","note":"fixture save"}]'::jsonb,
    '[{"fieldId":"field_dev_angle","side":"left","attemptNumber":1,"value":42.75,"unit":"deg"},{"fieldId":"field_dev_angle","side":"right","attemptNumber":1,"value":43.25,"unit":"deg"}]'::jsonb
  );
  if (v_result->>'totalScore')::integer <> 2 then raise exception 'generic protocol returned wrong total: %', v_result; end if;

  select a.status::text,a.total_score,a.max_score,st.screen_type_id,t.code,o.code
    into v_status,v_total,v_max,v_screen_type,v_test_code,v_answer_code
  from quickscreen_v2.assessments a
  join quickscreen_v2.screen_types st on st.screen_type_id=a.screen_type_id
  join quickscreen_v2.assessment_answers aa on aa.assessment_id=a.assessment_id
  join quickscreen_v2.test_fields f on f.test_field_id=aa.test_field_id
  join quickscreen_v2.screen_tests step on step.screen_test_id=f.screen_test_id
  join quickscreen_v2.tests t on t.test_id=step.test_id
  join quickscreen_v2.answer_options o on o.answer_option_id=aa.answer_option_id
  where a.assessment_id='dddddddd-2222-4222-8222-dddddddddddd';
  if v_status <> 'completed' or v_total <> 2 or v_max <> 3 then raise exception 'generic completion failed: %, %, %',v_status,v_total,v_max; end if;
  if v_screen_type <> 'screen_dev_generic' or v_test_code <> 'dev_single_score' or v_answer_code <> 'score_2' then
    raise exception 'generic result could not be reopened from catalog data: %, %, %',v_screen_type,v_test_code,v_answer_code;
  end if;
  if (select count(*) from quickscreen_v2.assessment_field_measurements where assessment_id='dddddddd-2222-4222-8222-dddddddddddd' and test_field_id='field_dev_angle' and unit='deg' and numeric_value in (42.75,43.25)) <> 2 then
    raise exception 'decimal measurements were not saved and readable';
  end if;
  if not exists (select 1 from quickscreen_v2.assessment_test_notes where assessment_id='dddddddd-2222-4222-8222-dddddddddddd' and test_id='test_dev_single_score' and note='fixture save') then
    raise exception 'generic protocol note was not saved';
  end if;
end;
$$;

rollback;

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','00000000-0000-0000-0000-000000000000','authenticated','authenticated','assessment-completion@example.invalid','x',now(),now(),now(),'{}','{}');
insert into quickscreen_v2.profiles (id,display_name)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Assessment completion test');
insert into quickscreen_v2.clients (client_id,owner_id,first_name,last_name,email)
values ('cccccccc-1111-4111-8111-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','Assessment','Test','assessment-client@example.invalid');
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
insert into quickscreen_v2.assessments (assessment_id,owner_id,client_id,screen_type_id,assessment_date,status)
values
  ('cccccccc-2222-4222-8222-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','cccccccc-1111-4111-8111-cccccccccccc','screen_quick_screen',current_date,'in_progress'),
  ('cccccccc-3333-4333-8333-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','cccccccc-1111-4111-8111-cccccccccccc','screen_quick_screen',current_date,'in_progress'),
  ('cccccccc-4444-4444-8444-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','cccccccc-1111-4111-8111-cccccccccccc','screen_quick_screen',current_date,'in_progress');

set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);

do $$
declare
  v_answers jsonb;
  v_answers_no_effect jsonb;
  v_incomplete_answers jsonb;
  v_result jsonb;
  v_status text;
  v_total integer;
  v_max integer;
  v_effect_count integer;
begin
  select jsonb_agg(jsonb_build_object(
      'fieldId', field.test_field_id,
      'side', expected.side,
      'attemptNumber', 1,
      'answerId', case
        when field.test_field_id = 'field_shoulder_clearing_upper_pain' and expected.side = 'left' then 'option_positive'
        when answer_set.code = 'score_0_3' then 'option_score_3'
        when answer_set.code = 'pass_fail' then 'option_pass'
        else 'option_negative'
      end
    ) order by field.sort_order, expected.side)
    into v_answers
  from quickscreen_v2.test_fields field
  join quickscreen_v2.screen_tests step on step.screen_test_id = field.screen_test_id and step.is_active
  join quickscreen_v2.answer_sets answer_set on answer_set.answer_set_id = field.answer_set_id
  cross join lateral unnest(case when field.side_mode = 'bilateral' then array['left','right']::text[] else array['none']::text[] end) expected(side)
    where step.screen_type_id = 'screen_quick_screen' and field.is_scoring_input;

  select jsonb_agg(case
      when item->>'fieldId' = 'field_shoulder_clearing_upper_pain' and item->>'side' = 'left'
        then item || jsonb_build_object('answerId','option_negative')
      else item
    end order by item->>'fieldId',item->>'side')
    into v_answers_no_effect
  from jsonb_array_elements(v_answers) item;

  perform quickscreen_v2.save_assessment_draft('cccccccc-2222-4222-8222-cccccccccccc','',v_answers_no_effect,'[]'::jsonb);
  v_result := quickscreen_v2.complete_assessment_v2('cccccccc-2222-4222-8222-cccccccccccc');
  if (v_result->>'totalScore')::integer <> 15 then raise exception 'unexpected score without effect: %', v_result; end if;
  select status::text,total_score,max_score into v_status,v_total,v_max from quickscreen_v2.assessments where assessment_id='cccccccc-2222-4222-8222-cccccccccccc';
  if v_status <> 'completed' or v_total <> 15 or v_max <> 15 then raise exception 'unexpected completed assessment state: %, %, %',v_status,v_total,v_max; end if;

  perform quickscreen_v2.save_assessment_draft('cccccccc-3333-4333-8333-cccccccccccc','',v_answers,'[]'::jsonb);
  v_result := quickscreen_v2.complete_assessment_v2('cccccccc-3333-4333-8333-cccccccccccc');
  if (v_result->>'totalScore')::integer <> 12 then raise exception 'unexpected score with shoulder effect: %', v_result; end if;
  select count(*) into v_effect_count from quickscreen_v2.applied_effects where assessment_id='cccccccc-3333-4333-8333-cccccccccccc' and after_score=0;
  if v_effect_count <> 1 then raise exception 'expected one applied shoulder effect, found %',v_effect_count; end if;

  begin
    perform quickscreen_v2.complete_assessment_v2('cccccccc-3333-4333-8333-cccccccccccc');
    raise exception 'completed assessment was accepted a second time';
  exception when others then
    if sqlerrm = 'completed assessment was accepted a second time' then raise; end if;
    if sqlerrm <> 'assessment_not_editable' then raise; end if;
  end;

  select jsonb_agg(item) into v_incomplete_answers
  from jsonb_array_elements(v_answers) item
  where item->>'fieldId' <> 'field_spine_extension_clearing_pain';
  perform quickscreen_v2.save_assessment_draft('cccccccc-4444-4444-8444-cccccccccccc','',v_incomplete_answers,'[]'::jsonb);
  begin
    perform quickscreen_v2.complete_assessment_v2('cccccccc-4444-4444-8444-cccccccccccc');
    raise exception 'incomplete assessment was accepted';
  exception when others then
    if sqlerrm = 'incomplete assessment was accepted' then raise; end if;
    if sqlerrm not like 'missing_answer:%' then raise; end if;
  end;
  select status::text into v_status from quickscreen_v2.assessments where assessment_id='cccccccc-4444-4444-8444-cccccccccccc';
  if v_status <> 'in_progress' then raise exception 'incomplete assessment did not remain a draft: %',v_status; end if;
end;
$$;

rollback;

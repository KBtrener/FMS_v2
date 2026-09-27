begin;

create or replace function public.validate_owned_relations()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'assessments' and not public.can_access_client(new.client_id) then
    raise exception 'assessment_client_access_denied';
  end if;
  if tg_table_name = 'attachments' then
    if new.client_id is not null and not public.can_access_client(new.client_id) then raise exception 'attachment_client_access_denied'; end if;
    if new.assessment_id is not null and not exists (select 1 from public.assessments a where a.assessment_id = new.assessment_id and public.can_access_client(a.client_id)) then raise exception 'attachment_assessment_access_denied'; end if;
  end if;
  return new;
end;
$$;

create or replace function public.save_assessment(
  p_client_id uuid,
  p_screen_type_id text,
  p_assessment_date date,
  p_note text,
  p_answers jsonb,
  p_effects jsonb default '[]'::jsonb,
  p_manual_version text default null
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := gen_random_uuid(); v_owner uuid := auth.uid(); v_answer jsonb; v_answer_id uuid;
begin
  if not public.can_access_client(p_client_id) then raise exception 'client_not_found'; end if;
  insert into public.assessments (assessment_id, owner_id, client_id, screen_type_id, assessment_date, note, manual_version)
  values (v_id, v_owner, p_client_id, p_screen_type_id, p_assessment_date, coalesce(p_note, ''), nullif(trim(coalesce(p_manual_version, '')), ''));
  for v_answer in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) loop
    insert into public.assessment_answers (assessment_id, test_field_id, side, attempt_number, answer_option_id, numeric_value, unit)
    values (v_id, v_answer->>'testFieldId', coalesce(v_answer->>'side', 'none'), coalesce((v_answer->>'attemptNumber')::smallint, 1), v_answer->>'answerOptionId', nullif(v_answer->>'numericValue','')::integer, nullif(v_answer->>'unit','')) returning answer_id into v_answer_id;
  end loop;
  for v_answer in select * from jsonb_array_elements(coalesce(p_effects, '[]'::jsonb)) loop
    insert into public.applied_effects (assessment_id, effect_rule_id, source_answer_id, target_screen_test_id, before_score, after_score, reason_pl)
    values (v_id, v_answer->>'effectRuleId', nullif(v_answer->>'sourceAnswerId','')::uuid, v_answer->>'targetScreenTestId', (v_answer->>'beforeScore')::integer, (v_answer->>'afterScore')::integer, v_answer->>'reasonPl');
  end loop;
  return v_id;
end;
$$;

grant execute on function public.save_assessment(uuid,text,date,text,jsonb,jsonb,text) to authenticated;
commit;

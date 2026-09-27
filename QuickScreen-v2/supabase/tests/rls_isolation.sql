begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-a@example.invalid','x',now(),now(),now(),'{}','{}'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-b@example.invalid','x',now(),now(),now(),'{}','{}');

set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.clients (client_id,owner_id,first_name,last_name,email)
values ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','User','A','a-client@example.invalid');
insert into public.assessments (assessment_id,owner_id,client_id,screen_type_id,assessment_date)
values ('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','screen_quick_screen',current_date);
insert into public.assessment_answers (answer_id,assessment_id,test_field_id,side,answer_option_id,numeric_value)
values ('aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa','aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','field_squat_score','none','option_score_3',3);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);

do $$ begin
  if exists (select 1 from public.clients where client_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') then raise exception 'RLS leak: user B can read user A client'; end if;
  if exists (select 1 from public.assessments where assessment_id='aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa') then raise exception 'RLS leak: user B can read user A assessment'; end if;
  if exists (select 1 from public.assessment_answers where answer_id='aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa') then raise exception 'RLS leak: user B can read user A answer'; end if;
  begin
    update public.clients set first_name='Hacked' where client_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
    if found then raise exception 'RLS leak: user B can update user A client'; end if;
  end;
  begin
    delete from public.clients where client_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
    if found then raise exception 'RLS leak: user B can delete user A client'; end if;
  end;
  begin
    update public.assessments set note='Hacked' where assessment_id='aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa';
    if found then raise exception 'RLS leak: user B can update user A assessment'; end if;
  end;
  begin
    delete from public.assessment_answers where answer_id='aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
    if found then raise exception 'RLS leak: user B can delete user A answer'; end if;
  end;
  begin
    update public.profiles set role='admin' where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    raise exception 'RLS leak: user B escalated role';
  exception when others then
    if sqlerrm='RLS leak: user B escalated role' then raise; end if;
  end;
end $$;

insert into public.clients (client_id,owner_id,first_name,last_name,email)
values ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','User','B','b-client@example.invalid');

do $$ begin
  begin
    insert into public.assessments (owner_id,client_id,screen_type_id,assessment_date)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','screen_quick_screen',current_date);
    raise exception 'RLS leak: cross-owner assessment accepted';
  exception when others then
    if sqlerrm='RLS leak: cross-owner assessment accepted' then raise; end if;
  end;
end $$;

insert into storage.objects (bucket_id,name,owner_id,metadata)
values ('assessment-files','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/test.txt','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{}');

select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$ begin
  if exists (select 1 from storage.objects where name='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/test.txt') then raise exception 'RLS leak: user A can read user B file'; end if;
end $$;

rollback;

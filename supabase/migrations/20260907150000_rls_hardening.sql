alter table public.screen_types enable row level security;
alter table public.tests enable row level security;
alter table public.screen_tests enable row level security;
alter table public.answer_sets enable row level security;
alter table public.answer_options enable row level security;
alter table public.test_fields enable row level security;
alter table public.effect_rules enable row level security;

drop policy if exists profiles_self on public.profiles;
create policy profiles_select_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then raise exception 'role_change_forbidden'; end if;
  return new;
end;
$$;
create trigger profiles_protect_role before update on public.profiles for each row execute procedure public.protect_profile_role();

create policy effect_rules_admin_update on public.effect_rules for update to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create or replace function public.validate_owned_relations()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'assessments' and not exists (
    select 1 from public.clients where client_id = new.client_id and owner_id = new.owner_id
  ) then raise exception 'assessment_owner_mismatch'; end if;
  if tg_table_name = 'attachments' then
    if new.client_id is not null and not exists (select 1 from public.clients where client_id = new.client_id and owner_id = new.owner_id) then raise exception 'attachment_client_owner_mismatch'; end if;
    if new.assessment_id is not null and not exists (select 1 from public.assessments where assessment_id = new.assessment_id and owner_id = new.owner_id) then raise exception 'attachment_assessment_owner_mismatch'; end if;
  end if;
  return new;
end;
$$;
create trigger assessments_validate_owner before insert or update on public.assessments for each row execute procedure public.validate_owned_relations();
create trigger attachments_validate_owner before insert or update on public.attachments for each row execute procedure public.validate_owned_relations();

revoke all on function public.save_assessment(uuid,text,date,text,jsonb,jsonb) from public, anon;
revoke all on function public.update_assessment(uuid,date,text,text,jsonb,jsonb) from public, anon;
grant execute on function public.save_assessment(uuid,text,date,text,jsonb,jsonb) to authenticated;
grant execute on function public.update_assessment(uuid,date,text,text,jsonb,jsonb) to authenticated;

revoke insert, update, delete on public.screen_types, public.tests, public.screen_tests, public.answer_sets, public.answer_options, public.test_fields from anon, authenticated;
revoke insert, delete on public.effect_rules from anon, authenticated;

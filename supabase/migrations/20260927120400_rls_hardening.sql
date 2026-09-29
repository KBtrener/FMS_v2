alter table quickscreen_v2.screen_types enable row level security;
alter table quickscreen_v2.tests enable row level security;
alter table quickscreen_v2.screen_tests enable row level security;
alter table quickscreen_v2.answer_sets enable row level security;
alter table quickscreen_v2.answer_options enable row level security;
alter table quickscreen_v2.test_fields enable row level security;
alter table quickscreen_v2.effect_rules enable row level security;

drop policy if exists profiles_self on quickscreen_v2.profiles;
create policy profiles_select_self on quickscreen_v2.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_self on quickscreen_v2.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function quickscreen_v2.protect_profile_role()
returns trigger language plpgsql security definer set search_path = quickscreen_v2, public as $$
begin
  if new.role is distinct from old.role and not exists (
    select 1 from quickscreen_v2.profiles where id = auth.uid() and role = 'admin'
  ) then raise exception 'role_change_forbidden'; end if;
  return new;
end;
$$;
create trigger profiles_protect_role before update on quickscreen_v2.profiles for each row execute procedure quickscreen_v2.protect_profile_role();

create policy effect_rules_admin_update on quickscreen_v2.effect_rules for update to authenticated
using (exists (select 1 from quickscreen_v2.profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from quickscreen_v2.profiles where id = auth.uid() and role = 'admin'));

create or replace function quickscreen_v2.validate_owned_relations()
returns trigger language plpgsql security definer set search_path = quickscreen_v2, public as $$
begin
  if tg_table_name = 'assessments' and not exists (
    select 1 from quickscreen_v2.clients where client_id = new.client_id and owner_id = new.owner_id
  ) then raise exception 'assessment_owner_mismatch'; end if;
  if tg_table_name = 'attachments' then
    if new.client_id is not null and not exists (select 1 from quickscreen_v2.clients where client_id = new.client_id and owner_id = new.owner_id) then raise exception 'attachment_client_owner_mismatch'; end if;
    if new.assessment_id is not null and not exists (select 1 from quickscreen_v2.assessments where assessment_id = new.assessment_id and owner_id = new.owner_id) then raise exception 'attachment_assessment_owner_mismatch'; end if;
  end if;
  return new;
end;
$$;
create trigger assessments_validate_owner before insert or update on quickscreen_v2.assessments for each row execute procedure quickscreen_v2.validate_owned_relations();
create trigger attachments_validate_owner before insert or update on quickscreen_v2.attachments for each row execute procedure quickscreen_v2.validate_owned_relations();

revoke all on function quickscreen_v2.save_assessment(uuid,text,date,text,jsonb,jsonb) from public, anon;
revoke all on function quickscreen_v2.update_assessment(uuid,date,text,text,jsonb,jsonb) from public, anon;
grant execute on function quickscreen_v2.save_assessment(uuid,text,date,text,jsonb,jsonb) to authenticated;
grant execute on function quickscreen_v2.update_assessment(uuid,date,text,text,jsonb,jsonb) to authenticated;

revoke insert, update, delete on quickscreen_v2.screen_types, quickscreen_v2.tests, quickscreen_v2.screen_tests, quickscreen_v2.answer_sets, quickscreen_v2.answer_options, quickscreen_v2.test_fields from anon, authenticated;
revoke insert, delete on quickscreen_v2.effect_rules from anon, authenticated;

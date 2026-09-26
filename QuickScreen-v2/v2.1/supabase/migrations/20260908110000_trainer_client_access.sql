begin;

create table if not exists public.trainer_client_access (
  access_id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(client_id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  is_active boolean not null default true,
  unique (client_id, trainer_id)
);

create index if not exists trainer_client_access_trainer_idx on public.trainer_client_access(trainer_id, is_active);
create index if not exists trainer_client_access_client_idx on public.trainer_client_access(client_id, is_active);
alter table public.trainer_client_access enable row level security;

create or replace function public.is_team_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists trainer_client_access_select on public.trainer_client_access;
create policy trainer_client_access_select on public.trainer_client_access for select to authenticated
using (trainer_id = auth.uid() or assigned_by = auth.uid() or public.is_team_admin());
drop policy if exists trainer_client_access_admin_write on public.trainer_client_access;
create policy trainer_client_access_admin_write on public.trainer_client_access for all to authenticated
using (public.is_team_admin()) with check (public.is_team_admin());

create or replace function public.can_access_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.clients where client_id = p_client_id and owner_id = auth.uid())
      or exists (select 1 from public.trainer_client_access where client_id = p_client_id and trainer_id = auth.uid() and is_active);
$$;

drop policy if exists clients_owner on public.clients;
create policy clients_owner on public.clients for all to authenticated
using (owner_id = auth.uid() or public.can_access_client(client_id))
with check (owner_id = auth.uid() or public.can_access_client(client_id) or public.is_team_admin());
drop policy if exists assessments_owner on public.assessments;
create policy assessments_owner on public.assessments for all to authenticated
using (owner_id = auth.uid() or public.can_access_client(client_id))
with check (owner_id = auth.uid() or public.can_access_client(client_id));
drop policy if exists answers_owner on public.assessment_answers;
create policy answers_owner on public.assessment_answers for all to authenticated
using (exists (select 1 from public.assessments a where a.assessment_id = assessment_answers.assessment_id and public.can_access_client(a.client_id)))
with check (exists (select 1 from public.assessments a where a.assessment_id = assessment_answers.assessment_id and public.can_access_client(a.client_id)));
drop policy if exists effects_owner on public.applied_effects;
create policy effects_owner on public.applied_effects for all to authenticated
using (exists (select 1 from public.assessments a where a.assessment_id = applied_effects.assessment_id and public.can_access_client(a.client_id)))
with check (exists (select 1 from public.assessments a where a.assessment_id = applied_effects.assessment_id and public.can_access_client(a.client_id)));
drop policy if exists attachments_owner on public.attachments;
create policy attachments_owner on public.attachments for all to authenticated
using (owner_id = auth.uid() or (client_id is not null and public.can_access_client(client_id)))
with check (owner_id = auth.uid() or (client_id is not null and public.can_access_client(client_id)));

create or replace function public.list_assignable_trainers()
returns table (trainer_id uuid, display_name text, email text)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, u.email::text
  from public.profiles p join auth.users u on u.id = p.id
  where public.is_team_admin() and p.role = 'trainer'
  order by coalesce(p.display_name, u.email);
$$;
revoke all on function public.list_assignable_trainers() from public, anon;
grant execute on function public.list_assignable_trainers() to authenticated;

grant select, insert, update, delete on public.trainer_client_access to authenticated;

commit;

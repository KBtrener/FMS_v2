begin;

create table if not exists public.trainer_certifications (
  certification_id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  issuer text not null default '',
  credential_number text not null default '',
  issued_on date,
  expires_on date,
  is_active boolean not null default true,
  sort_order integer not null default 1 check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_disciplines (
  client_discipline_id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(client_id) on delete cascade,
  discipline text not null check (length(trim(discipline)) > 0),
  level text not null default '',
  organization text not null default '',
  is_primary boolean not null default false,
  sort_order integer not null default 1 check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, discipline)
);

create index if not exists trainer_certifications_trainer_idx on public.trainer_certifications(trainer_id, is_active, sort_order);
create index if not exists client_disciplines_client_idx on public.client_disciplines(client_id, sort_order);

drop trigger if exists trainer_certifications_touch on public.trainer_certifications;
create trigger trainer_certifications_touch before update on public.trainer_certifications
  for each row execute procedure public.touch_updated_at();
drop trigger if exists client_disciplines_touch on public.client_disciplines;
create trigger client_disciplines_touch before update on public.client_disciplines
  for each row execute procedure public.touch_updated_at();

alter table public.trainer_certifications enable row level security;
alter table public.client_disciplines enable row level security;

drop policy if exists trainer_certifications_owner_all on public.trainer_certifications;
create policy trainer_certifications_owner_all on public.trainer_certifications
  for all to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
drop policy if exists client_disciplines_owner_all on public.client_disciplines;
create policy client_disciplines_owner_all on public.client_disciplines
  for all to authenticated using (exists (select 1 from public.clients c where c.client_id = client_disciplines.client_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.clients c where c.client_id = client_disciplines.client_id and c.owner_id = auth.uid()));

grant select, insert, update, delete on public.trainer_certifications, public.client_disciplines to authenticated;

commit;

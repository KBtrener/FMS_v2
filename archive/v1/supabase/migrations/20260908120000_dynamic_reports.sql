begin;

create table if not exists public.report_profiles (
  profile_code text primary key check (profile_code in ('free_current_result','assessment_report','full_coaching_report')),
  name_pl text not null,
  section_codes text[] not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.report_profiles (profile_code, name_pl, section_codes) values
  ('free_current_result','Bieżący wynik',array['report_header','executive_summary','latest_assessment','priority_findings','methodology']),
  ('assessment_report','Raport badania',array['report_header','executive_summary','latest_assessment','priority_findings','test_descriptions','methodology','trainer_signature']),
  ('full_coaching_report','Pełny raport trenerski',array['report_header','executive_summary','latest_assessment','priority_findings','test_descriptions','history','recommendations','next_steps','methodology','trainer_signature'])
on conflict (profile_code) do update set name_pl=excluded.name_pl, section_codes=excluded.section_codes;

create table if not exists public.client_services (
  client_service_id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(client_id) on delete cascade,
  report_profile_code text not null references public.report_profiles(profile_code),
  service_name text not null,
  granted_by uuid not null references public.profiles(id) on delete restrict,
  valid_from date not null default current_date,
  valid_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_until >= valid_from)
);

create table if not exists public.trainer_recommendations (
  recommendation_id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(client_id) on delete cascade,
  assessment_id uuid not null references public.assessments(assessment_id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  test_id text references public.tests(test_id) on delete set null,
  category text not null default 'movement',
  priority smallint not null default 2 check (priority between 1 and 3),
  content text not null check (length(trim(content)) > 0),
  frequency text not null default '',
  duration text not null default '',
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_instances (
  report_instance_id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(client_id) on delete restrict,
  assessment_id uuid not null references public.assessments(assessment_id) on delete restrict,
  trainer_id uuid not null references public.profiles(id) on delete restrict,
  report_profile_code text not null references public.report_profiles(profile_code),
  manual_extensions text[] not null default '{}',
  manual_version text,
  generator_version text not null,
  snapshot jsonb not null,
  generated_at timestamptz not null default now(),
  pdf_storage_path text,
  document_status text not null default 'generating' check (document_status in ('generating','ready','failed')),
  check (jsonb_typeof(snapshot) = 'object')
);

create table if not exists public.report_instance_sections (
  report_instance_id uuid not null references public.report_instances(report_instance_id) on delete restrict,
  section_code text not null,
  sort_order integer not null check (sort_order > 0),
  primary key (report_instance_id, section_code)
);

create index if not exists client_services_client_idx on public.client_services(client_id, is_active);
create index if not exists recommendations_assessment_idx on public.trainer_recommendations(assessment_id, status, priority);
create index if not exists report_instances_client_idx on public.report_instances(client_id, generated_at desc);

drop trigger if exists report_profiles_touch on public.report_profiles;
create trigger report_profiles_touch before update on public.report_profiles for each row execute procedure public.touch_updated_at();
drop trigger if exists recommendations_touch on public.trainer_recommendations;
create trigger recommendations_touch before update on public.trainer_recommendations for each row execute procedure public.touch_updated_at();

create or replace function public.prevent_final_report_mutation()
returns trigger language plpgsql as $$
begin
  if old.document_status = 'ready' then raise exception 'final_report_is_immutable'; end if;
  if new.snapshot is distinct from old.snapshot or new.client_id is distinct from old.client_id or new.assessment_id is distinct from old.assessment_id or new.report_profile_code is distinct from old.report_profile_code then raise exception 'report_snapshot_is_immutable'; end if;
  return new;
end;
$$;
drop trigger if exists report_instances_immutable on public.report_instances;
create trigger report_instances_immutable before update on public.report_instances for each row execute procedure public.prevent_final_report_mutation();

alter table public.report_profiles enable row level security;
alter table public.client_services enable row level security;
alter table public.trainer_recommendations enable row level security;
alter table public.report_instances enable row level security;
alter table public.report_instance_sections enable row level security;

create policy report_profiles_read on public.report_profiles for select to authenticated using (is_active);
create policy client_services_access on public.client_services for select to authenticated using (public.can_access_client(client_id));
create policy client_services_admin_write on public.client_services for all to authenticated using (public.is_team_admin()) with check (public.is_team_admin());
create policy recommendations_access on public.trainer_recommendations for select to authenticated using (public.can_access_client(client_id));
create policy recommendations_write on public.trainer_recommendations for insert to authenticated with check (author_id=auth.uid() and public.can_access_client(client_id) and exists(select 1 from public.assessments a where a.assessment_id=trainer_recommendations.assessment_id and a.client_id=trainer_recommendations.client_id));
create policy recommendations_author_update on public.trainer_recommendations for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid() and public.can_access_client(client_id));
create policy report_instances_access on public.report_instances for select to authenticated using (public.can_access_client(client_id));
create policy report_instances_create on public.report_instances for insert to authenticated with check (trainer_id=auth.uid() and public.can_access_client(client_id) and exists(select 1 from public.assessments a where a.assessment_id=report_instances.assessment_id and a.client_id=report_instances.client_id and a.status='completed'));
create policy report_instances_finalize on public.report_instances for update to authenticated using (trainer_id=auth.uid() and document_status='generating') with check (trainer_id=auth.uid() and public.can_access_client(client_id));
create policy report_sections_access on public.report_instance_sections for select to authenticated using (exists(select 1 from public.report_instances r where r.report_instance_id=report_instance_sections.report_instance_id and public.can_access_client(r.client_id)));
create policy report_sections_create on public.report_instance_sections for insert to authenticated with check (exists(select 1 from public.report_instances r where r.report_instance_id=report_instance_sections.report_instance_id and r.trainer_id=auth.uid() and r.document_status='generating'));

grant select on public.report_profiles to authenticated;
grant select,insert,update,delete on public.client_services to authenticated;
grant select,insert,update on public.trainer_recommendations to authenticated;
grant select,insert,update on public.report_instances to authenticated;
grant select,insert on public.report_instance_sections to authenticated;

insert into storage.buckets (id,name,public) values ('report-pdfs','report-pdfs',false) on conflict (id) do nothing;
create policy report_pdf_select on storage.objects for select to authenticated using (bucket_id='report-pdfs' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.report_instances r where r.pdf_storage_path=name and public.can_access_client(r.client_id))));
create policy report_pdf_insert on storage.objects for insert to authenticated with check (bucket_id='report-pdfs' and (storage.foldername(name))[1]=auth.uid()::text);

commit;

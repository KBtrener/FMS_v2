begin;

create table if not exists quickscreen_v2.report_settings (
  trainer_id uuid primary key references quickscreen_v2.profiles(id) on delete cascade,
  block_visibility jsonb not null default '{"intro":true,"results":true,"plan":true,"help":true}'::jsonb,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(block_visibility) = 'object')
);

create table if not exists quickscreen_v2.report_resources (
  resource_id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references quickscreen_v2.profiles(id) on delete cascade,
  test_code text,
  resource_type text not null check (resource_type in ('youtube','trainerize','other')),
  title text not null check (length(trim(title)) > 0),
  url text not null check (url ~* '^https://'),
  description text not null default '',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists report_resources_trainer_idx on quickscreen_v2.report_resources(trainer_id, is_active, sort_order);

drop trigger if exists report_settings_touch on quickscreen_v2.report_settings;
create trigger report_settings_touch before update on quickscreen_v2.report_settings for each row execute procedure quickscreen_v2.touch_updated_at();
drop trigger if exists report_resources_touch on quickscreen_v2.report_resources;
create trigger report_resources_touch before update on quickscreen_v2.report_resources for each row execute procedure quickscreen_v2.touch_updated_at();

alter table quickscreen_v2.report_settings enable row level security;
alter table quickscreen_v2.report_resources enable row level security;

create policy report_settings_owner on quickscreen_v2.report_settings for all to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
create policy report_resources_owner on quickscreen_v2.report_resources for all to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

grant select, insert, update on quickscreen_v2.report_settings to authenticated;
grant select, insert, update on quickscreen_v2.report_resources to authenticated;

commit;

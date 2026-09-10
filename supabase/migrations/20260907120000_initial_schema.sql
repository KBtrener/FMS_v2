create extension if not exists pgcrypto;

create type public.user_role as enum ('trainer', 'admin');
create type public.assessment_status as enum ('completed', 'archived');
create type public.side_mode as enum ('none', 'bilateral');
create type public.effect_type as enum ('set_final_score');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.user_role not null default 'trainer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.screen_types (
  screen_type_id text primary key,
  code text not null unique,
  name text not null,
  is_active boolean not null default true
);

create table public.tests (
  test_id text primary key,
  code text not null unique,
  name text not null,
  description_short text not null default '',
  criteria_summary text not null default '',
  source_reference text not null default '',
  is_active boolean not null default true
);

create table public.screen_tests (
  screen_test_id text primary key,
  screen_type_id text not null references public.screen_types(screen_type_id),
  test_id text not null references public.tests(test_id),
  sort_order integer not null check (sort_order > 0),
  calculation_type text not null,
  is_active boolean not null default true,
  parent_screen_test_id text references public.screen_tests(screen_test_id),
  unique (screen_type_id, test_id),
  unique (screen_type_id, sort_order)
);

create table public.answer_sets (
  answer_set_id text primary key,
  code text not null unique,
  name text not null,
  value_kind text not null,
  is_active boolean not null default true
);

create table public.answer_options (
  answer_option_id text primary key,
  answer_set_id text not null references public.answer_sets(answer_set_id) on delete cascade,
  code text not null,
  label_pl text not null,
  numeric_value integer check (numeric_value is null or numeric_value between 0 and 3),
  sort_order integer not null,
  is_active boolean not null default true,
  unique (answer_set_id, code)
);

create table public.test_fields (
  test_field_id text primary key,
  screen_test_id text not null references public.screen_tests(screen_test_id) on delete cascade,
  code text not null unique,
  label_pl text not null,
  answer_set_id text not null references public.answer_sets(answer_set_id),
  side_mode public.side_mode not null default 'none',
  attempt_mode text not null default 'single',
  is_scoring_input boolean not null default false,
  help_text text not null default '',
  sort_order integer not null,
  unique (screen_test_id, sort_order)
);

create table public.effect_rules (
  effect_rule_id text primary key,
  screen_type_id text not null references public.screen_types(screen_type_id),
  source_test_field_id text not null references public.test_fields(test_field_id),
  trigger_answer_option_id text not null references public.answer_options(answer_option_id),
  source_side_condition text not null check (source_side_condition in ('none', 'any', 'same_side', 'left', 'right')),
  target_screen_test_id text not null references public.screen_tests(screen_test_id),
  effect_type public.effect_type not null,
  effect_value integer not null check (effect_value between 0 and 3),
  is_active boolean not null default true,
  reason_template text not null
);

create table public.clients (
  client_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  legacy_client_id text,
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  email text not null check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessments (
  assessment_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  client_id uuid not null references public.clients(client_id) on delete restrict,
  legacy_assessment_id text,
  screen_type_id text not null references public.screen_types(screen_type_id),
  assessment_date date not null,
  completed_at timestamptz not null default now(),
  note text not null default '',
  status public.assessment_status not null default 'completed',
  correction_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(correction_note)) > 0 or created_at = updated_at or status = 'completed')
);

create table public.assessment_answers (
  answer_id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(assessment_id) on delete cascade,
  test_field_id text not null references public.test_fields(test_field_id),
  side text not null default 'none' check (side in ('left', 'right', 'none')),
  attempt_number smallint not null default 1 check (attempt_number between 1 and 3),
  answer_option_id text not null references public.answer_options(answer_option_id),
  numeric_value integer check (numeric_value is null or numeric_value between 0 and 3),
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, test_field_id, side, attempt_number)
);

create table public.applied_effects (
  applied_effect_id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(assessment_id) on delete cascade,
  effect_rule_id text not null references public.effect_rules(effect_rule_id),
  source_answer_id uuid references public.assessment_answers(answer_id) on delete set null,
  target_screen_test_id text not null references public.screen_tests(screen_test_id),
  before_score integer not null check (before_score between 0 and 3),
  after_score integer not null check (after_score between 0 and 3),
  reason_pl text not null,
  created_at timestamptz not null default now()
);

create table public.attachments (
  attachment_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  client_id uuid references public.clients(client_id) on delete cascade,
  assessment_id uuid references public.assessments(assessment_id) on delete cascade,
  bucket_id text not null default 'assessment-files',
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  byte_size bigint check (byte_size is null or byte_size >= 0),
  created_at timestamptz not null default now(),
  check (client_id is not null or assessment_id is not null)
);

create index clients_owner_name_idx on public.clients(owner_id, last_name, first_name);
create index clients_owner_email_idx on public.clients(owner_id, lower(email));
create index assessments_client_date_idx on public.assessments(client_id, assessment_date desc);
create index assessments_owner_status_idx on public.assessments(owner_id, status);
create index answers_assessment_idx on public.assessment_answers(assessment_id);
create index effects_assessment_idx on public.applied_effects(assessment_id);
create index attachments_owner_idx on public.attachments(owner_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute procedure public.touch_updated_at();
create trigger clients_touch before update on public.clients for each row execute procedure public.touch_updated_at();
create trigger assessments_touch before update on public.assessments for each row execute procedure public.touch_updated_at();
create trigger answers_touch before update on public.assessment_answers for each row execute procedure public.touch_updated_at();

create or replace function public.is_owner(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and id = uid);
$$;

create or replace function public.save_assessment(
  p_client_id uuid,
  p_screen_type_id text,
  p_assessment_date date,
  p_note text,
  p_answers jsonb,
  p_effects jsonb default '[]'::jsonb
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := gen_random_uuid();
  v_owner uuid := auth.uid();
  v_answer jsonb;
  v_answer_id uuid;
begin
  if not exists (select 1 from public.clients where client_id = p_client_id and owner_id = v_owner and not is_archived) then
    raise exception 'client_not_found';
  end if;
  insert into public.assessments (assessment_id, owner_id, client_id, screen_type_id, assessment_date, note)
  values (v_id, v_owner, p_client_id, p_screen_type_id, p_assessment_date, coalesce(p_note, ''));
  for v_answer in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) loop
    insert into public.assessment_answers (assessment_id, test_field_id, side, attempt_number, answer_option_id, numeric_value, unit)
    values (v_id, v_answer->>'testFieldId', coalesce(v_answer->>'side', 'none'), coalesce((v_answer->>'attemptNumber')::smallint, 1), v_answer->>'answerOptionId', nullif(v_answer->>'numericValue','')::integer, nullif(v_answer->>'unit',''))
    returning answer_id into v_answer_id;
  end loop;
  for v_answer in select * from jsonb_array_elements(coalesce(p_effects, '[]'::jsonb)) loop
    insert into public.applied_effects (assessment_id, effect_rule_id, source_answer_id, target_screen_test_id, before_score, after_score, reason_pl)
    values (v_id, v_answer->>'effectRuleId', nullif(v_answer->>'sourceAnswerId','')::uuid, v_answer->>'targetScreenTestId', (v_answer->>'beforeScore')::integer, (v_answer->>'afterScore')::integer, v_answer->>'reasonPl');
  end loop;
  return v_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.applied_effects enable row level security;
alter table public.attachments enable row level security;

create policy profiles_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy clients_owner on public.clients for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy assessments_owner on public.assessments for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy answers_owner on public.assessment_answers for all using (exists (select 1 from public.assessments a where a.assessment_id = assessment_id and a.owner_id = auth.uid())) with check (exists (select 1 from public.assessments a where a.assessment_id = assessment_id and a.owner_id = auth.uid()));
create policy effects_owner on public.applied_effects for all using (exists (select 1 from public.assessments a where a.assessment_id = assessment_id and a.owner_id = auth.uid())) with check (exists (select 1 from public.assessments a where a.assessment_id = assessment_id and a.owner_id = auth.uid()));
create policy attachments_owner on public.attachments for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy config_authenticated_read on public.screen_types for select to authenticated using (is_active);
create policy config_authenticated_read on public.tests for select to authenticated using (is_active);
create policy config_authenticated_read on public.screen_tests for select to authenticated using (is_active);
create policy config_authenticated_read on public.answer_sets for select to authenticated using (is_active);
create policy config_authenticated_read on public.answer_options for select to authenticated using (is_active);
create policy config_authenticated_read on public.test_fields for select to authenticated using (true);
create policy config_authenticated_read on public.effect_rules for select to authenticated using (true);

insert into storage.buckets (id, name, public) values ('assessment-files', 'assessment-files', false) on conflict (id) do nothing;
create policy storage_owner_select on storage.objects for select to authenticated using (bucket_id = 'assessment-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy storage_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'assessment-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy storage_owner_update on storage.objects for update to authenticated using (bucket_id = 'assessment-files' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'assessment-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy storage_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'assessment-files' and (storage.foldername(name))[1] = auth.uid()::text);

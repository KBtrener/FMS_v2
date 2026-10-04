create table if not exists quickscreen_v2.sfma_measurement_rules (
  measurement_key text primary key,
  unit text not null check (unit in ('deg')),
  operator text not null check (operator in ('gt','gte','lt','lte')),
  threshold numeric not null check (threshold >= 0 and threshold <= 360),
  result_code text not null check (result_code in ('FN','FP','DN','DP')),
  otherwise_result_code text check (otherwise_result_code is null or otherwise_result_code in ('FN','FP','DN','DP')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfma_measurement_key_format check (measurement_key ~ '^[A-Za-z0-9_-]+\|[A-Za-z0-9_-]+\|[0-9]+\|[A-Za-z0-9_-]+\|(left|right)?$')
);

create unique index if not exists sfma_measurement_rules_one_active_result
  on quickscreen_v2.sfma_measurement_rules (
    split_part(measurement_key, '|', 1),
    split_part(measurement_key, '|', 2),
    split_part(measurement_key, '|', 3),
    split_part(measurement_key, '|', 5)
  ) where is_active;

alter table quickscreen_v2.sfma_measurement_rules enable row level security;
create policy sfma_measurement_rules_select on quickscreen_v2.sfma_measurement_rules
  for select to authenticated using (true);
create policy sfma_measurement_rules_admin_write on quickscreen_v2.sfma_measurement_rules
  for all to authenticated
  using (exists (select 1 from quickscreen_v2.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from quickscreen_v2.profiles where id = auth.uid() and role = 'admin'));
revoke all on quickscreen_v2.sfma_measurement_rules from public, anon;
grant select on quickscreen_v2.sfma_measurement_rules to authenticated;
grant insert, update, delete on quickscreen_v2.sfma_measurement_rules to authenticated;

comment on table quickscreen_v2.sfma_measurement_rules is
  'Optional explicit rules for deriving an SFMA classification from a captured measurement. No rule is inferred from a standard alone.';
comment on column quickscreen_v2.sfma_measurement_rules.measurement_key is
  'Stable key: topTierId|sectionId|stepIndex|measurementFieldId|side (empty side for single-sided tests).';

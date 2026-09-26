alter table public.screen_tests
  add column if not exists parent_screen_test_id text references public.screen_tests(screen_test_id);

update public.screen_tests child
set parent_screen_test_id = parent.screen_test_id
from public.screen_tests parent
join public.tests parent_test on parent_test.test_id = parent.test_id
cross join public.tests child_test
where parent_test.code = 'shoulder_mobility'
  and child_test.code = 'shoulder_clearing'
  and child.test_id = child_test.test_id
  and child.screen_type_id = parent.screen_type_id;

update public.screen_tests child
set parent_screen_test_id = parent.screen_test_id
from public.screen_tests parent
join public.tests parent_test on parent_test.test_id = parent.test_id
cross join public.tests child_test
where parent_test.code = 'squat'
  and child_test.code = 'spine_extension_clearing'
  and child.test_id = child_test.test_id
  and child.screen_type_id = parent.screen_type_id;

insert into public.effect_rules (
  effect_rule_id, screen_type_id, source_test_field_id, trigger_answer_option_id,
  source_side_condition, target_screen_test_id, effect_type, effect_value,
  is_active, reason_template
)
values (
  'effect_rule_spine_extension_clearing_to_squat', 'screen_quick_screen',
  'field_spine_extension_clearing_pain', 'option_positive', 'none',
  'screen_test_squat', 'set_final_score', 0, true,
  'Spine Extension Clearing — ból zeruje wynik Squat'
)
on conflict (effect_rule_id) do update set
  is_active = excluded.is_active,
  reason_template = excluded.reason_template;

grant select on public.screen_tests to authenticated;
grant insert, update on public.effect_rules to authenticated;

drop policy if exists effect_rules_admin_insert on public.effect_rules;
create policy effect_rules_admin_insert on public.effect_rules for insert to authenticated
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists effect_rules_admin_update on public.effect_rules;
create policy effect_rules_admin_update on public.effect_rules for update to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

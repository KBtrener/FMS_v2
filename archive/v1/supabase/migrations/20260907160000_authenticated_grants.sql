grant usage on schema public to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.assessment_answers to authenticated;
grant select, insert, update, delete on public.applied_effects to authenticated;
grant select, insert, update, delete on public.attachments to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.screen_types, public.tests, public.screen_tests, public.answer_sets, public.answer_options, public.test_fields, public.effect_rules to authenticated;
grant update (is_active) on public.effect_rules to authenticated;

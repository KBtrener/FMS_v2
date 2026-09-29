grant usage on schema quickscreen_v2 to authenticated;
grant select, insert, update, delete on quickscreen_v2.clients to authenticated;
grant select, insert, update, delete on quickscreen_v2.assessments to authenticated;
grant select, insert, update, delete on quickscreen_v2.assessment_answers to authenticated;
grant select, insert, update, delete on quickscreen_v2.applied_effects to authenticated;
grant select, insert, update, delete on quickscreen_v2.attachments to authenticated;
grant select, update on quickscreen_v2.profiles to authenticated;
grant select on quickscreen_v2.screen_types, quickscreen_v2.tests, quickscreen_v2.screen_tests, quickscreen_v2.answer_sets, quickscreen_v2.answer_options, quickscreen_v2.test_fields, quickscreen_v2.effect_rules to authenticated;
grant update (is_active) on quickscreen_v2.effect_rules to authenticated;

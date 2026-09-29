insert into public.tests (test_id, code, name, description_short, criteria_summary, source_reference, is_active)
values (
  'test_neck_extension_clearing', 'neck_extension_clearing', 'Neck Extension Clearing',
  'Test clearingowy bólu przy wyproście szyi.',
  'Zapisz osobno dla lewej i prawej strony: Brak bólu albo Ból.',
  'Manual, strony 10-11', true
)
on conflict (test_id) do update set
  name = excluded.name,
  description_short = excluded.description_short,
  criteria_summary = excluded.criteria_summary,
  source_reference = excluded.source_reference,
  is_active = true;

insert into public.screen_tests (screen_test_id, screen_type_id, test_id, sort_order, calculation_type, is_active, parent_screen_test_id)
values ('screen_test_neck_extension_clearing', 'screen_quick_screen', 'test_neck_extension_clearing', 100, 'status_only_bilateral', true, 'screen_test_cervical_rotation')
on conflict (screen_test_id) do update set
  sort_order = excluded.sort_order,
  calculation_type = excluded.calculation_type,
  is_active = true,
  parent_screen_test_id = excluded.parent_screen_test_id;

update public.screen_tests
set sort_order = sort_order + 100
where screen_type_id = 'screen_quick_screen'
  and screen_test_id <> 'screen_test_neck_extension_clearing'
  and sort_order >= 3;

update public.screen_tests
set sort_order = sort_order - 99
where screen_type_id = 'screen_quick_screen'
  and screen_test_id <> 'screen_test_neck_extension_clearing'
  and sort_order >= 103;

update public.screen_tests
set sort_order = 3
where screen_test_id = 'screen_test_neck_extension_clearing';

update public.test_fields
set screen_test_id = 'screen_test_neck_extension_clearing',
    code = 'neck_extension_pain',
    label_pl = 'Ból przy wyproście szyi',
    sort_order = 1,
    is_scoring_input = true
where test_field_id = 'field_cervical_rotation_extension_pain';

insert into public.test_fields (test_field_id, screen_test_id, code, label_pl, answer_set_id, side_mode, attempt_mode, is_scoring_input, help_text, sort_order)
values ('field_neck_extension_pain', 'screen_test_neck_extension_clearing', 'neck_extension_pain', 'Ból przy wyproście szyi', 'answer_set_pain_status', 'bilateral', 'single', true, '', 1)
on conflict (code) do update set
  screen_test_id = excluded.screen_test_id,
  code = excluded.code,
  label_pl = excluded.label_pl,
  answer_set_id = excluded.answer_set_id,
  side_mode = excluded.side_mode,
  is_scoring_input = excluded.is_scoring_input,
  sort_order = excluded.sort_order;

update public.test_descriptions
set purpose = case when locale = 'pl' then 'Ocena obecności bólu podczas kontrolowanego wyprostu szyi po rotacji. Jest to osobny test clearingowy, bez wyniku 0-3.' else 'Checks for pain during controlled neck extension after rotation. It is a separate clearing test without a 0-3 score.' end,
    scoring_criteria = case when locale = 'pl' then 'To test clearing, a nie wynik ruchowy 0-3. Zapisz osobno dla lewej i prawej strony: Positive oznacza ból, Negative oznacza brak bólu.' else 'This is a clearing test, not a 0-3 movement score. Record left and right separately: Positive means pain and Negative means no pain.' end,
    report_description = case when locale = 'pl' then 'Osobny clearing bólu przy wyproście szyi, powiązany z testem Cervical Rotation.' else 'A separate neck-extension pain clearing linked to Cervical Rotation.' end,
    source_reference = 'FMS Quick Screen Manual, 10-11',
    content_hash = 'neck-extension-clearing-v1'
where test_id = 'test_neck_extension_clearing' and manual_version = '1.0';

update public.test_descriptions
set scoring_criteria = case
  when locale = 'pl' then 'Zapisz zakres rotacji i ból przy samej rotacji osobno dla lewej i prawej strony. Ból przy wyproście jest zapisywany w osobnym teście Neck Extension Clearing.'
  else 'Record rotation range and pain during rotation separately for the left and right sides. Pain during extension is recorded in the separate Neck Extension Clearing test.'
end
where test_id = 'test_cervical_rotation_extension' and manual_version = '1.0';

insert into public.test_descriptions (test_id, locale, purpose, procedure, verbal_instruction, side_definition, scoring_criteria, report_description, source_reference, manual_version, content_hash, is_active)
values
('test_neck_extension_clearing', 'en', 'Checks for pain during controlled neck extension after rotation. It is a separate clearing test without a 0-3 score.', 'From the rotated head position, gently move into the combined extension position, then return to neutral. Repeat on the other side.', 'Rotate your head to one side, gently add the extension movement, and tell the assessor whether pain appears. Repeat on the other side.', 'Record the side according to the direction of head rotation.', 'This is a clearing test, not a 0-3 movement score. Record left and right separately: Positive means pain and Negative means no pain.', 'A separate neck-extension pain clearing linked to Cervical Rotation.', 'FMS Quick Screen Manual, 10-11', '1.0', 'neck-extension-clearing-v1-en', true),
('test_neck_extension_clearing', 'pl', 'Ocena obecności bólu podczas kontrolowanego wyprostu szyi po rotacji. Jest to osobny test clearingowy, bez wyniku 0-3.', 'Z pozycji z obróconą głową wykonaj delikatnie pozycję łączącą rotację z wyprostem, a następnie wróć do pozycji neutralnej. Powtórz na drugą stronę.', 'Obróć głowę w jedną stronę, delikatnie dodaj wyprost i powiedz, czy pojawia się ból. Powtórz na drugą stronę.', 'Stronę określaj według kierunku obrotu głowy.', 'To test clearing, a nie wynik ruchowy 0-3. Zapisz osobno lewą i prawą stronę: Positive oznacza ból, a Negative oznacza brak bólu.', 'Osobny clearing bólu przy wyproście szyi, powiązany z testem Cervical Rotation.', 'FMS Quick Screen Manual, 10-11', '1.0', 'neck-extension-clearing-v1-pl', true)
on conflict (test_id, locale, manual_version) do update set
  purpose = excluded.purpose,
  procedure = excluded.procedure,
  verbal_instruction = excluded.verbal_instruction,
  side_definition = excluded.side_definition,
  scoring_criteria = excluded.scoring_criteria,
  report_description = excluded.report_description,
  source_reference = excluded.source_reference,
  content_hash = excluded.content_hash,
  is_active = true;

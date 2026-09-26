-- Add informational range checks to Shoulder Clearing.
-- Pain remains the only condition that can zero Shoulder Mobility.
update public.test_fields
set sort_order = 5
where test_field_id = 'field_shoulder_clearing_pain';

insert into public.test_fields
  (test_field_id, screen_test_id, code, label_pl, answer_set_id, side_mode, attempt_mode, is_scoring_input, help_text, sort_order)
values
  ('field_shoulder_clearing_upper_range', 'screen_test_shoulder_clearing', 'shoulder_clearing_upper_range', 'Odpowiedni zakres - ręka nad głową', 'answer_set_pass_fail', 'bilateral', 'single', false, 'Czy ręka osiąga wymaganą pozycję nad głową i przy łopatce?', 3),
  ('field_shoulder_clearing_lower_range', 'screen_test_shoulder_clearing', 'shoulder_clearing_lower_range', 'Odpowiedni zakres - ręka za plecami', 'answer_set_pass_fail', 'bilateral', 'single', false, 'Czy ręka osiąga wymaganą pozycję za plecami i przy łopatce?', 4)
on conflict (test_field_id) do update set
  label_pl = excluded.label_pl,
  answer_set_id = excluded.answer_set_id,
  side_mode = excluded.side_mode,
  attempt_mode = excluded.attempt_mode,
  is_scoring_input = excluded.is_scoring_input,
  help_text = excluded.help_text,
  sort_order = excluded.sort_order;

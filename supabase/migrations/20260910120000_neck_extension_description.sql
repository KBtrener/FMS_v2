-- Keeps the database-backed manual catalogue aligned with the separate clearing test.
insert into public.test_descriptions (
  test_id, locale, purpose, procedure, verbal_instruction, side_definition,
  scoring_criteria, report_description, source_reference, manual_version,
  content_hash, is_active
)
select t.test_id, 'pl',
  'Sprawdzenie, czy wyprost szyi po rotacji wywołuje ból. To test clearing, bez wyniku ruchowego 0-3.',
  'Po rotacji głowy w jedną stronę delikatnie wykonaj wyprost szyi. Wróć do pozycji neutralnej i powtórz po drugiej stronie.',
  '',
  'Strona oznacza kierunek rotacji głowy.',
  'Zapisz ból niezależnie po lewej i prawej stronie. Positive oznacza ból, Negative jego brak. Reguła może zmienić tylko wynik końcowy testu nadrzędnego; wynik rotacji pozostaje zachowany.',
  'Sprawdzenie bólu przy wyproście szyi; clearing nie zmienia wyniku bazowego testu nadrzędnego.',
  'FMS Quick Screen Manual, 10-11', '1.0',
  md5('neck_extension_clearing:pl:1.0'), true
from public.tests t where t.code = 'neck_extension_clearing'
on conflict (test_id, locale, manual_version) do update set
  purpose=excluded.purpose, procedure=excluded.procedure, side_definition=excluded.side_definition,
  scoring_criteria=excluded.scoring_criteria, report_description=excluded.report_description,
  source_reference=excluded.source_reference, content_hash=excluded.content_hash, is_active=true;

insert into public.test_descriptions (
  test_id, locale, purpose, procedure, verbal_instruction, side_definition,
  scoring_criteria, report_description, source_reference, manual_version,
  content_hash, is_active
)
select t.test_id, 'en',
  'Checks whether neck extension after rotation produces pain. This is a clearing test and does not receive a 0-3 movement score.',
  'After rotating the head to one side, gently extend the neck in the instructed pattern. Return to neutral and repeat on the other side.',
  '',
  'The side is the direction of head rotation.',
  'Record pain independently for the left and right sides. Positive means pain; Negative means no pain. An active clearing rule may change only the final score of the configured parent test; the rotation result remains preserved.',
  'Checks pain during neck extension; clearing does not change the parent test base score.',
  'FMS Quick Screen Manual, 10-11', '1.0',
  md5('neck_extension_clearing:en:1.0'), true
from public.tests t where t.code = 'neck_extension_clearing'
on conflict (test_id, locale, manual_version) do update set
  purpose=excluded.purpose, procedure=excluded.procedure, side_definition=excluded.side_definition,
  scoring_criteria=excluded.scoring_criteria, report_description=excluded.report_description,
  source_reference=excluded.source_reference, content_hash=excluded.content_hash, is_active=true;

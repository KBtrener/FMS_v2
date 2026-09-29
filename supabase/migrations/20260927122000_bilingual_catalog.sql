alter table quickscreen_v2.screen_types
  add column if not exists name_pl text,
  add column if not exists name_en text;

alter table quickscreen_v2.tests
  add column if not exists name_pl text,
  add column if not exists name_en text;

alter table quickscreen_v2.test_fields
  add column if not exists label_en text;

alter table quickscreen_v2.answer_options
  add column if not exists label_en text;

update quickscreen_v2.screen_types
set name_pl = coalesce(name_pl, case code when 'quick_screen' then 'FMS-Quickscreen' else name end),
    name_en = coalesce(name_en, name);

update quickscreen_v2.tests
set name_en = coalesce(name_en, name),
    name_pl = coalesce(name_pl, case code
      when 'cervical_flexion' then 'Zgięcie karku'
      when 'cervical_rotation_extension' then 'Rotacje karku'
      when 'neck_extension_clearing' then 'Wyprost karku'
      when 'toe_touch' then 'Skłon do palców'
      when 'shoulder_mobility' then 'Mobilność barku'
      when 'shoulder_clearing' then 'Shoulder Clearing'
      when 'rotation' then 'Rotacje'
      when 'balance' then 'Balans'
      when 'squat' then 'Przysiad'
      when 'spine_extension_clearing' then 'Wyprost kręgosłupa'
      else name end);

update quickscreen_v2.test_fields
set label_en = coalesce(label_en, initcap(replace(code, '_', ' ')));

update quickscreen_v2.answer_options
set label_en = coalesce(label_en, case code
  when 'positive' then 'Pain'
  when 'negative' then 'No pain'
  when 'pass' then 'Pass'
  when 'fail' then 'Fail'
  else coalesce(numeric_value::text, initcap(replace(code, '_', ' '))) end);

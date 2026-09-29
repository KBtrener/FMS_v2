update quickscreen_v2.test_fields
set sort_order = sort_order + 10
where test_field_id in (
  'field_shoulder_clearing_upper_pain',
  'field_shoulder_clearing_lower_pain',
  'field_shoulder_clearing_upper_range',
  'field_shoulder_clearing_lower_range'
);

update quickscreen_v2.test_fields
set sort_order = case test_field_id
  when 'field_shoulder_clearing_upper_pain' then 1
  when 'field_shoulder_clearing_upper_range' then 2
  when 'field_shoulder_clearing_lower_pain' then 3
  when 'field_shoulder_clearing_lower_range' then 4
end
where test_field_id in (
  'field_shoulder_clearing_upper_pain',
  'field_shoulder_clearing_lower_pain',
  'field_shoulder_clearing_upper_range',
  'field_shoulder_clearing_lower_range'
);

update quickscreen_v2.test_fields
set is_scoring_input = true
where test_field_id in (
  'field_shoulder_clearing_upper_range',
  'field_shoulder_clearing_lower_range'
);

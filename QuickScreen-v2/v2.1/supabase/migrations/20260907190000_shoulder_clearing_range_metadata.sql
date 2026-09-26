-- Keep range answers visible in the UI but outside numeric scoring inputs.
update public.test_fields
set is_scoring_input = false
where code in ('shoulder_clearing_upper_range', 'shoulder_clearing_lower_range');

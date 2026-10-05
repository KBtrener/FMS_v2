alter table quickscreen_v2.client_anthropometry
  add column if not exists wear_condition text not null default 'unspecified';
alter table quickscreen_v2.client_anthropometry
  add constraint client_anthropometry_wear_condition_check
  check (wear_condition in ('with_shoes','without_shoes','unspecified'));
alter table quickscreen_v2.client_anthropometry
  add constraint client_anthropometry_wear_condition_measurement_check
  check (measurement_code in ('tibia_length','foot_length') or wear_condition = 'unspecified');

alter table quickscreen_v2.assessment_field_measurements
  add column if not exists measurement_condition text;
alter table quickscreen_v2.assessment_field_measurements
  add constraint assessment_field_measurements_condition_check
  check (measurement_condition is null or measurement_condition in ('with_shoes','without_shoes','unspecified'));

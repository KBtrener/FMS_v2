grant update, delete on quickscreen_v2.client_anthropometry to authenticated;

update quickscreen_v2.client_anthropometry
set wear_condition = 'without_shoes'
where measurement_code in ('tibia_length','foot_length')
  and coalesce(wear_condition, 'unspecified') = 'unspecified';

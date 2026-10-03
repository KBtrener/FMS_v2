alter table quickscreen_v2.test_fields
  add column if not exists measurement_role text not null default 'value',
  add column if not exists measurement_shared_key text,
  add column if not exists measurement_shared_source_field_id text,
  add column if not exists measurement_side text,
  add column if not exists derived_score_rule text,
  add column if not exists derived_measurement_field_id text,
  add column if not exists derived_reference_field_id text;

alter table quickscreen_v2.test_fields drop constraint if exists test_fields_control_type_check;
alter table quickscreen_v2.test_fields add constraint test_fields_control_type_check
  check (control_type in ('choices', 'checkbox', 'derived_score'));

update quickscreen_v2.test_fields set measurement_unit='cm'
 where code like 'fms_%' and field_type='measurement';
update quickscreen_v2.test_fields set measurement_unit_group='fms-shoulder'
 where code in ('fms_shoulder_mobility_hand_length','fms_shoulder_mobility_distance');

update quickscreen_v2.test_fields set measurement_role='reference', measurement_shared_key='fms_tibia_length'
 where code='fms_hurdle_step_tibia_length';
update quickscreen_v2.test_fields set measurement_role='reference', measurement_shared_key='fms_tibia_length',
  measurement_shared_source_field_id='field_fms_hurdle_step_tibia_length', is_required=false, is_wizard_input=true
 where code='fms_inline_lunge_tibia_length';

update quickscreen_v2.test_fields set measurement_role='reference', measurement_shared_key='fms_foot_length'
 where code='fms_lower_body_mcs_foot_length';
update quickscreen_v2.test_fields set measurement_role='reference', measurement_shared_key='fms_foot_length',
  measurement_shared_source_field_id='field_fms_lower_body_mcs_foot_length', is_required=false
 where code='fms_upper_body_mcs_foot_length';
update quickscreen_v2.test_fields set measurement_role='side_result', measurement_side='left'
 where code in ('fms_lower_body_mcs_distance_left','fms_upper_body_mcs_distance_left');
update quickscreen_v2.test_fields set measurement_role='side_result', measurement_side='right'
 where code in ('fms_lower_body_mcs_distance_right','fms_upper_body_mcs_distance_right');

insert into quickscreen_v2.test_fields
 (test_field_id,screen_test_id,code,label_pl,side_mode,attempt_mode,is_scoring_input,sort_order,is_wizard_input,control_type,field_type,measurement_unit,measurement_min,measurement_max,measurement_step,measurement_unit_options,measurement_unit_group,is_required,measurement_role)
values
 ('field_fms_inline_lunge_tibia_length','screen_test_fms_inline_lunge','fms_inline_lunge_tibia_length','Długość piszczeli (z Hurdle Step)','none','single',false,2,true,'choices','measurement','cm',0.1,100,0.1,array['cm','in'],'fms-tibia',false,'reference'),
 ('field_fms_shoulder_mobility_distance','screen_test_fms_shoulder_mobility','fms_shoulder_mobility_distance','Odległość między pięściami','bilateral','single',false,4,true,'choices','measurement','cm',0,100,0.1,array['cm','in'],'fms-shoulder',false,'side_result')
on conflict (test_field_id) do update set label_pl=excluded.label_pl,is_wizard_input=true,field_type='measurement',measurement_unit='cm',measurement_min=excluded.measurement_min,measurement_max=excluded.measurement_max,measurement_step=excluded.measurement_step,measurement_unit_options=excluded.measurement_unit_options,measurement_unit_group=excluded.measurement_unit_group,measurement_role=excluded.measurement_role,is_required=false;

update quickscreen_v2.test_fields set measurement_side='left' where code='fms_shoulder_mobility_distance' and side_mode='bilateral';

update quickscreen_v2.test_fields set control_type='derived_score',derived_score_rule='fms_shoulder_mobility_ratio',
 derived_measurement_field_id='field_fms_shoulder_mobility_distance',derived_reference_field_id='field_fms_shoulder_mobility_hand_length'
 where code='fms_shoulder_mobility_score';

update quickscreen_v2.test_fields set help_text='Zielą stronę ocenia się jako stronę z przodu. Wartość piszczeli jest współdzielona z Hurdle Step.'
 where code='fms_inline_lunge_tibia_length';

update quickscreen_v2.test_fields set help_text='Wartość referencyjna: długość stopy z Lower Body MCS. Jeśli nie została wcześniej wpisana, można uzupełnić ją tutaj.'
 where code='fms_upper_body_mcs_foot_length';

update quickscreen_v2.tests set criteria_summary = case code
 when 'fms_hurdle_step' then E'Strona oceniana: noga unoszona nad poprzeczką.\n3: biodra, kolana i kostki pozostają w jednej linii; kij i poprzeczka są równoległe.\n2: kompensacja lub utrata ustawienia.\n1: brak możliwości wykonania wzorca.\n0: ból.'
 when 'fms_inline_lunge' then E'Strona oceniana: noga ustawiona z przodu.\n3: kij zachowuje trzy punkty kontaktu i pion, ruch jest stabilny.\n2: wykonanie z kompensacją.\n1: brak możliwości wykonania wzorca.\n0: ból.'
 else criteria_summary end
 where code in ('fms_hurdle_step','fms_inline_lunge');

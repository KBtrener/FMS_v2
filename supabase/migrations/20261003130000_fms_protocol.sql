alter table quickscreen_v2.test_fields
  add column if not exists is_wizard_input boolean not null default false,
  add column if not exists control_type text not null default 'choices',
  add column if not exists measurement_unit_options text[] not null default '{}',
  add column if not exists measurement_unit_group text,
  add column if not exists disabled_by_test_field_id text references quickscreen_v2.test_fields(test_field_id);

-- Extend the generic measurement validator for fields that accept a controlled unit list.
create or replace function quickscreen_v2.validate_field_measurements(
  p_assessment_id uuid,
  p_screen_type_id text,
  p_field_measurements jsonb
) returns void language plpgsql security invoker set search_path = quickscreen_v2, public as $$
declare
  v_item jsonb;
  v_field quickscreen_v2.test_fields%rowtype;
  v_side text;
  v_attempt smallint;
  v_value numeric;
  v_unit text;
begin
  if jsonb_typeof(coalesce(p_field_measurements, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid_field_measurements';
  end if;
  for v_item in select value from jsonb_array_elements(coalesce(p_field_measurements, '[]'::jsonb)) loop
    select field.* into v_field
    from quickscreen_v2.test_fields field
    join quickscreen_v2.screen_tests step on step.screen_test_id = field.screen_test_id
    where field.test_field_id = v_item->>'fieldId' and field.field_type = 'measurement'
      and step.screen_type_id = p_screen_type_id and step.is_active;
    if not found then raise exception 'invalid_measurement_field'; end if;
    v_side := coalesce(v_item->>'side', 'none');
    v_attempt := coalesce(nullif(v_item->>'attemptNumber', '')::smallint, 1);
    v_value := nullif(v_item->>'value', '')::numeric;
    v_unit := nullif(trim(v_item->>'unit'), '');
    if (v_field.side_mode = 'none' and v_side <> 'none')
      or (v_field.side_mode = 'bilateral' and v_side not in ('left', 'right')) then
      raise exception 'invalid_measurement_side';
    end if;
    if v_attempt < 1 or v_attempt > 3 or (v_field.attempt_mode = 'single' and v_attempt <> 1) then
      raise exception 'invalid_measurement_attempt';
    end if;
    if v_value is null
      or (v_unit is distinct from v_field.measurement_unit and not (v_unit = any(v_field.measurement_unit_options)))
      or (v_field.measurement_min is not null and v_value < v_field.measurement_min)
      or (v_field.measurement_max is not null and v_value > v_field.measurement_max) then
      raise exception 'invalid_measurement_value';
    end if;
  end loop;
  if exists (
    select 1 from quickscreen_v2.screen_tests step
    join quickscreen_v2.test_fields field on field.screen_test_id = step.screen_test_id
    where step.screen_type_id = p_screen_type_id and step.is_active
      and field.field_type = 'measurement' and field.is_required
      and exists (
        select 1 from unnest(case when field.side_mode = 'bilateral' then array['left', 'right'] else array['none'] end) expected(side)
        where not exists (
          select 1 from quickscreen_v2.assessment_field_measurements answer
          where answer.assessment_id = p_assessment_id and answer.test_field_id = field.test_field_id and answer.side = expected.side
        )
      )
  ) then raise exception 'missing_required_measurement'; end if;
end;
$$;

alter table quickscreen_v2.test_fields
  add constraint test_fields_control_type_check check (control_type in ('choices', 'checkbox'));

insert into quickscreen_v2.screen_types (screen_type_id,code,name,name_pl,name_en,is_active)
values ('screen_fms','fms','Functional Movement Screen','FMS','FMS',true)
on conflict (screen_type_id) do update set name=excluded.name,name_pl=excluded.name_pl,name_en=excluded.name_en,is_active=true;

insert into quickscreen_v2.tests (test_id,code,name,name_pl,name_en,description_short,criteria_summary,source_reference,is_active) values
('test_fms_deep_squat','fms_deep_squat','Deep Squat','Deep Squat','Deep Squat','Ocena wzorca przysiadu.','3: uda poniżej poziomu, pięty na ziemi, kolana w osi, kij nad stopami. 2: kryteria spełnione na podkładce pod piętami. 1: kryteria niespełnione także na podkładce. 0: ból.','Production bundle FMS-CUSTOM-2026-01',true),
('test_fms_hurdle_step','fms_hurdle_step','Hurdle Step','Hurdle Step','Hurdle Step','Ocena stabilizacji tułowia i kontroli kroku.','Strona L oznacza lewą nogę przechodzącą nad przeszkodą; P oznacza prawą. 3: stabilna miednica i tułów, oś zachowana, kij stabilny. 2: wykonanie z kompensacją. 1: dotknięcie przeszkody lub utrata równowagi. 0: ból.', 'Production bundle FMS-CUSTOM-2026-01',true),
('test_fms_inline_lunge','fms_inline_lunge','In-Line Lunge','In-Line Lunge','In-Line Lunge','Ocena stabilności tułowia i kontroli wykroku na linii.','Strona oznacza nogę z przodu. 3: kij utrzymany w trzech punktach, stabilność i stopy na linii. 2: wykonanie z kompensacją. 1: niepoprawne wykonanie, utrata równowagi lub przestawienie stóp. 0: ból.','Production bundle FMS-CUSTOM-2026-01',true),
('test_fms_shoulder_mobility','fms_shoulder_mobility','Shoulder Mobility','Shoulder Mobility','Shoulder Mobility','Ocena ruchomości barków i łopatek.','Strona oznacza rękę sięgającą górą. 3: dystans pięści nie większy niż długość dłoni. 2: dystans większy niż długość dłoni i nie większy niż 1,5 długości dłoni. 1: dystans większy niż 1,5 długości dłoni. 0: ból podczas testu lub clearingu.','Production bundle FMS-CUSTOM-2026-01',true),
('test_fms_aslr','fms_aslr','ASLR','ASLR','ASLR','Ocena mobilności tylnej taśmy i stabilizacji miednicy.','Strona oznacza unoszoną nogę. 3: kostka powyżej linii środka uda nogi leżącej. 2: kostka powyżej linii rzepki. 1: kostka poniżej linii rzepki. 0: ból.','Production bundle FMS-CUSTOM-2026-01',true),
('test_fms_trunk_stability_push_up','fms_trunk_stability_push_up','Trunk Stability Push-Up','Trunk Stability Push-Up','Trunk Stability Push-Up','Ocena stabilizacji centralnej w podporze.','3: jedna pompka w jednej bryle według standardu 3. 2: jedna pompka w jednej bryle według modyfikacji standardu 2. 1: brak wykonania także po modyfikacji. 0: ból. Ustawienie dłoni: mężczyźni — kciuki na wysokości czoła dla standardu 3 i dłonie na wysokości brody dla standardu 2; kobiety — kciuki na wysokości brody dla standardu 3 i dłonie na wysokości obojczyków dla standardu 2.','Production bundle FMS-CUSTOM-2026-01',true),
('test_fms_rotary_stability','fms_rotary_stability','Rotary Stability','Rotary Stability','Rotary Stability','Ocena kontroli rotacyjnej tułowia.','Strona oznacza tę samą rękę i kostkę. 3: pełna sekwencja stabilnie, bez utraty równowagi. 2: wykonanie z kompensacją. 1: brak wykonania lub utrata równowagi. 0: ból podczas testu lub Flexion Clearing.','Production bundle FMS-CUSTOM-2026-01',true),
('test_fms_ankle_mobility','fms_ankle_mobility','Ankle Mobility','Mobilność kostki - stoplight','Ankle Mobility - stoplight','Dodatkowy test stoplight mobilności zgięcia grzbietowego.','Strona oznacza nogę z tyłu. Zapisz GREEN, YELLOW albo RED oraz ból osobno. Test nie wchodzi do Total Score.','Production bundle FMS-CUSTOM-2026-01',true),
('test_fms_lower_body_mcs','fms_lower_body_mcs','Lower Body MCS','Lower Body MCS','Lower Body MCS','Dodatkowy pomiar dystansu względem długości stopy.','Test dodatkowy. Można oznaczyć jako niewykonany. PASS/FAIL jest obliczany zgodnie z funkcją MCS w aplikacji referencyjnej.','Production bundle FMS-CUSTOM-2026-01',true),
('test_fms_upper_body_mcs','fms_upper_body_mcs','Upper Body MCS','Upper Body MCS','Upper Body MCS','Dodatkowy pomiar dystansu względem długości stopy.','Test dodatkowy. Można oznaczyć jako niewykonany. Długość stopy może być pobrana z Lower Body MCS.','Production bundle FMS-CUSTOM-2026-01',true)
on conflict (test_id) do update set code=excluded.code,name=excluded.name,name_pl=excluded.name_pl,name_en=excluded.name_en,description_short=excluded.description_short,criteria_summary=excluded.criteria_summary,source_reference=excluded.source_reference,is_active=true;

insert into quickscreen_v2.screen_tests (screen_test_id,screen_type_id,test_id,sort_order,calculation_type,is_active,parent_screen_test_id) values
('screen_test_fms_deep_squat','screen_fms','test_fms_deep_squat',1,'best_attempt_single',true,null),
('screen_test_fms_hurdle_step','screen_fms','test_fms_hurdle_step',2,'best_attempt_minimum_bilateral',true,null),
('screen_test_fms_inline_lunge','screen_fms','test_fms_inline_lunge',3,'best_attempt_minimum_bilateral',true,null),
('screen_test_fms_shoulder_mobility','screen_fms','test_fms_shoulder_mobility',4,'best_attempt_minimum_bilateral',true,null),
('screen_test_fms_aslr','screen_fms','test_fms_aslr',5,'best_attempt_minimum_bilateral',true,null),
('screen_test_fms_trunk_stability_push_up','screen_fms','test_fms_trunk_stability_push_up',6,'best_attempt_single',true,null),
('screen_test_fms_rotary_stability','screen_fms','test_fms_rotary_stability',7,'best_attempt_minimum_bilateral',true,null),
('screen_test_fms_ankle_mobility','screen_fms','test_fms_ankle_mobility',8,'status_only_bilateral',true,'screen_test_fms_rotary_stability'),
('screen_test_fms_lower_body_mcs','screen_fms','test_fms_lower_body_mcs',9,'status_only_bilateral',true,'screen_test_fms_rotary_stability'),
('screen_test_fms_upper_body_mcs','screen_fms','test_fms_upper_body_mcs',10,'status_only_bilateral',true,'screen_test_fms_rotary_stability')
on conflict (screen_test_id) do update set sort_order=excluded.sort_order,calculation_type=excluded.calculation_type,is_active=true,parent_screen_test_id=excluded.parent_screen_test_id;

insert into quickscreen_v2.answer_sets (answer_set_id,code,name,value_kind,is_active) values
('answer_set_fms_yes_no','fms_yes_no','Tak / Nie','discrete_text',true),
('answer_set_fms_stoplight','fms_stoplight','Stoplight','discrete_text',true)
on conflict (answer_set_id) do update set code=excluded.code,name=excluded.name,value_kind=excluded.value_kind,is_active=true;

insert into quickscreen_v2.answer_options (answer_option_id,answer_set_id,code,label_pl,numeric_value,sort_order,is_active) values
('option_fms_yes','answer_set_fms_yes_no','positive','Tak',null,1,true),
('option_fms_no','answer_set_fms_yes_no','negative','Nie',null,2,true),
('option_fms_green','answer_set_fms_stoplight','green','GREEN',null,1,true),
('option_fms_yellow','answer_set_fms_stoplight','yellow','YELLOW',null,2,true),
('option_fms_red','answer_set_fms_stoplight','red','RED',null,3,true)
on conflict (answer_option_id) do update set answer_set_id=excluded.answer_set_id,code=excluded.code,label_pl=excluded.label_pl,numeric_value=excluded.numeric_value,sort_order=excluded.sort_order,is_active=true;

insert into quickscreen_v2.test_fields (test_field_id,screen_test_id,code,label_pl,answer_set_id,side_mode,attempt_mode,is_scoring_input,help_text,sort_order,is_wizard_input,control_type) values
('field_fms_deep_squat_score','screen_test_fms_deep_squat','fms_deep_squat_score','Wynik','answer_set_score_0_3','none','single',true,'',1,true,'choices'),
('field_fms_hurdle_step_score','screen_test_fms_hurdle_step','fms_hurdle_step_score','Wynik','answer_set_score_0_3','bilateral','single',true,'',1,true,'choices'),
('field_fms_inline_lunge_score','screen_test_fms_inline_lunge','fms_inline_lunge_score','Wynik','answer_set_score_0_3','bilateral','single',true,'',1,true,'choices'),
('field_fms_shoulder_mobility_score','screen_test_fms_shoulder_mobility','fms_shoulder_mobility_score','Wynik','answer_set_score_0_3','bilateral','single',true,'',1,true,'choices'),
('field_fms_shoulder_mobility_pain','screen_test_fms_shoulder_mobility','fms_shoulder_mobility_pain','Shoulder Clearing - ból','answer_set_fms_yes_no','bilateral','single',false,'Dodatni clearing zeruje wynik testu.',2,true,'choices'),
('field_fms_aslr_score','screen_test_fms_aslr','fms_aslr_score','Wynik','answer_set_score_0_3','bilateral','single',true,'',1,true,'choices'),
('field_fms_trunk_stability_push_up_score','screen_test_fms_trunk_stability_push_up','fms_trunk_stability_push_up_score','Wynik','answer_set_score_0_3','none','single',true,'',1,true,'choices'),
('field_fms_trunk_stability_push_up_pain','screen_test_fms_trunk_stability_push_up','fms_trunk_stability_push_up_pain','Extension Clearing - ból','answer_set_fms_yes_no','none','single',false,'Dodatni clearing zeruje wynik testu.',2,true,'choices'),
('field_fms_rotary_stability_score','screen_test_fms_rotary_stability','fms_rotary_stability_score','Wynik','answer_set_score_0_3','bilateral','single',true,'',1,true,'choices'),
('field_fms_rotary_stability_pain','screen_test_fms_rotary_stability','fms_rotary_stability_pain','Flexion Clearing - ból','answer_set_fms_yes_no','bilateral','single',false,'Dodatni clearing po dowolnej stronie zeruje wynik testu.',2,true,'choices'),
('field_fms_ankle_mobility_stoplight','screen_test_fms_ankle_mobility','fms_ankle_mobility_stoplight','Stoplight','answer_set_fms_stoplight','bilateral','single',true,'',1,true,'choices'),
('field_fms_ankle_mobility_pain','screen_test_fms_ankle_mobility','fms_ankle_mobility_pain','Ból','answer_set_fms_yes_no','bilateral','single',false,'',2,true,'choices'),
('field_fms_lower_body_mcs_skipped','screen_test_fms_lower_body_mcs','fms_lower_body_mcs_skipped','Test nie wykonany','answer_set_fms_yes_no','none','single',false,'',1,true,'checkbox'),
('field_fms_upper_body_mcs_skipped','screen_test_fms_upper_body_mcs','fms_upper_body_mcs_skipped','Test nie wykonany','answer_set_fms_yes_no','none','single',false,'',1,true,'checkbox')
on conflict (test_field_id) do update set label_pl=excluded.label_pl,answer_set_id=excluded.answer_set_id,side_mode=excluded.side_mode,attempt_mode=excluded.attempt_mode,is_scoring_input=excluded.is_scoring_input,help_text=excluded.help_text,sort_order=excluded.sort_order,is_wizard_input=excluded.is_wizard_input,control_type=excluded.control_type;

insert into quickscreen_v2.test_fields (test_field_id,screen_test_id,code,label_pl,answer_set_id,side_mode,attempt_mode,is_scoring_input,help_text,sort_order,is_wizard_input,control_type) values
('field_fms_ds_issue_torso','screen_test_fms_deep_squat','fms_ds_issue_torso','Tibia i tułów nie są równoległe / tułów zbyt pochylony','answer_set_fms_yes_no','none','single',false,'',10,true,'checkbox'),
('field_fms_ds_issue_depth','screen_test_fms_deep_squat','fms_ds_issue_depth','Udo nie schodzi poniżej poziomu','answer_set_fms_yes_no','none','single',false,'',11,true,'checkbox'),
('field_fms_ds_issue_knee_valgus','screen_test_fms_deep_squat','fms_ds_issue_knee_valgus','Kolana uciekają do środka','answer_set_fms_yes_no','none','single',false,'',12,true,'checkbox'),
('field_fms_ds_issue_dowel','screen_test_fms_deep_squat','fms_ds_issue_dowel','Kij nie pozostaje nad stopami','answer_set_fms_yes_no','none','single',false,'',13,true,'checkbox'),
('field_fms_ds_issue_heel_elevation','screen_test_fms_deep_squat','fms_ds_issue_heel_elevation','Do uzyskania jakości potrzebne uniesienie pięt','answer_set_fms_yes_no','none','single',false,'',14,true,'checkbox'),
('field_fms_hs_issue_alignment','screen_test_fms_hurdle_step','fms_hs_issue_alignment','Utrata ustawienia biodro-kolano-kostka','answer_set_fms_yes_no','bilateral','single',false,'',10,true,'checkbox'),
('field_fms_hs_issue_lumbar','screen_test_fms_hurdle_step','fms_hs_issue_lumbar','Ruch/kompensacja w odcinku lędźwiowym','answer_set_fms_yes_no','bilateral','single',false,'',11,true,'checkbox'),
('field_fms_hs_issue_dowel','screen_test_fms_hurdle_step','fms_hs_issue_dowel','Kij i poprzeczka nie pozostają równoległe','answer_set_fms_yes_no','bilateral','single',false,'',12,true,'checkbox'),
('field_fms_hs_issue_hurdle','screen_test_fms_hurdle_step','fms_hs_issue_hurdle','Brak możliwości przejścia nad linką','answer_set_fms_yes_no','bilateral','single',false,'',13,true,'checkbox'),
('field_fms_hs_issue_balance','screen_test_fms_hurdle_step','fms_hs_issue_balance','Utrata równowagi','answer_set_fms_yes_no','bilateral','single',false,'',14,true,'checkbox'),
('field_fms_il_issue_dowel_contact','screen_test_fms_inline_lunge','fms_il_issue_dowel_contact','Utrata 3-punktowego kontaktu kija','answer_set_fms_yes_no','bilateral','single',false,'',10,true,'checkbox'),
('field_fms_il_issue_dowel_vertical','screen_test_fms_inline_lunge','fms_il_issue_dowel_vertical','Kij nie pozostaje pionowo','answer_set_fms_yes_no','bilateral','single',false,'',11,true,'checkbox'),
('field_fms_il_issue_torso','screen_test_fms_inline_lunge','fms_il_issue_torso','Widoczny ruch/kołysanie tułowia','answer_set_fms_yes_no','bilateral','single',false,'',12,true,'checkbox'),
('field_fms_il_issue_plane','screen_test_fms_inline_lunge','fms_il_issue_plane','Kij lub stopy wypadają poza płaszczyznę strzałkową','answer_set_fms_yes_no','bilateral','single',false,'',13,true,'checkbox'),
('field_fms_il_issue_knee_board','screen_test_fms_inline_lunge','fms_il_issue_knee_board','Kolano nie dotyka środka deski','answer_set_fms_yes_no','bilateral','single',false,'',14,true,'checkbox'),
('field_fms_il_issue_foot_move','screen_test_fms_inline_lunge','fms_il_issue_foot_move','Przednia stopa zmienia pozycję','answer_set_fms_yes_no','bilateral','single',false,'',15,true,'checkbox'),
('field_fms_il_issue_balance','screen_test_fms_inline_lunge','fms_il_issue_balance','Utrata równowagi / zejście z deski','answer_set_fms_yes_no','bilateral','single',false,'',16,true,'checkbox'),
('field_fms_il_issue_setup','screen_test_fms_inline_lunge','fms_il_issue_setup','Brak możliwości wykonania wzorca lub wejścia w ustawienie','answer_set_fms_yes_no','bilateral','single',false,'',17,true,'checkbox'),
('field_fms_rs_issue_sequence','screen_test_fms_rotary_stability','fms_rs_issue_sequence','Dłoń i kolano nie odrywają się jednocześnie','answer_set_fms_yes_no','bilateral','single',false,'',10,true,'checkbox'),
('field_fms_rs_issue_line','screen_test_fms_rotary_stability','fms_rs_issue_line','Brak utrzymania ruchu w linii / stabilnej trajektorii','answer_set_fms_yes_no','bilateral','single',false,'',11,true,'checkbox'),
('field_fms_rs_issue_extension','screen_test_fms_rotary_stability','fms_rs_issue_extension','Brak pełnego wyprostu kolana i łokcia','answer_set_fms_yes_no','bilateral','single',false,'',12,true,'checkbox'),
('field_fms_rs_issue_balance','screen_test_fms_rotary_stability','fms_rs_issue_balance','Utrata równowagi / dotknięcie podłoża','answer_set_fms_yes_no','bilateral','single',false,'',13,true,'checkbox');

insert into quickscreen_v2.test_fields (test_field_id,screen_test_id,code,label_pl,answer_set_id,side_mode,attempt_mode,is_scoring_input,help_text,sort_order,is_wizard_input,control_type,field_type,measurement_unit,measurement_min,measurement_max,measurement_step,measurement_unit_options,measurement_unit_group,is_required) values
('field_fms_hurdle_step_tibia_length','screen_test_fms_hurdle_step','fms_hurdle_step_tibia_length','Długość piszczeli',null,'none','single',false,'',2,true,'choices','measurement','in',0,100,0.1,array['in','cm'],'fms-tibia',true),
('field_fms_shoulder_mobility_hand_length','screen_test_fms_shoulder_mobility','fms_shoulder_mobility_hand_length','Długość dłoni',null,'none','single',false,'',3,true,'choices','measurement','in',0,100,0.1,array['in','cm'],'fms-hand',true),
('field_fms_lower_body_mcs_foot_length','screen_test_fms_lower_body_mcs','fms_lower_body_mcs_foot_length','Długość stopy',null,'none','single',false,'',2,true,'choices','measurement','in',0,100,0.1,array['in','cm'],'fms-foot',false),
('field_fms_lower_body_mcs_distance_left','screen_test_fms_lower_body_mcs','fms_lower_body_mcs_distance_left','Lewa noga',null,'none','single',false,'',3,true,'choices','measurement','in',0,400,0.1,array['in','cm'],'fms-foot',false),
('field_fms_lower_body_mcs_distance_right','screen_test_fms_lower_body_mcs','fms_lower_body_mcs_distance_right','Prawa noga',null,'none','single',false,'',4,true,'choices','measurement','in',0,400,0.1,array['in','cm'],'fms-foot',false),
('field_fms_upper_body_mcs_foot_length','screen_test_fms_upper_body_mcs','fms_upper_body_mcs_foot_length','Długość stopy',null,'none','single',false,'',2,true,'choices','measurement','in',0,100,0.1,array['in','cm'],'fms-foot',false),
('field_fms_upper_body_mcs_distance_left','screen_test_fms_upper_body_mcs','fms_upper_body_mcs_distance_left','Lewa ręka',null,'none','single',false,'',3,true,'choices','measurement','in',0,400,0.1,array['in','cm'],'fms-foot',false),
('field_fms_upper_body_mcs_distance_right','screen_test_fms_upper_body_mcs','fms_upper_body_mcs_distance_right','Prawa ręka',null,'none','single',false,'',4,true,'choices','measurement','in',0,400,0.1,array['in','cm'],'fms-foot',false)
on conflict (test_field_id) do update set field_type=excluded.field_type,measurement_unit=excluded.measurement_unit,measurement_min=excluded.measurement_min,measurement_max=excluded.measurement_max,measurement_step=excluded.measurement_step,measurement_unit_options=excluded.measurement_unit_options,measurement_unit_group=excluded.measurement_unit_group,is_required=excluded.is_required,is_wizard_input=true;

update quickscreen_v2.test_fields set disabled_by_test_field_id='field_fms_lower_body_mcs_skipped' where test_field_id in ('field_fms_lower_body_mcs_foot_length','field_fms_lower_body_mcs_distance_left','field_fms_lower_body_mcs_distance_right');
update quickscreen_v2.test_fields set disabled_by_test_field_id='field_fms_upper_body_mcs_skipped' where test_field_id in ('field_fms_upper_body_mcs_foot_length','field_fms_upper_body_mcs_distance_left','field_fms_upper_body_mcs_distance_right');

insert into quickscreen_v2.effect_rules (effect_rule_id,screen_type_id,source_test_field_id,trigger_answer_option_id,source_side_condition,target_screen_test_id,effect_type,effect_value,is_active,reason_template) values
('effect_fms_shoulder_pain_zero','screen_fms','field_fms_shoulder_mobility_pain','option_fms_yes','any','screen_test_fms_shoulder_mobility','set_final_score',0,true,'Shoulder Clearing - ból: {side} strona'),
('effect_fms_extension_pain_zero','screen_fms','field_fms_trunk_stability_push_up_pain','option_fms_yes','none','screen_test_fms_trunk_stability_push_up','set_final_score',0,true,'Extension Clearing - ból zeruje wynik'),
('effect_fms_flexion_pain_zero','screen_fms','field_fms_rotary_stability_pain','option_fms_yes','any','screen_test_fms_rotary_stability','set_final_score',0,true,'Flexion Clearing - ból: {side} strona')
on conflict (effect_rule_id) do update set is_active=true,reason_template=excluded.reason_template;

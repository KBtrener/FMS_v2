-- Idempotent protocol catalog seed. Application data is never written here.
insert into public.screen_types (screen_type_id, code, name, is_active) values
('screen_quick_screen','quick_screen','FMS Quick Screen',true)
on conflict (screen_type_id) do update set name=excluded.name,is_active=excluded.is_active;

insert into public.tests (test_id,code,name,description_short,criteria_summary,source_reference,is_active) values
('test_cervical_flexion','cervical_flexion','Cervical Flexion','Ocena zakresu zgięcia szyi i bólu.','Zakres: Pass/Fail; ból: Brak bólu/Ból.','Manual, strona 9',true),
('test_cervical_rotation','cervical_rotation_extension','Cervical Rotation and Extension','Ocena rotacji szyi oraz bólu.','Dla każdej strony zapisz zakres i dwa stany bólu.','Manual, strony 10-11',true),
('test_toe_touch','toe_touch','Toe Touch','Ocena zgięcia w pozycji wykrocznej.','Strona oznacza nogę z tyłu; wynik to niższy z L/R.','Manual, strony 12-14',true),
('test_shoulder_mobility','shoulder_mobility','Shoulder Mobility','Ocena wzorca ruchomości barków.','Strona oznacza rękę nad głową; wynik to niższy z L/R.','Manual, strony 15-16',true),
('test_shoulder_clearing','shoulder_clearing','Shoulder Clearing','Test bólowy barku.','Ból po stronie może wyzerować Shoulder Mobility.','Manual, strona 17',true),
('test_rotation','rotation','Rotation','Ocena rotacji całego ciała.','Strona oznacza kierunek; wynik to niższy z L/R.','Manual, strony 18-20',true),
('test_balance','balance','Balance','Ocena równowagi na jednej nodze.','Strona oznacza nogę podporową; wynik to niższy z L/R.','Manual, strony 21-22',true),
('test_squat','squat','Squat','Ocena przysiadu bez strony.','Pojedynczy wynik 0-3; ból oznacza 0.','Manual, strony 23-25',true),
('test_spine_extension_clearing','spine_extension_clearing','Spine Extension Clearing','Test bólowy wyprostu kręgosłupa.','Zapisz Brak bólu albo Ból.','Manual, strona 26',true)
on conflict (test_id) do update set name=excluded.name,description_short=excluded.description_short,criteria_summary=excluded.criteria_summary,source_reference=excluded.source_reference,is_active=true;

insert into public.screen_tests values
('screen_test_cervical_flexion','screen_quick_screen','test_cervical_flexion',1,'status_only',true),
('screen_test_cervical_rotation','screen_quick_screen','test_cervical_rotation',2,'status_only_bilateral',true),
('screen_test_toe_touch','screen_quick_screen','test_toe_touch',3,'best_attempt_minimum_bilateral',true),
('screen_test_shoulder_mobility','screen_quick_screen','test_shoulder_mobility',4,'best_attempt_minimum_bilateral',true),
('screen_test_shoulder_clearing','screen_quick_screen','test_shoulder_clearing',5,'status_only_bilateral',true),
('screen_test_rotation','screen_quick_screen','test_rotation',6,'best_attempt_minimum_bilateral',true),
('screen_test_balance','screen_quick_screen','test_balance',7,'best_attempt_minimum_bilateral',true),
('screen_test_squat','screen_quick_screen','test_squat',8,'best_attempt_single',true),
('screen_test_spine_extension_clearing','screen_quick_screen','test_spine_extension_clearing',9,'status_only',true)
on conflict (screen_test_id) do update set sort_order=excluded.sort_order,calculation_type=excluded.calculation_type,is_active=true;

insert into public.answer_sets values
('answer_set_score_0_3','score_0_3','Wynik ruchowy 0-3','discrete_integer',true),
('answer_set_pass_fail','pass_fail','Zakres ruchu','discrete_text',true),
('answer_set_pain_status','pain_status','Ból','discrete_text',true)
on conflict (answer_set_id) do update set name=excluded.name,value_kind=excluded.value_kind,is_active=true;

insert into public.answer_options values
('option_score_0','answer_set_score_0_3','score_0','0 - ból',0,0,true),('option_score_1','answer_set_score_0_3','score_1','1',1,1,true),('option_score_2','answer_set_score_0_3','score_2','2',2,2,true),('option_score_3','answer_set_score_0_3','score_3','3',3,3,true),
('option_pass','answer_set_pass_fail','pass','Pass',null,1,true),('option_fail','answer_set_pass_fail','fail','Fail',null,2,true),
('option_negative','answer_set_pain_status','negative','Brak bólu',null,1,true),('option_positive','answer_set_pain_status','positive','Ból',null,2,true)
on conflict (answer_option_id) do update set label_pl=excluded.label_pl,numeric_value=excluded.numeric_value,is_active=true;

insert into public.test_fields (test_field_id,screen_test_id,code,label_pl,answer_set_id,side_mode,attempt_mode,is_scoring_input,help_text,sort_order) values
('field_cervical_flexion_range','screen_test_cervical_flexion','cervical_flexion_range','Zakres ruchu','answer_set_pass_fail','none','single',true,'',1),
('field_cervical_flexion_pain','screen_test_cervical_flexion','cervical_flexion_pain','Ból przy zgięciu','answer_set_pain_status','none','single',true,'',2),
('field_cervical_rotation_range','screen_test_cervical_rotation','cervical_rotation_range','Zakres rotacji','answer_set_pass_fail','bilateral','single',true,'',1),
('field_cervical_rotation_pain','screen_test_cervical_rotation','cervical_rotation_pain','Ból przy rotacji','answer_set_pain_status','bilateral','single',true,'',2),
('field_cervical_rotation_extension_pain','screen_test_cervical_rotation','cervical_rotation_extension_pain','Ból przy rotacji z wyprostem','answer_set_pain_status','bilateral','single',true,'',3),
('field_toe_touch_score','screen_test_toe_touch','toe_touch_score','Wynik','answer_set_score_0_3','bilateral','best_of_up_to_three',true,'',1),
('field_shoulder_mobility_score','screen_test_shoulder_mobility','shoulder_mobility_score','Wynik','answer_set_score_0_3','bilateral','best_of_up_to_three',true,'',1),
('field_shoulder_clearing_upper_pain','screen_test_shoulder_clearing','shoulder_clearing_upper_pain','Ból - wzorzec górny','answer_set_pain_status','bilateral','single',true,'',1),
('field_shoulder_clearing_lower_pain','screen_test_shoulder_clearing','shoulder_clearing_lower_pain','Ból - wzorzec dolny','answer_set_pain_status','bilateral','single',true,'',2),
('field_shoulder_clearing_pain','screen_test_shoulder_clearing','shoulder_clearing_pain','Ból','answer_set_pain_status','bilateral','single',true,'',3),
('field_rotation_score','screen_test_rotation','rotation_score','Wynik','answer_set_score_0_3','bilateral','best_of_up_to_three',true,'',1),
('field_balance_score','screen_test_balance','balance_score','Wynik','answer_set_score_0_3','bilateral','best_of_up_to_three',true,'',1),
('field_squat_score','screen_test_squat','squat_score','Wynik','answer_set_score_0_3','none','best_of_up_to_three',true,'',1),
('field_spine_extension_clearing_pain','screen_test_spine_extension_clearing','spine_extension_clearing_pain','Ból','answer_set_pain_status','none','single',true,'',1)
on conflict (test_field_id) do update set label_pl=excluded.label_pl,answer_set_id=excluded.answer_set_id,side_mode=excluded.side_mode,is_scoring_input=excluded.is_scoring_input;

insert into public.effect_rules values
('effect_rule_shoulder_upper_clearing_to_shoulder_mobility','screen_quick_screen','field_shoulder_clearing_upper_pain','option_positive','any','screen_test_shoulder_mobility','set_final_score',0,true,'Shoulder Clearing - ból: {side} strona, wzorzec górny'),
('effect_rule_shoulder_lower_clearing_to_shoulder_mobility','screen_quick_screen','field_shoulder_clearing_lower_pain','option_positive','any','screen_test_shoulder_mobility','set_final_score',0,true,'Shoulder Clearing - ból: {side} strona, wzorzec dolny'),
('effect_rule_shoulder_clearing_to_shoulder_mobility','screen_quick_screen','field_shoulder_clearing_pain','option_positive','any','screen_test_shoulder_mobility','set_final_score',0,false,'Shoulder Clearing - Ból po stronie {side}')
on conflict (effect_rule_id) do update set is_active=excluded.is_active,reason_template=excluded.reason_template;

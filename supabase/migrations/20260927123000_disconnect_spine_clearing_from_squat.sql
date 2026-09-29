update quickscreen_v2.screen_tests
set parent_screen_test_id = null
where screen_test_id = 'screen_test_spine_extension_clearing';

delete from quickscreen_v2.applied_effects
where effect_rule_id = 'effect_rule_spine_extension_clearing_to_squat';

update quickscreen_v2.effect_rules
set is_active = false
where effect_rule_id = 'effect_rule_spine_extension_clearing_to_squat';

alter table quickscreen_v2.assessments disable trigger assessments_validate_owner;

with numeric_scores as (
  select assessment.assessment_id, step.screen_test_id,
    case when step.calculation_type = 'best_attempt_single' then max(answer.numeric_value) else min(answer.numeric_value) end as base_score
  from quickscreen_v2.assessments assessment
  join quickscreen_v2.screen_tests step on step.screen_type_id = assessment.screen_type_id and step.is_active and step.calculation_type not like 'status%'
  join quickscreen_v2.test_fields field on field.screen_test_id = step.screen_test_id and field.is_scoring_input
  join quickscreen_v2.answer_sets answer_set on answer_set.answer_set_id = field.answer_set_id and answer_set.code = 'score_0_3'
  join quickscreen_v2.assessment_answers answer on answer.test_field_id = field.test_field_id and answer.assessment_id = assessment.assessment_id
  where assessment.status = 'completed'
  group by assessment.assessment_id, step.screen_test_id, step.calculation_type
), totals as (
  select score.assessment_id,
    sum(coalesce(effect.after_score, score.base_score))::integer as total_score
  from numeric_scores score
  left join lateral (
    select min(applied.after_score) as after_score
    from quickscreen_v2.applied_effects applied
    where applied.assessment_id = score.assessment_id and applied.target_screen_test_id = score.screen_test_id
  ) effect on true
  group by score.assessment_id
)
update quickscreen_v2.assessments assessment
set total_score = totals.total_score
from totals
where assessment.assessment_id = totals.assessment_id;

alter table quickscreen_v2.assessments enable trigger assessments_validate_owner;

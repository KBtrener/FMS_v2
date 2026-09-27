alter type quickscreen_v2.assessment_status add value if not exists 'in_progress';
alter table quickscreen_v2.assessments add column if not exists total_score integer;
alter table quickscreen_v2.assessments add column if not exists max_score integer;

create unique index if not exists assessment_answers_draft_identity_idx
  on quickscreen_v2.assessment_answers (assessment_id, test_field_id, side, attempt_number);

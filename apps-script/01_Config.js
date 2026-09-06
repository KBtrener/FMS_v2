var FMS_SETTINGS = Object.freeze({
  ownerEmail: "info@kbtrener.pl",
  driveRootFolderId: "1jFAX9C5JROxTTrnNRt9QXUMEjsKD88yZ",
  spreadsheetName: "FMS Quick Screen - Dane",
  applicationName: "FMS Quick Screen",
  schemaVersion: "1.0",
  timeZone: "Europe/Warsaw",
});

var FMS_SHEETS = Object.freeze({
  clients: [
    "client_id", "first_name", "last_name", "email", "is_archived",
    "created_at", "updated_at",
  ],
  assessments: [
    "assessment_id", "client_id", "screen_type_id", "assessment_date",
    "completed_at", "note", "status", "correction_note", "created_at",
    "updated_at",
  ],
  screen_types: ["screen_type_id", "code", "name", "is_active"],
  tests: [
    "test_id", "code", "name", "description_short", "criteria_summary",
    "source_reference", "is_active",
  ],
  screen_tests: [
    "screen_test_id", "screen_type_id", "test_id", "sort_order",
    "calculation_type", "is_active",
  ],
  answer_sets: ["answer_set_id", "code", "name", "value_kind", "is_active"],
  answer_options: [
    "answer_option_id", "answer_set_id", "code", "label_pl",
    "numeric_value", "sort_order", "is_active",
  ],
  test_fields: [
    "test_field_id", "screen_test_id", "code", "label_pl", "answer_set_id",
    "side_mode", "attempt_mode", "is_scoring_input", "help_text", "sort_order",
  ],
  assessment_answers: [
    "answer_id", "assessment_id", "test_field_id", "side", "attempt_number",
    "answer_option_id", "numeric_value", "unit", "created_at", "updated_at",
  ],
  effect_rules: [
    "effect_rule_id", "screen_type_id", "source_test_field_id",
    "trigger_answer_option_id", "source_side_condition", "target_screen_test_id",
    "effect_type", "effect_value", "is_active", "reason_template",
  ],
  applied_effects: [
    "applied_effect_id", "assessment_id", "effect_rule_id", "source_answer_id",
    "target_screen_test_id", "before_score", "after_score", "reason_pl",
    "created_at",
  ],
});

var FMS_PROPERTIES = Object.freeze({
  spreadsheetId: "FMS_SPREADSHEET_ID",
  initializedAt: "FMS_INITIALIZED_AT",
});

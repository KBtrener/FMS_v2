import { createClient } from "@supabase/supabase-js";
import seed from "../FMS_Quick_Screen_Codex_Package/config/quick_screen_seed.json" with { type: "json" };
import { DESCRIPTION_VERSION, loadManualDescriptions } from "./manual-descriptions.mjs";

const url = process.env.SUPABASE_PROJECT_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Wymagane są SUPABASE_PROJECT_URL i SUPABASE_SERVICE_ROLE_KEY w środowisku.");
const client = createClient(url.replace(/\/(?:rest|auth|storage)\/v1\/?$/, '').replace(/\/+$/, ''), key, { auth: { autoRefreshToken: false, persistSession: false } });
const fail = ({ data, error }, label) => { if (error) throw new Error(`${label}: ${error.message}`); return data; };

fail(await client.from("screen_types").upsert(seed.screenTypes.map(x => ({ screen_type_id: x.screenTypeId, code: x.code, name: x.name, is_active: x.isActive })), { onConflict: "screen_type_id" }), "screen_types");
fail(await client.from("tests").upsert(seed.tests.map(x => ({ test_id: x.testId, code: x.code, name: x.name, description_short: x.descriptionShort, criteria_summary: x.criteriaSummary, source_reference: x.sourceReference, is_active: true })), { onConflict: "test_id" }), "tests");
fail(await client.from("screen_tests").upsert(seed.screenTests.map(x => ({ screen_test_id: x.screenTestId, screen_type_id: x.screenTypeId, test_id: x.testId, sort_order: x.sortOrder, calculation_type: x.calculationType, is_active: x.isActive })), { onConflict: "screen_test_id" }), "screen_tests");
fail(await client.from("answer_sets").upsert(seed.answerSets.map(x => ({ answer_set_id: x.answerSetId, code: x.code, name: x.name, value_kind: x.valueKind, is_active: x.isActive })), { onConflict: "answer_set_id" }), "answer_sets");
fail(await client.from("answer_options").upsert(seed.answerSets.flatMap(set => set.options.map(x => ({ answer_option_id: x.answerOptionId, answer_set_id: set.answerSetId, code: x.code, label_pl: x.labelPl, numeric_value: x.numericValue, sort_order: x.sortOrder, is_active: true }))), { onConflict: "answer_option_id" }), "answer_options");
const sets = Object.fromEntries(seed.answerSets.map(x => [x.code, x.answerSetId]));
fail(await client.from("test_fields").upsert(seed.testFields.map(x => ({ test_field_id: x.testFieldId, screen_test_id: x.screenTestId, code: x.code, label_pl: x.labelPl, answer_set_id: sets[x.answerSetCode], side_mode: x.sideMode, attempt_mode: x.attemptMode, is_scoring_input: x.isScoringInput, help_text: x.helpText || "", sort_order: x.sortOrder })), { onConflict: "test_field_id" }), "test_fields");
const options = Object.fromEntries(seed.answerSets.flatMap(set => set.options.map(x => [x.code, x.answerOptionId])));
const rules = [...seed.effectRules, ...(seed.demoOnlyEffectRules || [])].map(x => ({ effect_rule_id: x.effectRuleId, screen_type_id: x.screenTypeId, source_test_field_id: x.sourceTestFieldId, trigger_answer_option_id: options[x.triggerAnswerCode], source_side_condition: x.sourceSideCondition, target_screen_test_id: x.targetScreenTestId, effect_type: x.effectType, effect_value: x.effectValue, is_active: x.isActive, reason_template: x.reasonTemplate }));
fail(await client.from("effect_rules").upsert(rules, { onConflict: "effect_rule_id" }), "effect_rules");
const descriptions = loadManualDescriptions();
fail(await client.from("test_descriptions").update({ is_active: false }).neq("manual_version", DESCRIPTION_VERSION), "deactivate old test descriptions");
fail(await client.from("test_descriptions").upsert(descriptions.map(item => ({
  test_id: seed.tests.find(test => test.code === item.testCode)?.testId,
  locale: item.locale,
  purpose: item.purpose,
  procedure: item.procedure,
  verbal_instruction: item.verbalInstruction,
  side_definition: item.sideDefinition,
  scoring_criteria: item.scoringCriteria,
  report_description: item.reportDescription,
  source_reference: item.sourceReference,
  manual_version: item.manualVersion,
  content_hash: item.contentHash,
  is_active: true,
})), { onConflict: "test_id,locale,manual_version" }), "test_descriptions");
console.log(JSON.stringify({ screenTypes: seed.screenTypes.length, tests: seed.tests.length, screenTests: seed.screenTests.length, answerSets: seed.answerSets.length, answerOptions: seed.answerSets.reduce((n, x) => n + x.options.length, 0), testFields: seed.testFields.length, effectRules: rules.length, testDescriptions: descriptions.length, manualVersion: DESCRIPTION_VERSION }));

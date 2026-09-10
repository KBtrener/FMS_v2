const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
let core;
test.before(async () => { core = await import("../web/core.js"); });

const seed = JSON.parse(readFileSync(resolve(__dirname, "../FMS_Quick_Screen_Codex_Package/config/quick_screen_seed.json"), "utf8"));
const fixtures = JSON.parse(readFileSync(resolve(__dirname, "../FMS_Quick_Screen_Codex_Package/fixtures/assessment_fixtures.json"), "utf8"));
const configFromSeed = seed => {
  const answerSets = seed.answerSets.map(set => ({ ...set, options: set.options.map(option => ({ ...option, answerSetId: set.answerSetId })) }));
  const fields = seed.testFields.map(field => ({ ...field, answerSetId: answerSets.find(set => set.code === field.answerSetCode).answerSetId }));
  const options = answerSets.flatMap(set => set.options);
  return { fields, rules: seed.effectRules, fieldsById: Object.fromEntries(fields.map(x => [x.testFieldId, x])), fieldsByCode: Object.fromEntries(fields.map(x => [x.code, x])), optionsById: Object.fromEntries(options.map(x => [x.answerOptionId, x])), optionsByCode: Object.fromEntries(options.map(x => [x.code, x])), testsById: Object.fromEntries(seed.tests.map(x => [x.testId, x])), screenTestsById: Object.fromEntries(seed.screenTests.map(x => [x.screenTestId, x])) };
};
const asInput = fixture => fixture.answers.map(([fieldCode, side, answerCode]) => ({ fieldCode, side, answerCode }));

test("AT-01 wymaga wszystkich danych klienta i poprawnego e-maila", () => {
  assert.throws(() => core.validateClient({ firstName:"", lastName:"Nowak", email:"a@b.pl" }), /Imię/);
  assert.throws(() => core.validateClient({ firstName:"Marta", lastName:"", email:"a@b.pl" }), /Nazwisko/);
  assert.throws(() => core.validateClient({ firstName:"Marta", lastName:"Nowak", email:"zĹ‚y" }), /e-mail/);
});
test("AT-03â€“05 fixture historii majÄ… wyniki 9, 11, 11", () => {
  const results = fixtures.assessments.slice(0,3).map(item => core.calculateAssessment(asInput(item), configFromSeed(seed)));
  assert.deepEqual(results.map(item => item.totalScreenScore), [9,11,11]);
});
test("AT-06 wynik obustronny przyjmuje niĹĽszÄ… stronÄ™", () => {
  const fixture = structuredClone(fixtures.assessments[0]);
  fixture.answers = fixture.answers.map(answer => answer[0] === "toe_touch_score" ? [answer[0],answer[1],answer[1] === "left" ? "score_3" : "score_2"] : answer);
  assert.equal(core.calculateAssessment(asInput(fixture), configFromSeed(seed)).finalScores.toe_touch, 2);
});

test("AT-07 Shoulder Clearing ustawia Shoulder Mobility na zero i zapisuje przyczynÄ™", () => {
  const result = core.calculateAssessment(asInput(fixtures.assessments[4]), configFromSeed(seed));
  assert.equal(result.baseScores.shoulder_mobility, 3);
  assert.equal(result.finalScores.shoulder_mobility, 0);
  assert.match(result.appliedEffects[0].reasonPl, /prawej/);
});

test("AT-08â€“09 Spine Extension nie wpĹ‚ywa produkcyjnie, ale dziaĹ‚a jako reguĹ‚a danych", () => {
  const input = asInput(fixtures.assessments[3]);
  assert.equal(core.calculateAssessment(input, configFromSeed(seed)).finalScores.squat, 3);
  const rules = seed.effectRules.concat(seed.demoOnlyEffectRules.map(rule => ({...rule,isActive:true})));
  const demo = core.calculateAssessment(input, {...configFromSeed(seed), rules}, rules);
  assert.equal(demo.finalScores.squat, 0);
  assert.equal(demo.appliedEffects[0].effectRuleId, "effect_rule_demo_spine_extension_to_squat");
});

test("AT-10 szeĹ›Ä‡ odpowiedzi szyjnych jest zachowanych osobno", () => {
  const result = core.calculateAssessment(asInput(fixtures.assessments[0]), configFromSeed(seed));
  const cervical = result.statuses.filter(answer => answer.fieldCode.startsWith("cervical_rotation"));
  assert.equal(cervical.length, 6);
  assert.deepEqual([...new Set(cervical.map(answer => answer.side))].sort(), ["left","right"]);
});

test("AT-11 odrzuca wynik spoza skonfigurowanych liczb caĹ‚kowitych 0â€“3", () => {
  const invalid = asInput(fixtures.assessments[0]);
  invalid.find(answer => answer.fieldCode === "squat_score").answerCode = "score_2.5";
  assert.throws(() => core.calculateAssessment(invalid, configFromSeed(seed)), /Odpowiedź nie pasuje|Nieznane/);
});

test("AT-13 historia pomija badania archiwalne", () => {
  const history = core.buildHistory([
    {assessmentId:"1",assessmentDate:"2026-01-01",totalScreenScore:9,status:"completed"},
    {assessmentId:"2",assessmentDate:"2026-02-01",totalScreenScore:11,status:"archived"},
    {assessmentId:"3",assessmentDate:"2026-03-01",totalScreenScore:12,status:"completed"},
  ]);
  assert.deepEqual(history.map(item => item.total), [9,12]);
});

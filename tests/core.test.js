const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const core = require("../apps-script/02_Core.js");

const seed = JSON.parse(readFileSync(resolve(__dirname, "../FMS_Quick_Screen_Codex_Package/config/quick_screen_seed.json"), "utf8"));
const fixtures = JSON.parse(readFileSync(resolve(__dirname, "../FMS_Quick_Screen_Codex_Package/fixtures/assessment_fixtures.json"), "utf8"));
const asInput = fixture => fixture.answers.map(([fieldCode, side, answerCode]) => ({ fieldCode, side, answerCode }));

test("AT-01 wymaga wszystkich danych klienta i poprawnego e-maila", () => {
  assert.throws(() => core.validateClient({ firstName:"", lastName:"Nowak", email:"a@b.pl" }), /Imię/);
  assert.throws(() => core.validateClient({ firstName:"Marta", lastName:"", email:"a@b.pl" }), /Nazwisko/);
  assert.throws(() => core.validateClient({ firstName:"Marta", lastName:"Nowak", email:"zły" }), /e-mail/);
});

test("AT-03–05 fixture historii mają wyniki 9, 11, 11", () => {
  const results = fixtures.assessments.slice(0,3).map(item => core.calculateAssessment(asInput(item), seed));
  assert.deepEqual(results.map(item => item.totalScreenScore), [9,11,11]);
});

test("AT-06 wynik obustronny przyjmuje niższą stronę", () => {
  const fixture = structuredClone(fixtures.assessments[0]);
  fixture.answers = fixture.answers.map(answer => answer[0] === "toe_touch_score" ? [answer[0],answer[1],answer[1] === "left" ? "score_3" : "score_2"] : answer);
  assert.equal(core.calculateAssessment(asInput(fixture), seed).finalScores.toe_touch, 2);
});

test("AT-07 Shoulder Clearing ustawia Shoulder Mobility na zero i zapisuje przyczynę", () => {
  const result = core.calculateAssessment(asInput(fixtures.assessments[4]), seed);
  assert.equal(result.baseScores.shoulder_mobility, 3);
  assert.equal(result.finalScores.shoulder_mobility, 0);
  assert.match(result.appliedEffects[0].reasonPl, /prawej/);
});

test("AT-08–09 Spine Extension nie wpływa produkcyjnie, ale działa jako reguła danych", () => {
  const input = asInput(fixtures.assessments[3]);
  assert.equal(core.calculateAssessment(input, seed).finalScores.squat, 3);
  const rules = seed.effectRules.concat(seed.demoOnlyEffectRules.map(rule => ({...rule,isActive:true})));
  const demo = core.calculateAssessment(input, seed, rules);
  assert.equal(demo.finalScores.squat, 0);
  assert.equal(demo.appliedEffects[0].effectRuleId, "effect_rule_demo_spine_extension_to_squat");
});

test("AT-10 sześć odpowiedzi szyjnych jest zachowanych osobno", () => {
  const result = core.calculateAssessment(asInput(fixtures.assessments[0]), seed);
  const cervical = result.statuses.filter(answer => answer.fieldCode.startsWith("cervical_rotation"));
  assert.equal(cervical.length, 6);
  assert.deepEqual([...new Set(cervical.map(answer => answer.side))].sort(), ["left","right"]);
});

test("AT-11 odrzuca wynik spoza skonfigurowanych liczb całkowitych 0–3", () => {
  const invalid = asInput(fixtures.assessments[0]);
  invalid.find(answer => answer.fieldCode === "squat_score").answerCode = "score_2.5";
  assert.throws(() => core.calculateAssessment(invalid, seed), /Nieznana odpowiedź/);
});

test("AT-13 historia pomija badania archiwalne", () => {
  const history = core.buildHistory([
    {assessmentId:"1",assessmentDate:"2026-01-01",totalScreenScore:9,status:"completed"},
    {assessmentId:"2",assessmentDate:"2026-02-01",totalScreenScore:11,status:"archived"},
    {assessmentId:"3",assessmentDate:"2026-03-01",totalScreenScore:12,status:"completed"},
  ]);
  assert.deepEqual(history.map(item => item.total), [9,12]);
});

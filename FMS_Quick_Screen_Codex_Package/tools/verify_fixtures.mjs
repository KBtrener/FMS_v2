import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const seed = JSON.parse(
  readFileSync(resolve(root, "config/quick_screen_seed.json"), "utf8"),
);
const fixtures = JSON.parse(
  readFileSync(resolve(root, "fixtures/assessment_fixtures.json"), "utf8"),
);

const fieldById = new Map(seed.testFields.map((field) => [field.testFieldId, field]));
const screenTestById = new Map(
  seed.screenTests.map((screenTest) => [screenTest.screenTestId, screenTest]),
);
const testById = new Map(seed.tests.map((test) => [test.testId, test]));
const optionByCode = new Map(
  seed.answerSets.flatMap((set) =>
    set.options.map((option) => [option.code, option]),
  ),
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function scoreFor(answerCode) {
  const option = optionByCode.get(answerCode);
  assert(option, "Nieznana odpowiedź: " + answerCode);
  assert(
    Number.isInteger(option.numericValue) &&
      option.numericValue >= 0 &&
      option.numericValue <= 3,
    "Odpowiedź nie jest prawidłowym wynikiem 0-3: " + answerCode,
  );
  return option.numericValue;
}

function fieldAnswers(assessment, fieldCode) {
  return assessment.answers
    .filter(([code]) => code === fieldCode)
    .map(([, side, answerCode]) => ({ side, answerCode }));
}

function baseScores(assessment) {
  const numericFields = [
    ["toe_touch_score", "toe_touch"],
    ["shoulder_mobility_score", "shoulder_mobility"],
    ["rotation_score", "rotation"],
    ["balance_score", "balance"],
    ["squat_score", "squat"],
  ];

  return Object.fromEntries(
    numericFields.map(([fieldCode, testCode]) => {
      const answers = fieldAnswers(assessment, fieldCode);
      assert(answers.length > 0, assessment.assessmentId + " nie ma " + fieldCode);
      return [
        testCode,
        Math.min(...answers.map((answer) => scoreFor(answer.answerCode))),
      ];
    }),
  );
}

function targetTestCode(rule) {
  const screenTest = screenTestById.get(rule.targetScreenTestId);
  assert(screenTest, "Nieznany cel reguły: " + rule.targetScreenTestId);
  const test = testById.get(screenTest.testId);
  assert(test, "Nieznany test celu: " + screenTest.testId);
  return test.code;
}

function sourceFieldCode(rule) {
  const field = fieldById.get(rule.sourceTestFieldId);
  assert(field, "Nieznane pole źródłowe: " + rule.sourceTestFieldId);
  return field.code;
}

function ruleMatches(rule, assessment) {
  const answers = fieldAnswers(assessment, sourceFieldCode(rule));
  return answers.some((answer) => {
    if (answer.answerCode !== rule.triggerAnswerCode) return false;
    if (rule.sourceSideCondition === "any" || rule.sourceSideCondition === "none") {
      return true;
    }
    return answer.side === rule.sourceSideCondition;
  });
}

function calculate(assessment, rules) {
  const base = baseScores(assessment);
  const finalScores = { ...base };
  const appliedEffects = [];

  for (const rule of rules.filter((candidate) => candidate.isActive)) {
    if (!ruleMatches(rule, assessment)) continue;
    const testCode = targetTestCode(rule);
    const beforeScore = finalScores[testCode];
    finalScores[testCode] = rule.effectValue;
    appliedEffects.push({
      effectRuleId: rule.effectRuleId,
      targetTestCode: testCode,
      beforeScore,
      afterScore: rule.effectValue,
      reasonContains: rule.reasonTemplate.split(" - ")[0],
    });
  }

  return {
    baseFinalScores: base,
    finalScores,
    totalScreenScore: Object.values(finalScores).reduce((sum, value) => sum + value, 0),
    appliedEffects,
  };
}

function sameJson(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function verifyExpected(label, actual, expected) {
  for (const key of ["baseFinalScores", "finalScores", "totalScreenScore"]) {
    if (!(key in expected)) continue;
    assert(
      sameJson(actual[key], expected[key]),
      label + ": niezgodne " + key + "\nactual: " +
        JSON.stringify(actual[key]) + "\nexpected: " + JSON.stringify(expected[key]),
    );
  }

  if ("appliedEffects" in expected) {
    assert(
      actual.appliedEffects.length === expected.appliedEffects.length,
      label + ": zła liczba appliedEffects",
    );
    expected.appliedEffects.forEach((effect, index) => {
      const actualEffect = actual.appliedEffects[index];
      for (const key of ["effectRuleId", "targetTestCode", "beforeScore", "afterScore"]) {
        assert(
          actualEffect[key] === effect[key],
          label + ": niezgodne appliedEffect." + key,
        );
      }
      assert(
        actualEffect.reasonContains.includes(effect.reasonContains),
        label + ": brak oczekiwanej przyczyny",
      );
    });
  }
}

for (const assessment of fixtures.assessments) {
  if (assessment.expected) {
    verifyExpected(
      assessment.assessmentId + " / production",
      calculate(assessment, seed.effectRules),
      assessment.expected,
    );
  }
  if (assessment.expectedWithProductionRules) {
    verifyExpected(
      assessment.assessmentId + " / production",
      calculate(assessment, seed.effectRules),
      assessment.expectedWithProductionRules,
    );
  }
  if (assessment.expectedWithDemoSpineRuleEnabled) {
    const rules = seed.effectRules.concat(
      seed.demoOnlyEffectRules.map((rule) => ({ ...rule, isActive: true })),
    );
    verifyExpected(
      assessment.assessmentId + " / demo relation",
      calculate(assessment, rules),
      assessment.expectedWithDemoSpineRuleEnabled,
    );
  }
}

console.log("PASS: konfiguracja i wszystkie fixture'y są spójne.");

(function (root, factory) {
  var api = factory();
  root.FmsCore = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VALID_SIDES = ["left", "right", "none"];

  function requiredText(value, label) {
    var text = String(value == null ? "" : value).trim();
    if (!text) throw new Error(label + " jest wymagane.");
    return text;
  }

  function normalizeEmail(value) {
    var email = requiredText(value, "E-mail").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Podaj prawidłowy adres e-mail.");
    }
    return email;
  }

  function validateClient(input) {
    input = input || {};
    return {
      firstName: requiredText(input.firstName, "Imię"),
      lastName: requiredText(input.lastName, "Nazwisko"),
      email: normalizeEmail(input.email),
    };
  }

  function indexSeed(seed) {
    var answerSets = {};
    var optionsByCode = {};
    var optionsById = {};
    var fieldsByCode = {};
    var fieldsById = {};
    var screenTestsById = {};
    var testsById = {};
    (seed.answerSets || []).forEach(function (set) {
      answerSets[set.code] = set;
      (set.options || []).forEach(function (option) {
        optionsByCode[option.code] = option;
        optionsById[option.answerOptionId] = option;
      });
    });
    (seed.testFields || []).forEach(function (field) {
      fieldsByCode[field.code] = field;
      fieldsById[field.testFieldId] = field;
    });
    (seed.screenTests || []).forEach(function (item) {
      screenTestsById[item.screenTestId] = item;
    });
    (seed.tests || []).forEach(function (test) { testsById[test.testId] = test; });
    return {
      answerSets: answerSets,
      optionsByCode: optionsByCode,
      optionsById: optionsById,
      fieldsByCode: fieldsByCode,
      fieldsById: fieldsById,
      screenTestsById: screenTestsById,
      testsById: testsById,
    };
  }

  function expectedSides(field) {
    return field.sideMode === "bilateral" ? ["left", "right"] : ["none"];
  }

  function validateAnswers(answers, seed) {
    if (!Array.isArray(answers)) throw new Error("Odpowiedzi mają nieprawidłowy format.");
    var index = indexSeed(seed);
    var seen = {};
    var normalized = answers.map(function (input, position) {
      var field = index.fieldsByCode[input.fieldCode];
      if (!field) throw new Error("Nieznane pole odpowiedzi: " + input.fieldCode + ".");
      var side = String(input.side || "none");
      if (VALID_SIDES.indexOf(side) < 0 || expectedSides(field).indexOf(side) < 0) {
        throw new Error("Nieprawidłowa strona dla pola " + field.labelPl + ".");
      }
      var option = index.optionsByCode[input.answerCode];
      if (!option) throw new Error("Nieznana odpowiedź: " + input.answerCode + ".");
      var set = index.answerSets[field.answerSetCode];
      var allowed = (set.options || []).some(function (candidate) {
        return candidate.answerOptionId === option.answerOptionId;
      });
      if (!allowed) throw new Error("Odpowiedź nie pasuje do pola " + field.labelPl + ".");
      if (field.answerSetCode === "score_0_3" &&
          (!Number.isInteger(option.numericValue) || option.numericValue < 0 || option.numericValue > 3)) {
        throw new Error("Wynik musi być liczbą całkowitą od 0 do 3.");
      }
      var key = field.code + ":" + side;
      if (seen[key]) throw new Error("Pole " + field.labelPl + " ma podwójną odpowiedź.");
      seen[key] = true;
      return {
        fieldCode: field.code,
        testFieldId: field.testFieldId,
        side: side,
        answerCode: option.code,
        answerOptionId: option.answerOptionId,
        numericValue: option.numericValue,
        position: position,
      };
    });

    (seed.testFields || []).filter(function (field) { return field.isScoringInput; })
      .forEach(function (field) {
        expectedSides(field).forEach(function (side) {
          if (!seen[field.code + ":" + side]) {
            throw new Error("Uzupełnij pole „" + field.labelPl + "” (" +
              (side === "left" ? "lewa strona" : side === "right" ? "prawa strona" : "bez strony") + ").");
          }
        });
      });
    return normalized;
  }

  function calculateAssessment(answers, seed, rulesOverride) {
    var normalized = validateAnswers(answers, seed);
    var index = indexSeed(seed);
    var byField = {};
    normalized.forEach(function (answer) {
      if (!byField[answer.fieldCode]) byField[answer.fieldCode] = [];
      byField[answer.fieldCode].push(answer);
    });
    var scoreFields = {
      toe_touch: "toe_touch_score",
      shoulder_mobility: "shoulder_mobility_score",
      rotation: "rotation_score",
      balance: "balance_score",
      squat: "squat_score",
    };
    var baseScores = {};
    var rawScores = {};
    Object.keys(scoreFields).forEach(function (testCode) {
      var values = byField[scoreFields[testCode]];
      rawScores[testCode] = {};
      values.forEach(function (answer) { rawScores[testCode][answer.side] = answer.numericValue; });
      baseScores[testCode] = Math.min.apply(null, values.map(function (answer) {
        return answer.numericValue;
      }));
    });
    var finalScores = Object.assign({}, baseScores);
    var appliedEffects = [];
    var rules = rulesOverride || seed.effectRules || [];
    rules.filter(function (rule) { return rule.isActive; }).forEach(function (rule) {
      var field = index.fieldsById[rule.sourceTestFieldId];
      var matching = normalized.filter(function (answer) {
        if (answer.fieldCode !== field.code || answer.answerCode !== rule.triggerAnswerCode) return false;
        return rule.sourceSideCondition === "any" || rule.sourceSideCondition === "none" ||
          answer.side === rule.sourceSideCondition;
      });
      matching.forEach(function (source) {
        var target = index.screenTestsById[rule.targetScreenTestId];
        var testCode = index.testsById[target.testId].code;
        var before = finalScores[testCode];
        if (rule.effectType !== "set_final_score") throw new Error("Nieobsługiwany typ reguły.");
        finalScores[testCode] = rule.effectValue;
        appliedEffects.push({
          effectRuleId: rule.effectRuleId,
          sourceAnswerPosition: source.position,
          sourceSide: source.side,
          targetScreenTestId: rule.targetScreenTestId,
          targetTestCode: testCode,
          beforeScore: before,
          afterScore: rule.effectValue,
          reasonPl: String(rule.reasonTemplate).replace("{side}", sideLabel(source.side)),
        });
      });
    });
    return {
      answers: normalized,
      rawScores: rawScores,
      baseScores: baseScores,
      finalScores: finalScores,
      totalScreenScore: Object.keys(finalScores).reduce(function (sum, key) {
        return sum + finalScores[key];
      }, 0),
      appliedEffects: appliedEffects,
      statuses: normalized.filter(function (answer) { return answer.numericValue == null; }),
    };
  }

  function sideLabel(side) {
    return side === "left" ? "lewej" : side === "right" ? "prawej" : "bez wskazania strony";
  }

  function validateAssessmentInput(input, seed) {
    input = input || {};
    var clientId = requiredText(input.clientId, "Klient");
    var date = requiredText(input.assessmentDate, "Data badania");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Data badania ma nieprawidłowy format.");
    var parsed = new Date(date + "T12:00:00Z");
    if (isNaN(parsed.getTime())) throw new Error("Data badania jest nieprawidłowa.");
    return {
      clientId: clientId,
      assessmentDate: date,
      note: String(input.note || "").trim(),
      correctionNote: String(input.correctionNote || "").trim(),
      result: calculateAssessment(input.answers, seed),
    };
  }

  function buildHistory(assessments) {
    return (assessments || []).filter(function (item) { return item.status !== "archived"; })
      .slice().sort(function (a, b) {
        return String(a.assessmentDate).localeCompare(String(b.assessmentDate));
      }).map(function (item) {
        return { assessmentId: item.assessmentId, date: item.assessmentDate, total: item.totalScreenScore };
      });
  }

  return {
    validateClient: validateClient,
    normalizeEmail: normalizeEmail,
    validateAnswers: validateAnswers,
    validateAssessmentInput: validateAssessmentInput,
    calculateAssessment: calculateAssessment,
    buildHistory: buildHistory,
    indexSeed: indexSeed,
  };
});

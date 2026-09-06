var FmsServices = (function () {
  "use strict";

  function requireId(value, label) {
    var result = String(value || "").trim();
    if (!result) throw new Error(label + " jest wymagany.");
    return result;
  }

  function dateValue(value) {
    if (Object.prototype.toString.call(value) === "[object Date]") {
      return Utilities.formatDate(value, FMS_SETTINGS.timeZone || "Europe/Warsaw", "yyyy-MM-dd");
    }
    return String(value || "").slice(0, 10);
  }

  function initializeApplication() {
    return FmsRepository.initialize();
  }

  function getInitialConfiguration() {
    FmsDriveGuard.assertOwner();
    var properties = PropertiesService.getScriptProperties();
    var spreadsheetId = properties.getProperty(FMS_PROPERTIES.spreadsheetId);
    if (!spreadsheetId) {
      spreadsheetId = FmsRepository.initialize().spreadsheetId;
    }
    return {
      appName: FMS_SETTINGS.applicationName,
      ownerEmail: FMS_SETTINGS.ownerEmail,
      initialized: true,
      seed: (function () { var seed = JSON.parse(JSON.stringify(FMS_SEED)); seed.manualSections = FmsManual.all(); return seed; })(),
    };
  }

  function searchClients(query, includeArchived) {
    var needle = String(query || "").trim().toLowerCase();
    var data = loadData_();
    var assessmentRows = data.assessments;
    var profiles = {};
    data.clients.forEach(function (row) {
      if (!includeArchived && FmsRepository.bool(row.is_archived)) return;
      var haystack = [row.first_name, row.last_name, row.email].join(" ").toLowerCase();
      if (needle && haystack.indexOf(needle) < 0) return;
      profiles[row.client_id] = {
        clientId: row.client_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        isArchived: FmsRepository.bool(row.is_archived),
        lastAssessmentDate: null,
        lastTotalScreenScore: null,
      };
    });
    assessmentRows.filter(function (row) {
      return row.status === "completed" && profiles[row.client_id];
    }).forEach(function (row) {
      var summary = hydrateAssessmentFromData_(row.assessment_id, data);
      var profile = profiles[row.client_id];
      if (!profile.lastAssessmentDate || dateValue(row.assessment_date) > profile.lastAssessmentDate) {
        profile.lastAssessmentDate = dateValue(row.assessment_date);
        profile.lastTotalScreenScore = summary.totalScreenScore;
      }
    });
    return Object.keys(profiles).map(function (key) { return profiles[key]; })
      .sort(function (a, b) {
        return (b.lastAssessmentDate || "").localeCompare(a.lastAssessmentDate || "") ||
          (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName, "pl");
      });
  }

  function createClient(input) {
    var clean = FmsCore.validateClient(input);
    var duplicate = FmsRepository.rows("clients").some(function (row) {
      return String(row.email).toLowerCase() === clean.email;
    });
    var stamp = FmsRepository.nowIso();
    var client = {
      client_id: FmsRepository.makeId("CL"), first_name: clean.firstName,
      last_name: clean.lastName, email: clean.email, is_archived: false,
      created_at: stamp, updated_at: stamp,
    };
    FmsRepository.append("clients", [client]);
    return {
      clientId: client.client_id, firstName: client.first_name,
      lastName: client.last_name, email: client.email,
      duplicateWarning: duplicate ? "Istnieje już klient z tym adresem e-mail." : "",
    };
  }

  function updateClient(clientId, input) {
    var id = requireId(clientId, "Identyfikator klienta");
    var clean = FmsCore.validateClient(input);
    var row = FmsRepository.rows("clients").filter(function (item) { return item.client_id === id; })[0];
    if (!row) throw new Error("Nie znaleziono klienta.");
    var duplicate = FmsRepository.rows("clients").some(function (item) {
      return item.client_id !== id && String(item.email).toLowerCase() === clean.email;
    });
    FmsRepository.updateRow("clients", row._row, {
      first_name: clean.firstName, last_name: clean.lastName, email: clean.email,
      updated_at: FmsRepository.nowIso(),
    });
    return { clientId: id, duplicateWarning: duplicate ? "Inny klient ma ten sam adres e-mail." : "" };
  }

  function setClientArchived_(clientId, archived) {
    var id = requireId(clientId, "Identyfikator klienta");
    var row = FmsRepository.rows("clients").filter(function (item) { return item.client_id === id; })[0];
    if (!row) throw new Error("Nie znaleziono klienta.");
    FmsRepository.updateRow("clients", row._row, {
      is_archived: archived, updated_at: FmsRepository.nowIso(),
    });
    return { clientId: id, isArchived: archived };
  }

  function archiveClient(clientId) { return setClientArchived_(clientId, true); }
  function restoreClient(clientId) { return setClientArchived_(clientId, false); }

  function startAssessment(clientId) {
    var id = requireId(clientId, "Identyfikator klienta");
    var client = FmsRepository.rows("clients").filter(function (row) {
      return row.client_id === id && !FmsRepository.bool(row.is_archived);
    })[0];
    if (!client) throw new Error("Nie znaleziono aktywnego klienta.");
    return { clientId: id, assessmentDate: Utilities.formatDate(new Date(), "Europe/Warsaw", "yyyy-MM-dd"), seed: FmsRepository.currentSeed() };
  }

  function saveAssessment(input) {
    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      return saveAssessmentLocked_(input);
    } finally {
      lock.releaseLock();
    }
  }

  function saveAssessmentLocked_(input) {
    var seed = FmsRepository.currentSeed();
    var clean = FmsCore.validateAssessmentInput(input, seed);
    var client = FmsRepository.rows("clients").filter(function (row) {
      return row.client_id === clean.clientId && !FmsRepository.bool(row.is_archived);
    })[0];
    if (!client) throw new Error("Nie znaleziono aktywnego klienta.");
    var assessmentId = FmsRepository.makeId("AS");
    var stamp = FmsRepository.nowIso();
    var answerRows = buildAnswerRows_(assessmentId, clean.result.answers, stamp);
    var effectRows = buildEffectRows_(assessmentId, clean.result.appliedEffects, answerRows, stamp);
    var assessmentRow = {
      assessment_id: assessmentId, client_id: clean.clientId,
      screen_type_id: seed.screenTypes[0].screenTypeId,
      assessment_date: clean.assessmentDate, completed_at: stamp, note: clean.note,
      status: "completed", correction_note: "", created_at: stamp, updated_at: stamp,
    };
    var written = [];
    try {
      written.push(FmsRepository.append("assessment_answers", answerRows));
      written.push(FmsRepository.append("applied_effects", effectRows));
      written.push(FmsRepository.append("assessments", [assessmentRow]));
    } catch (error) {
      written.filter(Boolean).reverse().forEach(function (entry) {
        entry.sheet.getRange(entry.start, 1, entry.count, entry.sheet.getLastColumn()).clearContent();
      });
      throw error;
    }
    return getClientProfile(clean.clientId, false);
  }

  function buildAnswerRows_(assessmentId, answers, stamp) {
    return answers.map(function (answer) {
      return {
        answer_id: FmsRepository.makeId("AN"), assessment_id: assessmentId,
        test_field_id: answer.testFieldId, side: answer.side, attempt_number: 1,
        answer_option_id: answer.answerOptionId, numeric_value: answer.numericValue,
        unit: "", created_at: stamp, updated_at: stamp,
      };
    });
  }

  function buildEffectRows_(assessmentId, effects, answerRows, stamp) {
    return effects.map(function (effect) {
      return {
        applied_effect_id: FmsRepository.makeId("AE"), assessment_id: assessmentId,
        effect_rule_id: effect.effectRuleId,
        source_answer_id: answerRows[effect.sourceAnswerPosition].answer_id,
        target_screen_test_id: effect.targetScreenTestId,
        before_score: effect.beforeScore, after_score: effect.afterScore,
        reason_pl: effect.reasonPl, created_at: stamp,
      };
    });
  }

  function loadData_() {
    return {
      clients: FmsRepository.rows("clients"),
      assessments: FmsRepository.rows("assessments"),
      answers: FmsRepository.rows("assessment_answers"),
      effects: FmsRepository.rows("applied_effects"),
    };
  }

  function hydrateAssessmentFromData_(assessmentId, data) {
    var hasNewShoulderFields = data.answers.some(function (row) {
      return row.assessment_id === assessmentId && (row.test_field_id === "field_shoulder_clearing_upper_pain" || row.test_field_id === "field_shoulder_clearing_lower_pain");
    });
    var hasLegacyShoulderField = data.answers.some(function (row) {
      return row.assessment_id === assessmentId && row.test_field_id === "field_shoulder_clearing_pain";
    });
    var seed = JSON.parse(JSON.stringify(FMS_SEED));
    if (!hasNewShoulderFields && hasLegacyShoulderField) {
      seed.testFields.forEach(function (field) {
        if (field.code === "shoulder_clearing_pain") field.isScoringInput = true;
        if (field.code === "shoulder_clearing_upper_pain" || field.code === "shoulder_clearing_lower_pain") field.isScoringInput = false;
      });
    }
    var index = FmsCore.indexSeed(seed);
    var assessment = data.assessments.filter(function (row) {
      return row.assessment_id === assessmentId;
    })[0];
    if (!assessment) throw new Error("Nie znaleziono badania.");
    var storedAnswers = data.answers.filter(function (row) {
      return row.assessment_id === assessmentId;
    });
    var inputAnswers = storedAnswers.map(function (row) {
      return {
        fieldCode: index.fieldsById[row.test_field_id].code,
        side: row.side,
        answerCode: index.optionsById[row.answer_option_id].code,
      };
    });
    var calculation = FmsCore.calculateAssessment(inputAnswers, seed, []);
    var effects = data.effects.filter(function (row) {
      return row.assessment_id === assessmentId;
    }).map(function (row) {
      var target = index.screenTestsById[row.target_screen_test_id];
      var testCode = index.testsById[target.testId].code;
      calculation.finalScores[testCode] = Number(row.after_score);
      return {
        effectRuleId: row.effect_rule_id, targetTestCode: testCode,
        beforeScore: Number(row.before_score), afterScore: Number(row.after_score),
        reasonPl: row.reason_pl,
      };
    });
    calculation.totalScreenScore = Object.keys(calculation.finalScores).reduce(function (sum, key) {
      return sum + calculation.finalScores[key];
    }, 0);
    return {
      assessmentId: assessmentId, clientId: assessment.client_id,
      assessmentDate: dateValue(assessment.assessment_date), note: assessment.note || "",
      status: assessment.status, correctionNote: assessment.correction_note || "",
      createdAt: String(assessment.created_at), updatedAt: String(assessment.updated_at),
      answers: inputAnswers, rawScores: calculation.rawScores,
      baseScores: calculation.baseScores, finalScores: calculation.finalScores,
      totalScreenScore: calculation.totalScreenScore,
      statuses: calculation.statuses, appliedEffects: effects,
      isLegacyShoulderClearing: !hasNewShoulderFields && hasLegacyShoulderField,
    };
  }

  function hydrateAssessment_(assessmentId) {
    return hydrateAssessmentFromData_(assessmentId, loadData_());
  }

  function getClientProfile(clientId, includeArchived) {
    var id = requireId(clientId, "Identyfikator klienta");
    var data = loadData_();
    var client = data.clients.filter(function (row) { return row.client_id === id; })[0];
    if (!client) throw new Error("Nie znaleziono klienta.");
    var assessments = data.assessments.filter(function (row) {
      return row.client_id === id && (includeArchived || row.status !== "archived");
    }).map(function (row) { return hydrateAssessmentFromData_(row.assessment_id, data); })
      .sort(function (a, b) { return b.assessmentDate.localeCompare(a.assessmentDate); });
    var active = assessments.filter(function (item) { return item.status !== "archived"; });
    return {
      client: {
        clientId: id, firstName: client.first_name, lastName: client.last_name,
        email: client.email, isArchived: FmsRepository.bool(client.is_archived),
      },
      latestAssessment: active[0] || null,
      assessments: assessments,
      history: FmsCore.buildHistory(active),
    };
  }

  function updateAssessment(assessmentId, input) {
    var id = requireId(assessmentId, "Identyfikator badania");
    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      var row = FmsRepository.rows("assessments").filter(function (item) { return item.assessment_id === id; })[0];
      if (!row) throw new Error("Nie znaleziono badania.");
      input.clientId = row.client_id;
      var clean = FmsCore.validateAssessmentInput(input, FmsRepository.currentSeed());
      if (!clean.correctionNote) throw new Error("Przy korekcie podaj krótką notatkę.");
      var oldAnswers = FmsRepository.removeWhere("assessment_answers", "assessment_id", id);
      var oldEffects = FmsRepository.removeWhere("applied_effects", "assessment_id", id);
      var stamp = FmsRepository.nowIso();
      try {
        var answers = buildAnswerRows_(id, clean.result.answers, stamp);
        FmsRepository.append("assessment_answers", answers);
        FmsRepository.append("applied_effects", buildEffectRows_(id, clean.result.appliedEffects, answers, stamp));
        FmsRepository.updateRow("assessments", row._row, {
          assessment_date: clean.assessmentDate, note: clean.note,
          correction_note: clean.correctionNote, updated_at: stamp,
        });
      } catch (error) {
        FmsRepository.removeWhere("assessment_answers", "assessment_id", id);
        FmsRepository.removeWhere("applied_effects", "assessment_id", id);
        FmsRepository.append("assessment_answers", oldAnswers);
        FmsRepository.append("applied_effects", oldEffects);
        throw error;
      }
      return getClientProfile(row.client_id, false);
    } finally {
      lock.releaseLock();
    }
  }

  function setAssessmentArchived_(assessmentId, status) {
    var id = requireId(assessmentId, "Identyfikator badania");
    var row = FmsRepository.rows("assessments").filter(function (item) { return item.assessment_id === id; })[0];
    if (!row) throw new Error("Nie znaleziono badania.");
    FmsRepository.updateRow("assessments", row._row, { status: status, updated_at: FmsRepository.nowIso() });
    return getClientProfile(row.client_id, true);
  }

  function archiveAssessment(id) { return setAssessmentArchived_(id, "archived"); }
  function restoreAssessment(id) { return setAssessmentArchived_(id, "completed"); }

  function getAdminConfiguration() {
    FmsDriveGuard.assertOwner();
    return {
      tests: FMS_SEED.tests,
      effectRules: FmsRepository.currentSeed().effectRules,
    };
  }

  function setEffectRuleActive(effectRuleId, isActive) {
    var id = requireId(effectRuleId, "Identyfikator reguły");
    var row = FmsRepository.rows("effect_rules").filter(function (item) { return item.effect_rule_id === id; })[0];
    if (!row) throw new Error("Nie znaleziono reguły.");
    FmsRepository.updateRow("effect_rules", row._row, { is_active: Boolean(isActive) });
    return getAdminConfiguration();
  }

  return {
    initializeApplication: initializeApplication,
    getInitialConfiguration: getInitialConfiguration,
    searchClients: searchClients,
    createClient: createClient,
    updateClient: updateClient,
    archiveClient: archiveClient,
    restoreClient: restoreClient,
    startAssessment: startAssessment,
    saveAssessment: saveAssessment,
    getClientProfile: getClientProfile,
    updateAssessment: updateAssessment,
    archiveAssessment: archiveAssessment,
    restoreAssessment: restoreAssessment,
    getAdminConfiguration: getAdminConfiguration,
    setEffectRuleActive: setEffectRuleActive,
    hydrateAssessment_: hydrateAssessment_,
  };
})();

if (typeof module === "object" && module.exports) module.exports = FmsServices;

var FmsRepository = (function () {
  "use strict";

  function nowIso() { return new Date().toISOString(); }
  function bool(value) { return value === true || String(value).toLowerCase() === "true"; }

  function spreadsheet() {
    FmsDriveGuard.assertOwner();
    var id = PropertiesService.getScriptProperties().getProperty(FMS_PROPERTIES.spreadsheetId);
    if (!id) throw new Error("Aplikacja nie została jeszcze zainicjalizowana.");
    FmsDriveGuard.assertDirectChild(id);
    return SpreadsheetApp.openById(id);
  }

  function sheet(name) {
    var value = spreadsheet().getSheetByName(name);
    if (!value) throw new Error("Brak wymaganej karty danych: " + name + ".");
    return value;
  }

  function rows(name) {
    var tab = sheet(name);
    var values = tab.getDataRange().getValues();
    if (values.length < 2) return [];
    var headers = values[0];
    return values.slice(1).filter(function (row) {
      return row.some(function (cell) { return cell !== ""; });
    }).map(function (row, index) {
      var object = { _row: index + 2 };
      headers.forEach(function (key, column) { object[key] = row[column]; });
      return object;
    });
  }

  function append(name, objects) {
    if (!objects.length) return null;
    var tab = sheet(name);
    var headers = FMS_SHEETS[name];
    var start = tab.getLastRow() + 1;
    var values = objects.map(function (object) {
      return headers.map(function (header) {
        return object[header] == null ? "" : object[header];
      });
    });
    tab.getRange(start, 1, values.length, headers.length).setValues(values);
    return { sheet: tab, start: start, count: values.length };
  }

  function updateRow(name, rowNumber, patch) {
    var tab = sheet(name);
    var headers = FMS_SHEETS[name];
    var range = tab.getRange(rowNumber, 1, 1, headers.length);
    var values = range.getValues()[0];
    headers.forEach(function (header, index) {
      if (Object.prototype.hasOwnProperty.call(patch, header)) values[index] = patch[header];
    });
    range.setValues([values]);
  }

  function removeWhere(name, key, value) {
    var matches = rows(name).filter(function (row) { return String(row[key]) === String(value); });
    var tab = sheet(name);
    matches.sort(function (a, b) { return b._row - a._row; })
      .forEach(function (row) { tab.deleteRow(row._row); });
    return matches;
  }

  function makeId(prefix) {
    return prefix + "-" + Utilities.getUuid().replace(/-/g, "").slice(0, 12).toUpperCase();
  }

  function initialize() {
    FmsDriveGuard.assertOwner();
    FmsDriveGuard.assertProjectLocation();
    var properties = PropertiesService.getScriptProperties();
    var existing = properties.getProperty(FMS_PROPERTIES.spreadsheetId);
    if (existing) {
      FmsDriveGuard.assertDirectChild(existing);
      var existingBook = SpreadsheetApp.openById(existing);
      if (!properties.getProperty(FMS_PROPERTIES.initializedAt)) {
        prepareSpreadsheet_(existingBook);
        properties.setProperty(FMS_PROPERTIES.initializedAt, nowIso());
      } else {
        migrateConfiguration_();
      }
      return { spreadsheetId: existing, spreadsheetUrl: existingBook.getUrl(), created: false };
    }
    var id = FmsDriveGuard.createSpreadsheetInRoot(FMS_SETTINGS.spreadsheetName);
    var book = SpreadsheetApp.openById(id);
    properties.setProperty(FMS_PROPERTIES.spreadsheetId, id);
    prepareSpreadsheet_(book);
    properties.setProperty(FMS_PROPERTIES.initializedAt, nowIso());
    return { spreadsheetId: id, spreadsheetUrl: book.getUrl(), created: true };
  }

  function migrateConfiguration_() {
    var fieldCodes = {};
    rows("test_fields").forEach(function (row) { fieldCodes[row.code] = true; });
    var shoulder = FMS_SEED.testFields.filter(function (field) {
      return field.code === "shoulder_clearing_upper_pain" || field.code === "shoulder_clearing_lower_pain";
    });
    var optionSetId = {};
    FMS_SEED.answerSets.forEach(function (set) { optionSetId[set.code] = set.answerSetId; });
    var missingFields = shoulder.filter(function (field) { return !fieldCodes[field.code]; }).map(function (field) {
      return {
        test_field_id: field.testFieldId, screen_test_id: field.screenTestId, code: field.code,
        label_pl: field.labelPl, answer_set_id: optionSetId[field.answerSetCode], side_mode: field.sideMode,
        attempt_mode: field.attemptMode, is_scoring_input: true, help_text: field.helpText || "", sort_order: field.sortOrder,
      };
    });
    append("test_fields", missingFields);
    var rules = rows("effect_rules").map(function (row) { return row.effect_rule_id; });
    var index = FmsCore.indexSeed(FMS_SEED);
    var missingRules = FMS_SEED.effectRules.filter(function (rule) {
      return rules.indexOf(rule.effectRuleId) < 0;
    }).map(function (rule) {
      return {
        effect_rule_id: rule.effectRuleId, screen_type_id: rule.screenTypeId, source_test_field_id: rule.sourceTestFieldId,
        trigger_answer_option_id: index.optionsByCode[rule.triggerAnswerCode].answerOptionId,
        source_side_condition: rule.sourceSideCondition, target_screen_test_id: rule.targetScreenTestId,
        effect_type: rule.effectType, effect_value: rule.effectValue, is_active: rule.isActive, reason_template: rule.reasonTemplate,
      };
    });
    append("effect_rules", missingRules);
  }

  function prepareSpreadsheet_(book) {
    var defaultSheet = book.getSheets()[0];
    Object.keys(FMS_SHEETS).forEach(function (name, position) {
      var tab = book.getSheetByName(name);
      if (!tab) {
        tab = position === 0 && defaultSheet.getLastRow() <= 1 ? defaultSheet.setName(name) : book.insertSheet(name);
      }
      var headers = FMS_SHEETS[name];
      tab.clearContents();
      tab.getRange(1, 1, 1, headers.length).setValues([headers]);
      tab.setFrozenRows(1);
      tab.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#132A36").setFontColor("#FFFFFF");
    });
    seedConfiguration_(book);
  }

  function seedConfiguration_(book) {
    var optionSetId = {};
    FMS_SEED.answerSets.forEach(function (set) { optionSetId[set.code] = set.answerSetId; });
    var data = {
      screen_types: FMS_SEED.screenTypes.map(function (x) { return {
        screen_type_id: x.screenTypeId, code: x.code, name: x.name, is_active: x.isActive,
      }; }),
      tests: FMS_SEED.tests.map(function (x) { return {
        test_id: x.testId, code: x.code, name: x.name, description_short: x.descriptionShort,
        criteria_summary: x.criteriaSummary, source_reference: x.sourceReference, is_active: true,
      }; }),
      screen_tests: FMS_SEED.screenTests.map(function (x) { return {
        screen_test_id: x.screenTestId, screen_type_id: x.screenTypeId, test_id: x.testId,
        sort_order: x.sortOrder, calculation_type: x.calculationType, is_active: x.isActive,
      }; }),
      answer_sets: FMS_SEED.answerSets.map(function (x) { return {
        answer_set_id: x.answerSetId, code: x.code, name: x.name,
        value_kind: x.valueKind, is_active: x.isActive,
      }; }),
      answer_options: FMS_SEED.answerSets.reduce(function (all, set) {
        return all.concat(set.options.map(function (x) { return {
          answer_option_id: x.answerOptionId, answer_set_id: set.answerSetId, code: x.code,
          label_pl: x.labelPl, numeric_value: x.numericValue, sort_order: x.sortOrder, is_active: true,
        }; }));
      }, []),
      test_fields: FMS_SEED.testFields.map(function (x) { return {
        test_field_id: x.testFieldId, screen_test_id: x.screenTestId, code: x.code,
        label_pl: x.labelPl, answer_set_id: optionSetId[x.answerSetCode], side_mode: x.sideMode,
        attempt_mode: x.attemptMode, is_scoring_input: x.isScoringInput,
        help_text: x.helpText || "", sort_order: x.sortOrder,
      }; }),
      effect_rules: FMS_SEED.effectRules.concat(FMS_SEED.demoOnlyEffectRules || []).map(function (x) { return {
        effect_rule_id: x.effectRuleId, screen_type_id: x.screenTypeId,
        source_test_field_id: x.sourceTestFieldId,
        trigger_answer_option_id: FmsCore.indexSeed(FMS_SEED).optionsByCode[x.triggerAnswerCode].answerOptionId,
        source_side_condition: x.sourceSideCondition, target_screen_test_id: x.targetScreenTestId,
        effect_type: x.effectType, effect_value: x.effectValue, is_active: x.isActive,
        reason_template: x.reasonTemplate,
      }; }),
    };
    Object.keys(data).forEach(function (name) {
      var headers = FMS_SHEETS[name];
      var values = data[name].map(function (item) {
        return headers.map(function (key) { return item[key] == null ? "" : item[key]; });
      });
      if (values.length) book.getSheetByName(name).getRange(2, 1, values.length, headers.length).setValues(values);
    });
  }

  function currentSeed() {
    var seed = JSON.parse(JSON.stringify(FMS_SEED));
    var index = FmsCore.indexSeed(seed);
    seed.effectRules = rows("effect_rules").map(function (row) {
      var option = index.optionsById[row.trigger_answer_option_id];
      return {
        effectRuleId: row.effect_rule_id,
        screenTypeId: row.screen_type_id,
        sourceTestFieldId: row.source_test_field_id,
        triggerAnswerCode: option && option.code,
        sourceSideCondition: row.source_side_condition,
        targetScreenTestId: row.target_screen_test_id,
        effectType: row.effect_type,
        effectValue: Number(row.effect_value),
        isActive: bool(row.is_active),
        reasonTemplate: row.reason_template,
      };
    });
    seed.manualSections = FmsManual.all();
    return seed;
  }

  return {
    nowIso: nowIso,
    bool: bool,
    spreadsheet: spreadsheet,
    rows: rows,
    append: append,
    updateRow: updateRow,
    removeWhere: removeWhere,
    makeId: makeId,
    initialize: initialize,
    currentSeed: currentSeed,
  };
})();

if (typeof module === "object" && module.exports) module.exports = FmsRepository;

const NUMERIC_FIELDS = {
  toe_touch: 'toe_touch_score',
  shoulder_mobility: 'shoulder_mobility_score',
  rotation: 'rotation_score',
  balance: 'balance_score',
  squat: 'squat_score',
};

export const NUMERIC_TESTS = [
  ['toe_touch', 'Toe Touch'], ['shoulder_mobility', 'Shoulder Mobility'],
  ['rotation', 'Rotation'], ['balance', 'Balance'], ['squat', 'Squat'],
];

export function requiredText(value, label) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${label} jest wymagane.`);
  return text;
}

export function normalizeEmail(value) {
  const email = requiredText(value, 'E-mail').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Podaj prawidłowy adres e-mail.');
  return email;
}

export function validateClient(input = {}) {
  return { firstName: requiredText(input.firstName, 'Imię'), lastName: requiredText(input.lastName, 'Nazwisko'), email: normalizeEmail(input.email) };
}

export function expectedSides(field) { return field.sideMode === 'bilateral' ? ['left', 'right'] : ['none']; }

export function validateAnswers(answers, cfg) {
  if (!Array.isArray(answers)) throw new Error('Odpowiedzi mają nieprawidłowy format.');
  const seen = new Set();
  const normalized = answers.map((answer, position) => {
    const field = cfg.fieldsByCode[answer.fieldCode];
    if (!field) throw new Error(`Nieznane pole odpowiedzi: ${answer.fieldCode}.`);
    const side = answer.side || 'none';
    if (!expectedSides(field).includes(side)) throw new Error(`Nieprawidłowa strona dla pola ${field.labelPl}.`);
    const option = cfg.optionsByCode[answer.answerCode];
    if (!option || option.answerSetId !== field.answerSetId) throw new Error(`Odpowiedź nie pasuje do pola ${field.labelPl}.`);
    const key = `${field.code}:${side}`;
    if (seen.has(key)) throw new Error(`Pole ${field.labelPl} ma podwójną odpowiedź.`);
    seen.add(key);
    return { fieldCode: field.code, testFieldId: field.testFieldId, side, answerCode: option.code, answerOptionId: option.answerOptionId, numericValue: option.numericValue, position };
  });
  cfg.fields.filter(field => field.isScoringInput).forEach(field => expectedSides(field).forEach(side => {
    if (!seen.has(`${field.code}:${side}`)) throw new Error(`Uzupełnij pole „${field.labelPl}” (${side === 'left' ? 'lewa strona' : side === 'right' ? 'prawa strona' : 'bez strony'}).`);
  }));
  return normalized;
}

export function calculateAssessment(answers, cfg, rules = cfg.rules) {
  const normalized = validateAnswers(answers, cfg);
  const byField = new Map();
  normalized.forEach(answer => byField.set(answer.fieldCode, [...(byField.get(answer.fieldCode) || []), answer]));
  const rawScores = {}, baseScores = {};
  Object.entries(NUMERIC_FIELDS).forEach(([testCode, fieldCode]) => {
    const values = byField.get(fieldCode) || [];
    if (!values.length) throw new Error(`Brak wyniku dla testu ${testCode}.`);
    rawScores[testCode] = Object.fromEntries(values.map(x => [x.side, x.numericValue]));
    baseScores[testCode] = Math.min(...values.map(x => x.numericValue));
  });
  const finalScores = { ...baseScores }, appliedEffects = [];
  rules.filter(rule => rule.isActive).forEach(rule => {
    const field = cfg.fieldsById[rule.sourceTestFieldId];
    normalized.filter(answer => answer.fieldCode === field?.code && answer.answerCode === rule.triggerAnswerCode && ['any', 'none', answer.side].includes(rule.sourceSideCondition)).forEach(source => {
      const target = cfg.screenTestsById[rule.targetScreenTestId];
      const testCode = cfg.testsById[target.testId].code;
      const before = finalScores[testCode];
      finalScores[testCode] = rule.effectValue;
      appliedEffects.push({ effectRuleId: rule.effectRuleId, targetScreenTestId: rule.targetScreenTestId, affectedTestCode: testCode, sourceFieldCode: field.code, sourceSide: source.side, beforeScore: before, afterScore: rule.effectValue, reasonPl: rule.reasonTemplate.replace('{side}', source.side === 'left' ? 'lewej' : source.side === 'right' ? 'prawej' : 'bez wskazania strony') });
    });
  });
  return { answers: normalized, rawScores, baseScores, finalScores, totalScreenScore: Object.values(finalScores).reduce((sum, value) => sum + value, 0), appliedEffects, statuses: normalized.filter(x => x.numericValue == null) };
}

export function hydrateAssessment(row, cfg) {
  const answers = (row.assessment_answers || []).map(item => ({ fieldCode: cfg.fieldsById[item.test_field_id]?.code, side: item.side, answerCode: cfg.optionsById[item.answer_option_id]?.code }));
  const calculated = calculateAssessment(answers, cfg, []);
  const effects = (row.applied_effects || []).map(item => ({ effectRuleId: item.effect_rule_id, targetScreenTestId: item.target_screen_test_id, beforeScore: item.before_score, afterScore: item.after_score, reasonPl: item.reason_pl }));
  effects.forEach(effect => { const target = cfg.screenTestsById[effect.targetScreenTestId]; calculated.finalScores[cfg.testsById[target.testId].code] = effect.afterScore; });
  calculated.totalScreenScore = Object.values(calculated.finalScores).reduce((sum, value) => sum + value, 0);
  return { assessmentId: row.assessment_id, clientId: row.client_id, assessmentDate: row.assessment_date, note: row.note || '', correctionNote: row.correction_note || '', manualVersion: row.manual_version || null, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, ...calculated, appliedEffects: effects };
}

export function buildHistory(items) {
  return items.filter(x => x.status !== 'archived').slice().sort((a, b) => a.assessmentDate.localeCompare(b.assessmentDate) || String(a.updatedAt || a.createdAt || '').localeCompare(String(b.updatedAt || b.createdAt || '')) || String(a.assessmentId).localeCompare(String(b.assessmentId))).map(x => ({ assessmentId: x.assessmentId, date: x.assessmentDate, total: x.totalScreenScore }));
}

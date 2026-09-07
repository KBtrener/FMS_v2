export function validateClient(input) {
  const firstName = String(input.firstName || '').trim(), lastName = String(input.lastName || '').trim(), email = String(input.email || '').trim().toLowerCase();
  if (!firstName || !lastName) throw new Error('Imię i nazwisko są wymagane.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Podaj prawidłowy adres e-mail.');
  return { firstName, lastName, email };
}
export function calculate(answers, cfg, rules = cfg.rules) {
  const byField = Object.groupBy(answers, x => x.fieldCode), scores = { toe_touch: 'toe_touch_score', shoulder_mobility: 'shoulder_mobility_score', rotation: 'rotation_score', balance: 'balance_score', squat: 'squat_score' }, rawScores = {}, baseScores = {};
  for (const [test, fieldCode] of Object.entries(scores)) { const values = (byField[fieldCode] || []).map(x => x.numericValue); rawScores[test] = Object.fromEntries((byField[fieldCode] || []).map(x => [x.side, x.numericValue])); baseScores[test] = Math.min(...values); }
  const finalScores = { ...baseScores }, appliedEffects = [];
  for (const rule of rules.filter(x => x.isActive)) for (const answer of answers.filter(x => x.fieldCode === cfg.fieldsById[rule.sourceTestFieldId]?.code && x.answerCode === rule.triggerAnswerCode && (rule.sourceSideCondition === 'any' || rule.sourceSideCondition === 'none' || answer.side === rule.sourceSideCondition))) { const target = cfg.screenTestsById[rule.targetScreenTestId], code = cfg.testsById[target.testId].code, before = finalScores[code]; finalScores[code] = rule.effectValue; appliedEffects.push({ effectRuleId: rule.effectRuleId, targetScreenTestId: rule.targetScreenTestId, beforeScore: before, afterScore: rule.effectValue, reasonPl: rule.reasonTemplate.replace('{side}', answer.side === 'left' ? 'lewej' : answer.side === 'right' ? 'prawej' : 'bez wskazania strony') }); }
  return { rawScores, baseScores, finalScores, totalScreenScore: Object.values(finalScores).reduce((a, b) => a + b, 0), appliedEffects };
}

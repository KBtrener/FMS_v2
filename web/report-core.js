export const REPORT_GENERATOR_VERSION = '3.0.0';

export const REPORT_SECTIONS = Object.freeze({
  report_header: { required: true },
  executive_summary: { required: true },
  latest_assessment: { required: true },
  priority_findings: { required: false },
  test_descriptions: { required: false },
  history: { required: false, when: model => model.historicalAssessments.length >= 2 },
  recommendations: { required: false, when: model => model.recommendations.length > 0 },
  next_steps: { required: false, when: model => model.recommendations.length > 0 },
  methodology: { required: true },
  trainer_signature: { required: false },
});

export const REPORT_PROFILES = Object.freeze({
  free_current_result: ['report_header', 'executive_summary', 'latest_assessment', 'priority_findings', 'methodology'],
  assessment_report: ['report_header', 'executive_summary', 'latest_assessment', 'priority_findings', 'test_descriptions', 'methodology', 'trainer_signature'],
  full_coaching_report: Object.keys(REPORT_SECTIONS),
});

export function statusMeta(answerCode, numericValue = null) {
  if (answerCode === 'positive' || numericValue === 0) return { level: 'pain', label: 'Ból / red flag', icon: '!', rank: 0 };
  if (answerCode === 'fail' || numericValue === 1) return { level: 'attention', label: 'Uwaga', icon: '!', rank: 1 };
  if (answerCode === 'pass' || answerCode === 'negative' || numericValue === 2 || numericValue === 3) return { level: 'pass', label: 'W normie', icon: '✓', rank: 3 };
  return { level: 'info', label: 'Informacja', icon: 'i', rank: 2 };
}

export function resolveSections(profile, requested = [], model = {}) {
  const configured = REPORT_PROFILES[profile] || REPORT_PROFILES.free_current_result;
  const selected = new Set([...configured, ...requested, ...Object.entries(REPORT_SECTIONS).filter(([, value]) => value.required).map(([key]) => key)]);
  return Object.keys(REPORT_SECTIONS).filter(key => selected.has(key) && (!REPORT_SECTIONS[key].when || REPORT_SECTIONS[key].when(model)));
}

export function buildPriorityFindings(assessment, cfg) {
  const findings = [];
  for (const answer of assessment.statuses || []) {
    const field = cfg.fieldsById[answer.testFieldId];
    const option = cfg.optionsById[answer.answerOptionId];
    const meta = statusMeta(answer.answerCode, answer.numericValue);
    if (meta.level === 'pass') continue;
    findings.push({ type: answer.answerCode === 'positive' ? 'pain' : 'clearing', severity: meta.level, rank: meta.rank, title: field?.labelPl || answer.fieldCode, detail: `${answer.side === 'left' ? 'Lewa strona · ' : answer.side === 'right' ? 'Prawa strona · ' : ''}${option?.labelPl || answer.answerCode}`, testCode: field?.code || null });
  }
  for (const [testCode, sides] of Object.entries(assessment.rawScores || {})) {
    if (sides.left != null && sides.right != null && sides.left !== sides.right) findings.push({ type: 'asymmetry', severity: 'attention', rank: 1, title: `Asymetria · ${testCode}`, detail: `Lewa ${sides.left} / Prawa ${sides.right}`, testCode });
    if (assessment.finalScores?.[testCode] === 1) findings.push({ type: 'score_1', severity: 'attention', rank: 1, title: `Wynik 1 · ${testCode}`, detail: 'Wzorzec wymaga uwagi.', testCode });
  }
  for (const effect of assessment.appliedEffects || []) findings.push({ type: 'override', severity: 'pain', rank: 0, title: 'Wynik zmieniony przez clearing', detail: effect.reasonPl, testCode: null });
  return findings.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title, 'pl'));
}

export function createReportModel(input) {
  if (!input.latestAssessment || input.latestAssessment.status === 'archived') throw new Error('Raport wymaga ostatniego kompletnego badania.');
  const model = {
    reportProfile: input.reportProfile || 'free_current_result',
    generatorVersion: input.generatorVersion || REPORT_GENERATOR_VERSION,
    manualVersion: input.manualVersion || input.latestAssessment.manualVersion || null,
    generatedAt: input.generatedAt || new Date().toISOString(),
    client: input.client,
    trainer: input.trainer,
    service: input.service || null,
    latestAssessment: input.latestAssessment,
    historicalAssessments: (input.historicalAssessments || []).filter(item => item.status !== 'archived').slice().sort((a, b) => a.assessmentDate.localeCompare(b.assessmentDate)),
    testDescriptions: input.testDescriptions || [],
    priorityFindings: input.priorityFindings || [],
    recommendations: (input.recommendations || []).filter(item => item.status !== 'archived'),
    testItems: input.testItems || [],
    requestedSections: input.enabledSections || [],
  };
  model.enabledSections = resolveSections(model.reportProfile, model.requestedSections, model);
  return model;
}

export function reportSnapshot(model) {
  const snapshot = JSON.parse(JSON.stringify({ ...model, snapshotVersion: 2 }));
  delete snapshot.logoData;
  for (const item of snapshot.testItems || []) for (const photo of item.photos || []) delete photo.dataUrl;
  return snapshot;
}

export function buildTestItems({ assessment, tests = [], screenTests = [], fields = [], descriptionsByTestId = {}, fieldsById = {}, optionsById = {}, notes = [], photos = [] }) {
  const noteByTest = Object.fromEntries(notes.map(item => [item.test_id || item.testId, item.note]));
  const photosByTest = photos.reduce((result, item) => {
    const id = item.test_id || item.testId;
    if (id) (result[id] ||= []).push(item);
    return result;
  }, {});
  return screenTests.filter(item => item.isActive !== false).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((screen, index) => {
    const test = tests.find(item => item.testId === screen.testId) || {};
    const description = descriptionsByTestId[screen.testId]?.pl || {};
    const testFields = fields.filter(field => field.screenTestId === screen.screenTestId);
    const answers = (assessment.answers || []).filter(answer => testFields.some(field => field.testFieldId === answer.testFieldId)).map(answer => ({
      field: fieldsById[answer.testFieldId]?.labelPl || answer.fieldCode,
      side: answer.side,
      value: optionsById[answer.answerOptionId]?.labelPl || answer.answerCode,
      status: statusMeta(answer.answerCode, answer.numericValue),
    }));
    const raw = assessment.rawScores?.[test.code] || {};
    const finalScore = assessment.finalScores?.[test.code];
    const baseScore = assessment.baseScores?.[test.code];
    const status = statusMeta(null, finalScore);
    return {
      index: index + 1,
      testId: screen.testId,
      parentTestId: screen.parentScreenTestId || null,
      code: test.code,
      name: test.name,
      description: description.reportDescription || description.purpose || test.descriptionShort || '',
      criteria: description.scoringCriteria || test.criteriaSummary || '',
      sourceReference: description.sourceReference || test.sourceReference || '',
      finalScore,
      baseScore,
      rawScores: raw,
      answers,
      status,
      asymmetry: raw.left != null && raw.right != null && raw.left !== raw.right,
      note: noteByTest[screen.testId] || '',
      photos: photosByTest[screen.testId] || [],
    };
  });
}

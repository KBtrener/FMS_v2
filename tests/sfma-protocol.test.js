const test = require('node:test');
const assert = require('node:assert/strict');
const Sfma = require('../js/sfma-protocol.js');

test('SFMA defines the ten source Top Tier patterns and permits completion after all classifications', () => {
  assert.equal(Sfma.topTier.length, 10);
  const answers = Object.fromEntries(Sfma.topTier.map(item => [item.id, item.sides === 'bilateral' ? { left: 'FN', right: 'DN' } : { score: 'FN' }]));
  assert.equal(Sfma.isComplete(answers), true);
  assert.equal(Sfma.isComplete({ ...answers, cervicalRotation: { left: 'FN' } }), false);
});

test('only non-FN Top Tier patterns expose their optional breakout catalog', () => {
  const test = Sfma.topTier.find(item => item.id === 'cervicalRotation');
  assert.equal(Sfma.breakoutActive(test, { cervicalRotation: { left: 'FN', right: 'FP' } }), true);
  assert.equal(Sfma.breakoutActive(test, { cervicalRotation: { left: 'FN', right: 'FN' } }), false);
  assert.equal(Sfma.breakouts.length, 10);
  assert.deepEqual(Object.keys(Sfma.classifications), ['FN', 'FP', 'DN', 'DP']);
});

test('local breakout passive branches are evaluated independently for each side', () => {
  const section = { id: 'local', title: 'Podtesty lokalne', steps: [
    { title: 'Active Prone Shoulder IR' },
    { title: 'Passive Prone Shoulder IR' },
  ] };
  const state = Sfma.stepVisibility(section, { 'local:0:left': 'DN', 'local:0:right': 'FN' });
  assert.deepEqual(state[1].visibility, { left: true, right: false });
  assert.equal(Sfma.isBilateralStep(section.steps[0], section), true);
});

test('single-side breakouts preserve the source active/passive flow gating', () => {
  const section = { id: 'flow', title: 'Sekwencja testów', steps: [
    { title: 'Active SLR' },
    { title: 'Stabilized ASLR' },
    { title: 'Passive SLR' },
    { title: 'Supine Knee to Chest' },
  ] };
  const fn = Sfma.stepVisibility(section, { 'flow:0': 'FN' });
  assert.equal(fn[1].visible, false);
  assert.equal(fn[2].visible, true);
  const dysfunction = Sfma.stepVisibility(section, { 'flow:0': 'DN', 'flow:1': 'FN' });
  assert.equal(dysfunction[1].visible, true);
  assert.equal(dysfunction[3].visible, false);
});

test('SFMA measurements retain standards and derive only when an explicit rule exists', () => {
  const fields = Sfma.measurementFields({ title: 'Active Prone Shoulder IR', standards: ['60 deg i/lub total arc 150 deg'] });
  assert.deepEqual(fields, [
    { id: 'angle', label: 'Zakres ruchu', unit: 'deg', standard: 60 },
    { id: 'totalArc', label: 'Łuk całkowity', unit: 'deg', standard: 150 },
  ]);
  assert.equal(Sfma.deriveMeasurementResult(null, 70), null);
  assert.equal(Sfma.deriveMeasurementResult({ operator: 'gte', threshold: 60, result: 'FN', otherwiseResult: 'DN' }, 60), 'FN');
  assert.equal(Sfma.deriveMeasurementResult({ operator: 'gte', threshold: 60, result: 'FN', otherwiseResult: 'DN' }, 59.9), 'DN');
});

test('SFMA results reuse shared desktop/mobile result surfaces and show measurement change', () => {
  global.document ||= { addEventListener() {} };
  require('../js/sfma-report-ui.js');
  const assessment = {
    assessmentId: 'sfma-current', date: '2026-10-04', protocolCode: 'sfma',
    client: { firstName: 'Ala', lastName: 'Test' },
    sfma: { measurements: { upperExtPattern1: { 'ue1-local:0': { left: { angle: 65 } } } } },
    measurementHistory: [{ date: '2026-09-01', measurements: { upperExtPattern1: { 'ue1-local:0': { left: { angle: 60 } } } } }],
    rows: Sfma.topTier.map((test,index) => ({ code: test.id, name: test.name, sides: test.sides, classification: test.sides === 'single' ? 'FN' : null, leftClassification: test.sides === 'bilateral' ? 'FN' : null, rightClassification: test.sides === 'bilateral' ? 'DN' : null, breakout: index === 3 ? { 'ue1-local:0:left': 'DN' } : {} })),
  };
  const html = global.SfmaReportUI.report(assessment, '<a>Wróć</a>');
  assert.match(html, /result-table card/);
  assert.match(html, /result-table-mobile/);
  assert.match(html, /65° · poprzednio 60°/);
  assert.match(html, /open><summary>Breakouty i pomiary/);
  assert.match(html, /Nie wykonano/);
  assert.match(html, /FN/);
  assert.doesNotMatch(html, /Total Score|Wynik całkowity/);
});

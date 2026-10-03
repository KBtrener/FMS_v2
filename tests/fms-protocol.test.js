const test = require('node:test');
const assert = require('node:assert/strict');
const Fms = require('../js/fms-protocol.js');

test('wynik bilateralny FMS bierze niższą stronę, a dodatni clearing zeruje tylko wskazane testy', () => {
  assert.equal(Fms.finalScore(Fms.MAIN_TESTS[1], { left: 3, right: 2 }), 2);
  assert.equal(Fms.finalScore(Fms.MAIN_TESTS[3], { left: 3, right: 2, painLeft: true }), 0);
  assert.equal(Fms.finalScore(Fms.MAIN_TESTS[5], { score: 3, pain: true }), 0);
  assert.equal(Fms.finalScore(Fms.MAIN_TESTS[6], { left: 3, right: 3, painRight: true }), 0);
  assert.equal(Fms.finalScore(Fms.MAIN_TESTS[4], { left: 3, right: 2, painLeft: true }), 2);
});

test('Total Score wynosi /21, pozostaje pusty do kompletności i pomija testy dodatkowe', () => {
  const complete = Object.fromEntries(Fms.MAIN_TESTS.map(test => [test.key, test.bilateral ? { left: 3, right: 3 } : { score: 3 }]));
  const result = Fms.summarize(complete);
  assert.equal(result.totalScore, 21);
  assert.equal(result.maximum, 21);
  assert.equal(Fms.ADDITIONAL_TESTS.length, 3);
  assert.equal(Fms.summarize({ deepSquat: { score: 3 } }).totalScore, null);
});

test('asymetria dotyczy wyłącznie wyników stronowych i wykrywa różnicę L/P', () => {
  const scores = Object.fromEntries(Fms.MAIN_TESTS.map(test => [test.key, test.bilateral ? { left: 3, right: 2 } : { score: 3 }]));
  assert.deepEqual(Fms.summarize(scores).asymmetries, ['Hurdle Step', 'In-Line Lunge', 'Shoulder Mobility', 'ASLR', 'Rotary Stability']);
});

test('MCS stosuje progi z referencyjnej funkcji PASS/FAIL i respektuje pominięcie', () => {
  assert.equal(Fms.mcs(10, 21, 22, 'in'), 'PASS');
  assert.equal(Fms.mcs(10, 20, 24, 'cm'), 'FAIL');
  assert.equal(Fms.mcs(null, 30, 31, 'in'), null);
  assert.equal(Fms.validateCompletion({ lowerSkipped: true, upperSkipped: true }), null);
  assert.match(Fms.validateCompletion({ lowerSkipped: false, lowerLength: 10, lowerLeft: null, lowerRight: 25 }), /Lower Body MCS/);
});

test('Shoulder Mobility wylicza score z odległości do długości dłoni i akceptuje przecinek dziesiętny', () => {
  assert.equal(Fms.shoulderMobilityScore('20', '20'), 3);
  assert.equal(Fms.shoulderMobilityScore('21,5', '20'), 2);
  assert.equal(Fms.shoulderMobilityScore('30.1', '20'), 1);
  assert.equal(Fms.shoulderMobilityScore('-1', '20'), null);
  assert.equal(Fms.shoulderMobilityScore('10', '0'), null);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const Bunkie = require('../js/bunkie-protocol.js');

test('Bunkie reports a weaker side, absolute delta, asymmetry and goal states', () => {
  assert.deepEqual(Bunkie.analyze(35, 42, 40), {
    left: 35, right: 42, difference: 7, asymmetryPercent: 16.7, weakerSide: 'left',
    leftMetGoal: false, rightMetGoal: true,
    interpretation: 'Lewa strona uzyskała wynik słabszy o 7 s (16,7%) względem drugiej. Lewa strona pozostaje poniżej przyjętego celu 40 s, natomiast prawa strona osiągnęła przyjęty cel.'
  });
});

test('equal results remain symmetric independently of endurance target', () => {
  const above = Bunkie.analyze(42, 42, 40);
  assert.equal(above.difference, 0);
  assert.equal(above.asymmetryPercent, 0);
  assert.equal(above.weakerSide, null);
  assert.match(above.interpretation, /osiągnęły przyjęty cel/);
  const below = Bunkie.analyze(30, 30, 40);
  assert.equal(below.leftMetGoal, false);
  assert.match(below.interpretation, /korzystną obserwację w zakresie symetrii/);
  assert.match(below.interpretation, /ogólna wytrzymałość/);
});

test('asymmetry with both goals reached does not label clinical significance', () => {
  const result = Bunkie.analyze(43, 55, 40);
  assert.equal(result.weakerSide, 'left');
  assert.equal(result.difference, 12);
  assert.equal(result.asymmetryPercent, 21.8);
  assert.equal(result.leftMetGoal && result.rightMetGoal, true);
  assert.match(result.interpretation, /obserwacją do monitorowania/);
  assert.doesNotMatch(result.interpretation, /klinicz|zaburzen/);
});

test('asymmetry below goal reports endurance and side difference', () => {
  const result = Bunkie.analyze(20, 32, 40);
  assert.equal(result.difference, 12);
  assert.equal(result.asymmetryPercent, 37.5);
  assert.equal(result.weakerSide, 'left');
  assert.equal(result.leftMetGoal || result.rightMetGoal, false);
  assert.match(result.interpretation, /Obie strony pozostają poniżej/);
});

test('zero and missing values avoid division errors and fabricated asymmetry', () => {
  assert.equal(Bunkie.analyze(0, 0, 40).asymmetryPercent, 0);
  const missing = Bunkie.analyze(14, null, 40);
  assert.equal(missing.difference, null);
  assert.equal(missing.asymmetryPercent, null);
  assert.equal(missing.weakerSide, null);
});

test('research population averages and five bilateral positions are defined', () => {
  assert.equal(Bunkie.TESTS.length, 5);
  assert.deepEqual(Bunkie.TESTS.map(item => item.figure), [1, 2, 3, 4, 5]);
  const rows = Bunkie.TESTS.map((item, index) => ({ left: 0, right: 0, goalLeft: index === 4 ? 25 : 40, goalRight: index === 4 ? 25 : 40 }));
  const allSymmetric = Bunkie.summary(rows);
  assert.equal(allSymmetric.symmetric, true);
  assert.match(allSymmetric.symmetryText, /mimo że nie wszystkie cele czasowe/);
});

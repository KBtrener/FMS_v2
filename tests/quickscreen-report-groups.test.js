const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { resolve } = require('node:path');

function build(tests) {
  const window = {};
  runInNewContext(readFileSync(resolve(__dirname, '../js/report-engine.js'), 'utf8'), { window });
  return window.QuickScreenReport.buildReport({ tests }).blocks.results;
}

test('wyniki trafiają do jednej niepustej grupy, a pojedyncze 2/3 są symetryczne', () => {
  const result = build([
    { code: 'toe_touch', name: 'Skłon z BD', finalScore: 1 },
    { code: 'squat', finalScore: 2 },
    { code: 'balance', finalScore: 3 },
    { code: 'rotation', leftScore: 3, rightScore: 2 },
    { code: 'shoulder_mobility', finalScore: 0 },
    { code: 'cervical_rotation', fields: [{ side: 'left', valueCode: 'pass' }, { side: 'right', valueCode: 'fail' }] },
  ]);
  assert.deepEqual(Array.from(result.groups, group => group.title), ['Bardzo dobrze', 'Dobrze', 'Asymetria', 'Do poprawy', 'Ból']);
  assert.equal(result.groups.flatMap(group => group.items).length, 6);
  assert.equal(result.groups.find(group => group.title === 'Dobrze').items[0].name, 'Przysiad');
  assert.equal(result.groups.find(group => group.title === 'Do poprawy').items[0].name, 'Skłon z BD');
});

test('ból ma pierwszeństwo i komunikat wymienia wszystkie bolesne testy', () => {
  const result = build([
    { code: 'rotation', finalScore: 1 },
    { code: 'squat', finalScore: 0 },
    { code: 'shoulder_clearing', name: 'Clearing barku BD', fields: [{ side: 'left', valueCode: 'positive' }] },
  ]);
  assert.match(result.priorityMessage, /Przysiad/);
  assert.match(result.priorityMessage, /Clearing barku BD/);
  assert.equal(result.congratulation, null);
  assert.equal(result.ending, null);
});

test('bezbolesne symetryczne wyniki 2 i 3 otrzymują gratulacje i informację o pełnym FMS', () => {
  const result = build([{ code: 'squat', finalScore: 2 }, { code: 'balance', leftScore: 3, rightScore: 3 }]);
  assert.match(result.congratulation, /Gratulacje/);
  assert.match(result.ending, /Pełny FMS/);
});

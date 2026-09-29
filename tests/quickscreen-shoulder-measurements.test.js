const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { resolve } = require('node:path');

function shoulderScore(handLength, distance) {
  const window = {};
  runInNewContext(readFileSync(resolve(__dirname, '../js/shoulder-measurements.js'), 'utf8'), { window });
  return window.QuickScreenShoulderMeasurements.score(handLength, distance);
}

test('mobilność barku wylicza wynik według progów FMS, także na granicach', () => {
  assert.equal(shoulderScore(10, 10), 3);
  assert.equal(shoulderScore(10, 15), 2);
  assert.equal(shoulderScore(10, 15.01), 1);
  assert.equal(shoulderScore(10, 0), 3);
});

test('pomiar częściowy lub niepoprawny nie ustala wyniku automatycznie', () => {
  assert.equal(shoulderScore(10, ''), null);
  assert.equal(shoulderScore('', 10), null);
  assert.equal(shoulderScore(0, 10), null);
  assert.equal(shoulderScore(10, -1), null);
});

test('raport i wyniki pokazują odległość w cm oddzielnie dla stron', () => {
  const api = readFileSync(resolve(__dirname, '../supabase/functions/quickscreen-api/index.ts'), 'utf8');
  const ui = readFileSync(resolve(__dirname, '../js/report-ui.js'), 'utf8');
  const app = readFileSync(resolve(__dirname, '../js/app.js'), 'utf8');
  const migration = readFileSync(resolve(__dirname, '../supabase/migrations/20260929130000_shoulder_measurements.sql'), 'utf8');
  assert.match(api, /leftDistanceCm: shoulderMeasurements\.leftDistanceCm/);
  assert.match(api, /rightDistanceCm: shoulderMeasurements\.rightDistanceCm/);
  assert.match(app, /shoulder-hand-length\?screenTypeId=/);
  assert.match(app, /measurementCode: 'shoulder_hand_length'/);
  assert.match(app, /data-shoulder-measurement="gap"/);
  assert.match(ui, /L: \$\{scoreText\(item\.leftScore, item\.leftDistanceCm\)\} \/ P:/);
  assert.match(ui, /L: \$\{sideValue\(item\.leftScore, item\.leftDistanceCm\)\} \/ P:/);
  assert.match(migration, /assessment_measurements/);
  assert.match(migration, /p_measurements jsonb/);
});

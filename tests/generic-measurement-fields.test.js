const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const read = path => readFileSync(resolve(__dirname, '..', path), 'utf8');

test('ogólne pomiary obsługują wartości dziesiętne, jednostki, strony i opcjonalne próby', () => {
  const migration = read('supabase/migrations/20261003120000_generic_measurement_fields.sql');
  const app = read('js/app.js');
  const api = read('supabase/functions/quickscreen-api/index.ts');
  const fixture = read('supabase/tests/generic_protocol_flow.sql');
  assert.match(migration, /numeric_value numeric\(14,4\)/);
  assert.match(migration, /side text not null default 'none'.*left.*right.*none/s);
  assert.match(migration, /attempt_number smallint not null default 1/);
  assert.match(migration, /field_type = 'measurement'/);
  assert.match(app, /data-measurement-field/);
  assert.match(app, /fieldMeasurements\[`\$\{e\.target\.dataset\.measurementField\}:\$\{e\.target\.dataset\.side\}`\]=e\.target\.value/);
  assert.match(app, /fieldMeasurements, fieldMeasurementUnits, notes, shoulderMeasurements/);
  assert.match(app, /measurementAnswers\.push\(\{ fieldId: field\.id, side, attemptNumber: 1, value: Number\(value\), unit: fieldMeasurementUnits\[field\.measurementUnitGroup\] \|\| field\.measurementUnit \}\)/);
  assert.match(app, /record\.assessment_field_measurements/);
  assert.match(api, /measurementUnit: field\.measurement_unit/);
  assert.match(api, /assessment_field_measurements/);
  assert.match(api, /edit_assessment_v3/);
  assert.match(fixture, /value":42\.75/);
  assert.match(fixture, /value":43\.25/);
  assert.match(fixture, /numeric_value in \(42\.75,43\.25\)/);
});

test('Quick Screen zachowuje dotychczasową tabelę pomiarów i kontrakt wyników/raportu', () => {
  const migration = read('supabase/migrations/20261003120000_generic_measurement_fields.sql');
  const api = read('supabase/functions/quickscreen-api/index.ts');
  const reportUi = read('js/report-ui.js');
  const app = read('js/app.js');
  assert.doesNotMatch(migration, /assessment_measurements/);
  assert.match(api, /protocol\.code === 'quick_screen'[\s\S]*submit_assessment_v2/);
  assert.match(api, /isQuickScreen[\s\S]*edit_assessment_v2/);
  assert.match(api, /leftDistanceCm: shoulderMeasurements\.leftDistanceCm/);
  assert.match(api, /rightDistanceCm: shoulderMeasurements\.rightDistanceCm/);
  assert.match(api, /return \{ code: field\.code, label: field\.label_pl, answerSetCode:/);
  assert.doesNotMatch(api.match(/return \{ code: field\.code, label: field\.label_pl, answerSetCode:[^\n]+/)?.[0] || '', /fieldType/);
  assert.match(reportUi, /item\.leftDistanceCm/);
  assert.match(reportUi, /item\.rightDistanceCm/);
  assert.match(app, /measurementCode: 'shoulder_hand_length'/);
  assert.match(app, /measurementCode: 'shoulder_fist_gap'/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const read = path => readFileSync(resolve(__dirname, '..', path), 'utf8');

test('additional assessment tests have atomic writes, catalog checks, history, and remain outside primary scoring', () => {
  const migration = read('supabase/migrations/20261005120000_additional_tests.sql');
  const api = read('supabase/functions/quickscreen-api/index.ts');
  const app = read('js/app.js');
  const engine = read('js/report-engine.js');
  const report = read('js/report-ui.js');
  const fms = read('js/fms-report-ui.js');
  const sfma = read('js/sfma-report-ui.js');

  assert.match(migration, /create table if not exists quickscreen_v2\.assessment_additional_tests/);
  assert.match(migration, /unique \(assessment_id, test_code, side\)/);
  assert.match(migration, /write_assessment_additional_tests/);
  assert.match(api, /validateAdditionalTests\(db, input\.additionalTests\)/);
  assert.match(api, /additional-tests\\\/history/);
  assert.match(api, /assessment_additional_tests/);
  assert.match(app, /additionalTestsPage\(\)/);
  assert.match(app, /additionalTests, wizardIndex/);
  assert.match(app, /finish-assessment/);
  assert.match(app, /sfma_\$\{test\.id\}/);
  assert.match(app, /sfma_breakout_/);
  assert.match(api, /SfmaProtocol\.breakouts/);
  assert.match(engine, /allTests\.filter\(test => !test\.additional\)/);
  assert.match(engine, /additionalTests: assessment\.additionalTests/);
  assert.match(report, /Testy dodatkowe/);
  assert.match(fms, /additionalTestsMarkup\(assessment\)/);
  assert.match(sfma, /assessment\.additionalTests/);
});

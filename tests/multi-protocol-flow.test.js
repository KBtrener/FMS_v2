const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const read = path => readFileSync(resolve(__dirname, '..', path), 'utf8');

test('wizard, save, edit, and result loading use the selected protocol definition', () => {
  const app = read('js/app.js');
  const api = read('supabase/functions/quickscreen-api/index.ts');
  const protocolTest = read('supabase/tests/generic_protocol_flow.sql');
  const productionSeed = read('supabase/seed.sql');

  assert.match(app, /screenTypes\.find\(item => item\.screenTypeId === selectedScreenTypeId\)/);
  assert.match(app, /loadScenarioDefinition\(protocol\.screenTypeId\)/);
  assert.match(app, /tests = definition\.steps\.map/);
  assert.match(app, /screenTypeId: protocol\.screenTypeId/);
  assert.match(app, /scenarioId: activeAssessment\.screenTypeId \|\| currentScenario\.id/);
  assert.match(app, /loadScenarioDefinition\(record\.screen_type_id\)/);
  assert.match(api, /\.eq\('screen_type_id', assessment\.screen_type_id\)\.eq\('status', 'completed'\)/);
  assert.match(api, /protocolCode: screenType\.code/);
  assert.match(api, /unsupported_report_protocol/);
  assert.match(protocolTest, /screen_dev_generic/);
  assert.match(protocolTest, /submit_assessment_v2/);
  assert.match(protocolTest, /rollback;/);
  assert.doesNotMatch(productionSeed, /screen_dev_generic|dev_generic/);
});

test('the generic test field renderer does not branch on Quick Screen test IDs', () => {
  const app = read('js/app.js');
  const genericRenderer = app.match(/function testFields\(test,index\) \{([\s\S]*?)\n  \}  function criteriaMarkup/);
  assert.ok(genericRenderer, 'testFields renderer should be extractable');
  assert.match(genericRenderer[1], /field\.sideMode/);
  assert.match(genericRenderer[1], /field\.answerSet\.code/);
  assert.match(genericRenderer[1], /field\.answers\.map/);
  assert.doesNotMatch(genericRenderer[1], /field_[a-z]|screen_quick_screen|test_[a-z]/);
});

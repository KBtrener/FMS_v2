const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

test('raport QuickScreen V2 ładuje wyniki wskazanego badania', () => {
  const app = readFileSync(resolve(__dirname, '../QuickScreen-v2/js/app.js'), 'utf8');

  assert.match(app, /function generateReport\(\)/);
  assert.ok(app.includes("routeAssessmentId=routePath().match(/^report\\/([^/]+)$/)"));
  assert.match(app, /loadResults\(decodeURIComponent\(routeAssessmentId\)\)/);
  assert.match(app, /href="#\/report\/\$\{item\.assessmentId\}"/);
});

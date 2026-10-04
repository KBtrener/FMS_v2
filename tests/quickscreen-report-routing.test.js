const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

test('raport QuickScreen V2 ładuje wyniki wskazanego badania', () => {
  const app = readFileSync(resolve(__dirname, '../js/app.js'), 'utf8');

  assert.match(app, /function generateReport\(\)/);
  assert.ok(app.includes("routeAssessmentId=routePath().match(/^report\\/([^/]+)$/)"));
  assert.match(app, /loadResults\(decodeURIComponent\(routeAssessmentId\)\)/);
  assert.match(app, /href="#\/report\/\$\{item\.assessmentId\}"/);
});

test('główne akcje widoków są zebrane w kafelkach, a powrót zachowuje kontekst trasy', () => {
  const app = readFileSync(resolve(__dirname, '../js/app.js'), 'utf8');
  const qsReport = readFileSync(resolve(__dirname, '../js/report-ui.js'), 'utf8');
  const fmsReport = readFileSync(resolve(__dirname, '../js/fms-report-ui.js'), 'utf8');

  assert.match(app, /actionTile\('<button class="btn nav-button nav-button-primary" data-action="add-client"/);
  assert.ok(app.includes("actionTile(`${clientMode?'':backAction(route()"));
  assert.match(app, /data-action="route-back"/);
  assert.match(app, /routeTrail\.push\(trackedRoute\)/);
  assert.match(app, /routeTrail\[routeTrail\.length-1\]\.startsWith\('report\/'\)/);
  assert.match(app, /skipRouteTrailUpdate=true;setRoute\(`fms-report/);
  assert.match(qsReport, /options\.backMarkup/);
  assert.match(fmsReport, /action-tile card/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

test('cała strona raportu jest izolowana przez centralny router', () => {
  const app = readFileSync(resolve(__dirname, '../QuickScreen-v2/js/app.js'), 'utf8');
  const report = readFileSync(resolve(__dirname, '../QuickScreen-v2/js/client-report-v4.js'), 'utf8');

  assert.match(app, /function isReportPageClick\(event\)/);
  assert.match(app, /if\(isReportPageClick\(e\)\)return;/);
  assert.match(report, /closest\('\.report-variant, \.qs-back'\)/);
  assert.match(report, /QSRouter\.go\(control\.getAttribute\('href'\)\)/);
});

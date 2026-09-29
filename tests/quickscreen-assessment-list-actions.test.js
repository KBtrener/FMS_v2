const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

test('assessment history provides open, edit, and report actions without opening the assessment', () => {
  const app = readFileSync(resolve(__dirname, '../js/app.js'), 'utf8');
  const table = app.slice(app.indexOf('function historyTable(client)'), app.indexOf('function profileBanner('));
  assert.equal((table.match(/data-action="edit-assessment"/g) || []).length, 2);
  assert.ok(table.includes('Otw\\u00f3rz'));
  assert.ok(table.includes('Edytuj'));
  assert.ok(table.includes('>Raport</a>'));
  assert.equal(table.split('href="#/report/${item.assessmentId}"').length - 1, 2);
});

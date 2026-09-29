const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const read = path => readFileSync(resolve(__dirname, '..', path), 'utf8');

test('widok wyników pokazuje notatki testowe zwracane przez API', () => {
  const api = read('supabase/functions/quickscreen-api/index.ts');
  const app = read('js/app.js');
  assert.ok(api.includes("assessment_test_notes').select('test_id,note')"));
  assert.ok(api.includes('testNameById.get(item.test_id)'));
  assert.match(app, /function assessmentNotesMarkup\(\)/);
  assert.match(app, /Notatki do testów/);
  assert.match(app, /\$\{assessmentNotesMarkup\(\)\}/);
});

test('edycja zakończonego badania odtwarza i zapisuje odpowiedzi, notatki i pomiary barku', () => {
  const api = read('supabase/functions/quickscreen-api/index.ts');
  const app = read('js/app.js');
  const migration = read('supabase/migrations/20260929140000_edit_completed_assessments.sql');
  assert.match(api, /request\.method === 'PATCH' && assessmentRoute/);
  assert.match(app, /async function editAssessment\(assessmentId\)/);
  assert.match(app, /firstMissingEditAnswer/);
  assert.match(app, /results-load-error/);
  assert.match(api, /assessment_measurements\(\*\)/);
  assert.match(app, /data-action="edit-assessment"/);
  assert.match(app, /data-shoulder-measurement="handLengthCm"/);
  assert.match(app, /data-action="save-assessment-edit"/);
  assert.match(migration, /status = 'completed' for update/);
  assert.match(migration, /save_assessment_draft\(p_assessment_id, v_assessment\.note, p_answers, p_notes\)/);
  assert.match(migration, /assessment_measurements/);
  assert.match(migration, /complete_assessment_v2\(p_assessment_id\)/);
});

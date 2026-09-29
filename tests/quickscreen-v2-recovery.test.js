const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const read = path => readFileSync(resolve(__dirname, path), 'utf8');

test('QuickScreen V2 keeps interrupted assessments per user for 24 hours', () => {
  const app = read('../js/app.js');
  assert.match(app, /quickscreen-v2-draft:\$\{authSession\?\.user\?\.id/);
  assert.match(app, /24 \* 60 \* 60 \* 1000/);
  assert.match(app, /offerResumeDraft\(\)/);
  assert.match(app, /restoreLocalDraft\(interrupted\)/);
  assert.match(app, /removeLocalDraft\(\)/);
  assert.match(app, /localStorage\.setItem\(draftKey\(\)/);
});

test('QuickScreen V2 submits completed assessments through one idempotent RPC', () => {
  const app = read('../js/app.js');
  const api = read('../supabase/functions/quickscreen-api/index.ts');
  const migration = read('../supabase/migrations/20260928130000_atomic_assessment_submission.sql');
  assert.match(app, /apiRequest\('\/assessments\/complete'/);
  assert.match(api, /db\.rpc\('submit_assessment_v2'/);
  assert.match(migration, /security definer/);
  assert.match(migration, /alreadyCompleted/);
  assert.match(migration, /revoke insert, update, delete on quickscreen_v2\.assessments from authenticated/);
  assert.doesNotMatch(api, /route === '\/assessments'|request\.method === 'PATCH' && assessmentRoute/);
});

test('history routes each report to its assessment and removes inert client controls', () => {
  const app = read('../js/app.js');
  const api = read('../supabase/functions/quickscreen-api/index.ts');
  assert.equal((app.match(/href="#\/report\/\$\{item\.assessmentId\}"/g) || []).length, 2);
  assert.doesNotMatch(app, /aria-label="Filtruj dyscyplinę"|aria-label="Sortowanie"|Pokaż archiwalnych/);
  assert.match(api, /b\.assessment_date\.localeCompare\(a\.assessment_date\) \|\| b\.created_at\.localeCompare\(a\.created_at\)/);
  assert.match(app, /trainer\?\.displayName/);
});

test('client-specific new assessment entries preserve the client in the route', () => {
  const app = read('../js/app.js');
  assert.equal((app.match(/href="#\/new-assessment\/\$\{encodeURIComponent\(c\.id\)\}"/g) || []).length, 2);
  assert.match(app, /href="#\/new-assessment\/\$\{encodeURIComponent\(client\.id\)\}"/);
  assert.match(app, /newAssessmentClientId\(\)/);
  assert.match(app, /selectedClient=contextId\?clients\.find\(c=>c\.id===contextId\)\|\|null:null/);
  assert.match(app, /Nie znaleziono wskazanego klienta/);
  assert.match(app, /setRoute\(`new-assessment\/\$\{encodeURIComponent\(selectedClient\.id\)\}`\)/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const read = path => readFileSync(resolve(__dirname, '..', path), 'utf8');

test('badanie pary ma osobne stany, szkic i osobne idempotentne wysłania', () => {
  const app = read('js/app.js');
  assert.match(app, /data-pair-mode/);
  assert.match(app, /data-pair-client/);
  assert.match(app, /pairedDraft=protocol\.code==='quick_screen'/);
  assert.match(app, /data-pair-member="second"/);
  assert.match(app, /pairClientId, pairedDraft/);
  assert.match(app, /const secondPayload=pairedAssessmentPayload\(\)/);
  assert.match(app, /if\(secondPayload\)await apiRequest\('\/assessments\/complete'/);
  assert.match(app, /function updatePairedDraft\(update\)/);
});

test('opcjonalny pomiar Toe Touch jest bilateralny, niepunktowany i wraca w historii klienta', () => {
  const migration = read('supabase/migrations/20261008120000_toe_touch_distance_measurements_and_reassign.sql');
  const api = read('supabase/functions/quickscreen-api/index.ts');
  const app = read('js/app.js');
  assert.match(migration, /toe_touch_distance_cm/);
  assert.match(migration, /'bilateral'.*false/);
  assert.match(migration, /measurement_min=0/);
  assert.match(api, /toeTouch: \(item\.assessment_field_measurements\|\|\[\]\)/);
  assert.match(app, /Pomiary Toe Touch/);
  assert.match(app, /trim\(\)\.replace\(',',\s*'\.'\)/);
});

test('podpowiedzi klientów zamykają się po kliknięciu poza polem i przez Escape', () => {
  const app = read('js/app.js');
  assert.match(app, /document\.addEventListener\('click',[\s\S]*?suggestions\.show/);
  assert.match(app, /client-first','client-last','client-email'[\s\S]*?event\.key === 'Escape'/);
  assert.match(app, /data-client="\$\{c\.id\}"/);
});

test('zmiana klienta przenosi badanie wraz z raportami i rekomendacjami w transakcji', () => {
  const migration = read('supabase/migrations/20261008120000_toe_touch_distance_measurements_and_reassign.sql');
  const api = read('supabase/functions/quickscreen-api/index.ts');
  const app = read('js/app.js');
  assert.match(migration, /reassign_completed_assessment/);
  assert.match(migration, /update quickscreen_v2\.report_instances/);
  assert.match(migration, /update quickscreen_v2\.trainer_recommendations/);
  assert.match(api, /reassign_completed_assessment/);
  assert.match(app, /data-edit-client/);
});

test('rozszerzenie wyprostu szyi zachowuje dotychczasowy test clearingowy', () => {
  const app = read('js/app.js');
  assert.match(app, /testFields=function\(test,index\).*neck_extension_clearing/);
  assert.match(app, /baseTestFields\(clearing,index\)/);
  assert.match(app, /data-note="\$\{tests\.indexOf\(clearing\)\+1\}"/);
});

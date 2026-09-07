const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function coreModule() {
  const source = fs.readFileSync('web/core.js', 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

function configFromSeed(seed) {
  const answerSets = seed.answerSets.map(set => ({ ...set, answerSetId: set.answerSetId, options: set.options.map(option => ({ ...option, answerSetId: set.answerSetId })) }));
  const fields = seed.testFields.map(field => ({ ...field, answerSetId: answerSets.find(set => set.code === field.answerSetCode).answerSetId }));
  const options = answerSets.flatMap(set => set.options);
  return { fields, rules: seed.effectRules, fieldsById: Object.fromEntries(fields.map(x => [x.testFieldId, x])), fieldsByCode: Object.fromEntries(fields.map(x => [x.code, x])), optionsById: Object.fromEntries(options.map(x => [x.answerOptionId, x])), optionsByCode: Object.fromEntries(options.map(x => [x.code, x])), testsById: Object.fromEntries(seed.tests.map(x => [x.testId, x])), screenTestsById: Object.fromEntries(seed.screenTests.map(x => [x.screenTestId, x])) };
}

test('Supabase migration defines relational schema, RLS, storage and RPCs', () => {
  const sql = fs.readFileSync('supabase/migrations/20260907120000_initial_schema.sql', 'utf8');
  for (const fragment of ['create table public.profiles', 'create table public.clients', 'create table public.assessments', 'create table public.assessment_answers', 'create table public.attachments', 'enable row level security', 'create policy', 'save_assessment']) assert.match(sql, new RegExp(fragment, 'i'));
  assert.doesNotMatch(sql, /SUPABASE_SERVICE_ROLE_KEY|postgres(ql)?:\/\//i);
});

test('legacy importer and web frontend do not use google.script.run', () => {
  assert.doesNotMatch(fs.readFileSync('web/app.js', 'utf8'), /google\.script\.run/);
  assert.match(fs.readFileSync('tools/import-google-export.mjs', 'utf8'), /legacy_client_id/);
});

test('Supabase frontend preserves validation and clearing score logic', async () => {
  const core = await coreModule();
  const seed = JSON.parse(fs.readFileSync('FMS_Quick_Screen_Codex_Package/config/quick_screen_seed.json', 'utf8'));
  const cfg = configFromSeed(seed);
  const answers = cfg.fields.filter(x => x.isScoringInput).flatMap(field => (field.sideMode === 'bilateral' ? ['left', 'right'] : ['none']).map(side => ({ fieldCode: field.code, side, answerCode: field.answerSetCode === 'score_0_3' ? 'score_3' : field.answerSetCode === 'pass_fail' ? 'pass' : 'negative' })));
  const upper = answers.find(x => x.fieldCode === 'shoulder_clearing_upper_pain' && x.side === 'left');
  upper.answerCode = 'positive';
  const result = core.calculateAssessment(answers, cfg);
  assert.equal(result.baseScores.shoulder_mobility, 3);
  assert.equal(result.finalScores.shoulder_mobility, 0);
  assert.equal(result.totalScreenScore, 12);
  assert.equal(result.appliedEffects.length, 1);
  assert.throws(() => core.validateClient({ firstName: '', lastName: 'Test', email: 'x@example.com' }), /Imię/);
});

test('production web build contains subpath config, PDF, attachments and mail workflow', () => {
  const app = fs.readFileSync('web/app.js', 'utf8');
  const htaccess = fs.readFileSync('web/.htaccess', 'utf8');
  const build = fs.readFileSync('tools/build-web.mjs', 'utf8');
  assert.match(htaccess, /RewriteBase \/quickscreen\//);
  assert.match(app, /pdfMake\.createPdf/);
  assert.match(app, /assessment-files/);
  assert.match(app, /createSignedUrl/);
  assert.match(app, /mailto:/);
  assert.match(build, /SUPABASE_API_URL/);
  assert.doesNotMatch(app, /google\.script\.run|SpreadsheetApp|DriveApp/);
});

test('deployment secrets are ignored by Git and clasp', () => {
  assert.match(fs.readFileSync('.gitignore', 'utf8'), /\.env\.deploy\.local/);
  assert.match(fs.readFileSync('.claspignore', 'utf8'), /\.env\.deploy\.local/);
  assert.ok(path.isAbsolute(path.resolve('dist/web')));
});

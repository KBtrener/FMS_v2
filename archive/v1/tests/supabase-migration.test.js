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

test('Shoulder Clearing has informational bilateral range fields without changing score rules', () => {
  const migration = fs.readFileSync('supabase/migrations/20260907180000_shoulder_clearing_range.sql', 'utf8');
  const seed = JSON.parse(fs.readFileSync('FMS_Quick_Screen_Codex_Package/config/quick_screen_seed.json', 'utf8'));
  for (const code of ['shoulder_clearing_upper_range', 'shoulder_clearing_lower_range']) {
    assert.match(migration, new RegExp(code));
    const field = seed.testFields.find(item => item.code === code);
    assert.equal(field.sideMode, 'bilateral');
    assert.equal(field.answerSetCode, 'pass_fail');
    assert.equal(field.isScoringInput, false);
  }
  assert.match(fs.readFileSync('web/app.js', 'utf8'), /shoulder_clearing_.*field\.code !== 'shoulder_clearing_pain'/);
});

test('wizard renders bilateral layout and structured criteria directly', () => {
  const source = fs.readFileSync('web/app.js', 'utf8');
  assert.match(source, /testFieldsMarkup/);
  assert.match(source, /side-panels/);
  assert.match(source, /criteria-sheet/);
});

test('web frontend uses Supabase and the legacy importer remains isolated', () => {
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

test('deployment secrets are ignored by Git', () => {
  assert.match(fs.readFileSync('.gitignore', 'utf8'), /\.env\.deploy\.local/);
  assert.ok(path.isAbsolute(path.resolve('dist/web')));
});

test('test descriptions are database-backed and static manual is not bundled', () => {
  const migration = fs.readFileSync('supabase/migrations/20260908090000_test_descriptions.sql', 'utf8');
  const build = fs.readFileSync('tools/build-web.mjs', 'utf8');
  assert.match(migration, /create table (if not exists )?public\.test_descriptions/i);
  assert.match(migration, /manual_version/);
  assert.match(migration, /select test_id from public\.tests where code = 'cervical_flexion'/);
  assert.match(fs.readFileSync('web/app.js', 'utf8'), /test_descriptions/);
  assert.doesNotMatch(build, /manual\.md/);
});

test('reports can reference multiple trainer certifications and client disciplines', () => {
  const migration = fs.readFileSync('supabase/migrations/20260908100000_trainer_certifications_client_disciplines.sql', 'utf8');
  assert.match(migration, /create table if not exists public\.trainer_certifications/i);
  assert.match(migration, /create table if not exists public\.client_disciplines/i);
  assert.match(migration, /trainer_id uuid .*references public\.profiles/i);
  assert.match(migration, /client_id uuid .*references public\.clients/i);
  assert.match(fs.readFileSync('web/app.js', 'utf8'), /trainer_certifications/);
  assert.match(fs.readFileSync('web/app.js', 'utf8'), /client_disciplines/);
});

test('team assignments preserve owner access and permit collaborator assessment writes', () => {
  const migration = fs.readFileSync('supabase/migrations/20260908110000_trainer_client_access.sql', 'utf8');
  const writes = fs.readFileSync('supabase/migrations/20260908111000_team_assessment_write_access.sql', 'utf8');
  assert.match(migration, /create table if not exists public\.trainer_client_access/i);
  assert.match(migration, /list_assignable_trainers/);
  assert.match(migration, /can_access_client/);
  assert.match(writes, /save_assessment/);
  assert.match(writes, /public\.can_access_client\(p_client_id\)/);
});

test('dynamic reports persist immutable snapshots, sections and protected PDFs', () => {
  const sql = fs.readFileSync('supabase/migrations/20260908120000_dynamic_reports.sql', 'utf8');
  for (const table of ['report_profiles','client_services','trainer_recommendations','report_instances','report_instance_sections']) assert.match(sql, new RegExp(`create table if not exists public\\.${table}`,'i'));
  assert.match(sql, /prevent_final_report_mutation/);
  assert.match(sql, /public\.can_access_client\(client_id\)/);
  assert.match(sql, /report-pdfs/);
  assert.match(fs.readFileSync('web/report-core.js','utf8'), /resolveSections/);
  assert.match(fs.readFileSync('web/app.js','utf8'), /reportSnapshot/);
});

test('canonical design tokens, responsive mobile navigation and A4 print rules are bundled', () => {
  const css=fs.readFileSync('web/design-system.css','utf8');
  const html=fs.readFileSync('web/index.html','utf8');
  for(const token of ['#0f172a','#1e293b','#0d9488','#059669','#d97706','#e11d48','#0284c7']) assert.match(css,new RegExp(token,'i'));
  assert.match(css, /@media\(max-width:620px\)/);
  assert.match(css, /@page\{size:A4/);
  assert.match(css, /min-height:48px/);
  assert.match(html, /assets\/kb-logo\.png/);
  assert.doesNotMatch(html, /googleusercontent\.com/);
});

test('per-test notes and photo mapping are protected by RLS', () => {
  const sql=fs.readFileSync('supabase/migrations/20260908130000_test_notes_and_photo_mapping.sql','utf8');
  assert.match(sql,/create table if not exists public\.assessment_test_notes/i);
  assert.match(sql,/attachment_role.*test_photo/is);
  assert.match(sql,/public\.can_access_client/i);
  assert.match(fs.readFileSync('web/app.js','utf8'),/assessment_test_notes/);
  assert.match(fs.readFileSync('web/app.js','utf8'),/test_id:testId/);
});

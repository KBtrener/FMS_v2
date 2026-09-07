const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Supabase migration defines relational schema, RLS, storage and RPCs', () => {
  const sql = fs.readFileSync('supabase/migrations/20260907120000_initial_schema.sql', 'utf8');
  for (const fragment of ['create table public.profiles', 'create table public.clients', 'create table public.assessments', 'create table public.assessment_answers', 'create table public.attachments', 'enable row level security', 'create policy', 'save_assessment']) assert.match(sql, new RegExp(fragment, 'i'));
  assert.doesNotMatch(sql, /SUPABASE_SERVICE_ROLE_KEY|postgres(ql)?:\/\//i);
});

test('legacy importer and web frontend do not use google.script.run', () => {
  assert.doesNotMatch(fs.readFileSync('web/app.js', 'utf8'), /google\.script\.run/);
  assert.match(fs.readFileSync('tools/import-google-export.mjs', 'utf8'), /legacy_client_id/);
});

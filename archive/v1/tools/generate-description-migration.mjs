import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { descriptionSeedSql, loadManualDescriptions } from './manual-descriptions.mjs';

const root = resolve(import.meta.dirname, '..');
const descriptions = loadManualDescriptions(root);
const migrationPath = resolve(root, 'supabase/migrations/20260908090000_test_descriptions.sql');
const seedPath = resolve(root, 'supabase/test_descriptions_seed.sql');
mkdirSync(resolve(root, 'supabase/migrations'), { recursive: true });
const header = `-- Generated from 09_manual_test_descriptions_bilingual.md.\n-- Do not edit content values by hand; update the Markdown and regenerate.\n\nbegin;\n\ncreate table if not exists public.test_descriptions (\n  test_description_id uuid primary key default gen_random_uuid(),\n  test_id text not null references public.tests(test_id) on delete cascade,\n  locale text not null check (locale in ('en', 'pl')),\n  purpose text not null default '',\n  procedure text not null default '',\n  verbal_instruction text not null default '',\n  side_definition text not null default '',\n  scoring_criteria text not null default '',\n  report_description text not null default '',\n  source_reference text not null default '',\n  manual_version text not null,\n  content_hash text not null,\n  is_active boolean not null default true,\n  created_at timestamptz not null default now(),\n  updated_at timestamptz not null default now(),\n  unique (test_id, locale, manual_version)\n);\n\ncreate unique index if not exists test_descriptions_active_idx\n  on public.test_descriptions(test_id, locale) where is_active;\ncreate index if not exists test_descriptions_lookup_idx\n  on public.test_descriptions(test_id, locale, is_active);\n\ndrop trigger if exists test_descriptions_touch on public.test_descriptions;\ncreate trigger test_descriptions_touch before update on public.test_descriptions\n  for each row execute procedure public.touch_updated_at();\n\nalter table public.test_descriptions enable row level security;\ndrop policy if exists config_test_descriptions_read on public.test_descriptions;\ncreate policy config_test_descriptions_read on public.test_descriptions\n  for select to authenticated using (is_active);\n\nrevoke insert, update, delete on public.test_descriptions from authenticated;\ngrant select on public.test_descriptions to authenticated;\n\n`;
const footer = '\n\ncommit;\n';
writeFileSync(migrationPath, `${header}${descriptionSeedSql(descriptions)}${footer}`, 'utf8');
writeFileSync(seedPath, `-- Generated from 09_manual_test_descriptions_bilingual.md.\n${descriptionSeedSql(descriptions)}\n`, 'utf8');
console.log(`Generated ${migrationPath}`);

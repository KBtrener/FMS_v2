import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DESCRIPTION_VERSION = '1.0';
export const DESCRIPTION_LOCALES = ['en', 'pl'];
const REQUIRED_CODES = [
  'cervical_flexion',
  'cervical_rotation_extension',
  'neck_extension_clearing',
  'toe_touch',
  'shoulder_mobility',
  'shoulder_clearing',
  'rotation',
  'balance',
  'squat',
  'spine_extension_clearing',
];

const firstHeadingBody = (source, names) => {
  const wanted = new Set(names.map(name => name.toLowerCase()));
  const lines = source.replace(/\r/g, '').split('\n');
  const start = lines.findIndex(line => line.startsWith('#### ') && wanted.has(line.slice(5).trim().toLowerCase()));
  if (start < 0) return '';
  const end = lines.findIndex((line, index) => index > start && line.startsWith('#### '));
  return lines.slice(start + 1, end < 0 ? lines.length : end).join('\n').trim();
};

const clean = value => value.replace(/\r/g, '').trim();
const hash = value => createHash('sha256').update(value, 'utf8').digest('hex');

export function parseManualDescriptions(source) {
  const sections = source.replace(/\r/g, '').split(/^## (?=\d+\. )/gm).slice(1).map(section => section.replace(/\n^## Układ[\s\S]*$/m, ''));
  const result = [];
  for (const section of sections) {
    const code = section.match(/^\*\*Code:\*\* `([^`]+)`/m)?.[1];
    const sourcePages = section.match(/^\*\*Manual pages?:\*\* ([^\n]+)/m)?.[1] || section.match(/^\*\*Manual page:\*\* ([^\n]+)/m)?.[1];
    if (!code || !sourcePages) continue;
    const english = section.match(/^### English\s*\n([\s\S]*?)(?=^### Polski\s*$)/mi)?.[1] || '';
    const polish = section.match(/^### Polski\s*\n([\s\S]*)/mi)?.[1] || '';
    for (const [locale, localized] of [['en', english], ['pl', polish]]) {
      const purpose = firstHeadingBody(localized, locale === 'en' ? ['Purpose'] : ['Cel']);
      const procedure = firstHeadingBody(localized, locale === 'en' ? ['Procedure'] : ['Wykonanie']);
      const verbalInstruction = firstHeadingBody(localized, locale === 'en' ? ['Verbal cue'] : ['Instrukcja dla klienta']);
      const scoringCriteria = firstHeadingBody(localized, locale === 'en' ? ['Scoring', 'Scoring and effect'] : ['Punktacja', 'Punktacja i wpływ', 'Punktacja oraz wpływ']);
      const sideDefinition = firstHeadingBody(localized, locale === 'en' ? ['Side definition'] : ['Definicja strony']);
      const values = { testCode: code, locale, purpose, procedure, verbalInstruction, scoringCriteria, sideDefinition, reportDescription: purpose, sourceReference: `FMS Quick Screen Manual, ${sourcePages}`, manualVersion: DESCRIPTION_VERSION };
      result.push({ ...values, contentHash: hash(JSON.stringify(values)) });
    }
  }
  const foundCodes = [...new Set(result.map(item => item.testCode))];
  const missingCodes = REQUIRED_CODES.filter(code => !foundCodes.includes(code));
  const missingLocales = REQUIRED_CODES.flatMap(code => DESCRIPTION_LOCALES.filter(locale => !result.some(item => item.testCode === code && item.locale === locale)).map(locale => `${code}:${locale}`));
  if (missingCodes.length || missingLocales.length || result.length !== REQUIRED_CODES.length * DESCRIPTION_LOCALES.length) {
    throw new Error(`Niekompletny katalog opisów. Brak testów: ${missingCodes.join(', ') || 'brak'}. Brak lokalizacji: ${missingLocales.join(', ') || 'brak'}. Rekordów: ${result.length}.`);
  }
  return result;
}

export function loadManualDescriptions(root = resolve(import.meta.dirname, '..')) {
  return parseManualDescriptions(readFileSync(resolve(root, '09_manual_test_descriptions_bilingual.md'), 'utf8'));
}

export function sqlLiteral(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}

export function descriptionSeedSql(descriptions) {
  const values = descriptions.map(item => `(${[
    `(select test_id from public.tests where code = ${sqlLiteral(item.testCode)})`, sqlLiteral(item.locale), sqlLiteral(item.purpose), sqlLiteral(item.procedure),
    sqlLiteral(item.verbalInstruction), sqlLiteral(item.sideDefinition), sqlLiteral(item.scoringCriteria),
    sqlLiteral(item.reportDescription), sqlLiteral(item.sourceReference), sqlLiteral(item.manualVersion), sqlLiteral(item.contentHash), 'true',
  ].join(', ')})`).join(',\n');
  return `update public.test_descriptions set is_active = false where manual_version <> ${sqlLiteral(DESCRIPTION_VERSION)};\n\ninsert into public.test_descriptions (test_id, locale, purpose, procedure, verbal_instruction, side_definition, scoring_criteria, report_description, source_reference, manual_version, content_hash, is_active) values\n${values}\non conflict (test_id, locale, manual_version) do update set purpose = excluded.purpose, procedure = excluded.procedure, verbal_instruction = excluded.verbal_instruction, side_definition = excluded.side_definition, scoring_criteria = excluded.scoring_criteria, report_description = excluded.report_description, source_reference = excluded.source_reference, content_hash = excluded.content_hash, is_active = true;`;
}

# Wdrożenie FMS Quick Screen

## Architektura

Aplikacja jest wdrażana jako statyczny frontend webowy z Supabase jako bazą danych, autoryzacją, storage i API. Apps Script, clasp oraz Google Sheets nie są wymagane.

## Konfiguracja

Utwórz `.env.local` na podstawie `.env.example` i ustaw `SUPABASE_PROJECT_URL` (lub `SUPABASE_API_URL`) oraz `SUPABASE_PUBLISHABLE_KEY`.

Migracje uruchom przez Supabase CLI lub panel SQL. Migracja `20260908090000_test_descriptions.sql` tworzy katalog opisów testów, a `20260908091000_assessment_manual_version.sql` dodaje wersjonowanie opisów w badaniach.

Migracje `20260910100000_clearing_hierarchy_and_admin_rules.sql`,
`20260910110000_neck_extension_clearing.sql` oraz
`20260910120000_neck_extension_description.sql` dodają hierarchię parent →
clearing, osobny Neck Extension Clearing i jego opis.

## Build i publikacja

```powershell
npm ci
npm run verify
npm run build:web
```

Artefakt do publikacji znajduje się w `dist/web`. Serwer powinien kierować ścieżkę aplikacji na `dist/web/index.html` oraz zwracać `index.html` dla routingu klienta. Klucz publishable może być umieszczony w publicznym bundle; nigdy nie publikuj `SUPABASE_SERVICE_ROLE_KEY`.

## Dane i opisy testów

Źródłem redakcyjnym jest `09_manual_test_descriptions_bilingual.md`. `node tools/generate-description-migration.mjs` tworzy migrację oraz seed SQL. Opisy są pobierane przez frontend i dołączane do wizardu, raportu HTML oraz PDF. `manual_version` w `assessments` zapewnia identyfikację wersji użytej przy zapisie badania.

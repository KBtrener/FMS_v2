# Migracja FMS Quick Screen do Supabase

## Stan i przepływ

Przed migracją UI Apps Script wywoływał `google.script.run`, a Apps Script
czytał i zapisywał znormalizowane karty Google Sheets. Drive przechowywał
arkusz, a Utilities/Gmail generowały PDF i szkic wiadomości.

Po migracji przepływ jest następujący:

`web/index.html → Supabase Auth → PostgreSQL/RLS → Supabase Storage`

Frontend korzysta z publishable key wyłącznie w runtime. Klucz service-role
jest używany tylko przez lokalne narzędzia administracyjne i nigdy nie trafia
do frontendu ani repozytorium.

## Mapowanie funkcji

| Funkcja | Apps Script | Supabase |
|---|---|---|
| Logowanie | konto właściciela Web App | Supabase Auth email/password; Google OAuth może być włączony w Dashboard |
| Klienci | `SpreadsheetApp`/Repository | `clients` + RLS po `owner_id` |
| Badania i odpowiedzi | Sheets + `LockService` | `save_assessment`/`update_assessment` RPC w transakcji |
| Katalog testów | seed Sheets | tabele katalogowe + `supabase/seed.sql` |
| Reguły clearing | `effect_rules` w Sheets | `effect_rules` + `applied_effects` |
| Pliki | Google Drive | bucket `assessment-files` + `attachments` |
| Historia | obliczana z arkusza | zapytania PostgreSQL z RLS |
| Raport | HTML/PDF/Gmail draft | widok danych w UI i drukowanie przeglądarki; wysyłka wymaga osobnej Edge Function |

## Migracje i seed

- `supabase/migrations/20260907120000_initial_schema.sql`
- `supabase/migrations/20260907130000_import_support.sql`
- `supabase/migrations/20260907140000_assessment_update_rpc.sql`
- `supabase/seed.sql`

Po wdrożeniu migracji seed katalogu wykonuje się idempotentnie przez CLI:

```powershell
npx supabase db query --linked --file supabase/seed.sql
```

## Import danych

`tools/import-google-export.mjs` przyjmuje katalog z `clients.csv/json`,
`assessments.csv/json`, `assessment_answers.csv/json` i opcjonalnym katalogiem
`files/`. Wymaga `SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_ROLE_KEY` oraz
`--owner-id`. Zachowuje legacy ID, relacje, daty i raportuje liczbę rekordów.
Nie usuwa danych źródłowych i można go uruchomić ponownie.

Rzeczywisty import nie został uruchomiony, bo repozytorium nie zawiera danych
produkcyjnych Google.

## Uruchomienie web

`npm run build:web` kopiuje frontend do `dist/web` i tworzy lokalny runtime
config z `SUPABASE_PROJECT_URL` oraz `SUPABASE_PUBLISHABLE_KEY`. `web/config.js`
jest ignorowany przez Git. Nie używaj service-role key w tym pliku.

# FMS v2 — Quick Screen

Webowa aplikacja do screeningu FMS. Frontend korzysta z Supabase (Auth, Postgres, Storage i RPC), a opisy testów są utrzymywane jako dane wersjonowane w bazie.

Zmiany funkcjonalne muszą aktualizować również dokumentację. Obowiązuje
FMS_Quick_Screen_Codex_Package/docs/08_documentation_change_policy.md.

Kanoniczny system wizualny znajduje się w `Stitch/Dla stitcha/design.md`. Raporty HTML i PDF korzystają ze wspólnego modelu sekcji w `web/report-core.js`, a każdy pobrany dokument zapisuje niezmienny snapshot oraz prywatny PDF w Supabase.

## Uruchomienie

```powershell
npm ci
npm run verify
npm run build:web
```

Przed buildem ustaw `SUPABASE_PROJECT_URL` oraz `SUPABASE_PUBLISHABLE_KEY` w `.env.local`. Wynik znajduje się w `dist/web`.

## Źródła opisów testów

`09_manual_test_descriptions_bilingual.md` jest kanonicznym źródłem redakcyjnym (EN/PL). Polecenie `node tools/generate-description-migration.mjs` generuje migrację i seed SQL dla tabeli `test_descriptions`. Aplikacja automatycznie pobiera aktywne opisy, wykorzystuje je w wizardzie i umieszcza w raportach oraz PDF.

## Weryfikacja

`npm run verify:descriptions` sprawdza kompletność katalogu, `npm run verify:fixtures` testuje przykłady punktacji, a `npm test` uruchamia testy jednostkowe i migracji.

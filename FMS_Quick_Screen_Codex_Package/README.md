# Pakiet wdrożeniowy: FMS Quick Screen

Ten pakiet opisuje aktualną aplikację: frontend webowy, Supabase jako bazę,
autoryzację, RLS, Storage i RPC oraz produkcyjny adres
`https://fms.kbtrener.pl/quickscreen/`.

Dokumentacja jest częścią procesu wdrożeniowego. Każda przyszła zmiana
wpływająca na zachowanie, dane, UI, raport, konfigurację, routing lub
wdrożenie musi być dopisana do planu zmian i do odpowiednich dokumentów.
Szczegóły opisuje `docs/08_documentation_change_policy.md`.

## Zawartość

- `AGENT_PROMPT.md` — instrukcja dla agenta implementującego.
- `docs/01_product_specification.md` — zakres produktu.
- `docs/02_data_model.md` — model danych Supabase.
- `docs/03_scoring_and_configuration.md` — punktacja i reguły clearingowe.
- `docs/04_ui_and_report_specification.md` — wizard, profil i raport.
- `docs/05_technical_deployment.md` — architektura i wdrożenie.
- `docs/06_acceptance_tests.md` — testy odbiorowe.
- `docs/07_decisions_and_limits.md` — decyzje i ograniczenia.
- `docs/08_documentation_change_policy.md` — obowiązkowy proces aktualizacji.
- `09_manual_test_descriptions_bilingual.md` — kanoniczne opisy EN/PL.

Konfiguracja startowa znajduje się w `supabase/seed.sql`, a migracje w
`supabase/migrations/`. Nie traktuj dawnych plików Apps Script/Google Sheets
jako aktualnej architektury.

## Gotowy projekt

Projekt jest gotowy, gdy migracje i RLS są zastosowane, build przechodzi,
testy odbiorowe przechodzą, a aplikacja działa na produkcyjnym adresie.
Raporty są generowane z aktualnych danych; PDF może być przechowywany w
prywatnym Storage jako dokument raportu zgodnie z bieżącą konfiguracją.

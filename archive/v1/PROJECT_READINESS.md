# Gotowość projektu

Projekt korzysta wyłącznie z frontendu webowego i Supabase. Konfiguracja, migracje oraz seed są wersjonowane w repozytorium; dane opisów testów pochodzą z `09_manual_test_descriptions_bilingual.md`.

Przed publikacją uruchom `npm run verify`, skonfiguruj zmienne Supabase i zastosuj wszystkie migracje, łącznie z `20260908120000_dynamic_reports.sql`. Po wdrożeniu wykonaj zalogowany smoke test generowania profili `free_current_result`, `assessment_report` i `full_coaching_report` oraz sprawdź wydruk A4. Szczegóły znajdują się w [DEPLOYMENT.md](DEPLOYMENT.md).

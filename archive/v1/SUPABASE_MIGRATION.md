# Architektura Supabase

Frontend `web/index.html` korzysta z Supabase Auth, PostgreSQL/RLS, Storage i RPC. Klucz publishable działa wyłącznie w runtime; klucz service-role jest zarezerwowany dla lokalnych narzędzi administracyjnych.

## Zakres danych

- `profiles`, `clients`, `assessments`, odpowiedzi i efekty są chronione RLS po `owner_id`.
- `test_descriptions` przechowuje wersjonowane opisy EN/PL, kryteria, instrukcje i odwołania do podręcznika.
- `manual_version` w `assessments` zapisuje wersję katalogu używaną podczas badania.
- `report_profiles`, `client_services` i `trainer_recommendations` sterują zakresem raportu.
- `report_instances` oraz `report_instance_sections` przechowują niezmienny snapshot i faktycznie użyte sekcje.
- Storage `assessment-files` obsługuje załączniki, a prywatny `report-pdfs` przechowuje finalne dokumenty.

## Migracje i seed

Uruchom migracje przez Supabase CLI lub panel SQL, a następnie seed:

```powershell
npx supabase db query --linked --file supabase/seed.sql
```

Katalog opisów jest generowany z `09_manual_test_descriptions_bilingual.md` przez `node tools/generate-description-migration.mjs`.

Migracja `20260908120000_dynamic_reports.sql` musi zostać zastosowana przed publikacją nowego frontendu. Finalizacja raportu zmienia stan `generating` na `ready`; trigger blokuje późniejszą zmianę snapshotu i gotowego dokumentu. RLS pozwala generować raport wyłącznie trenerowi mającemu dostęp do klienta i kompletnego badania.

## Import danych

`tools/import-google-export.mjs` jest opcjonalnym, jednorazowym importerem plików CSV/JSON do Supabase. Wymaga klucza service-role tylko lokalnie i nie jest częścią runtime aplikacji.

Migracje `20260910100000_clearing_hierarchy_and_admin_rules.sql`,
`20260910110000_neck_extension_clearing.sql` oraz
`20260910120000_neck_extension_description.sql` muszą być zastosowane, aby
hierarchia clearingów, osobny Neck Extension i jego opis były kompletne.

Każda zmiana schematu lub konfiguracji wymaga wpisu do planu zmian, migracji,
aktualizacji dokumentacji i odpowiedniego testu odbiorowego.

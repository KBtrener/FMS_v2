# Architektura i wdrożenie

Frontend jest statyczną aplikacją webową. Supabase zapewnia Auth, PostgreSQL, RLS, Storage i RPC. Produkcyjny adres: https://fms.kbtrener.pl/quickscreen/. Apps Script, clasp i Google Sheets nie są aktualną architekturą.

## Wdrożenie

Ustaw SUPABASE_PROJECT_URL i SUPABASE_PUBLISHABLE_KEY, zastosuj wszystkie migracje, uruchom npm run verify, npm run build:web i npm test, a następnie opublikuj dist/web z fallbackiem routingu do index.html. Klucz service-role nie może trafić do bundla.

Migracja 20260910110000_neck_extension_clearing.sql tworzy osobny Neck Extension, przenosi pole bólu przy wyproście i ustawia relację z Cervical Rotation. Każda zmiana danych wymaga migracji, seed/opisów, testu i wpisu w planie oraz dokumentacji.


# Prompt dla Codexu implementującego

Przeczytaj `README.md` oraz dokumenty `docs/01-08` przed rozpoczęciem pracy.
Traktuj je jako aktualną specyfikację, a `09_manual_test_descriptions_bilingual.md`
jako kanoniczne źródło redakcyjne opisów.

## Aktualna architektura

Frontend działa jako aplikacja webowa, a Supabase zapewnia Auth, PostgreSQL,
RLS, Storage i RPC. Nie używaj Apps Script, clasp ani Google Sheets jako
backendu aktualnej aplikacji. Klucz service-role może być używany wyłącznie
lokalnie przez narzędzia administracyjne.

## Bezwzględne zasady

- Wynik surowy/bazowy testu i wynik końcowy są osobnymi pojęciami.
- Reguła clearingowa może zmienić wyłącznie wynik końcowy; nie może nadpisać
  odpowiedzi ani wyniku bazowego w bazie.
- Każdy zastosowany wpływ zapisuj w `applied_effects` wraz ze źródłem, celem,
  wynikiem przed/po i przyczyną.
- Reguły są konfigurowalne w danych i dostępne administracyjnie.
- `parent_screen_test_id` opisuje hierarchię test nadrzędny → clearing.
- `Neck Extension Clearing` jest osobnym testem clearingowym pod `Cervical
  Rotation`; nie dodawaj bólu przy wyproście do formularza rotacji.
- Zachowuj wynik każdej strony oraz asymetrię; clearing nie może ich ukryć.
- Zachowuj istniejący system wizualny i responsywność.
- Po zmianie sprawdź, czy dokumentacja nadal jest zgodna. Jeśli nie, zmiana
  dokumentacji jest częścią tego samego planu i odbioru.

## Odbiór

Uruchom `npm run verify`, `npm run build:web` i `npm test`. Sprawdź wizard,
profil klienta, raport HTML/PDF, panel administratora, historię przeglądarki,
desktop i telefon. Przed przekazaniem zaktualizuj dokumenty wskazane w planie.

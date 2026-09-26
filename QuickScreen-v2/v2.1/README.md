# QuickScreen

Interaktywna makieta nowego modułu QuickScreen. Pliki UI, dane demonstracyjne, konfiguracja Supabase i migracje znajdują się w tym katalogu.

## Uruchomienie makiety

Uruchom lokalny serwer statyczny w katalogu `v2.1`, np.:

```powershell
python -m http.server 8000
```

Otwórz `http://localhost:8000`. Makieta korzysta z fixture’ów w `js/data.js` i `js/v2.1-data.js`; nie zapisuje prawdziwych klientów ani badań.

## Supabase

`supabase/migrations` zawiera bazowy schemat, polityki RLS, procedury, definicje testów i raportów przeniesione z istniejącego backendu. Seed w `supabase/seed.sql` opisuje ten sam protokół 10 testów co makieta, wraz z zależnościami clearingów. Nie seeduje prawdziwych osób ani badań.

Dla lokalnego środowiska Supabase:

```powershell
npx supabase start
npx supabase db reset
```

Dla wybranego projektu Supabase skonfiguruj połączenie przez CLI, a następnie wypchnij migracje i seed. Nie dodawaj klucza service-role do frontendu.

## Integracja z aplikacją główną

QuickScreen jest osobnym modułem. Widoki, protokół i schemat mogą być rozwijane niezależnie. Późniejsze połączenie z aplikacją główną powinno odbywać się przez wersjonowaną warstwę API opisaną w [API_ARCHITECTURE.md](API_ARCHITECTURE.md). Makieta nie jest jeszcze podłączona do projektu Supabase ani do API aplikacji głównej.

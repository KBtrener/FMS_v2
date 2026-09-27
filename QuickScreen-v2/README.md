# QuickScreen V2

QuickScreen V2 jest samodzielnym frontendem w katalogu `QuickScreen-v2`. Interfejs korzysta z Supabase Auth i wersjonowanego REST API w Supabase Edge Functions. Makieta wyników zachowuje istniejący układ, a zawartość wizardu i wyników pochodzi z bazy.

## Struktura

- `index.html`, `css/`, `js/`, `assets/` — frontend V2.
- `js/config.js` — publiczna konfiguracja runtime; podczas publikacji skrypt wstawia URL Supabase i publishable key z `.env.local`.
- `supabase/migrations/` — izolowany schemat `quickscreen_v2` i migracje danych z `public`.
- `supabase/functions/quickscreen-api/` — REST API dla V2, dostępne pod `/functions/v1/quickscreen-api/v1`.

## Konfiguracja i wdrożenie Supabase

Ustaw `SUPABASE_PROJECT_URL` oraz `SUPABASE_PUBLISHABLE_KEY` w `.env.local`. Połącz Supabase CLI z projektem zawierającym bazę V1, a następnie z katalogu `QuickScreen-v2` zastosuj migracje i opublikuj funkcję:

```powershell
npx supabase link --project-ref TWOJ_PROJECT_REF
npx supabase db push
npx supabase functions deploy quickscreen-api
```

Migracja `20260927121900_copy_v1_data.sql` kopiuje rekordy z istniejącego schematu `public` do `quickscreen_v2`, zachowując identyfikatory. Operację można bezpiecznie powtórzyć. Przed użyciem aplikacji zastosuj katalog początkowy:

```powershell
npx supabase db query --linked --file supabase/seed.sql
```

Dodaj `quickscreen_v2` do listy exposed schemas w ustawieniach Data API projektu Supabase. Schemat wymaga dostępu roli `authenticated`; API używa JWT użytkownika i polityk RLS. Nie umieszczaj klucza `service_role` w frontendzie.

## Wdrożenie frontendu

Skrypt `node QuickScreen-v2/deploy-ovh.mjs` publikuje wyłącznie frontend V2 pod katalogiem `quickscreenv2` na OVH. Pobiera konfigurację Supabase z `.env.local` i umieszcza w publicznym bundle wyłącznie URL oraz publishable key. Wymaga też istniejącego `.env.deploy.local` z danymi OVH.

## API

Kontrakt v1 zawiera profil użytkownika, scenariusze i ich konfigurację PL/EN, wyszukiwanie i tworzenie klientów, pulpit, szkice badań, ich odpowiedzi oraz finalizację i wyniki. Wszystkie rekordy użytkownika są filtrowane przez `auth.uid()` i RLS. Konfiguracja scenariusza jest wersjonowana przez `manual_version`.

Pliki załączników i obiekty Storage nie są kopiowane przez migrację rekordów SQL; wymagają osobnego transferu obiektów, jeśli zawierają dane potrzebne w V2.

## Lokalny podgląd

Z katalogu głównego uruchom:

```powershell
python -m http.server 8000 --directory QuickScreen-v2
```

Frontend wymaga skonfigurowanego Supabase Auth, migracji, seedu oraz wdrożonej funkcji API.
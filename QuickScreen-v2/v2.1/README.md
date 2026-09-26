# QuickScreen

Makieta aplikacji zbudowana od podstaw na podstawie PNG z Figmy i zasad z `design.md`. Interfejs nie korzysta z kodu ani komponentów poprzedniej aplikacji. Dane klientów i badań są wyłącznie demonstracyjne.

## Uruchomienie

W katalogu `v2.1` uruchom:

```powershell
python -m http.server 8000
```

Otwórz `http://localhost:8000`.

## Supabase i przyszłe API

`supabase/` zawiera schemat, RLS, migracje i seedy bazujące na istniejącym backendzie oraz protokole 10 testów. Makieta nie zapisuje danych do Supabase. Granicę modułu i przyszłą integrację przez API opisuje [API_ARCHITECTURE.md](API_ARCHITECTURE.md).

## Publikacja

Z katalogu głównego repozytorium uruchom `node QuickScreen-v2/v2.1/deploy-ovh.mjs`. Skrypt publikuje pliki UI do `quickscreen v2` oraz dotychczasowego adresu `quick-screen-v2`. Nie wysyła dokumentacji ani plików Supabase.

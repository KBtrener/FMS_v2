# QuickScreen V2 — KB Trener

QuickScreen jest niezależnym modułem do oceny funkcjonalnej. Aktualny interfejs to statyczna makieta z danymi demonstracyjnymi — nie uwierzytelnia użytkowników ani nie zapisuje badań.

## Uruchomienie lokalne

W katalogu głównym repozytorium uruchom:

```powershell
python -m http.server 8000 --directory QuickScreen-v2
```

Otwórz `http://localhost:8000`.

## Struktura

- `index.html`, `css/`, `js/`, `assets/` — aktualna makieta.
- `supabase/` — konfiguracja, migracje, dane startowe i test izolacji RLS dla przyszłego backendu.
- `API_ARCHITECTURE.md` — granica modułu i zasady integracji.
- `design.md` i `agents.md` — zasady wyglądu i pracy nad aplikacją.
- `docs/` i `sources/` — logika badań, raportów i reguły domenowe.

## Przygotowanie backendu

Interfejs nadal korzysta z danych demonstracyjnych. Przy wdrażaniu backendu dostęp do danych należy zamknąć w jednym adapterze; widoki mają korzystać z modelu QuickScreen, a nie bezpośrednio z tabel Supabase. Przed integracją z aplikacją główną trzeba uzgodnić uwierzytelnianie, adres API, role dostępu i kontrakt endpointów. Migracji nie należy nakładać na produkcyjną bazę przed wskazaniem projektu Supabase i planu migracji. Szczegóły opisuje `API_ARCHITECTURE.md`.

## Publikacja makiety na OVH

Z katalogu głównego repozytorium uruchom `node QuickScreen-v2/deploy-ovh.mjs`. Skrypt odczytuje `.env.deploy.local` z katalogu głównego repozytorium i publikuje tylko pliki interfejsu do `quickscreen v2` oraz `quick-screen-v2`.

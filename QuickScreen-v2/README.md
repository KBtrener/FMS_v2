# QuickScreen V2 · KB Trener

Samodzielna, statyczna makieta frontendowa modułu QuickScreen dla systemu KB Trener. To demonstrator wyglądu, UX i nawigacji — bez backendu, Supabase, API, autoryzacji, zapisu, localStorage, logiki biznesowej i prawdziwych operacji.

## Uruchomienie

Otwórz `index.html` bezpośrednio w przeglądarce. Główny entrypoint nie wymaga Node ani npm. Hash routing działa również z `file://`. Opcjonalnie można uruchomić prosty serwer statyczny w tym katalogu.

## Nawigacja

Klikalne karty i akcje nawigacyjne prowadzą do statycznych stanów. `Prototype Navigator` otwiera się przyciskiem w prawym dolnym rogu i pozwala przejść bezpośrednio do każdego widoku demonstracyjnego.

## Struktura

- `docs/` — kanoniczny design system i audyt zakresu.
- `references/` — wybrane materiały Stitch jako referencje wizualne.
- `assets/` — lokalne logo, fonty, grafika instruktażowa i ikony.
- `css/` — tokeny, baza, komponenty, layouty i strony.
- `js/` — fixture data, routing, komponenty, widoki i bootstrap aplikacji.

Struktura odpowiada przyszłym komponentom React: `AppShell`, `ClientCard`, `AssessmentWizard`, `ScoreSelector`, `ReportPreview` itd.
Szczegółowe ustalenia dla widoku podglądu badania znajdują się w `docs/ASSESSMENT_DETAILS_UI.md`.

# Pakiet wdrożeniowy: FMS Quick Screen

Ten katalog jest kompletnym wejściem dla agenta implementującego. Ma pozwolić
zbudować i wdrożyć pierwszą wersję aplikacji bez odtwarzania wcześniejszej
rozmowy.

## Jak użyć pakietu

1. Przekaż agentowi cały katalog albo plik ZIP.
2. Dołącz plik AGENT_PROMPT.md jako główną instrukcję.
3. Umożliw mu jednorazową autoryzację konta Google właściciela przy tworzeniu
   arkusza, projektu Apps Script i wdrożenia webowego. Nie przekazuj hasła.
4. Po wdrożeniu odbierz link produkcyjny, link do arkusza danych oraz link do
   projektu Apps Script.

## Zawartość

- AGENT_PROMPT.md - gotowy prompt dla Codexu.
- docs/01_product_specification.md - zakres produktu i zachowanie aplikacji.
- docs/02_data_model.md - logiczny, znormalizowany model danych dla Google
  Sheets.
- docs/03_scoring_and_configuration.md - reguły Quick Screen i konfiguracja
  powiązań testów.
- docs/04_ui_and_report_specification.md - ekrany, interakcje i raport.
- docs/05_technical_deployment.md - architektura Apps Script i warunki
  przekazania.
- docs/06_acceptance_tests.md - testy, które muszą przejść przed przekazaniem.
- docs/07_decisions_and_limits.md - zatwierdzone decyzje i jawne granice.
- config/quick_screen_seed.json - maszynowo czytelna konfiguracja startowa.
- fixtures/assessment_fixtures.json - fikcyjni klienci i oczekiwane wyniki.
- tools/verify_fixtures.mjs - automatyczna kontrola konfiguracji i fixture'ów.
- references/ - przekazane materiały PDF.

## Definicja gotowego projektu

Projekt jest gotowy dopiero, gdy działa pod produkcyjnym linkiem Apps Script,
dostępnym wyłącznie dla właściciela konta Google, zapisuje dane do prywatnego
Google Sheets i przechodzi wszystkie testy z docs/06_acceptance_tests.md.

Raporty nie są trwale zapisywane na Dysku. Aplikacja może pobrać PDF w
przeglądarce oraz - po osobnej zgodzie na Gmail - utworzyć niewysłany szkic
wiadomości z PDF-em.

## Materiały źródłowe i prawa

PDF-y są materiałami referencyjnymi przekazanymi przez właściciela projektu.
Implementacja ma korzystać z ich zasad punktacji, ale nie powinna kopiować
logo, układu ani pełnych treści podręcznika do aplikacji. Ekrany i raport mają
mieć własny, neutralny wygląd. Kryteria w interfejsie należy zwięźle
streścić i podać odwołanie do strony źródła.

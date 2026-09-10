# FMS QuickScreen — postęp rekonstrukcji Stitch

Ostatnia aktualizacja: 2026-09-08
Status: audyt zakończony, lista klientów, wizard i profil klienta w kolejnej iteracji UI; screenshot comparison zablokowany przez brak przeglądarki.

## Cel

Odtworzyć produkcyjny interfejs FMS QuickScreen zgodnie z referencjami Stitch, zachowując istniejącą logikę Supabase, autoryzację, scoring, clearing, historię, snapshoty raportów, notatki, zdjęcia i generowanie PDF.

## Zasady wznowienia

1. Nie zmieniać schematu Supabase, RPC, RLS ani logiki domenowej bez uzasadnienia.
2. Najpierw wymieniać markup renderera na strukturę Stitch, potem podłączać istniejące dane/eventy.
3. Używać tokenów z `Stitch/Dla stitcha/design.md` i lokalnych fontów/logo.
4. Po każdym ekranie: build, testy, screenshoty 390×844 / 768×1024 / 1440×900, porównanie z referencją, aktualizacja tego pliku.
5. Nie deklarować zgodności 1:1 bez rzeczywistego porównania PNG.

## Audyt — stan zastany

### Repozytorium i źródła

- Aplikacja jest vanilla ES modules: `web/index.html`, `web/app.js`, `web/core.js`, `web/report-core.js`, `web/pdf-report.js`.
- Główny arkusz ładowany produkcyjnie: `web/design-system.css`.
- `web/styles.css` istnieje jako starszy/konfliktujący arkusz i nie jest ładowany przez `web/index.html`, ale zawiera stare tokeny/paletę oraz stare definicje klas.
- Istnieją lokalne fonty Outfit i Inter w `web/assets/`.
- W repo nie ma jeszcze `web/assets/fms-logo.svg`; `design.md` wskazuje ten plik jako produkcyjny master logo, a aktualny HTML używa `web/assets/kb-logo.png`.
- W referencjach Stitch występują zewnętrzne URL-e Google Fonts, Material Symbols, logo i zdjęć. Nie przenosić ich do produkcji.
- Istniejące zmiany użytkownika są obszerne i niezależne od tej rekonstrukcji. Nie resetować ani nie nadpisywać ich bez potrzeby.

### Referencje i uszkodzone screenshoty

| Referencja | `code.html` | `screen.png` | Decyzja |
|---|---:|---:|---|
| lista klientów | dostępny | 115240 B, poprawny | używać obu |
| karta klienta | dostępny | 28 B, uszkodzony | używać wyłącznie `code.html` |
| podgląd raportu PDF | dostępny | 1013177 B, poprawny | używać obu |
| wizard Shoulder Clearing | dostępny | 97497 B, poprawny | używać obu |
| wizard Toe Touch | dostępny | 28 B, uszkodzony | używać wyłącznie `code.html` |
| wzornik kolorów/statusów | dostępny | 343959 B, poprawny | używać obu |

## Tabela ekranów

| Ekran | Renderer / routing | Referencja Stitch | Aktualna zgodność | Główne różnice |
|---|---|---|---|---|
| lista klientów | `showClients()` → `clients-shell` / `client-card`; `data-action=home`, `new-client`, `data-client` | `lista_klient_w/code.html`, `screen.png` | częściowa | struktura jest uproszczona względem referencji; brak referencyjnego topbara/symboli; wyszukiwarka ma skrócony placeholder; brak jawnego sortowania „Ostatnie badanie”; akcja `+ Test` jest wizualna, ale kliknięcie karty przejmuje całą akcję; do sprawdzenia semantyka statusów i wyników |
| karta klienta | `showProfile()` → `renderProfile()` → `renderReferenceProfile()`; `data-action=home/edit-client/new-assessment/report`, `data-open/edit/archive/restore-assessment` | `profil_klienta_gawe_kot/code.html` (screenshot uszkodzony) | częściowa | nowa struktura odpowiada kompaktowej karcie klienta Stitch, ale brak screenshot comparison; logo/ikony i stany loading/error nadal wymagają ujednolicenia |
| wizard | `beginAssessment()` → `renderAssessment()` → `renderReferenceAssessment()`; `data-step`, `data-answer`, `previous-step`, `next-step`, `finish-assessment`, criteria sheet | Shoulder Clearing + Toe Touch `code.html`/screens | częściowa | nowa struktura odpowiada referencji, ale wymaga screenshot comparison; stan `error` i dokładne odwzorowanie każdego testu pozostają do weryfikacji |
| podgląd raportu HTML | `showReport()` → raport renderowany w `app.js`; `data-action=print-report/download-pdf/email-report`, sekcje dynamiczne | `podgl_d_raportu_pdf_gawe_kot/code.html`, `screen.png` | częściowa | istnieje wspólny model raportu (`report-core.js`), ale markup i styling wymagają porównania ze Stitch; do ujednolicenia logo, nagłówka, kart ryzyka, kolejności sekcji, pustych sekcji i historii |
| PDF | `createFmsPdfDefinition()` + pdfmake; `downloadPdf()` | podgląd raportu Stitch jako wzorzec | niezgodna architektonicznie | PDF używa niezależnego layoutu pdfmake zamiast tego samego HTML/CSS; zachowuje dane, ale nie gwarantuje zgodności hierarchii i łamania A4; wymaga migracji/warstwy wspólnego renderera HTML + print, jeśli narzędzia pozwolą |
| szczegóły badania | `openAssessment()` oraz akcje historii | brak osobnej referencji | niezweryfikowana | funkcjonalność istnieje, ale ekran nie ma potwierdzonego odpowiednika Stitch; trzeba oprzeć go na wspólnych komponentach i określić kontrakt |
| konfiguracja | `showConfig()`; `data-action=config`, `data-rule` | brak osobnej referencji | generyczna | używa starego `hero/panel/rule-card`; wymaga wspólnego topbara, kart, statusów, stanów i responsywnego kontraktu |
| profil trenera | `showUserProfile()`; certyfikacje, hasło, wylogowanie | brak osobnej referencji | generyczna | funkcjonalny ekran ma prostą strukturę paneli; wymaga wspólnej kompozycji i semantyki |
| panel zespołu | `showTeamAdmin()`; przypisania trainer-client | brak osobnej referencji | generyczna | funkcjonalny ekran ma prostą formę/tabelaryczne wiersze; wymaga wspólnych komponentów i stanów |
| logowanie / systemowe | `renderAuth()`, `renderFatal()`, `loading()`, toast/modal | wzornik + design.md | częściowa | istnieją stany, ale wymagają sprawdzenia typografii, logo, focus, opisów dostępności i spójnych statusów |

## Aktywne routing/events

- Globalny klik w `web/app.js` obsługuje: home, konfigurację, zespół, profil, klienta, badanie, raport, archiwizację, PDF, email, upload/attachment, clearing rules, hasło i logout.
- `sb.auth.onAuthStateChange()` steruje logowaniem, recovery i bootem.
- Wizard zapisuje szkic lokalnie przez `localStorage` (`quickscreen-draft:*`) i zapisuje odpowiedzi przez istniejącą funkcję końcową.
- Raport pobiera dane z `report-core.js`; snapshot zapisuje do `report_instances`, sekcje do `report_instance_sections`, PDF do Storage.

## Kontrakt responsywny do wdrożenia

- 390×844: gutter 16 px, jedna kolumna, fixed topbar + dolna nawigacja, sticky wizard action bar, brak poziomego scrolla formularza, pełne „Lewa strona” / „Prawa strona”, cele min. 48×48.
- 768×1024: kontrolowane 1–2 kolumny; widoczne kroki wizardu i wygodna obsługa jedną ręką.
- 1440×900: max content 1200 px, pełna nawigacja, raport jako responsywny podgląd A4.
- Status zawsze ma znak/ikonę + nazwę + opis dostępny; kolor nie może być jedynym nośnikiem znaczenia.

## Kanoniczne tokeny

Primary `#0F172A`, primary accent `#1E293B`, secondary `#0D9488`, base `#F8FAFC`, card `#FFFFFF`, muted `#F1F5F9`, border subtle `#E2E8F0`, border strong `#CBD5E1`, pass `#059669/#ECFDF5`, attention `#D97706/#FFFBEB`, pain `#E11D48/#FFF1F2`, info `#0284C7`; nagłówki Outfit, tekst/liczby Inter.

## Kolejka implementacji

1. Uporządkować wspólny shell/topbar/logo/icon/status/accessibility i usunąć konflikt starej palety.
2. Wymienić markup listy klientów zgodnie z `lista_klient_w/code.html`; zachować API `fetchClients()` i eventy.
3. Dopracować kartę klienta zgodnie z `profil_klienta_gawe_kot/code.html`.
4. Dopracować wizard na przykładzie Shoulder Clearing i Toe Touch.
5. Ujednolicić raport HTML i przygotować wspólny render print/A4.
6. Zweryfikować/migrować PDF bez zmiany modelu danych.
7. Ujednolicić szczegóły badania, konfigurację, profil, zespół, auth/system states.
8. Po każdym punkcie wykonać walidację i wpisać różnice do tabeli poniżej.

## Ostatni wykonany krok

- Wykonano audyt plików, rendererów, eventów, CSS i screenshotów.
- Dodano ten plik postępu.
- Przebudowano renderer `showClients()` na referencyjny układ kart: pełny placeholder wyszukiwarki, sortowanie po ostatnim badaniu, semantyczne statusy, osobna akcja `+ Test`, status „Nowy”, data i stan synchronizacji.
- Dodano widoczne nazwy kroków w pasku postępu wizarda przez `aria-label` → pseudo-element, zachowując istniejące `data-step`.
- Dodano osobny listener dla `+ Test`, który otwiera kartę klienta i rozpoczyna nowe badanie bez zmiany danych domenowych.
- Podłączono nowy aktywny renderer `renderReferenceAssessment()` dla wizarda.
- Wizard ma dokładny status `Szkic zapisany na tym urządzeniu`, nazwane kroki, stany postępu, opis biomechaniczny, clearing alert, pełne panele stron, wynik niepełny/semantyczny, kryteria zamknięte domyślnie i sticky action bar z nazwą następnego testu.
- Shoulder Clearing ma dedykowane grupowanie referencyjne: dwa kafle L/P, osobno `Zakres ruchu` i `Objawy bólowe`, przyciski 2×2 oraz komunikat kompletności `4/4`; nie renderuje dodatkowego agregatu `x / 3 pkt`.
- Zaznaczone odpowiedzi Shoulder Clearing respektują statusy: pass teal, attention amber, pain rose.
- Usunięto automatyczny blok wyniku `x / 3 pkt` z wizarda.
- W wizualnym rendererze wizarda punktacja ma tylko duże cyfry; Pass/Fail używa `✓/×`; ból używa `Są/Nie ma`.
- Shoulder Clearing ma kafle L/P ustawione pionowo na desktopie i osobno modelowane na mobile zgodnie z referencją; usunięto komunikat `Komplet odpowiedzi zaznaczony` z kafli.
- Profil klienta wybiera najnowsze kompletne badanie deterministycznie po `assessmentDate`; wiersze testów mają fallback wyniku.
- Przebudowano aktywny renderer profilu na `renderReferenceProfile()`: kompaktowa karta klienta, CTA „Nowe badanie FMS”, akcje pomocnicze, sekcja ostatniego badania, flagi ryzyka, testy, trend i historia zgodne hierarchią z `profil_klienta_gawe_kot/code.html`.
- Wykres profilu przestał używać hardkodowanych kolorów; linie, siatka i punkty korzystają z kanonicznych tokenów CSS.
- `npm run verify` po przebudowie profilu: opisy OK, fixture’y OK, testy 27/27, build OK.
- Wdrożono aktualne `dist/web` do `/home/svtpikz/fms/quickscreen`; `https://fms.kbtrener.pl/quickscreen/index.html` odpowiada `HTTP 200 OK`.
- Naprawiono edycję badania: aktywny wizard pokazuje wymagane pole „Powód korekty” przy istniejącym badaniu i przekazuje je do `update_assessment`.
- Naprawiono wybór najnowszego badania: sortowanie uwzględnia datę badania oraz `updated_at`/`created_at` przy badaniach z tą samą datą.
- Po poprawkach ponownie wykonano `npm run verify` (27/27) i wdrożono aktualny build do `/quickscreen/`.
- Ujednolicono kolor fontu odpowiedzi wizarda: `0` i `Są` = pain, `1` = attention, `2`, `3` i `Nie ma` = pass; zaznaczone odpowiedzi zachowują biały tekst na statusowym tle dla kontrastu.
- Po zmianie kolorów wykonano `npm run verify` (27/27) i ponownie wdrożono `dist/web` do `/quickscreen/`.
- Zdiagnozowano, że wcześniejsza reguła `.answer-score:not(.is-selected)` nadpisywała kolor fontu dla cyfr `0–3`; dodano reguły o wyższej specyficzności dla statusów pain/attention/pass.
- Ponownie wykonano `npm run verify` (27/27) i wdrożono poprawiony `design-system.css` do `/quickscreen/`.
- Audyt kafli wizarda: standardowe testy korzystają wspólnie z `testFieldsMarkup()` → `renderField()` → `answerButtonContent()`, ale Shoulder Clearing ma osobne `shoulderClearingMarkup()` → `shoulderChoiceMarkup()` oraz klasy `.shoulder-*`. Jego reguła `.shoulder-choice-options .answer-btn` ma większą specyficzność i nadpisuje kolor fontu; wymaga ujednolicenia z wariantem standardowym.
- Ujednolicono Shoulder Clearing z pozostałymi testami: usunięto osobny renderer i klasy `shoulder-*`; aktywny wizard używa wyłącznie `testFieldsMarkup()` oraz wspólnych kafli stron i odpowiedzi. Usunięto również komunikaty „Zasada zerowania” i „Komplet odpowiedzi zaznaczony” z prezentacji.
- Po zmianie wykonano `npm run verify` (27/27) i wdrożono aktualny build do `/quickscreen/`.
- `npm run verify`: opisy OK, fixture’y OK, testy 27/27, build OK.
- Ujednolicono układ kafli L/P we wszystkich testach wizarda do jednej kolumny, również dla Shoulder Clearing.
- Ujednolicono warianty kolorystyczne wszystkich aktywnych przycisków wizarda; deployment ponowiony po tej zmianie.
- Uruchomiono `npm test`: 27/27 przechodzi.
- Uruchomiono `npm run build:web`: przechodzi, artefakt `dist/web`.
- Uruchomiono `git diff --check`: bez błędów whitespace.
- Wykonano ponowne wdrożenie aktualnego `dist/web` przez SFTP do `/home/svtpikz/fms/quickscreen`.
- Zweryfikowano `https://fms.kbtrener.pl/quickscreen/index.html`: `HTTP 200 OK` po ostatnich poprawkach.

## Następny konkretny krok

Uruchomić screenshot comparison wizarda przy 390×844, 768×1024 i 1440×900 po udostępnieniu przeglądarki. Następnie porównać z referencją Shoulder Clearing i Toe Touch, usunąć stary `renderStitchAssessment()` po potwierdzeniu braku użycia, a potem przejść do karty klienta.

## Dziennik walidacji

| Data | Zakres | Test/build | Screenshot comparison | Wynik / ograniczenie |
|---|---|---|---|---|
| 2026-09-08 | audyt + lista klientów + wizard korekty + globalny układ L/P + redeployment | `npm run verify`: opisy OK, fixture’y OK, testy 27/27, build OK, diff check OK | screenshot aplikacji niewykonany — browser plugin zgłosił brak dostępnej przeglądarki | aktualna wersja wdrożona pod `/quickscreen/`; brak deklaracji zgodności wizualnej bez screenshot comparison |

## Tabela różnic wizualnych

| Element | Referencja | Implementacja | Różnica | Status |
|---|---|---|---|---|
| logo | lokalny master przewidziany przez design system | `kb-logo.png` + viewport crop | brak `fms-logo.svg`, inne źródło/kompozycja | do poprawy |
| ikony | Material Symbols w referencji | tekstowe symbole Unicode w `index.html`/CSS | inny kształt, baseline i dostępność | do poprawy |
| lista | topbar + cards z referencji | `clients-reference` + osobny `client-card-main`/`client-action` | wymaga screenshot comparison; lokalne ikony/logo nadal nie są finalne | do porównania |
| wizard progress | nazwane kroki + current/done/incomplete/error | nazwę widocznie dostarcza `aria-label` przez CSS; logika nadal tylko done/current | incomplete/error nadal do modelowania | częściowo poprawione |
| wizard renderer | Shoulder Clearing: kontekst, alert, pełne L/P, zakres+ból, bottom sheet, sticky bar | `renderReferenceAssessment()` + `shoulderClearingMarkup()` | wymaga porównania screenshotów i sprawdzenia każdego testu | częściowo poprawione |
| wizard controls | referencja: cyfry, ✓/×, `Są/Nie ma`, statusowe kolory | `answerButtonContent()` + `shoulderChoiceMarkup()` | wymaga screenshot comparison | częściowo poprawione |
| profile structure | kompaktowa karta klienta, główne CTA, sekcja ostatniego badania, historia | `renderReferenceProfile()` + `.profile-reference` | brak screenshot comparison z powodu uszkodzonego screenshotu referencji i braku browsera | częściowo poprawione |
| profile latest score | najnowsze wyniki testów w podsumowaniu karty | sortowanie po dacie + fallback w `stitchTestRows()` | wymaga weryfikacji na danych produkcyjnych | poprawione defensywnie |
| profile chart colors | secondary, pain, border tokens | `.chart-line`, `.chart-dot-current`, `.chart-grid` | wymaga wizualnego porównania | poprawione |
| PDF | ten sam HTML/CSS co preview | niezależne pdfmake definition | ryzyko różnej hierarchii/layoutu | do poprawy |

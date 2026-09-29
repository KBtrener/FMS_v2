# Current App UI Audit

## 1. Executive summary

Repozytorium zawiera produkcyjną aplikację FMS QuickScreen dla trenera. Jest to aplikacja webowa typu SPA zbudowana bez Reacta: HTML jest dostarczany przez `web/index.html`, a widoki są składane dynamicznie w `web/app.js` jako stringi HTML. Dane użytkownika, konfiguracja protokołu, wyniki badań, raporty i pliki są obsługiwane przez Supabase.

Najważniejszy funkcjonalny rdzeń aplikacji to:

- uwierzytelnienie trenera,
- lista klientów z wyszukiwaniem i filtrowaniem archiwalnych profili,
- karta klienta z ostatnim wynikiem, trendem i historią badań,
- rozpoczęcie lub korekta dziewięcioetapowego badania QuickScreen,
- ocena pól jednostronnych i obustronnych, w tym Shoulder Clearing,
- zapisywanie szkicu lokalnie i zapisywanie kompletnego badania w Supabase,
- podgląd raportu HTML, wybór dodatkowych sekcji, wydruk i generowanie PDF,
- zapis niezmiennego snapshotu raportu,
- przechowywanie notatek i załączników do badania,
- profil trenera, certyfikacje, dyscypliny klienta,
- administracja zespołem oraz regułami clearingu.

Obecna implementacja ma dwa zauważalne poziomy wizualne. Starsza/ogólna warstwa CSS w `web/styles.css` używa bardziej miękkiej estetyki (`Manrope`, koral, papierowe tło, większe zaokrąglenia), natomiast aktualne widoki oznaczone w kodzie jako `Reference`/`Stitch` korzystają z `web/design-system.css` i `Stitch/Dla stitcha/design.md`: Outfit + Inter, deep slate, teal, jasne powierzchnie, statusy FMS i układ nastawiony na obsługę jedną ręką. To oznacza, że obecny frontend jest częściowo migracją w kierunku Stitch, a nie jednym całkowicie jednolitym systemem.

Materiały Stitch są przede wszystkim referencją wizualną i specyfikacją. Najlepiej opisany kierunek to „Studio Biomechanics”: spokojne, precyzyjne narzędzie treningowe, a nie aplikacja medyczna ani generyczny dashboard SaaS. Kod aplikacji potwierdza, że funkcje i flow są bardziej rozbudowane niż dostępne ekrany Stitch.

Ważne ograniczenia audytu:

- repozytorium zawiera artefakty produkcyjne, dokumentację i materiały projektowe, ale nie zawiera Reacta;
- nie uruchamiano aplikacji z prawdziwą sesją ani nie wykonywano operacji zapisu;
- konfiguracja testów jest ładowana dynamicznie z Supabase, dlatego dokładne nazwy i liczba testów poza opisanymi w kodzie nie powinny być hardkodowane w makiecie bez fixture/config;
- dwa screenshoty Stitch (`profil_klienta_gawe_kot/screen.png` i `wizard_toe_touch_test_3_9/screen.png`) mają po 28 bajtów i są uszkodzone; ich `code.html` jest źródłem zastępczym.

## 2. Technologie i architektura frontendu

### Technologie

- Vanilla JavaScript ES modules.
- HTML5: `web/index.html` zawiera stały shell, topbar, kontener `#app`, toast i pustą warstwę modala.
- CSS bez frameworka w runtime: `web/design-system.css` oraz `web/styles.css`.
- Supabase JS `@supabase/supabase-js`: Auth, Postgres, Storage i RPC.
- `pdfmake` do tworzenia PDF w przeglądarce.
- `esbuild` w skrypcie budowania do przygotowania bundle’a webowego.
- Lokalne fonty TrueType: Inter i Outfit. W repozytorium jest także `web/assets/Manrope`-like kierunek obecny w starszym CSS, ale faktycznie dostępne lokalne fonty to Inter i Outfit.

### Entry pointy i budowanie

- `web/index.html` — dokument startowy.
- `web/app.js` — główna logika aplikacji, stan, renderowanie widoków, event delegation, routing hash/history.
- `web/core.js` — logika konfiguracji i obliczeń domenowych, walidacja klienta i odpowiedzi, hydratacja badań.
- `web/report-core.js` — model raportu, sekcje, profile raportów, findingi i dane do renderowania.
- `web/pdf-report.js` — definicje dokumentu PDF i karty wyników.
- `web/config.example.js` / generowane `config.js` — konfiguracja połączenia z Supabase.
- `tools/build-web.mjs` — proces budowy do `dist/web`.

`package.json` nie zawiera `react`, `react-dom`, Vite, Next.js ani biblioteki komponentów. React nie jest dostępny jako istniejący framework aplikacji.

### Model stanu

Globalny obiekt stanu w `web/app.js` przechowuje m.in. użytkownika, profil trenera, konfigurację, klientów, aktualny profil, aktualne badanie, raport, identyfikator badania, flagę zajętości i bieżącą trasę. Widoki są przełączane przez zastępowanie `app.innerHTML`.

### Dostęp do danych

Po uruchomieniu aplikacja:

1. sprawdza sesję Supabase;
2. przy braku sesji pokazuje auth;
3. pobiera profil trenera i aktywne certyfikacje;
4. pobiera konfigurację protokołu: typy screeningu, testy, kolejność testów, zestawy odpowiedzi, pola, opcje, reguły i opisy;
5. pokazuje listę klientów.

Odpowiedzi nowego badania są tymczasowo zapisywane w `localStorage` pod kluczem zależnym od użytkownika i klienta. Kompletne badanie jest zapisywane przez RPC `save_assessment`; korekta istniejącego przez `update_assessment`.

## 3. Struktura aplikacji

### Najważniejsze katalogi i pliki

```text
web/
├── index.html
├── app.js
├── core.js
├── design-system.css
├── styles.css
├── report-core.js
├── pdf-report.js
└── assets/
    ├── Inter*.ttf
    ├── Outfit*.ttf
    ├── kb-logo.png
    └── toe-touch-instruction.jpg

Stitch/
├── Dla stitcha/
│   ├── design.md
│   ├── STITCH_AUDIT.md
│   ├── STITCH_PROMPT.md
│   └── STITCH_SCREENSHOTS.md
└── stitch_fms_quickscreen_design_system/
    ├── lista_klient_w/
    ├── profil_klienta_gawe_kot/
    ├── wizard_toe_touch_test_3_9/
    ├── wizard_shoulder_clearing_wzorzec_g_rny_test_5a_9/
    ├── podgl_d_raportu_pdf_gawe_kot/
    ├── wzornik_kolor_w_i_oznacze_style_guide/
    ├── studio_biomechanics/DESIGN.md
    └── logokb_png3.png/screen.png
```

### Widoki renderowane przez aplikację

W kodzie występują m.in. `renderAuth`, `showClients`, `showProfile`, `renderStitchProfile`, `renderReferenceProfile`, `renderAssessment`, `renderReferenceAssessment`, `openAssessment`, `showReport`, `showConfig`, `showUserProfile` i `showTeamAdmin`. Nazwy `Reference`/`Stitch` wskazują na warianty implementacyjne kierowane designem Stitch, a nie na osobny routing.

### Routing

Routing jest lekki i oparty na hash/history API:

- lista klientów: `#home` lub stan domyślny;
- profil klienta: `#profile` wraz z `clientId` w `history.state`;
- badanie: `#assessment/{clientId}`;
- konfiguracja: `#config`;
- panel zespołu i profil użytkownika mają ustawiany stan nawigacji (`team`, `profile-user`), ale nie mają osobnego rozbudowanego routera;
- raport jest otwierany z kontekstu profilu klienta i nie ma niezależnego deklaratywnego routera;
- `popstate` odtwarza klienta, krok badania, konfigurację albo listę klientów.

Nie znaleziono biblioteki routingowej ani deklaracji tras w osobnym pliku.

## 4. Mapa nawigacji

```text
Start
├── Brak sesji
│   ├── Logowanie
│   ├── Rejestracja
│   ├── Nie pamiętam hasła
│   └── Reset / ustawienie nowego hasła
│
└── Sesja trenera
    ├── Klienci (#home)
    │   ├── Wyszukiwanie
    │   ├── Sortowanie / filtr archiwalnych
    │   ├── Nowy klient (modal)
    │   └── Profil klienta (#profile)
    │       ├── Edytuj dane (modal)
    │       ├── Dodaj / edytuj dyscyplinę (modal)
    │       ├── Nowe badanie
    │       │   └── QuickScreen Wizard (#assessment/{clientId})
    │       │       ├── Meta: data i kontekst
    │       │       ├── Test 1–9
    │       │       │   ├── Instrukcja / grafika lub diagram zastępczy
    │       │       │   ├── Kryteria (bottom sheet / drawer)
    │       │       │   ├── Ocena 0–3, pass/fail lub status bólu
    │       │       │   ├── Lewa / prawa strona
    │       │       │   └── Notatka do testu
    │       │       ├── Wstecz / Dalej
    │       │       └── Zakończ badanie
    │       ├── Historia badań
    │       │   ├── Otwórz badanie
    │       │   ├── Koryguj badanie
    │       │   ├── Archiwizuj / przywróć badanie
    │       │   └── Pokaż archiwalne
    │       ├── Raport
    │       │   ├── Podgląd HTML
    │       │   ├── Dodaj opcjonalne sekcje
    │       │   ├── Drukuj
    │       │   ├── Pobierz PDF / zapisz snapshot
    │       │   ├── Przygotuj e-mail
    │       │   └── Historia wygenerowanych raportów
    │       └── Archiwizuj / przywróć klienta
    │
    ├── Badanie (topbar)
    │   └── Jeśli brak wybranego klienta: komunikat i powrót do Klientów
    ├── Raporty (topbar)
    │   └── Jeśli brak aktywnego profilu z kompletnym badaniem: komunikat
    ├── Konfiguracja (#config)
    │   ├── Reguły clearingu
    │   ├── Włącz / wyłącz regułę
    │   ├── Dodaj regułę (admin, modal)
    │   └── Katalog testów
    └── Konto trenera
        ├── Zmień hasło (modal)
        ├── Certyfikacje: dodaj / edytuj / usuń
        ├── Panel zespołu (admin)
        └── Wyloguj
```

## 5. Główne flow użytkownika

### 5.1 Wejście i uwierzytelnienie

Po wejściu aplikacja pokazuje loader „Przygotowuję aplikację…”, a następnie sprawdza sesję. Bez sesji renderowany jest ekran logowania z panelem marki KB Trener / Quick Screen, opisem prywatnej przestrzeni i formularzem e-mail + hasło.

- „Zaloguj się” → `signInWithPassword`; sukces prowadzi do listy klientów.
- „Załóż konto” → przełączenie formularza na rejestrację.
- Rejestracja → `signUp`; jeśli nie ma sesji, użytkownik dostaje komunikat o potwierdzeniu e-maila i wraca do logowania.
- „Nie pamiętam hasła” → natywny `prompt` na adres e-mail, wysłanie linku resetującego.
- Link resetujący / event `PASSWORD_RECOVERY` → formularz nowego hasła.
- Błąd → toast błędu; przy błędzie sesji następuje wylogowanie.

### 5.2 Lista klientów

Po zalogowaniu aplikacja pobiera klientów wraz z badaniami potrzebnymi do wyliczenia ostatniego wyniku. Użytkownik widzi nagłówek „Klienci”, przycisk „Dodaj”, wyszukiwarkę po imieniu, nazwisku lub e-mailu, informację o sortowaniu i przełącznik „Archiwalni”.

Każda karta klienta pokazuje inicjały, imię i nazwisko, e-mail, status „Nowy” lub „Brak badań”, ostatni wynik `/15` i datę ostatniego badania. W stopce karty jest szybka akcja „+ Test”.

- kliknięcie karty → profil klienta;
- „+ Test” → rozpoczęcie badania dla tego klienta;
- wpisywanie w wyszukiwarce → filtrowanie po krótkim opóźnieniu;
- „Archiwalni” → dołączenie klientów archiwalnych;
- pusty wynik → empty state „Brak klientów” z zachętą do dodania pierwszej osoby;
- błąd ładowania → ekran „Spróbuj ponownie” z akcją ponowienia.

### 5.3 Dodanie i edycja klienta

„Dodaj” otwiera modal „Nowy klient” z polami Imię, Nazwisko i E-mail. „Edytuj dane” na profilu otwiera ten sam modal w trybie edycji.

- „Anuluj” lub X → zamknięcie bez zapisu;
- „Zapisz klienta” → walidacja wymaganych pól i e-maila, następnie insert albo update;
- zapis → zamknięcie modala, toast i otwarcie profilu klienta;
- e-mail już używany → zapis jest możliwy, ale pojawia się ostrzeżenie w toast;
- błąd → formularz pozostaje otwarty, przycisk zostaje odblokowany, pojawia się toast.

### 5.4 Profil klienta

Profil pokazuje breadcrumb Klienci / klient, inicjały, dane kontaktowe i podstawową dyscyplinę. Główna karta podsumowania prezentuje ostatnie kompletne badanie: wynik łączny, status ryzyka, wyniki poszczególnych testów, wynik bazowy i końcowy, strony L/P, asymetrię oraz efekty reguł clearingu. Obok jest wykres trendu, który pojawia się sensownie dopiero od dwóch badań.

Niżej znajduje się historia badań w kartach. Każda pozycja ma datę, wynik `/15`, status i akcje Otwórz, Koryguj oraz Archiwizuj/Przywróć. Dostępny jest filtr badań archiwalnych.

Na profilu można także zarządzać dyscyplinami klienta. Formularz ma pola dyscyplina, poziom, klub/organizacja i checkbox „Dyscyplina główna”.

- „Nowe badanie” → wizard; jest wyłączone dla archiwalnego klienta;
- „Edytuj dane” → modal klienta;
- kliknięcie badania → szczegóły kompletnego badania;
- „Koryguj” → wizard z odpowiedziami, wymagający powodu korekty;
- „Raport PDF” → podgląd raportu dla ostatniego kompletnego badania;
- archiwizacja klienta → profil oznaczony jako archiwalny; możliwe przywrócenie;
- brak kompletnego badania → empty state i przycisk „Nowe badanie”.

### 5.5 Rozpoczęcie QuickScreen

`beginAssessment` buduje obiekt badania dla wybranego klienta, ustawia krok 0, dzisiejszą datę i pusty zestaw odpowiedzi. Przy nowym badaniu próbuje odtworzyć szkic z `localStorage`; przy korekcie pobiera notatki testowe z Supabase.

Wizard renderuje kontekst klienta, status „Szkic zapisany na tym urządzeniu” albo „Korekta niezapisana”, pasek/listę dziewięciu kroków, metadane badania i bieżący test.

### 5.6 Wykonywanie testu

Każdy krok zawiera nazwę testu, opis celu, grafikę instruktażową, jeśli istnieje, albo placeholder diagramu, akcję „Kryteria”, pola oceny i opcjonalną notatkę testową. Odpowiedzi są ładowane z dynamicznej konfiguracji.

Typowe zestawy odpowiedzi:

- skala numeryczna 0–3;
- pass/fail;
- status bólu / pozytywny-negatywny;
- inne opisowe statusy skonfigurowane w bazie.

Testy bilateralne renderują osobne sekcje „LEWA STRONA” i „PRAWA STRONA”. `shoulder_clearing` dodatkowo dzieli ocenę na „Wzorzec górny” i „Wzorzec dolny” dla każdej strony. W kodzie istnieje także relacja testu clearingu do testu nadrzędnego.

- wybór odpowiedzi → zaznaczenie przycisku, aktualizacja wyniku bieżącego testu i zapis szkicu;
- wpisanie notatki → zapis szkicu;
- zmiana daty/kontekstu → zapis szkicu;
- „Kryteria” → bottom sheet/drawer z procedurą i kryteriami punktacji;
- „Wstecz” → poprzedni test;
- „Dalej” → przejście dalej, tylko jeśli bieżący test jest kompletny;
- kliknięcie nazwanego kroku → skok do wybranego testu, z zapisaniem szkicu;
- zamknięcie badania → potwierdzenie; odpowiedzi pozostają tymczasowo w przeglądarce.

### 5.7 Zakończenie badania

„Zakończ badanie” sprawdza kompletność wszystkich testów, datę oraz — przy korekcie — wymagany powód korekty. Następnie wylicza wyniki bazowe, efekty reguł clearingu i wynik łączny. Nowe badanie trafia przez `save_assessment`, korekta przez `update_assessment`; notatki testowe są zapisane osobno.

- brak odpowiedzi → wizard przenosi użytkownika do pierwszego niekompletnego testu i pokazuje błąd;
- brak daty → toast z prośbą o wybór daty;
- brak powodu korekty → toast;
- sukces → usunięcie lokalnego draftu, toast „Badanie zapisane” lub „Korekta została zapisana” i powrót do profilu;
- błąd zapisu → przycisk zostaje odblokowany, toast błędu, stan badania pozostaje dostępny.

### 5.8 Szczegóły zapisanego badania

„Otwórz” pokazuje datę, wynik łączny, karty wyników testów, efekty clearingu, listę statusowych odpowiedzi i notatki do testów. Druga sekcja to „Dokumentacja badania”.

Dokumentacja pozwala wybrać rolę pliku („Zdjęcie testu” albo „Dokument ogólny”), przypisać zdjęcie do testu i dodać obraz/PDF do 20 MB. Zdjęcie testu wymaga wyboru testu i musi być obrazem.

- „Pobierz” → signed URL do prywatnego pliku;
- „Usuń” → potwierdzenie i usunięcie pliku oraz rekordu;
- upload → loader, zapis do Storage i tabeli attachments, następnie odświeżenie listy;
- brak załączników → tekstowy empty state.

### 5.9 Raport

Raport jest budowany z modelu `report-core.js` na podstawie ostatniego kompletnego badania, a nie szkicu. Podgląd HTML ma stałą strukturę: nagłówek/logo, metadane klienta i trenera, wynik łączny, czynniki ryzyka, legendę, metodologię, szczegółowe próby, priorytetowe obserwacje, historię, zalecenia, wersje i disclaimer.

Raport może używać profili `free_current_result`, `assessment_report` i `full_coaching_report`. Część sekcji może być dodana z poziomu podglądu, np. historia, opisy testów/kryteria i zalecenia trenera.

- „Drukuj” → `window.print()`;
- „Pobierz PDF” → wygenerowanie PDF przez pdfmake, zapis snapshotu i PDF w Supabase, a następnie lokalne pobranie;
- „E-mail” → wygenerowanie/pobranie PDF i otwarcie `mailto:`;
- raporty historyczne → lista niezmiennych snapshotów z datą, profilem i wersją generatora;
- brak danych opcjonalnych → sekcja nie powinna być renderowana albo pojawia się odpowiedni komunikat pustego stanu, zgodnie z logiką report-core.

Obowiązkowy disclaimer brzmi: „Raport opisuje zapisane wyniki screeningu i nie stanowi diagnozy ani zalecenia terapeutycznego.”

### 5.10 Konto trenera i administracja

Profil konta pokazuje nazwę/e-mail, rolę, zmianę hasła, wylogowanie i aktywne certyfikacje. Certyfikacja ma nazwę, organizację, numer, datę wydania i datę wygaśnięcia.

Administrator ma dodatkowo panel zespołu z przypisywaniem trenera do zawodnika oraz listą aktywnych przypisań, a także konfigurację protokołu z regułami clearingu i katalogiem testów. Reguły można aktywować/dezaktywować; administrator może dodać nową regułę przez modal. Dla nie-admina panel jest niedostępny i pojawia się błąd.

## 6. Katalog ekranów

### Screen 1 — Loading / inicjalizacja

**Route / wejście:** start aplikacji, `boot()`, każde żądanie wymagające pobrania danych.

**Cel:** poinformować użytkownika, że aplikacja sprawdza sesję lub ładuje dane.

**Co użytkownik widzi:** centralny spinner i komunikat zależny od operacji, np. „Przygotowuję aplikację…”, „Sprawdzam sesję…”, „Wczytuję klientów…”, „Wczytuję badanie…”.

**Akcje i przejścia:** brak akcji podczas zwykłego ładowania; po sukcesie przejście do właściwego widoku. Przy błędzie przejście do error state.

**Stany:** loading.

**Dane:** wyłącznie tekst statusu.

### Screen 2 — Logowanie

**Route / wejście:** brak sesji, stan domyślny auth.

**Cel:** uzyskać dostęp trenera.

**Co użytkownik widzi:** dwukolumnowy auth shell; panel marki „KB Trener / Quick Screen”, opis prywatnej przestrzeni, informację o Supabase Auth/RLS, formularz e-mail + hasło, przycisk „Zaloguj się”, linki „Załóż konto” i „Nie pamiętam hasła”.

**Akcje:** logowanie, przełączenie na rejestrację, rozpoczęcie resetu hasła.

**Stany:** pusty formularz, disabled submit podczas wysyłania, błąd w toast, stan braku potwierdzenia e-maila obsługiwany po rejestracji.

**Dane:** e-mail, hasło.

### Screen 3 — Rejestracja

**Route / wejście:** klik „Załóż konto” z logowania.

**Cel:** utworzyć konto trenera.

**Co użytkownik widzi:** ten sam shell auth, pola e-mail i hasło, przycisk „Załóż konto”, link powrotu do logowania.

**Akcje:** submit, powrót do logowania.

**Stany:** wysyłanie, błąd, oczekiwanie na potwierdzenie e-maila.

### Screen 4 — Ustawienie nowego hasła

**Route / wejście:** event `PASSWORD_RECOVERY`.

**Cel:** ustawić hasło po linku resetującym.

**Co użytkownik widzi:** formularz nowe hasło i przycisk „Zapisz hasło”.

**Akcje:** zapis nowego hasła.

**Stany:** wymagane minimum sześciu znaków, błąd, sukces i powrót do aplikacji.

### Screen 5 — Lista klientów

**Route / wejście:** po zalogowaniu, `#home`, topbar „Klienci”.

**Cel:** znaleźć klienta albo rozpocząć pracę z nową osobą.

**Co użytkownik widzi:** topbar z marką, nawigacją Klienci/Badanie/Raporty/Konfiguracja i kontem; nagłówek „Klienci”; przycisk „Dodaj”; search; sortowanie „Ostatnie badanie”; checkbox „Archiwalni”; listę kart klientów; komunikat synchronizacji lokalnej.

**Akcje:** wyszukiwanie, filtr archiwalnych, sortowanie UI, otwarcie profilu, szybkie rozpoczęcie testu, dodanie klienta.

**Stany:** loading, populated, empty, archived, filtered, error/retry.

**Dane:** imię/nazwisko, e-mail, inicjały, status nowego klienta, ostatnia data i wynik `/15`.

### Screen 6 — Modal nowego/edytowanego klienta

**Route / wejście:** przycisk „Dodaj” albo „Edytuj dane”.

**Cel:** utworzyć lub zmienić dane klienta.

**Co użytkownik widzi:** modal z nagłówkiem „Nowy klient” albo „Edytuj klienta”, pola Imię, Nazwisko, E-mail, przyciski Anuluj/Zapisz i X.

**Akcje:** edycja, anulowanie, zapis.

**Stany:** create/edit, validation, saving, error.

**Dane:** first name, last name, e-mail.

### Screen 7 — Profil klienta / dashboard wyniku

**Route / wejście:** klik klienta, `#profile` z clientId.

**Cel:** zobaczyć bieżący stan klienta i zarządzać badaniami.

**Co użytkownik widzi:** breadcrumb; nagłówek klienta z awatarem, e-mailem i dyscypliną; akcje Edytuj dane i Nowe badanie; ostatni wynik; lista wyników testów; status ryzyka; wykres trendu; historia badań; filtr archiwalnych; Raport PDF; akcje historii.

**Akcje:** rozpoczęcie, korekta, otwarcie, archiwizacja/przywrócenie, raport, edycja klienta, dyscypliny.

**Stany:** brak kompletnego badania, kompletne badanie, archiwalny klient, jedna lub wiele prób, brak historii trendu, loading/error.

**Dane:** klient, dyscypliny, wyniki bazowe/końcowe, L/P, asymetrie, efekty clearingu, daty i statusy badań.

### Screen 8 — Modal dyscypliny klienta

**Route / wejście:** akcje dyscyplin na profilu.

**Cel:** dodać albo edytować kontekst sportowy klienta.

**Co użytkownik widzi:** pola Dyscyplina, Poziom, Klub/organizacja, checkbox Dyscyplina główna, przyciski Anuluj/Zapisz.

**Stany:** create/edit, saving, error.

### Screen 9 — QuickScreen wizard: kontekst i postęp

**Route / wejście:** Nowe badanie albo Koryguj, `#assessment/{clientId}`.

**Cel:** przeprowadzić trenera przez dziewięć testów.

**Co użytkownik widzi:** klienta, status szkicu/korekty, zamknięcie badania, listę nazwanych kroków 1–9, aktywny test, procent/postęp, a na pierwszym kroku datę badania i opcjonalny kontekst.

**Akcje:** wybór kroku, zmiana daty/kontekstu, zamknięcie.

**Stany:** current/done/incomplete/pending, draft saved, correction unsaved.

### Screen 10 — QuickScreen wizard: pojedynczy test

**Route / wejście:** krok 1–9 w wizardzie.

**Cel:** pokazać instrukcję i zebrać ocenę bieżącego testu.

**Co użytkownik widzi:** numer i nazwę testu, opis, grafikę albo diagram zastępczy, przycisk Kryteria, obszar odpowiedzi, wynik bieżącej próby, notatkę do testu i sticky action bar.

**Akcje:** odpowiedź, Kryteria, notatka, Wstecz, Dalej, Zakończ.

**Stany:** nieuzupełniony, częściowo uzupełniony, zaznaczony, wynik 0/1/2/3, pass/fail, ból, asymetria, disabled Wstecz na pierwszym kroku.

**Dane:** opis/purpose/procedure, kryteria, pola, opcje odpowiedzi, strona, notatka.

### Screen 11 — QuickScreen: Shoulder Clearing

**Route / wejście:** krok testu `shoulder_clearing`.

**Cel:** ocenić clearing górny i dolny dla lewej i prawej strony.

**Co użytkownik widzi:** dwie sekcje stron, w każdej „Wzorzec górny” i „Wzorzec dolny”, status zależności od testu nadrzędnego oraz ostrzeżenie o bólu/automatycznym zerowaniu powiązanego wzorca zgodnie z konfiguracją.

**Akcje/stany:** jak w pojedynczym teście, z niezależnym zaznaczeniem L/P i pól górny/dolny.

### Screen 12 — Drawer/bottom sheet kryteriów

**Route / wejście:** przycisk Kryteria.

**Cel:** udostępnić procedurę i kryteria oceny bez obciążania głównego widoku.

**Co użytkownik widzi:** overlay, panel od dołu, uchwyt, nagłówek „Kryteria: [test]”, tekst procedury i punktacji, przycisk „Rozumiem, wróć do oceny”.

**Akcje:** zamknięcie X, zamknięcie przyciskiem.

**Stany:** hidden/open, scrollable przy dłuższej treści.

### Screen 13 — Szczegóły kompletnego badania

**Route / wejście:** Otwórz z historii profilu.

**Cel:** przejrzeć zapisane odpowiedzi i dokumentację.

**Co użytkownik widzi:** powrót do profilu, datę, wynik `/15`, karty testów, efekty reguł, statusy odpowiedzi, notatki testowe, obszar uploadu dokumentacji, listę załączników.

**Akcje:** korekta z profilu, upload pliku, pobranie, usunięcie załącznika, powrót.

**Stany:** brak załączników, upload, error, załączniki istnieją, plik zdjęcie/dokument.

### Screen 14 — Podgląd raportu

**Route / wejście:** Raport PDF z profilu.

**Cel:** przejrzeć raport, dobrać sekcje i przygotować dokument.

**Co użytkownik widzi:** pasek akcji, dokument z okładką, logo, dane klienta/trenera, wynik łączny, ryzyka, legendę, metodologię, listę testów, priorytetowe obserwacje, historię, zalecenia, wersje, podpis i disclaimer.

**Akcje:** druk, pobranie PDF, e-mail, dodanie sekcji, powrót do profilu, pobieranie historii raportów.

**Stany:** sekcje obecne/nieobecne, brak historii przy jednym badaniu, puste zalecenia/załączniki, desktop/mobile, print.

### Screen 15 — Profil użytkownika trenera

**Route / wejście:** avatar/topbar, `profile-user`.

**Cel:** zarządzać kontem i certyfikacjami.

**Co użytkownik widzi:** konto, e-mail, rola, przyciski zmiany hasła, zespołu dla admina i wylogowania, listę certyfikacji.

**Akcje:** zmiana hasła, dodanie/edycja/usunięcie certyfikacji, panel zespołu, wylogowanie.

**Stany:** lista pusta, certyfikacje istnieją, admin/non-admin.

### Screen 16 — Modal certyfikacji i modal hasła

**Route / wejście:** profil trenera.

**Cel:** zmienić hasło albo zapisać certyfikację.

**Dane:** hasło; dla certyfikacji nazwa, issuer, numer, daty wydania/wygaśnięcia.

### Screen 17 — Panel zespołu administratora

**Route / wejście:** profil trenera → Zespół.

**Cel:** przypisywać trenerów współpracujących do zawodników.

**Co użytkownik widzi:** nagłówek „Trenerzy i zawodnicy”, dwa selecty Zawodnik/Trener, przycisk „Przypisz trenera” i listę przypisań z akcją Usuń.

**Akcje:** przypisanie, usunięcie przypisania.

**Stany:** lista pusta, przypisania istnieją, tylko admin, błąd uprawnień.

### Screen 18 — Konfiguracja protokołu

**Route / wejście:** topbar Konfiguracja, `#config`.

**Cel:** zarządzać katalogiem testów i regułami clearingu.

**Co użytkownik widzi:** nagłówek, sekcję „Reguły clearing” z liczbą reguł, listę reguł ze źródłem, celem i wartością, stan Aktywna/Wyłączona, a także „Katalog testów” z nazwą, kryteriami i źródłem.

**Akcje:** włączenie/wyłączenie reguły; admin może dodać regułę.

**Stany:** aktywna/wyłączona, disabled dla nie-admina, błąd ładowania.

### Screen 19 — Modal nowej reguły clearingu

**Route / wejście:** Dodaj regułę, tylko admin.

**Cel:** skonfigurować efekt zależny od odpowiedzi.

**Dane:** pole źródłowe, odpowiedź wyzwalająca, warunek strony, test docelowy, wynik końcowy 0–3, przyczyna.

**Akcje:** utworzenie, zamknięcie.

## 7. Komponenty wspólne

### Shell i nawigacja

- **Topbar:** sticky, logo KB, QuickScreen, status „Zapisano lokalnie”, nawigacja Klienci/Badanie/Raporty/Konfiguracja, ikona synchronizacji i avatar.
- **Brand button:** powrót do listy klientów.
- **Top navigation:** aktywna pozycja przez `is-active`; na mobile CSS pokazuje ikony/emoji i etykiety w dolnym stylu.
- **App switcher:** koncept obecny w Stitch (`QuickScreen` z dropdownem oraz moduły FMS/SFMA/QuickScreen), ale działającego przełącznika modułów w produkcyjnym JS nie znaleziono.
- **Breadcrumb:** profil i raport; prosty tekstowy ciąg „Klienci / klient / …”.
- **Sticky action bar:** wizard, Wstecz/Dalej/Zakończ zawsze przy dolnej krawędzi; na mobile uwzględnia bottom navigation/safe area.

### Primitives

- `btn`, `btn-primary`, `btn-dark`, `btn-quiet`, `btn-danger`;
- `icon-btn`;
- `field`, `search`, `check`;
- `panel`, `setup-card`, `test-card`;
- `status-badge`, `score-pill`, `initials`;
- `toast` i `modal-layer`;
- `loading-state`, `loader`, `empty-state`.

### FMS-specific

- `result-chip` / karta wyniku testu;
- `status-list`;
- `wizard-progress-card` i nazwane kroki testów;
- `wizard-test-card`;
- `answer-group`, `answer-options`, `answer-btn`;
- `side-panel`, `side-heading`, `side-letter`;
- `clearing-pattern`, `clearing-sides`;
- `criteria-sheet` / bottom sheet;
- `wizard-result`;
- `assessment-nav`;
- `effect-note` dla automatycznych efektów clearingu;
- `chart` SVG dla historii.

### Raportowe

- `report-document`, `report-cover`, `report-meta`;
- `report-summary`, risk cards i legenda;
- `report-test-card` z opcjonalnym zdjęciem;
- `report-section`, `report-section-title`;
- `matrix` dla historii;
- `methodology-card`, podpis i disclaimer;
- `drop-zone`, `attachment-row`.

### Warianty/stany wspólne

- statusy wyników: pass, attention/fail, pain/red flag, info/draft;
- `selected` vs unselected odpowiedzi;
- active/inactive reguła;
- archived vs active;
- loading, empty, error, retry;
- create vs edit modal;
- complete vs incomplete test;
- draft vs saved/correction;
- disabled action dla braku uprawnień lub pierwszego kroku.

## 8. Obecny design system

### System kanoniczny Stitch / design.md

Dokument `Stitch/Dla stitcha/design.md` i `Stitch/stitch_fms_quickscreen_design_system/studio_biomechanics/DESIGN.md` określają aktualny kierunek docelowy.

**Kolory:**

| Token | Wartość | Zastosowanie |
|---|---:|---|
| Primary / deep slate | `#0F172A` | topbar, mocne buttony, tekst, nagłówki |
| Primary accent | `#1E293B` / `#334155` | struktura i aktywne elementy |
| Teal / secondary | `#0D9488` | CTA, aktywność, postęp, focus |
| Surface base | `#F8FAFC` | tło aplikacji |
| Surface card | `#FFFFFF` | karty i formularze |
| Surface muted | `#F1F5F9` | hover, pola, tła pomocnicze |
| Border subtle | `#E2E8F0` | domyślne obramowanie |
| Border strong | `#CBD5E1` | mocniejsze obramowanie |
| Pass | `#059669` / `#ECFDF5` | wynik 2–3, brak bólu |
| Attention/fail | `#D97706` / `#FFFBEB` | wynik 1, asymetria, uwaga |
| Pain | `#E11D48` / `#FFF1F2` | wynik 0, ból, red flag |
| Info/draft | `#0284C7` | szkic, synchronizacja, informacja |

W starszym `web/styles.css` istnieje dodatkowo paleta `#142D37`, koral `#EF604E`, mięta i papierowe tło. To jest odrębny, mniej zgodny z kanonicznym Stitch kierunek.

### Typografia

- Outfit dla nagłówków, zwykle 600–700;
- Inter dla body, etykiet, liczb i tabel;
- H1/display około 28–32 px w kanonicznym systemie;
- H2 około 20–22 px;
- body desktop 14–16 px, body mobile minimum 16 px jako zalecenie design.md;
- liczby wyników Inter z tabular figures, pogrubione;
- starszy CSS zawiera reguły dla `h1` do 40 px i bazę Inter, ale część starszego layoutu odwołuje się do `Manrope` i `Fraunces`, których nie ma jako lokalnie zadeklarowanych fontów.

### Radius, spacing, cienie

- radius: 8 px small, 12 px medium, 16 px large, 24 px dla arkuszy/modali; pełne pill 9999 px;
- spacing: 4/8/12/16/24/32 px;
- gutter mobile 16 px, desktop 24 px;
- karta zwykle padding 16–24 px;
- minimalny touch target 48 × 48 px;
- cień subtelny kart około `0 4px 20px rgba(15,23,42,.045)` i raised około `0 18px 50px rgba(15,23,42,.09)`;
- focus ring teal.

### Layout i responsywność

- desktop: kontrolowany max width około 1200 px;
- profil Stitch: około 1120 px;
- wizard: około 680 px;
- raport: około 960 px w dokumencie, shell około 1060 px;
- mobile 360–430 px: gutter 16 px, jedna kolumna, bottom navigation, sticky action bar;
- tablet: 1–2 kolumny zależnie od widoku;
- desktop: pełny topbar, szersze karty i tabele;
- CSS ma breakpointy około 880, 800, 700, 620 i 420 px;
- print: ukrywa topbar, akcje i buttony, ustawia A4 i usuwa cienie/ramy dokumentu.

### Ikony i assets

Produkcja nie ma zainstalowanej biblioteki ikon. W `index.html` i JS występują znaki Unicode/emoji używane jako ikony. Stitch HTML używa `Material Symbols Outlined` z Google Fonts i Tailwind CDN, ale są to zewnętrzne referencje projektowe, nie biblioteka produkcyjna. Dostępne lokalnie są `kb-logo.png`, `toe-touch-instruction.jpg`, Inter i Outfit. `DESIGN.md` wspomina `web/assets/fms-logo.svg`, ale w aktualnym listing repozytorium nie znaleziono tego pliku; używany kod odwołuje się do `kb-logo.png`.

## 9. Analiza materiałów Stitch

### Zidentyfikowane materiały

1. `lista_klient_w` — lista klientów w wariancie mobile/portalowym.
2. `profil_klienta_gawe_kot` — karta klienta z przykładowym klientem „Gaweł Kot”; screenshot jest uszkodzony, ale HTML pokazuje układ profilu.
3. `wizard_toe_touch_test_3_9` — wizard testu Toe Touch; screenshot uszkodzony, HTML jest źródłem zastępczym.
4. `wizard_shoulder_clearing_wzorzec_g_rny_test_5a_9` — wizard Shoulder Clearing, w tym wzorzec górny.
5. `podgl_d_raportu_pdf_gawe_kot` — raport HTML/A4 dla klienta; pełny screenshot istnieje.
6. `wzornik_kolor_w_i_oznacze_style_guide` — style guide z paletą, statusami i komponentami; pełny screenshot istnieje.
7. `studio_biomechanics/DESIGN.md` — opis wersji design systemu.
8. `Dla stitcha/design.md` — nadrzędny lokalny system projektowania.
9. `STITCH_PROMPT.md`, `STITCH_AUDIT.md`, `STITCH_SCREENSHOTS.md` — instrukcje i audyt materiałów.
10. `logokb_png3.png/screen.png` — osobny screenshot logo; obecny kod produkcyjny używa lokalnego `web/assets/kb-logo.png`.

### Co Stitch pokazuje

**Lista klientów:** jasne tło, topbar z logo i QuickScreen, status synchronizacji, ikona chmury, avatar, duży przycisk dodawania, wyszukiwarka z filtrem, sortowanie, karty klientów i szybki „Test”. Layout jest mobile-first, z touch targetami i dolną nawigacją.

**Profil klienta:** nagłówek klienta z inicjałami, e-mailem i dyscypliną; CTA „Edytuj dane” i „Nowe badanie”; karta wyniku łącznego z listą testów; panel trendu; karty historii badań. To jest bliskie `renderStitchProfile` w obecnym JS.

**Wizard:** kontekst klienta, status lokalnego szkicu, nazwany postęp „Test n z 9”, aktywny test, opis, grafika, kryteria jako bottom sheet, osobne oceny L/P, wynik bieżącej próby, notatka i sticky bar.

**Shoulder Clearing:** wyraźne grupowanie wzorca górnego i dolnego oraz rozdzielenie stron. To rozwiązanie jest spójne z obecnym `testFieldsMarkup`.

**Raport:** układ dokumentu A4 z nagłówkiem marki, danymi trenera/klienta, podsumowaniem i czynnikami ryzyka, szczegółami testów, historią, rekomendacjami, metodologią, podpisem i disclaimerem.

**Style guide:** wspólne tokeny, statusy, typografia, touch targets, breakpointy i zasady dostępności. Design explicitly odrzuca primary `#000000`, znaczenie przekazywane wyłącznie kolorem, anonimowe kropki postępu, poziome przewijanie formularzy mobile oraz puste sekcje raportu.

### Wersje i różnice wewnątrz Stitch

Najbardziej widoczna jest różnica między starszymi, bardziej ekspresyjnymi materiałami `code.html` a kanonicznym `design.md`. Część HTML Stitch używa `primary: #000000`, `Manrope`, `Fraunces`, koralowego akcentu i papierowego tła. Późniejszy „Studio Biomechanics” używa deep slate `#0F172A`, teal `#0D9488`, Outfit + Inter, jasnych powierzchni i semantycznych statusów. `Dla stitcha/design.md` wskazuje, że ten drugi kierunek jest nadrzędny.

## 10. Różnice: Stitch vs obecna implementacja

### Już wdrożone albo bardzo bliskie

- lista klientów, wyszukiwarka, archiwalne profile i szybki Test;
- profil klienta z wynikiem, trendem, historią i kartami statusów;
- dziewięciokrokowy wizard z nazwanymi testami, postępem i sticky navigation;
- testy bilateralne z Lewą/Prawą stroną;
- Shoulder Clearing z podziałem górny/dolny;
- drawer/bottom sheet kryteriów;
- statusy pass/attention/pain/info;
- raport HTML/PDF z sekcjami i disclaimerem;
- lokalne fonty Inter/Outfit i większość tokenów kanonicznego systemu;
- responsywne breakpointy i tryb druku A4.

### Częściowo wdrożone albo różniące się

- produkcja używa lokalnego PNG logo, podczas gdy część materiałów Stitch używa zewnętrznych URL `googleusercontent.com`; lokalny asset jest bezpieczniejszy i zgodny z instrukcją projektową;
- produkcyjny topbar ma tekstowe znaki/emoji zamiast Material Symbols;
- Stitch sugeruje działający app switcher modułów, ale produkcja ma głównie statyczny brand „QuickScreen”;
- w Stitch lista klientów ma bardziej rozbudowane filtrowanie i mobile bottom navigation; implementacja ma wyszukiwarkę, prosty checkbox i klasyczny topbar;
- raport Stitch ma bogatszy układ redakcyjny i wariant A4, podczas gdy implementacja ma również dodatkowe elementy techniczne (profile raportów, snapshoty i sekcje dynamiczne), które nie muszą być wszystkie widoczne w jednym mockupie;
- Stitch design wymaga minimum 16 px body mobile, podczas gdy część produkcyjnych captionów i pól ma 11–14 px;
- starsza warstwa `web/styles.css` ma koral/papier/Manrope/Fraunces i inne promienie, co tworzy wizualny rozjazd z `design-system.css`;
- część wariantów CSS występuje równolegle: ogólny `.profile-*`/`.assessment-*` oraz nowszy `.stitch-*`/`.wizard-*`;
- produkcyjny kod ma rozbudowane funkcje administracyjne i załączniki, których Stitch nie pokazuje na referencyjnych ekranach;
- nie wszystkie testy mają lokalny obraz instruktażowy; wtedy pojawia się diagram zastępczy.

### Najbardziej spójne rozwiązania Stitch

1. named progress z nazwami testów zamiast samych kropek;
2. jedna wspólna paleta statusów z ikoną, tekstem i kolorem;
3. wyraźny podział L/P;
4. kryteria schowane w drawerze/bottom sheet;
5. sticky action bar pod kciukiem;
6. profil klienta łączący wynik bieżący, trend i historię;
7. spokojny, jasny język „Studio Biomechanics”;
8. raport jako kontrolowany dokument A4, nie zwykła długa strona;
9. wspólne tokeny między aplikacją, raportem i modułami FMS.

## 11. Problemy UI

Poniższe punkty są obserwacjami audytowymi, nie zmianami w kodzie.

- W aplikacji współistnieją dwa style: kanoniczny slate/teal oraz starszy koral/papier. Użytkownik może odczuć zmianę produktu między ekranami.
- Występują równoległe klasy i warianty renderowania profilu oraz wizarda, co utrudnia ustalenie jednego źródła prawdy dla UI.
- Ikony są realizowane znakami Unicode/emoji, a nie spójnym zestawem ikon; część znaków w odczycie plików jest ponadto widoczna jako problemy kodowania znaków.
- Część tekstów i etykiet jest bardzo mała, szczególnie captiony, opisy statusów i dane pomocnicze.
- Karty historii i wyniku zawierają dużo informacji w małych blokach, przez co hierarchia może być mniej czytelna podczas pracy w ruchu.
- Topbar desktopowy i mobilny próbuje pomieścić wiele funkcji naraz: brand, moduł, synchronizację, nawigację i konto.
- W niektórych miejscach używany jest natywny `prompt`/`confirm`, co wizualnie odstaje od własnych modalów i bottom sheetów.
- Brakuje wyraźnego, niezależnego UI dla sukcesu zapisu poza toastem i zmianą widoku.
- Wymagania design.md mówią o lokalnym `fms-logo.svg`, ale pliku nie znaleziono; implementacja korzysta z `kb-logo.png`.
- Nie znaleziono działającej biblioteki ikon ani biblioteki komponentów; powtarzalne primitive są ręcznie stylowane.

## 12. Problemy UX

- Rozpoczęcie badania z globalnego topbara bez wybranego klienta kończy się komunikatem i powrotem do listy; lepszy przyszły prototyp powinien wyraźnie wymagać wyboru klienta przed wejściem w wizard.
- Użytkownik może kliknąć nazwany krok wizarda, nawet jeśli wcześniejszy krok nie jest kompletny. To daje elastyczność, ale może osłabiać poczucie kolejności badania.
- Walidacja kompletności następuje dopiero przy „Dalej”/„Zakończ”, więc brakujące odpowiedzi mogą nie być widoczne wystarczająco wcześnie.
- W testach bilateralnych trzeba jednocześnie śledzić stronę, pole i opcję; błędne przypisanie L/P jest realnym ryzykiem ergonomii.
- Korekta wymaga powodu, ale pole jest widoczne tylko na pierwszym kroku. Przy długim badaniu może być łatwo przeoczone.
- Zamknięcie nowego badania zachowuje draft w localStorage, ale komunikat o tym jest drugorzędny i może nie wyjaśniać, jak wrócić do szkicu.
- Archiwizacja badań/klientów i usuwanie załączników są ważnymi akcjami, ale archiwalność bywa komunikowana głównie przez zmniejszoną opacity.
- Raport ma wiele możliwych profili i sekcji, ale zasada wyboru profilu może być mało oczywista z samego flow UI.
- Historia trendu nie ma wartości przy jednym badaniu; użytkownik musi rozumieć, dlaczego wykres jest pusty.
- Obsługa załączników wymaga kilku selekcji przed uploadem; szczególnie rola zdjęcia i przypisanie do testu powinny być bardzo jednoznaczne.
- Natywny e-mail przez `mailto:` nie daje gwarancji, że wiadomość zostanie faktycznie wysłana ani że PDF będzie załączony; jest to przygotowanie procesu, nie pełna wysyłka.
- Nie udało się jednoznacznie ustalić na podstawie repozytorium, czy wszystkie przewidziane role trenera i uprawnienia są dostępne jako osobne ekrany użytkowe poza rolą admin/non-admin.

## 13. Problemy spójności wizualnej

- `web/styles.css` i `web/design-system.css` definiują odmienne tokeny kolorystyczne, fontowe i przestrzenne.
- Jedna warstwa używa `#0F172A` + teal, druga `#142D37` + coral; jeden produkt może przez to wyglądać jak dwa różne prototypy.
- Karty mają radius 10/12/14/16/21/24 px zależnie od warstwy.
- Buttony mają różne wysokości, typografie i poziomy cienia.
- W kodzie obok Inter/Outfit pojawiają się odwołania do Manrope/Fraunces; brak spójnej gwarancji font fallbacków.
- Status `fail` i `attention` są semantycznie bliskie, ale w różnych fragmentach mogą być komunikowane inną nazwą.
- Logo jest kadrowane przez viewport CSS w kilku miejscach, co może prowadzić do różnic skali i proporcji.
- Materiały Stitch używają Material Symbols, a aplikacja znaków tekstowych; brak wspólnego języka ikon.
- Występują warianty profilu z różnymi klasami i strukturą (`profile-*`, `stitch-*`), co może utrudniać utrzymanie jednolitego układu.

## 14. Ekrany wymagane w przyszłej makiecie

### MUST HAVE

1. Logowanie.
2. Lista klientów — populated.
3. Lista klientów — empty/search/archived variant.
4. Modal nowego klienta.
5. Profil klienta bez badania.
6. Profil klienta z ostatnim wynikiem, trendem i historią.
7. Wizard — pierwszy krok z metadanymi.
8. Wizard — zwykły test bilateralny z Lewą/Prawą stroną i wynikiem 0–3.
9. Wizard — Shoulder Clearing z podziałem górny/dolny.
10. Drawer/bottom sheet kryteriów.
11. Wizard — stan częściowo uzupełniony / ukończony krok.
12. Profil po zakończeniu badania z wynikiem.
13. Szczegóły zapisanego badania.
14. Podgląd raportu z podsumowaniem i listą testów.
15. Mapa nawigacji/prototypowe przejście między klientem, badaniem i raportem.

### SHOULD HAVE

1. Korekta zapisanego badania z polem powodu korekty.
2. Profil klienta z wieloma badaniami i trendem.
3. Historia badań z archiwalnym rekordem.
4. Raport z dodatkowymi sekcjami: historia, kryteria, zalecenia.
5. Panel dokumentacji badania z załącznikami.
6. Profil trenera z certyfikacjami.
7. Modal zmiany hasła.
8. Konfiguracja reguł clearingu i katalog testów.
9. Panel zespołu administratora.
10. Loading, error/retry i success/toast states.
11. Desktop 1440, tablet 1024 i mobile 390 warianty kluczowych ekranów.

### OPTIONAL

1. Rejestracja i reset hasła.
2. Modal nowej reguły clearingu.
3. Zarządzanie dyscyplinami klienta.
4. Historia wygenerowanych snapshotów raportów.
5. Pobieranie/usuwanie załącznika.
6. Print/A4 variant.
7. Rzadkie stany uprawnień admin/non-admin.
8. Brakujące grafiki testów zastąpione placeholderami.

## 15. Proponowany katalog komponentów przyszłej makiety

```text
AppShell
TopBar
BrandBlock
ModuleSwitcher
SyncStatus
TrainerMenu
DesktopNav
MobileBottomNav
Breadcrumbs
PageHeader
EmptyState
LoadingState
ErrorState
Toast

ClientListPage
ClientToolbar
ClientSearch
ClientFilter
ClientSort
ClientCard
ClientScorePill
ClientStatusBadge
ClientFormModal

ClientProfilePage
ClientHeader
ClientActions
LatestAssessmentCard
TotalScore
RiskStatus
TestScoreList
TestScoreRow
TrendChart
AssessmentHistory
AssessmentHistoryCard
ArchiveToggle
DisciplineList
DisciplineFormModal

AssessmentWizard
WizardContextBar
WizardProgress
WizardStepList
AssessmentMetaForm
TestInstructionCard
InstructionMedia
TestDescription
CriteriaTrigger
CriteriaBottomSheet
AssessmentScoreArea
SideSelector
BilateralScoreGroup
ClearingPatternGroup
ScoreSelector
PassFailSelector
PainStatusSelector
TestResultSummary
TestNoteField
WizardActionBar
CorrectionNoteField

AssessmentDetailsPage
AssessmentSummary
ResultChipGrid
EffectNote
StatusAnswerList
TestNotesList
AttachmentPanel
AttachmentUpload
AttachmentRow

ReportPreviewPage
ReportToolbar
ReportDocument
ReportCover
ReportClientMeta
ReportExecutiveSummary
RiskCards
ReportLegend
ReportTestList
ReportTestCard
PriorityFindings
ReportHistoryMatrix
Recommendations
MethodologyBlock
TrainerSignature
ReportDisclaimer
ReportSectionPicker

TrainerProfilePage
CertificationList
CertificationFormModal
PasswordFormModal
TeamAdminPage
AssignmentForm
AssignmentRow
ConfigurationPage
ClearingRuleList
ClearingRuleRow
ClearingRuleFormModal
TestCatalog

StatusToken
Button
IconButton
Input
Select
Textarea
Modal
BottomSheet
Card
Badge
ConfirmDialog
FocusRing
```

## 16. Elementy wymagające szczególnej uwagi podczas redesignu

- Rozdzielić wizualnie dane kliniczno-screeningowe od błędów technicznych; „ból” jest wynikiem FMS, nie komunikatem systemowym.
- Zawsze pokazywać stronę pełną nazwą „Lewa strona” / „Prawa strona”; litery L/P mogą być dodatkowym skrótem, nie jedynym oznaczeniem.
- Odpowiedzi muszą mieć co najmniej 48 × 48 px, tekst/ikonę i stan selected, a nie tylko kolor.
- Wizard powinien stale pokazywać, gdzie użytkownik jest w dziewięciu testach i które testy są kompletne.
- Kryteria powinny być dostępne jednym kliknięciem, ale domyślnie schowane.
- Sticky navigation musi być dostępna jedną ręką na mobile i nie może zasłaniać notatek ani pól.
- Stan draftu powinien być wyraźny: zapis lokalny nie jest tym samym co zapis kompletnego badania w chmurze.
- Korekta musi jasno różnić się od nowego badania i wymagać widocznego powodu.
- Wynik łączny należy pokazać razem z `/15`, statusem słownym i legendą skali.
- Asymetria i efekty clearingu powinny być widoczne w miejscu wyniku, którego dotyczą, a nie tylko w długim tekście.
- Pusty trend przy jednym badaniu powinien mieć wyjaśnienie, nie być tylko pustym obszarem.
- Archiwalne rekordy wymagają etykiety tekstowej i akcji odwracalnej, nie samej przezroczystości.
- Raport musi zachować nadrzędny model sekcji, snapshot i disclaimer; makieta może być statyczna, ale powinna pokazywać logikę dokumentu.
- Logo i ikony powinny korzystać z lokalnych, stabilnych assetów; nie kopiować wygasających URL z HTML Stitch.
- Nowa makieta powinna jasno oddzielić funkcjonalny zakres aplikacji od opcjonalnych obszarów administracyjnych.

## 17. Otwarte pytania / rzeczy, których nie dało się jednoznacznie ustalić

- Nie udało się jednoznacznie ustalić na podstawie repozytorium, jakie dokładnie 9 aktywnych testów zwróci produkcyjna konfiguracja Supabase w każdym środowisku. Kod zakłada dziewięć kroków, ale szczegółowa lista jest dynamiczna.
- Nie udało się jednoznacznie ustalić na podstawie repozytorium, czy wszystkie ekrany `renderReferenceProfile` i `renderStitchProfile` są wybierane przez aktualną flagę/konfigurację, czy część pozostaje historycznym wariantem implementacji.
- Nie udało się jednoznacznie ustalić na podstawie repozytorium, czy topbarowy „Raporty” ma być globalną listą raportów, ponieważ obecnie bez aktywnego profilu pokazuje komunikat i nie otwiera osobnego katalogu.
- Nie udało się jednoznacznie ustalić na podstawie repozytorium, czy sortowanie listy klientów ma więcej działających wariantów; UI pokazuje akcję „Zmień”, ale logika sortowania w analizowanym kodzie pozostaje ustawiona na ostatnie badanie.
- Nie udało się jednoznacznie ustalić na podstawie repozytorium, jakie dokładnie dane są dostępne w każdym wariancie raportu dla każdego użytkownika, ponieważ część zależy od rekordów i usług Supabase.
- Nie udało się jednoznacznie ustalić na podstawie repozytorium, czy `fms-logo.svg` istnieje poza listowanymi plikami; w analizowanym katalogu dostępny jest `web/assets/kb-logo.png`.
- Dwa screenshoty Stitch są uszkodzone i mają po 28 bajtów. Nie można wiarygodnie opisać ich warstwy wizualnej na podstawie obrazu; użyto ich `code.html` jako źródła zastępczego.
- Nie udało się jednoznacznie ustalić na podstawie repozytorium, czy na produkcji aktywne są wszystkie operacje administracyjne dotyczące usług raportowych i zaleceń, choć odpowiednie funkcje/formularze istnieją w `app.js`.

## 18. Implementation Context for UI Prototype

- **Framework:** obecna aplikacja to vanilla HTML/CSS/ES module JavaScript; React nie jest zainstalowany ani używany.
- **Routing:** własny hash/history routing w `web/app.js`; brak React Routera.
- **CSS:** `web/design-system.css` jest kanoniczną warstwą Studio Biomechanics, a `web/styles.css` zawiera starszy/alternatywny system. Makieta powinna mieć własny izolowany arkusz albo osobny katalog, aby nie zmieniać produkcyjnych styli.
- **Komponenty:** brak biblioteki komponentów; obecne primitive są ręcznie pisane jako klasy CSS i stringi HTML.
- **Ikony:** brak lokalnej biblioteki ikon; produkcja używa znaków Unicode, Stitch HTML używa Material Symbols z zewnętrznego Google Fonts.
- **Assety:** lokalnie dostępne są `web/assets/kb-logo.png`, `web/assets/toe-touch-instruction.jpg`, `Inter*.ttf` i `Outfit*.ttf`. Należy używać lokalnych assetów, nie zewnętrznych URL z Stitch.
- **Stitch:** materiały są w `Stitch/stitch_fms_quickscreen_design_system/`; nadrzędne tokeny i zasady w `Stitch/Dla stitcha/design.md`, a opis Studio Biomechanics w `Stitch/stitch_fms_quickscreen_design_system/studio_biomechanics/DESIGN.md`.
- **Ograniczenia repozytorium:** użytkownik wymaga, aby statyczna makieta nie wykonywała Supabase RPC/API, nie zapisywała danych, nie zmieniała routingu ani konfiguracji produkcyjnej i nie ingerowała w istniejący frontend.
- **Bezpieczne miejsce:** najbezpieczniejszy jest nowy, niezależny katalog prototypu, np. `ui-prototype/`, z własnym `index.html`, CSS i statycznym JS/Reactem, o ile zostanie utworzony dopiero w kolejnym zadaniu. Alternatywnie można przygotować osobny mini-projekt obok `web/`, bez importowania go do istniejącego builda.
- **Proponowane uruchomienie:** statyczny prototyp uruchamiać osobnym lokalnym serwerem plików/dev serverem i osobnym skryptem, bez modyfikowania `web/index.html`, `web/app.js`, `web/design-system.css`, `web/styles.css`, `package.json` ani konfiguracji deployu. W makiecie używać fixture JSON/in-memory state oraz linków/hashów lokalnych, bez klienta Supabase.
- **Zakres makiety:** odtworzyć przede wszystkim funkcje, treści, dane i flow opisane w tym audycie; wygląd oprzeć na kanonicznym Stitch Studio Biomechanics, a obecny frontend traktować jako źródło zachowania, nie jako docelowy wzór wizualny.

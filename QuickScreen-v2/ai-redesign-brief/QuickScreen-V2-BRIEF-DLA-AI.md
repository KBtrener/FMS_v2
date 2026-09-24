# QuickScreen V2 — brief dla AI projektującego grafikę

## Nadrzędne doprecyzowanie aktualnego flow V2

Opis wyboru klienta oraz Shoulder Clearing w tym briefie i zbiorczym kodzie może być starszy. Dla tych elementów stosuj [`ASSESSMENT_FLOW_V2.md`](ASSESSMENT_FLOW_V2.md): wybór/potwierdzenie klienta jest pierwszym krokiem wizarda; Shoulder Clearing jest jednym zwykłym, kompletnym testem z sekcją lewej strony nad sekcją prawej strony. W V2 wyszukiwanie pokazuje podpowiedzi od 3 znaków, a kliknięcie wejścia z profilu wstępnie uzupełnia imię, nazwisko, e-mail i dyscyplinę. Szczegóły przyszłego sprawdzania i tworzenia klientów opisuje wskazany dokument.

Krok wyboru klienta i wyszukiwanie są prezentowane jako makieta na fixture’ach; nie dodawaj połączenia z bazą. Zachowaj pozostałe istniejące teksty i flow testów.

## Czym jest produkt

QuickScreen V2 to narzędzie KB Trener do przeprowadzania krótkich badań i testów ruchowych, przeglądania wyników i raportów oraz obsługi klientów i administracji. To nie jest generator ani plan treningowy. Określenia „Wizard” i „KB Trener” odnoszą się do badania/testów w aplikacji.

## Wymagania, których nie wolno zmienić

- Zachowaj dokładnie obecne teksty w aplikacji: pytania, instrukcje, opisy, etykiety, statusy, przyciski i tekst raportu. Bez parafrazy, korekty, skracania, tłumaczenia ani dopisywania treści.
- Zachowaj obecne flow wizarda: kroki i ich kolejność, sposób przechodzenia, pytania/odpowiedzi, ocenianie oraz logikę clearingów. Zmieniamy wygląd, nie działanie badania.
- Obejrzyj także widoki administracji i dane/testy. Ich treść jest w zbiorczym pliku źródłowym.

## Kierunek projektu

- Cała strona ma być spójna stylistycznie: panel klienta, panel trenera, lista i profil klienta, wizard, wyniki, raport i administracja.
- Ma sprawiać wrażenie bardzo prostej i lekkiej w odbiorze. Jasne, spokojne tło, czytelna hierarchia i delikatne kolorowe akcenty; bez przeładowania dekoracjami.
- Użyj dostarczonego logo KB Trener. Zachowaj jego proporcje i czytelność.
- Uprość wizualnie raport tak, żeby można go było szybko przeskanować. Nie usuwaj ani nie zmieniaj jego obecnych tekstów i danych.
- Opieraj ekran na powtarzalnych blokach. Treść i dane bloku mogą się zmieniać, ale jego konstrukcja i styl powinny pozostać spójne w całej aplikacji.

## Pliki do przejrzenia

- `QuickScreen-V2-AKTUALNY-KOD.md` — bieżący kod `index.html`, wszystkich plików `js/` i `css/`; źródło prawdy dla ekranów, tekstów, pytań, danych i flow.
- `assets/logo/kb-logo.png` — dołączone logo KB Trener.

Zaprojektuj redesign wszystkich istniejących ekranów, nie pomijając wizarda, raportu ani administracji. Najpierw odczytaj cały zbiorczy kod, potem przedstaw spójny plan i propozycje wizualne. Nie wymyślaj brakujących pytań ani danych — są w kodzie.

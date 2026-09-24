# Prompt dla generatora UI

```text
Zaprojektuj wysokiej jakości, responsywny interfejs webowy aplikacji „QuickScreen” dla trenera wykonującego screening FMS. Projektuj mobile-first, ale pokaż też logiczne zachowanie na desktopie. To operacyjne narzędzie pracy podczas sesji z klientem, a nie aplikacja medyczna ani typowy dashboard SaaS.

Zachowaj istniejące referencje panelu/listy klientów i podglądu raportu PDF. Nie projektuj ich od nowa; stylistycznie dopasuj do nich nowe ekrany. Przeprojektuj tylko: logowanie, pierwszy krok wyboru klienta, wizard z aktualną skonfigurowaną listą testów, szczegóły badania i historię, konfigurację, konto trenera/panel zespołu oraz stany puste i błędy. Krok wyboru klienta nie jest testem i nie wchodzi do punktacji.

Przyjmij kierunek: „Field notebook / terenowy dziennik trenera”. Użyj tła z odcieniem papieru, atramentowego granatu, zieleni dla powodzenia i jednego pomarańczowego akcentu. Stwórz charakterystyczny nazwany przebieg testów według bieżącej konfiguracji oraz duży moduł bieżącej decyzji. Typografia ma być wyrazista, funkcjonalna i inna niż Inter/Roboto/Arial. Unikaj fioletowych gradientów, efektu glassmorphism i nadmiaru kart z zaokrągleniami.

Zaprojektuj najpierw pierwszy krok wizarda „Nowe badanie — wybierz klienta”: prosty formularz Imię, Nazwisko, E-mail i Dyscyplina. Wejście z profilu wypełnia go danymi klienta. Wpisywanie co najmniej 3 znaków w polu imienia, nazwiska lub e-maila pokazuje dopasowane profile; wybór profilu uzupełnia wszystkie pola. Trener może też kontynuować wpisywanie danych nowej osoby. Docelową regułę backendu opisuje `docs/ASSESSMENT_FLOW_V2.md`; makieta pokazuje tylko przepływ na danych demonstracyjnych.

Następnie pokaż zwykły test wizarda z nazwą, krótkim celem, przyciskiem „Kryteria”, instrukcją, oceną, opcjonalną notatką oraz przyciskami Wstecz/Dalej. Odpowiedzi muszą mieć duże pola dotykowe, wyraźny stan wyboru i nie mogą polegać tylko na kolorze.

Shoulder Clearing przedstaw jako zwykły, kompletny test w tej samej sekwencji i hierarchii co pozostałe testy. Ma jeden kafelek: sekcja Lewa strona na górze, Prawa strona pod nią; w obu stronach pola Wzorzec górny i Wzorzec dolny z dotychczasowymi odpowiedziami. Nie nazywaj go osobnym, podrzędnym ani wyjątkowym testem. Nie pokazuj tekstu „Komplet odpowiedzi”. Panel kryteriów nie ma niebieskiej belki informacyjnej. Szczegóły są w `docs/ASSESSMENT_FLOW_V2.md`.

Uwzględnij dostępność: kontrast AA, czytelne stany focus, etykiety tekstowe, pola dotyku min. 48×48 px oraz hierarchię możliwą do skanowania w kilka sekund. Teksty interfejsu pisz po polsku, naturalnie i zwięźle.

Wynik dostarcz jako gotowy do implementacji projekt ze specyfikacją: paleta, typografia, odstępy, komponenty, stany interakcji i zachowanie mobilne/desktopowe. Jeśli generujesz kod, użyj semantycznego HTML/CSS/JS i nie zależ od zewnętrznych API.
```

## Zadanie dla tej iteracji

Zmieniaj tylko fragment po zdaniu „Zaprojektuj najpierw ekran…”. Przykłady:

- „Pierwszy krok wizarda: wybór/podpowiedzi klienta albo wpisanie nowego klienta.”
- „Szczegóły zapisanego badania: wynik /15, asymetrie, notatki, historia oraz akcje Korekta i Raport PDF.”
- „Konfiguracja reguł clearingu: lista reguł, stan aktywności, bezpieczne dodawanie i opis konsekwencji.”

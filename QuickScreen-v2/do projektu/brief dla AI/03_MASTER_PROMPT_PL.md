# Główny prompt dla AI projektującego QuickScreen V2

> Przed projektowaniem zastosuj `../../docs/ASSESSMENT_FLOW_V2.md` jako nadrzędne doprecyzowanie aktualnego flow V2. Projektuj krok wyboru klienta jako pierwszy ekran wizarda: imię, nazwisko, e-mail i dyscyplina; podpowiedzi wyszukiwania zaczynają się od 3 znaków, a wejście z profilu wstępnie uzupełnia pola. Docelowe dopasowanie backendowe opiera się na imieniu, nazwisku i e-mailu, z ręcznym wyborem przy niejednoznaczności. Shoulder Clearing jest zwykłym pełnym testem; w jednym kafelku pokaż Lewą stronę u góry i Prawą pod nią, a w obu wzorzec górny i dolny. Nie dodawaj etykiety „Osobny test clearingowy”, komunikatu „Komplet odpowiedzi” ani niebieskiej belki w kryteriach.

Zaprojektuj nową warstwę wizualną istniejącej makiety QuickScreen V2 na podstawie ekranów i kodu w folderze nadrzędnym. Pracujesz nad wyglądem całej aplikacji: panelem klienta, panelem trenera, listą i profilem klienta, wizardem badania, wynikami, raportem i administracją.

## Warunki bezwzględne

- **Nie zmieniaj obecnego flow wizarda.** Zachowaj wszystkie istniejące kroki, ich kolejność, przejścia, sterowanie, logikę odpowiedzi i clearingów. To redesign wizualny, nie przebudowa procesu badania.
- **Zachowaj dokładnie wszystkie aktualne teksty.** Kopiuj je znak w znak z istniejącej makiety. Nie parafrazuj, nie skracaj, nie poprawiaj, nie tłumacz i nie dopisuj żadnych nowych treści interfejsu.
- **Uprość raport wizualnie.** Ma być łatwy do szybkiego przeczytania i oparty na czytelnych, powtarzalnych blokach. Nie usuwaj ani nie zmieniaj treści raportu.
- **Ujednolić całą stronę.** Wszystkie ekrany mają wyglądać jak jedna prosta, lekka aplikacja.
- **Użyj mojego logo** z `../assets/logo/kb-logo.png`.
- **Buduj z bloków.** Projektuj powtarzalne komponenty, w których podmieniane są dane i treść, a wzorzec wizualny pozostaje ten sam.

## Pożądany wygląd

Prosty, spokojny i lekki interfejs z jasnym tłem, czytelną typografią i delikatnymi kolorowymi akcentami. Ogranicz dekoracje i liczbę elementów na ekranie. Zachowaj wyraźną hierarchię informacji oraz widoczny, ale nienachalny główny krok.

## Sposób pracy

1. Obejrzyj działającą makietę i poznaj jej aktualny flow.
2. Użyj obecnego UI i kodu jako źródła prawdy dla tekstów, danych, funkcji i kolejności kroków.
3. Zaprojektuj jeden spójny system wizualny, następnie zastosuj go do wszystkich ekranów.
4. Nie zastępuj istniejących tekstów przykładowym copy. Nie pomijaj ekranów ani kroków wizarda.
5. Przed oddaniem sprawdź, czy wszystkie obecne teksty i przejścia pozostały bez zmian.

## Kryterium akceptacji

Projekt jest gotowy, gdy wygląda prosto, lekko i spójnie; korzysta z logo KB Trener; raport łatwo się skanuje; elementy powtarzają się jako bloki; teksty są identyczne z obecnymi; a użytkownik przechodzi przez wizard dokładnie tym samym flow co wcześniej.

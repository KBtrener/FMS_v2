# QuickScreen V2 — cel projektu i granice zmian

## Aktualny przepływ wyboru klienta i testu barku

Stosuj nadrzędny opis `../../docs/ASSESSMENT_FLOW_V2.md`. Pierwszym krokiem wizarda jest prosty wybór/potwierdzenie klienta z polami imię, nazwisko, e-mail i dyscyplina. Wejście z profilu wypełnia pola; wyszukiwanie po imieniu, nazwisku lub e-mailu pokazuje podpowiedzi od 3 znaków. Backend docelowo ponownie sprawdza jednoznaczne dopasowanie imienia, nazwiska i e-maila przed utworzeniem rekordu; sam e-mail nie identyfikuje klienta. Shoulder Clearing jest jednym zwykłym, kompletnym testem, z lewą stroną nad prawą i wzorcem górnym/dolnym w każdej z nich. Nie przedstawiaj go jako przypadku szczególnego ani jako dwóch osobnych testów.

## Cel

Przygotuj spójny, bardzo prosty wizualnie projekt całej strony QuickScreen V2. Interfejs ma być lekki w odbiorze, uporządkowany i oparty na obecnym logo KB Trener z `../assets/logo/kb-logo.png`. Stosuj oszczędne, lekkie akcenty kolorystyczne. Nie buduj ciężkiego, przeładowanego dashboardu.

## Najważniejsze wymagania

1. Zachowaj dokładnie wszystkie obecne teksty interfejsu: nagłówki, etykiety, opisy, komunikaty, nazwy przycisków i treści raportu. Nie parafrazuj, nie skracaj, nie poprawiaj ani nie tłumacz tekstów. Aktualna makieta jest jedynym źródłem treści.
2. Zachowaj obecne działanie i flow badania. Projekt wizualny nie może zmienić kolejności kroków, przejść między ekranami, logiki odpowiedzi, clearingów ani nawigacji.
3. Ujednolić stylistycznie wszystkie ekrany: klienta, trenera, listy i profilu klienta, wizarda, wyników, raportu i administracji.
4. Buduj interfejs z powtarzalnych bloków. W obrębie bloku można podmieniać treść i dane, ale jego układ, odstępy, typografia, obramowania i zachowanie pozostają spójne.

## Zakres

To redesign wyglądu. Zmieniaj prezentację, hierarchię wizualną, typografię, odstępy, powierzchnie i lekkie akcenty koloru. Treść, dane, funkcje, flow i znaczenie statusów pozostają zgodne z obecną makietą.

## Źródło prawdy

Otwórz `../index.html` przez lokalny serwer statyczny i przejrzyj aktualne ekrany oraz kod w `../js/` i `../css/`. W razie rozbieżności zachowaj aktualne zachowanie aplikacji i dokładne teksty z kodu. Obrazy w `../referencje wizualne/` są inspiracjami, nie źródłem aktualnego tekstu ani flow.

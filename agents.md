# QuickScreen — zasady pracy

- Pracujemy wyłącznie nad nowym QuickScreen w katalogu głównym repozytorium `D:\apki\aplikacja FMS`; pliki aplikacji znajdują się w tym katalogu.
- Jedynym źródłem wytycznych wizualnych jest `design.md`. Nie opieramy projektu na starych makietach ani innych opisach designu.
- Podgląd aplikacji jest dostępny wyłącznie na OVH. Każdą zmianę aplikacji commitujemy i wdrażamy wyłącznie do katalogu OVH `quickscreenv2`; nie publikujemy jej do `quick-screen-v2` ani innych katalogów.
- Przy niejasnościach pytamy.
- QuickScreen pozostaje osobnym modułem; integracja z aplikacją główną ma przebiegać przez API.

## Nawigacja

- Przyciski „Wróć” prowadzą do poprzedniego rzeczywistego widoku QuickScreen; kroki techniczne, takie jak generowanie raportu i przekierowania, pomijaj. Dla adresu otwartego bez historii użyj ustalonego fallbacku.

## Dodawanie testów i wyników

- Dla każdego nowego testu odwzoruj logikę z dostarczonego, wiarygodnego źródła: odpowiedzi, kolejność, strony, próby, ból/clearing, rozgałęzienia i sposób ustalania wyniku. Nie dopowiadaj ani nie przenoś reguł z innego protokołu bez potwierdzenia w źródle.
- Wyniki pokazuj według skali i klasyfikacji danego testu. Widok ma czytelnie łączyć wynik ogólny z wynikami testów, zachowywać wymagane strony i grupowanie oraz ikony statusu. Reguły QS/FMS poniżej stosuj tylko do wyników o zgodnej skali i strukturze.
- Nowy test zintegruj z API i wspólnym przepływem aplikacji bez uzależniania współdzielonego renderera od identyfikatorów QuickScreen. Sprawdź wyniki na desktopie i telefonie oraz powrót zgodnie z zasadą nawigacji.

## Zasady raportu wyników QuickScreen/FMS

- W punktowanych testach w kolumnie „Wynik końcowy” pokazuj wynik liczbowy od 0 do 3.
- Koloruj wyniki liczbowe według statusu: 0 — czerwony, 1 — pomarańczowy, 2–3 — zielony.
- Dla barków wiersze 5, 6 i 7 mają jeden wspólny wynik w pionowo scalonej komórce kolumny „Wynik końcowy”.
- Gdy test nie jest podzielony na strony, scal komórki L i P i wyśrodkuj wspólny wynik.
- Zachowaj ikony statusu przy nazwach testów.
- Zachowaj czytelne proporcje tabeli: bez nadmiernego rozciągania i wychodzenia kolumn poza obramowanie.

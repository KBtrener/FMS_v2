# QuickScreen — zasady pracy

- Pracujemy wyłącznie nad nowym QuickScreen w katalogu głównym repozytorium `D:\apki\aplikacja FMS`; pliki aplikacji znajdują się w tym katalogu.
- Jedynym źródłem wytycznych wizualnych jest `design.md`. Nie opieramy projektu na starych makietach ani innych opisach designu.
- Podgląd aplikacji jest dostępny wyłącznie na OVH. Każdą zmianę aplikacji commitujemy i wdrażamy wyłącznie do katalogu OVH `quickscreenv2`; nie publikujemy jej do `quick-screen-v2` ani innych katalogów.
- Przy niejasnościach pytamy.
- QuickScreen pozostaje osobnym modułem; integracja z aplikacją główną ma przebiegać przez API.

## Nawigacja

- Przyciski „Wróć” prowadzą do poprzedniego rzeczywistego widoku QuickScreen; kroki techniczne, takie jak generowanie raportu i przekierowania, pomijaj. Dla adresu otwartego bez historii użyj ustalonego fallbacku.

## Dodawanie protokołów i testów

- Istniejąca nawigacja QuickScreen i ekran wyników QuickScreen są wzorcem dla wszystkich protokołów. Nowy protokół (także FMS) ma zachować ten sam układ, komponenty, hierarchię, nawigację, zachowanie „Wróć” i obsługę telefonu. Nie twórz równoległego wyglądu ani osobnego modelu nawigacji dla protokołu.
- Dopasuj dane i punktację nowego protokołu do wspólnego widoku wyników, zachowując jego własne reguły, nazwy, klasyfikacje i strony. Odtwórz logikę wyłącznie ze źródła; nie przenoś zasad QS/FMS tam, gdzie protokół ich nie określa. Reguły poniżej dotyczą wyników QS/FMS.
- SFMA używa opisowych klasyfikacji bez sumy punktów. Jego szczegółowe reguły oraz źródło znajdują się w `docs/SFMA_PROTOCOL.md`.

## Zasady raportu wyników QuickScreen/FMS

- W punktowanych testach w kolumnie „Wynik końcowy” pokazuj wynik liczbowy od 0 do 3.
- Koloruj wyniki liczbowe według statusu: 0 — czerwony, 1 — pomarańczowy, 2–3 — zielony.
- Dla barków wiersze 5, 6 i 7 mają jeden wspólny wynik w pionowo scalonej komórce kolumny „Wynik końcowy”.
- Gdy test nie jest podzielony na strony, scal komórki L i P i wyśrodkuj wspólny wynik.
- Zachowaj ikony statusu przy nazwach testów.
- Zachowaj czytelne proporcje tabeli: bez nadmiernego rozciągania i wychodzenia kolumn poza obramowanie.

## Wyniki i pomiary SFMA

- Korzystaj ze wspólnego układu wyników QuickScreen, tabeli desktopowej, widoku mobilnego i kafelka akcji. Zachowuj kody oraz pełne nazwy FN/FP/DN/DP, oddzielne strony L/P i nie wyliczaj wyniku zastępczego.
- Pokaż standard przy teście i zapisuj surowe pomiary do późniejszego porównania. Wynik z pomiaru wyliczaj wyłącznie według jawnej, aktywnej reguły w bazie; bez niej klasyfikację wybiera trener.

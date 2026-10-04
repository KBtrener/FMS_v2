# QuickScreen — zasady pracy

- Pracujemy wyłącznie nad nowym QuickScreen w katalogu głównym repozytorium `D:\apki\aplikacja FMS`; pliki aplikacji znajdują się w tym katalogu.
- Jedynym źródłem wytycznych wizualnych jest `design.md`. Nie opieramy projektu na starych makietach ani innych opisach designu.
- Publikujemy na OVH w `quickscreen v2` i pod dotychczasowym adresem `quick-screen-v2`.
- Każdą zmianę commitujemy. Przy niejasnościach pytamy.
- QuickScreen pozostaje osobnym modułem; integracja z aplikacją główną ma przebiegać przez API.

## Nawigacja

- Przyciski „Wróć” prowadzą do poprzedniego rzeczywistego widoku QuickScreen; kroki techniczne, takie jak generowanie raportu i przekierowania, pomijaj. Dla adresu otwartego bez historii użyj ustalonego fallbacku.

## Zasady raportu wyników

- W punktowanych testach w kolumnie „Wynik końcowy” pokazuj wynik liczbowy od 0 do 3.
- Koloruj wyniki liczbowe według statusu: 0 — czerwony, 1 — pomarańczowy, 2–3 — zielony.
- Dla barków wiersze 5, 6 i 7 mają jeden wspólny wynik w pionowo scalonej komórce kolumny „Wynik końcowy”.
- Gdy test nie jest podzielony na strony, scal komórki L i P i wyśrodkuj wspólny wynik.
- Zachowaj ikony statusu przy nazwach testów.
- Zachowaj czytelne proporcje tabeli: bez nadmiernego rozciągania i wychodzenia kolumn poza obramowanie.

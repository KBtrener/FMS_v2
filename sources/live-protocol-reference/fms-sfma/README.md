# Lokalny materiał referencyjny FMS i SFMA

To jest kopia kodu aplikacji produkcyjnej dostępnej pod `fms.kbtrener.pl`, pobrana z katalogu jej statycznych zasobów na OVH na prośbę właściciela aplikacji. Nie zawiera rekordów klientów ani danych z Supabase.

## Pliki

- `production-bundle.js` — oryginalny bundle JavaScript, zachowany bajt w bajt.
- `production-bundle.readable.js` — ten sam bundle sformatowany przez esbuild dla łatwiejszego przeglądania. Przy niejasności oryginalny bundle jest źródłem rozstrzygającym.
- `README.md` — pochodzenie i mapa najważniejszych fragmentów logiki.

SHA-256 oryginalnego bundle: `3d2e5ebc4b2bcceae04f534fcf249107bac28ff7d3548982f7a8963a929e56fc`.

Kod jest produkcyjnym buildem Vite/React, a nie repozytorium źródłowym. Nie znaleziono sourcemap. Nazwy lokalnych symboli są zminifikowane. Pliki CSS i konfiguracja nie zostały skopiowane, bo nie definiują reguł wykonania testów. Bundle jest wyłącznie materiałem do odwzorowania; nie jest importowany przez Quick Screen ani przez aplikację produkcyjną.

## Mapa logiki w `production-bundle.readable.js`

Numery linii odnoszą się do sformatowanej kopii.

### FMS

- `hm` (okolice linii 13033): kolejność siedmiu testów głównych: Deep Squat, Hurdle Step, In-Line Lunge, Shoulder Mobility, ASLR, Trunk Stability Push-Up, Rotary Stability.
- `m8` (9926): model wyników, pola stron lewa/prawa, flagi bólu, kryteria/issue arrays, pomiary i testy dodatkowe.
- `rJ` oraz `nJ` (okolice linii 13033): powiązania testów z dodatkowymi testami oraz konfiguracja kroków wizarda.
- `Ag` (13040): nazwy prezentowane dla testów.
- `zR`, `uw`, `fw`, `dw` (13049–13075): wynik pojedynczego testu, wybór niższego wyniku stron, zerowanie wyniku przy bólu oraz suma siedmiu wyników. Suma jest pusta, dopóki którykolwiek test główny nie ma wyniku.
- `aJ` (około 13075): warunki kompletności dla testów głównych i dodatkowych; pomiar dodatkowy może być jawnie pominięty.
- `Jxe`, `Xxe`, `rCe` (około 46236): kolory wyników oraz reguły wyświetlania testów clearing w raporcie PDF.
- `AG`: wersja danych sesji `FMS-CUSTOM-2026-01`.

### SFMA

- `b8` (10522): dozwolone klasyfikacje `FN`, `FP`, `DN`, `DP` wraz z opisami.
- `ap` (10522): katalog i kolejność 10 testów Top Tier; każdy ma identyfikator, nazwę, stronę pojedynczą/bilateralną i opis.
- `BY` (10522): katalog breakoutów przypiętych do `topTierId`; zawiera sekwencje kroków, standardy zakresu oraz jawne notatki/warunki przejścia. Opis przy breakoutach mówi, że uruchamia się je, gdy Top Tier nie ma wyniku FN.
- Dalej w tym samym bloku znajdują się rozgałęzienia dla szyi, wzorców kończyny górnej, Multi-Segmental Flexion/Extension/Rotation, Single-Leg Stance oraz Arms Down Deep Squat.

Ważne ograniczenie źródła: SFMA jest w tym buildzie reprezentowane jako katalog Top Tier i dane opisujące breakouts/sekwencje. Sam tekstowy opis reguły nie zawsze oznacza, że aplikacja automatycznie ocenia tę regułę. Przy implementacji trzeba odtworzyć faktyczne zachowanie komponentów i zapisu w dalszej części pliku, a brakujących kryteriów nie dopowiadać.

## Zakres i wierność

Bundle obejmuje całą aplikację, więc zawiera też zależności biblioteczne niezwiązane z protokołami. Kopię pobrano wyłącznie do odczytu. Nie zmieniano hostingu, danych, konfiguracji Supabase ani aplikacji Quick Screen. Nie uruchamiano testów ani nie wykonywano zapisu/edycji sesji.

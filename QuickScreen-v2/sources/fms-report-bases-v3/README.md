# FMS Report Engine — baza treści i logiki

Wersja: 3.0

## Cel

Ten pakiet ma wystarczyć Codexowi do zbudowania deterministycznego generatora raportów bez LLM i bez dostępu do manuala źródłowego.

Generator ma:

1. przyjąć ustrukturyzowane wyniki badania,
2. wybrać główny priorytet według zdefiniowanej hierarchii,
3. przypisać Protect / Correct / Develop,
4. dobrać język do profilu GENERAL / ACTIVE,
5. dodać kontekst sportowy,
6. rozpoznać nowego użytkownika lub klienta z kontem,
7. jeśli istnieje historia, pokazać zmianę względem poprzedniego badania,
8. złożyć raport z gotowych bloków tekstowych,
9. zachować naturalny, konkretny i niesztuczny język.

## Pliki

- `FMS_REPORT_LANGUAGE_GUIDE.md` — nadrzędne zasady języka i stylu raportu.
- `FMS_REPORT_DATA_CONTRACT.md` — model danych wejściowych.
- `FMS_REPORT_TESTS_DB.md` — definicje testów, kryteria i opisy znaczenia.
- `FMS_REPORT_RESULT_STATES_DB.md` — teksty dla wyników 0/1/2/3, bólu i asymetrii.
- `FMS_REPORT_SPORT_PROFILES_DB.md` — profile, sporty i kontekst sportowy.
- `FMS_REPORT_USER_STATE_DB.md` — nowy użytkownik / klient / historia / CTA.
- `FMS_REPORT_LOGIC_AND_TEMPLATES.md` — wybór priorytetu i składanie raportu.
- `FMS_REPORT_EDGE_CASES_AND_VALIDATION.md` — brak danych, wideo, wiele bolesnych obszarów i inne przypadki graniczne.
- `FMS_REPORT_EXAMPLES.md` — przykładowe raporty napisane w docelowym stylu.

## Najważniejsze zasady domenowe

- Ból ma pierwszeństwo nad jakością ruchu.
- Wynik `1` oznacza, że ruch nie spełnia podstawowego standardu badania.
- Wynik `2` jest dobrym, akceptowalnym wynikiem i nie powinien być przedstawiany jako problem.
- Wynik `3` oznacza spełnienie wszystkich kryteriów testu.
- Asymetria jest osobną informacją i może zostać priorytetem nawet wtedy, gdy słabsza strona ma `2`.
- Główny priorytet wybieramy przez ból, wynik 1 / Fail / asymetrię oraz hierarchię ruchów, a nie przez sumę punktów.
- Hierarchia: `cervical -> toe_touch -> shoulder_mobility -> squat -> balance -> rotation`.
- Sport zmienia znaczenie wyniku dla użytkownika, ale nie zmienia hierarchii.
- Stan klienta zmienia historię i CTA, ale nie zmienia interpretacji ruchowej.

## Najważniejsza zasada językowa

Raport ma dawać wniosek, a nie tylko opisywać test.

Dla każdego ważnego wyniku odpowiedz:

`Co zobaczyliśmy -> co to oznacza dla Ciebie -> co zrobić teraz.`

Mów jasno o tym, co badanie pokazało. Niepewność zostaw dla przyczyny, jeśli sam test jej nie rozstrzyga.

## Zasada implementacyjna

Kod może podstawiać zmienne, wybierać warianty tekstu i odmieniać liczby. Nie powinien sam dopisywać nowych interpretacji medycznych ani tworzyć tekstów poza zdefiniowanymi blokami.

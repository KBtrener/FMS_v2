# Logika wyboru priorytetu i składania raportu

Wersja: 3.0

Wszystkie teksty użytkowe muszą być zgodne z `FMS_REPORT_LANGUAGE_GUIDE.md`.

---

# 1. Hierarchia

```text
10 cervical
20 toe_touch
30 shoulder_mobility
40 squat
50 balance
60 rotation
```

Jeśli kilka obszarów spełnia kryteria priorytetu, wybierz pierwszy w tej hierarchii.

---

# 2. Etap 1 — ból

```text
pain_items = wszystkie dodatnie elementy cervical
           + wszystkie ruchy z score 0 / pain true
           + dodatni shoulder clearing
           + dodatni spine extension clearing

if pain_items not empty:
    report_mode = PROTECT
    primary_priority_type = PAIN
    primary_items = pain_items
    do not select one artificial weak link among painful items
```

### Nagłówek

`Najważniejsza informacja z dzisiejszego badania: podczas ruchu pojawił się ból.`

### Opis

`Ból jest teraz ważniejszy niż sam wynik ruchowy. Na razie nie warto dokładać tym ruchom większego obciążenia lub intensywności — najpierw trzeba sprawdzić problem dokładniej.`

Pozostałe bezbolesne ruchy można nadal pokazać w DEVELOP.

---

# 3. Etap 2 — kandydaci bez bólu

Kandydatem jest:

- każdy bilateralny test z co najmniej jednym wynikiem `1`,
- każda asymetria `3/2`, `3/1`, `2/1`,
- cervical `FAIL`,
- cervical asymmetry PASS/FAIL.

`2/2` i `3/3` bez bólu nie są kandydatami.

```text
candidates = build_candidates()
sort by test.priority_order ascending

if candidates not empty:
    primary_priority = candidates[0]
    secondary_findings = candidates[1:]
else:
    primary_priority = none
    status = NO_CLEAR_CORRECTIVE_PRIORITY
```

---

# 4. Kilka wyników 1

Nie wybieraj „najgorszego”, jeśli kilka wyników jest równych. Wybierz pierwszy w hierarchii.

Przykład:

```text
toe_touch = 1
shoulder_mobility = 1
rotation = 1
```

Wynik:

```text
PRIMARY = toe_touch
SECONDARY = shoulder_mobility, rotation
```

Tekst dla użytkownika:

`Kilka obszarów wymaga poprawy. Na dziś zaczynamy od {primary_client_name}, bo jest bardziej podstawowym ruchem i znajduje się wcześniej w hierarchii. Pozostałe wyniki nadal są ważne, ale nie musisz próbować poprawiać wszystkiego naraz.`

---

# 5. PRIMARY — gotowe szablony

## A. Wynik 1

`headline`:
`Najważniejszy obszar do pracy: {client_name}`

`body`:
`Tutaj mamy najwięcej do poprawy. Wynik 1 oznacza, że ten ruch nie spełnia jeszcze podstawowego standardu dzisiejszego badania. {profile_meaning} Dlatego od tego warto zacząć. {sport_context_optional}`

`next_step_active`:
`Najpierw popraw podstawową jakość tego ruchu, zanim dołożysz mu większe obciążenie, prędkość lub trudność.`

`next_step_general`:
`Najpierw popraw podstawową jakość tego ruchu, zanim przejdziesz do trudniejszych wersji.`

## B. Asymetria 3/2

`headline`:
`Najważniejszy obszar do pracy: {client_name}`

`body`:
`Obie strony radzą sobie dobrze, ale jedna wyraźnie lepiej. Słabsza strona nadal spełnia podstawowy standard, więc problemem nie jest „zły wynik”, tylko różnica między stronami. {profile_meaning} {sport_context_optional}`

`next_step`:
`Warto dążyć do bardziej podobnej jakości ruchu po obu stronach.`

## C. Asymetria z wynikiem 1

`headline`:
`Najważniejszy obszar do pracy: {client_name}`

`body`:
`Jedna strona radzi sobie dobrze, a druga wyraźnie odstaje. Słabsza strona nie spełnia jeszcze podstawowego standardu, dlatego od niej warto zacząć. {profile_meaning} {sport_context_optional}`

## D. Cervical Fail

`headline`:
`Najważniejszy obszar do pracy: ruchomość szyi`

`body`:
`W tym kierunku szyja nie osiąga podstawowego zakresu wymaganego w dzisiejszym badaniu. {profile_meaning} Warto poprawić swobodę tego ruchu i sprawdzić go ponownie. {sport_context_optional}`

## E. Brak priorytetu

`headline`:
`Nie ma dziś jednego wyraźnego problemu do poprawy.`

`body`:
`Wszystkie oceniane ruchy osiągają co najmniej dobry, podstawowy poziom. Nie pojawił się ból ani różnica między stronami, która wymagałaby pierwszeństwa. Możesz dalej rozwijać jakość, siłę i kontrolę tych ruchów.`

---

# 6. Protect / Correct / Develop

Te etykiety mogą pozostać elementem UI. Tekst pod nimi powinien być prosty.

## PROTECT

Dla bólu:

`W tym obszarze pojawił się ból. Na razie nie dokładaj mu większego obciążenia — najpierw warto sprawdzić problem dokładniej.`

## CORRECT

Dla wyniku 1 / Fail / asymetrii będącej priorytetem:

`To jest obszar do pracy. Najpierw popraw jakość ruchu, potem zwiększaj wymagania.`

## DEVELOP

Dla 2 lub 3 bez bólu:

`Ten ruch jest na dobrym poziomie i możesz go dalej normalnie rozwijać.`

---

# 7. Inne obszary wymagające uwagi

Dla każdego `secondary_finding` użyj krótkiego, naturalnego zdania:

- wynik 1: `{client_name}: wynik 1 — to również warto poprawić, ale nie jest to pierwszy priorytet.`
- 3/2: `{client_name}: obie strony radzą sobie dobrze, ale jedna wypada lepiej.`
- 2/1 lub 3/1: `{client_name}: jedna strona wyraźnie odstaje i warto do niej wrócić po głównym priorytecie.`
- cervical fail: `Ruchomość szyi: w jednym kierunku zakres jest za mały.`

Nie rozwijaj każdego punktu do długiego akapitu.

---

# 8. Mocne strony / Develop

Wybierz maksymalnie 2–4 najmocniejsze obszary.

Priorytet:

1. bilateralne 3/3,
2. wynik 3,
3. bilateralne 2/2,
4. wynik 2.

Tekst zbiorczy:

`Masz też kilka mocnych stron. Wyniki 2 i 3 oznaczają, że te ruchy spełniają podstawowy standard i możesz je normalnie rozwijać.`

Dla 3/3 można dodać:

`To jeden z najmocniejszych elementów dzisiejszego badania.`

---

# 9. Szczegóły każdego testu

Dla każdego testu pokaż:

1. nazwę,
2. wynik,
3. jedno zdanie `report_short`,
4. interpretację z RESULT_STATES_DB,
5. `general_meaning` albo `active_meaning`,
6. opcjonalnie jedno zdanie sportowe,
7. status Protect / Correct / Develop.

Nie powtarzaj przy każdym teście informacji o disclaimerze ani całego głównego komunikatu.

---

# 10. Historia

Jeśli `CLIENT_WITH_HISTORY`, pokaż ją bezpośrednio po głównym priorytecie.

## Nagłówek

`Co zmieniło się od poprzedniego badania`

## Kolejność

1. ból,
2. główny priorytet,
3. wyniki 1,
4. asymetrie,
5. zmiany 2/3.

## Przykładowy język

- `Mobilność barków poprawiła się z 1/1 do 2/2. To oznacza, że ruch osiąga już podstawowy standard.`
- `Różnica w równowadze zniknęła: wcześniej było 3/2, teraz jest 3/3.`
- `W rotacji pojawiła się nowa różnica 3/2. Obie strony są dobre, ale jedna wypada lepiej.`

## Priorytet

`Poprzedni priorytet: {previous_primary}`

`Obecny priorytet: {current_primary}`

Jeśli ten sam:

`Główny obszar do pracy pozostaje bez zmian: {current_primary}.`

---

# 11. Nowy użytkownik vs klient

Po złożeniu warstwy ruchowej wybierz stan z `FMS_REPORT_USER_STATE_DB.md`.

## NEW_LEAD

Kolejność:

1. krótkie intro,
2. najważniejszy obszar,
3. co to oznacza dla niego,
4. Protect / Correct / Develop,
5. inne obserwacje,
6. mocne strony,
7. szczegóły testów,
8. CTA kontaktowe,
9. jeden disclaimer.

## CLIENT_NO_HISTORY

Kolejność:

1. najważniejszy obszar,
2. Protect / Correct / Develop,
3. inne obserwacje,
4. mocne strony,
5. szczegóły,
6. informacja, że to punkt wyjścia,
7. jeden disclaimer.

## CLIENT_WITH_HISTORY

Kolejność:

1. najważniejszy obszar teraz,
2. zmiana od poprzedniego badania,
3. Protect / Correct / Develop,
4. inne obserwacje,
5. mocne strony,
6. szczegóły,
7. historia / CTA,
8. jeden disclaimer.

---

# 12. Stopka

Stały komunikat:

`Move well. Move often.`

Opcjonalne krótkie rozwinięcie:

`Najpierw jakość, potem więcej obciążenia, szybkości i złożoności.`

## Disclaimer

Pokazuj tylko raz, na końcu:

`Badanie ma charakter przesiewowy. Pokazuje, które obszary warto poprawić lub sprawdzić dokładniej, ale nie określa przyczyny bólu ani ograniczenia.`

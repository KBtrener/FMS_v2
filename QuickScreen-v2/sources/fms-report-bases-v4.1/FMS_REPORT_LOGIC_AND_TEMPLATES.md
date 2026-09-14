# Logika wyboru priorytetu, działania i składania raportu

Wersja: 4.1

> **Wydanie UI 4.1 — obowiązujące uzupełnienie.** Nie zmieniaj hierarchii ani punktacji. Po wyborze PRIMARY renderuj: hero (decyzja + PRIMARY), wspólny blok trzech działań, kontekst i mały re-test, następnie historię, a na końcu zwarte Protect / Correct / Develop. `report.retest_date` trenera ma pierwszeństwo; bez daty renderuj `Sprawdź ponownie za 1–2 tygodnie.` Generator nie generuje ćwiczeń, dawek ani programu treningowego.

Wszystkie teksty użytkowe muszą być zgodne z `FMS_REPORT_LANGUAGE_GUIDE.md`.

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
pain_items = cervical pain
           + score 0 / pain true
           + positive shoulder clearing
           + positive spine extension clearing

if pain_items not empty:
    report_mode = PROTECT
    primary_priority_type = PAIN
    primary_items = all pain_items
    do not select a non-painful problem as more important
```

Jeśli bolesnych obszarów jest kilka, pokaż wszystkie.

Dla każdego bolesnego obszaru pobierz konkretne zalecenie z `ACTION_RULES_DB`.

---

# 3. Etap 2 — kandydaci bez bólu

Kandydatem jest:

- wynik `1`,
- asymetria `3/2`, `3/1`, `2/1`,
- cervical `FAIL`,
- cervical PASS/FAIL między stronami.

`2/2` i `3/3` bez bólu nie są kandydatami.

```text
candidates = build_candidates()
sort candidates by test.priority_order ascending

primary = candidates[0]
secondary = candidates[1:]
```

---

# 4. Etap 3 — pobranie konkretnego działania

Po wybraniu `primary`:

```text
rule = ACTION_RULES_DB[test.action_key + state]
```

Wynik raportu musi zawierać:

```text
activity_status
do_now
temporarily_limit
can_continue
next_step
```

Jeśli `profile = general`, użyj `general_*`.

Jeśli `profile = active`, użyj `active_*`.

---

# 5. Etap 4 — sport

Tylko dla `profile = active`.

```text
matched_tags =
intersection(
    sport.tags,
    action_rule.movement_demand_tags
)
```

Jeśli `matched_tags` nie jest puste:

1. wybierz maksymalnie 1–2 tagi najlepiej związane z PRIMARY,
2. pobierz `sport.activity_examples[tag]`,
3. użyj przykładu do uszczegółowienia `temporarily_limit`, `can_continue` albo `why_it_matters`.

Sport nie może:

- zmienić priorytetu,
- zmienić wyniku,
- stworzyć nowego zakazu spoza Action Rule.

---

# 6. Odpowiedź „Czy mogę trenować?”

## A. Ból

Nie pisz automatycznie `przerwij cały trening`.

Szablon:

`Możesz utrzymać aktywność, która nie prowokuje bólu. Na razie ogranicz {specific_painful_demands}. {can_continue}.`

Jeśli kilka bolesnych obszarów blokuje większość treningu, trener może indywidualnie zmienić zalecenie.

## B. Wynik 1 / Fail bez bólu

Szablon:

`Możesz trenować. Na razie ogranicz {specific_limit}, a {can_continue}.`

Jeśli dana reguła ma `activity_status = continue_with_focus`:

`Możesz trenować bez dodatkowych ograniczeń wynikających z tego wyniku. Głównym zadaniem jest teraz poprawa {primary}.`

## C. Asymetria 3/2

`Możesz trenować bez dodatkowych ograniczeń wynikających z tej różnicy. Obie strony spełniają podstawowy standard; skup się na stronie, która wypadła słabiej.`

Nie wprowadzaj ograniczeń tylko z powodu 3/2.

## D. Brak priorytetu

`Możesz trenować / funkcjonować bez dodatkowych ograniczeń wynikających z dzisiejszego badania. Nie ma jednego wyraźnego obszaru, który wymaga teraz pierwszeństwa.`

---

# 7. Główna sekcja raportu

Nie pokazuj dwóch sąsiadujących komunikatów, które powtarzają nazwę PRIMARY. Jeśli nagłówek brzmi `Najważniejszy obszar: {primary}`, tekst pod nim ma wyjaśniać znaczenie lub działanie.

Kolejność:

## 1. Czy możesz trenować / funkcjonować?

Jedno konkretne zdanie.

## 2. Najważniejsze teraz

`PRIMARY` albo ból.

## 3. Co zrobić teraz

`do_now`.

## 4. Co chwilowo ograniczyć

`temporarily_limit`.

Jeśli nic:
`Nie ma potrzeby ograniczać aktywności wyłącznie z powodu tego wyniku.`

## 5. Co możesz kontynuować

`can_continue`.

## 6. Dlaczego ma to znaczenie dla Ciebie

- GENERAL -> `general_meaning` + codzienny przykład,
- ACTIVE -> `active_meaning` + maksymalnie 1–2 sportowe przykłady.

Dopiero po tych sekcjach pokazuj Protect / Correct / Develop i pełne szczegóły.

---

# 8. Protect / Correct / Develop

## PROTECT
Ból.

Tekst:
`W tym obszarze pojawił się ból. Ogranicz ruchy i obciążenia, które go odtwarzają. Pozostałą bezbolesną aktywność możesz kontynuować.`

## CORRECT
Wynik 1 / Fail / asymetria będąca priorytetem.

Tekst:
`To jest obszar do pracy. Najpierw popraw jakość ruchu, potem zwiększaj wymagania.`

## DEVELOP
2 / 3 bez bólu i bez priorytetowej asymetrii.

Tekst:
`Ten ruch jest na dobrym poziomie i możesz go dalej rozwijać.`

---

# 9. Kilka wyników 1

Nie poprawiaj wszystkiego naraz.

Przykład:

```text
toe_touch = 1
shoulder_mobility = 1
rotation = 1
```

PRIMARY = Toe Touch.

Tekst:
`Kilka obszarów wymaga poprawy. Na dziś zaczynamy od skłonu i pracy bioder. Pozostałe wyniki nadal są ważne, ale wrócimy do nich po pracy nad pierwszym priorytetem.`

---


## Zasada stron

Jeśli test jest bilateralny i dane wejściowe zawierają lewą i prawą stronę, tekst użytkowy musi wskazać stronę.

Przykład:

```text
balance_left = 2
balance_right = 1
```

Tekst:
`Prawa strona ma wynik 1 i wymaga poprawy. Lewa spełnia podstawowy standard.`

Nie generuj:
`Jedna strona wymaga poprawy.`

W warstwie UI preferuj zapis `L 2 · P 1` albo `Lewa 2 · Prawa 1`, a nie samo `2/1`.

---

# 10. Inne obszary

Każdy secondary pokaż krótko.

- `1`: `To również wymaga poprawy, ale nie jest pierwszym krokiem.`
- `3/2`: `Obie strony spełniają podstawowy standard. W raporcie nazwij stronę, która wypada lepiej.`
- `2/1 lub 3/1`: `{weaker_side} nie spełnia podstawowego standardu; {better_side} wypada lepiej.`
- cervical Fail: `Zakres w tym kierunku jest za mały.`

Nie dodawaj pełnej listy ograniczeń dla każdego secondary na górze raportu. Szczegółowe Action Rules mogą być rozwijane niżej.

---

# 11. Mocne strony

Wybierz 2–4 najmocniejsze wyniki.

`Masz też mocne strony. Te ruchy spełniają podstawowy standard i możesz je dalej rozwijać.`

Dla 3:
`To jeden z najmocniejszych elementów dzisiejszego badania.`

---

# 12. Historia

Dla `CLIENT_WITH_HISTORY` bezpośrednio po głównej decyzji:

1. ból pojawił się / ustąpił,
2. zmiana PRIMARY,
3. 1 -> 2/3 albo 2/3 -> 1,
4. asymetria pojawiła się / ustąpiła,
5. 2 <-> 3.

Historia ma odpowiadać na pytanie:
`Czy kierunek pracy przynosi zmianę?`

Jeśli nie ma porównywalnego wcześniejszego badania, nie pokazuj nagłówka `Od poprzedniego badania`. Użyj osobnego komunikatu `Twój punkt wyjścia`.

---

# 13. NEW_LEAD / CLIENT

## NEW_LEAD

1. Czy mogę trenować / funkcjonować
2. Najważniejsze teraz
3. Co robić / ograniczyć / kontynuować
4. Dlaczego to ma znaczenie
5. Protect / Correct / Develop
6. Mocne strony
7. Szczegóły
8. CTA
9. Jeden disclaimer

## CLIENT_NO_HISTORY

Jak wyżej, ale bez sprzedażowego CTA. Dodaj:
`To jest Twój punkt wyjścia.`

## CLIENT_WITH_HISTORY

Jak wyżej +:
`Co zmieniło się od poprzedniego badania`.

---

# 14. Zasada generatora

Generator nie może kończyć na ogólnym:
`zmodyfikuj trening`.

Jeśli Action Rule ma konkret:
`ogranicz dynamiczne zadania jednonóż i trudne lądowania`,
to właśnie ten konkret ma trafić do raportu.

Jeśli Action Rule nie definiuje ograniczenia, nie wymyślaj go.

---

# 15. Stopka

`Move well. Move often.`

Opcjonalnie:
`Najpierw jakość, potem więcej obciążenia, szybkości i złożoności.`

Disclaimer tylko raz:
`Badanie ma charakter przesiewowy. Pokazuje, które obszary warto poprawić lub sprawdzić dokładniej, ale nie określa przyczyny bólu ani ograniczenia.`

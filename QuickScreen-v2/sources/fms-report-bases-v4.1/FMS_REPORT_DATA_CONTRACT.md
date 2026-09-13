# Kontrakt danych wejściowych raportu

Wersja: 4.1

## 1. Profil użytkownika

```text
user.profile = general | active
user.sports = [] | [sport_id, ...]
user.account_exists = true | false
user.previous_completed_screens_count = integer >= 0
```

### Znaczenie

- `general` — osoba nieaktywna / ogólna; raport odnosi wynik głównie do codziennego funkcjonowania.
- `active` — osoba aktywna / sportowiec; raport odnosi wynik do treningu i wybranych sportów.
- `sports` — lista sportów; może zawierać więcej niż jedną dyscyplinę.
- `account_exists = false` — nowy użytkownik bez historii w systemie.
- `account_exists = true` — klient z kontem.
- `previous_completed_screens_count > 0` — można generować sekcję zmian w czasie.

## 2. Metadane badania

```text
screen.id
screen.date
screen.mode = in_person | video
screen.video_quality = not_applicable | high | acceptable | limited
screen.notes_optional
```

`video_quality` wpływa na komunikat o pewności obserwacji. Nie zmienia punktacji. Jeśli konkretnego kryterium nie da się zobaczyć, wynik tego elementu ustaw jako `not_assessable`.

## 3. Cervical Patterns

Cervical nie jest jednym wynikiem 0–3.

```text
cervical.flexion.rom = pass | fail | not_assessable
cervical.flexion.pain = negative | positive | not_assessable

cervical.rotation.right.rom = pass | fail | not_assessable
cervical.rotation.right.pain = negative | positive | not_assessable
cervical.rotation.left.rom = pass | fail | not_assessable
cervical.rotation.left.pain = negative | positive | not_assessable

cervical.rotation_extension.right.pain = negative | positive | not_assessable
cervical.rotation_extension.left.pain = negative | positive | not_assessable
```

### Kryteria zakresu

- Flexion PASS: broda dochodzi na odległość maksymalnie dwóch ułożonych pionowo palców od górnej części mostka.
- Rotation PASS: broda dochodzi co najmniej do połowy długości obojczyka po stronie rotacji.
- Rotation + Extension: brak kryterium zakresu; ocena dotyczy bólu.

### Reguła bólu

Każdy ból w cervical ma status `PROTECT` i ma pierwszeństwo nad Pass/Fail.

## 4. Toe Touch

```text
toe_touch.right.raw_score = 0 | 1 | 2 | 3 | not_assessable
toe_touch.left.raw_score = 0 | 1 | 2 | 3 | not_assessable
toe_touch.final_score = min(right, left)
toe_touch.pain = true | false
```

Strona odpowiada nodze znajdującej się z tyłu.

## 5. Shoulder Mobility

```text
shoulder_mobility.right.raw_score = 0 | 1 | 2 | 3 | not_assessable
shoulder_mobility.left.raw_score = 0 | 1 | 2 | 3 | not_assessable
shoulder_mobility.final_score = min(right, left)
shoulder_mobility.hand_length = number_optional

shoulder_clearing.right.overhead = negative | positive | not_assessable
shoulder_clearing.right.behind_back = negative | positive | not_assessable
shoulder_clearing.left.overhead = negative | positive | not_assessable
shoulder_clearing.left.behind_back = negative | positive | not_assessable
```

Dowolny dodatni Shoulder Clearing ustawia cały Shoulder Mobility jako ból/0 na potrzeby raportu.

## 6. Rotation

```text
rotation.right.raw_score = 0 | 1 | 2 | 3 | not_assessable
rotation.left.raw_score = 0 | 1 | 2 | 3 | not_assessable
rotation.final_score = min(right, left)
rotation.pain = true | false
```

Strona odpowiada kierunkowi rotacji.

## 7. Balance

```text
balance.right.raw_score = 0 | 1 | 2 | 3 | not_assessable
balance.left.raw_score = 0 | 1 | 2 | 3 | not_assessable
balance.final_score = min(right, left)
balance.pain = true | false
```

Strona odpowiada nodze podporowej.

## 8. Squat

```text
squat.score = 0 | 1 | 2 | 3 | not_assessable
squat.pain = true | false
```

## 9. Spine Extension Clearing

```text
spine_extension_clearing.pain = negative | positive | not_assessable
```

To jest test bólowy. Nie ma wyniku 0–3.

## 10. Pola pochodne

Dla każdego testu bilateralnego:

```text
asymmetry = true, gdy left_score != right_score i oba wyniki są assessable
asymmetry_type = 3_2 | 3_1 | 2_1 | none
```

Nie ma asymetrii dla `1/1`, `2/2`, `3/3`.

Dla historii:

```text
history.previous_value
history.current_value
history.change = improved | unchanged | worsened | new_asymmetry | resolved_asymmetry | not_comparable
```

## 11. Brak danych

`not_assessable` oznacza, że tego elementu nie dało się wiarygodnie ocenić. Nie zamieniaj go na 0, 1, 2 ani 3.

W raporcie użyj odpowiedniego komunikatu z `FMS_REPORT_EDGE_CASES_AND_VALIDATION.md`.


## 12. Pochodne pola decyzji dla raportu

Silnik powinien obliczyć:

```text
report.primary_priority
report.secondary_findings[]
report.develop_items[]

report.activity_status =
    protect_pain
    | continue_with_specific_limits
    | continue_with_focus
    | continue_normal

report.do_now[]
report.temporarily_limit[]
report.can_continue[]
report.next_step[]

report.matched_movement_demand_tags[]
report.selected_context_examples[]
```

### Znaczenie `activity_status`

- `protect_pain` — wystąpił ból; konkretne ograniczenia pobierz z `ACTION_RULES_DB`.
- `continue_with_specific_limits` — bez bólu, ale istnieje wynik 1 / Fail, dla którego baza definiuje konkretne ograniczenia progresji.
- `continue_with_focus` — można normalnie kontynuować, ale istnieje obszar do poprawy, np. asymetria 3/2.
- `continue_normal` — brak bólu i brak wyraźnego priorytetu.

`activity_status` nigdy nie może być jedyną poradą. Zawsze pokaż również `temporarily_limit` i `can_continue`, jeśli istnieją.

## 13. Mapowanie sportu na konkretne przykłady

Dla profilu `active`:

```text
user.sports = [sport_id, ...]
sport.tags = [...]
action_rule.movement_demand_tags = [...]

matched_tags = intersection(sport.tags, action_rule.movement_demand_tags)
```

Na podstawie `matched_tags` wybierz maksymalnie 1–2 najbardziej konkretne przykłady z:

```text
sport.activity_examples[tag]
```

Jeśli brak dopasowania, użyj bazowego zalecenia bez wymyślania sportowego przykładu.

## 14. Profil GENERAL

Dla `user.profile = general` nie wymagaj sportu.

Użyj:

```text
action_rule.general_do_now
action_rule.general_temporarily_limit
action_rule.general_can_continue
action_rule.general_next_step
```

Nie pokazuj sportowych przykładów.


## 15. Prezentacja stron w raporcie

Dla testów bilateralnych generator powinien udostępnić:

```text
better_side
weaker_side
left_score
right_score
```

Tekst użytkowy zawsze nazywa stronę, jeśli jest znana.

Warstwa UI preferuje:

```text
L 2 · P 1
```

lub:

```text
Lewa 2 · Prawa 1
```

Nie pokazuj klientowi samego `2/1`, jeśli może to być odczytane jako „2 punkty z 1” albo „2 z 1”.

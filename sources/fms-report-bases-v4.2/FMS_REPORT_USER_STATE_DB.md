# Stan użytkownika, historia i CTA

Wersja: 4.2

Ta warstwa nie zmienia interpretacji ruchowej. Steruje tylko tym, co raport pokazuje na końcu i czy widoczna jest historia.

---

# 1. NEW_LEAD

## Warunek

```text
account_exists = false
```

## Zachowanie

- `show_history = false`
- `show_change_summary = false`
- `show_education = true`
- `show_contact_cta = true`
- `show_client_next_step = false`

## Krótkie intro

`education_intro`:
`Dzisiejsze badanie pokazuje, co działa dobrze, gdzie pojawiają się różnice i od czego najlepiej zacząć.`

Nie dodawaj tutaj informacji typu „to nie jest diagnoza”. Jeden disclaimer znajduje się na końcu raportu.

## CTA

`headline`:
`Wiesz już, gdzie zacząć. Chcesz przełożyć ten wynik na konkretny plan pracy?`

`body`:
`Odezwij się do mnie. Przełożymy ten wynik na konkretny plan dopasowany do Ciebie.`

`button_label`:
`Skontaktuj się`

---

# 2. CLIENT_NO_HISTORY

## Warunek

```text
account_exists = true
previous_completed_screens_count = 0
```

## Zachowanie

- `show_history = false`
- `show_change_summary = false`
- `show_education = reduced`
- `show_contact_cta = false`
- `show_client_next_step = true`

## CTA

`headline`:
`To jest Twój punkt wyjścia.`

`body`:
`To jest Twój punkt wyjścia. Kolejne badanie pokaże, co się poprawiło, co zostało bez zmian i czy zmienił się główny priorytet.`

`button_label`:
`Zobacz historię badań`

---

# 3. CLIENT_WITH_HISTORY

## Warunek

```text
account_exists = true
previous_completed_screens_count > 0
```

## Zachowanie

- `show_history = true`
- `show_change_summary = true`
- `show_previous_priority = true`
- `show_current_priority = true`
- `show_contact_cta = false`
- `show_client_next_step = true`

## CTA

`headline`:
`Najważniejsze jest to, co zmienia się w czasie.`

`body`:
`Sprawdź, co zmieniło się od poprzedniego badania i na czym skupić się teraz.`

`button_label`:
`Zobacz historię`

---

# 4. Zasada historii

Historia porównuje konkretne ruchy, a nie tylko Total Score.

Priorytet pokazywania zmian:

1. ból: pojawił się / ustąpił / bez zmian,
2. główny priorytet: zmienił się / pozostał,
3. wynik 1 -> 2/3 lub 2/3 -> 1,
4. asymetria: pojawiła się / ustąpiła,
5. zmiana 2 <-> 3,
6. pozostałe stabilne wyniki.

## Teksty historii

- `improved`: `Ten wynik poprawił się od poprzedniego badania.`
- `unchanged`: `Ten wynik pozostał bez zmian.`
- `worsened`: `Ten wynik jest słabszy niż poprzednio.`
- `new_asymmetry`: `Pojawiła się nowa różnica między stronami.`
- `resolved_asymmetry`: `Różnica między stronami, którą widzieliśmy wcześniej, już się nie pojawia.`
- `pain_resolved`: `Tym razem ten ruch nie wywołał bólu.`
- `new_pain`: `W tym badaniu pojawił się ból, którego wcześniej nie było.`

## Priorytet w historii

- `priority_same`: `Główny obszar do pracy pozostaje ten sam: {current_primary}.`
- `priority_changed`: `Poprzednio głównym obszarem był {previous_primary}. Teraz najważniejszy jest {current_primary}.`
- `priority_resolved`: `Poprzedni główny problem nie jest już pierwszym priorytetem.`


---

# 5. CTA po konkretnym zaleceniu

CTA nie może zastępować użytecznej odpowiedzi.

NEW_LEAD najpierw powinien zobaczyć:

- co jest priorytetem,
- co ograniczyć,
- co może robić,
- dlaczego ma to znaczenie.

Dopiero potem CTA:

`Wiesz już, co jest najważniejsze. Jeśli chcesz przełożyć ten wynik na plan pracy dopasowany do Ciebie, odezwij się.`

Nie stosuj modelu:
`wynik -> brak konkretu -> skontaktuj się`.

Stosuj:
`wynik -> konkretna decyzja -> CTA do dalszej indywidualizacji`.


---

# 6. Reguła nagłówka historii

- `NEW_LEAD` -> nie pokazuj sekcji historii.
- `CLIENT_NO_HISTORY` -> użyj nagłówka `Twój punkt wyjścia`.
- `CLIENT_WITH_HISTORY` -> użyj nagłówka `Od poprzedniego badania` albo `Co zmieniło się od poprzedniego badania`.

Nigdy nie używaj `Od poprzedniego badania`, jeśli nie istnieje wcześniejszy porównywalny wynik.


---

# 7. User state a warstwa semantyczna

Stan użytkownika wybiera sekcje, nie język techniczny.

- `NEW_LEAD` — naturalny raport + CTA po pełnej odpowiedzi.
- `CLIENT_NO_HISTORY` — użyj `Twój punkt wyjścia`; nie twórz pseudo-historii.
- `CLIENT_WITH_HISTORY` — użyj `Co zmieniło się od poprzedniego badania?`.

Historia ma `message_intent = history`.


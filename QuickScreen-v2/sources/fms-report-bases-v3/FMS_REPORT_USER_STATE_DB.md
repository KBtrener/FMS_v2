# Stan użytkownika, historia i CTA

Wersja: 3.0

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
`Dzisiejsze badanie pokazuje, które ruchy wypadają dobrze, gdzie występują różnice między stronami i czym warto zająć się w pierwszej kolejności.`

Nie dodawaj tutaj informacji typu „to nie jest diagnoza”. Jeden disclaimer znajduje się na końcu raportu.

## CTA

`headline`:
`Wiesz już, gdzie zacząć. Chcesz przełożyć ten wynik na konkretny plan pracy?`

`body`:
`Odezwij się do mnie. Omówimy wynik i ustalimy, co warto zrobić dalej w Twoim przypadku.`

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
`Przy kolejnym badaniu zobaczysz, co się poprawiło, co zostało bez zmian i czy zmienił się główny priorytet.`

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
`Sprawdź, co poprawiło się od poprzedniego badania i na czym warto skupić się teraz.`

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

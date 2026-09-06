# Model danych

## Założenie

Model jest znormalizowany logicznie, ale w MVP jego tabele są osobnymi kartami
jednego prywatnego Google Sheets. Nazwy techniczne są stałe; etykiety w
interfejsie są po polsku.

Źródłem prawdy są odpowiedzi zapisane w assessment_answers. Raporty, historia,
suma i wykresy są obliczane z danych. Wyjątkiem jest applied_effects: zapisuje
on ślad konkretnej reguły, która zmieniła wynik w konkretnym badaniu.

## Karty Google Sheets

| Karta | Rola | Najważniejsze kolumny |
|---|---|---|
| clients | Dane klienta | client_id, first_name, last_name, email, is_archived, created_at, updated_at |
| assessments | Jedno wykonane badanie | assessment_id, client_id, screen_type_id, assessment_date, completed_at, note, status, correction_note, created_at, updated_at |
| screen_types | Rodzaje badań | screen_type_id, code, name, is_active |
| tests | Katalog testów | test_id, code, name, description_short, criteria_summary, source_reference, is_active |
| screen_tests | Test w określonym screenie | screen_test_id, screen_type_id, test_id, sort_order, calculation_type, is_active |
| answer_sets | Zestawy odpowiedzi | answer_set_id, code, name, value_kind, is_active |
| answer_options | Możliwe odpowiedzi | answer_option_id, answer_set_id, code, label_pl, numeric_value, sort_order, is_active |
| test_fields | Pola wejściowe testu | test_field_id, screen_test_id, code, label_pl, answer_set_id, side_mode, attempt_mode, is_scoring_input, help_text, sort_order |
| assessment_answers | Faktycznie wybrane odpowiedzi | answer_id, assessment_id, test_field_id, side, attempt_number, answer_option_id, numeric_value, unit, created_at, updated_at |
| effect_rules | Reguły wpływu między testami | effect_rule_id, screen_type_id, source_test_field_id, trigger_answer_option_id, source_side_condition, target_screen_test_id, effect_type, effect_value, is_active, reason_template |
| applied_effects | Ślad zastosowania reguły | applied_effect_id, assessment_id, effect_rule_id, source_answer_id, target_screen_test_id, before_score, after_score, reason_pl, created_at |

## Stabilne identyfikatory

Każdy identyfikator jest niezależny od numeru wiersza, np. CL-0001,
AS-0001, ST-QS-SQUAT. Nigdy nie używaj numeru wiersza Google Sheets jako
identyfikatora lub klucza obcego.

## Klient i badanie

- clients.email jest wymagany w MVP, ale nie ma unikalnego ograniczenia.
- assessments.assessment_date jest datą badania wybraną przez trenera.
- assessments.completed_at jest technicznym znacznikiem czasu zapisu.
- assessments.status przyjmuje co najmniej completed lub archived.
- Archiwizowane dane nie są usuwane z arkusza ani z odpowiedzi; są pomijane
  przez zwykłą historię, wykres i raport.

## Odpowiedź i strona ciała

Jedna odpowiedź jest jednym wierszem assessment_answers.

| Wartość side | Znaczenie |
|---|---|
| left | lewa strona, lewy kierunek lub lewa kończyna - znaczenie wynika z pola testu |
| right | prawa strona, prawy kierunek lub prawa kończyna - znaczenie wynika z pola testu |
| none | pole bez strony |

Znaczenie strony musi być opisane przy każdym teście. Przykłady:

- Toe Touch: strona oznacza nogę z tyłu.
- Shoulder Mobility: strona oznacza ramię idące nad głowę.
- Rotation: strona oznacza kierunek rotacji.
- Balance: strona oznacza nogę podporową.
- Cervical Rotation: strona oznacza kierunek skrętu.

attempt_number dopuszcza 1, 2 albo 3. Szybki interfejs może zapisywać tylko
najlepszy zaobserwowany wynik jako próbę 1, ponieważ podręcznik wymaga
zapisania najlepszego wyniku, a nie pełnej historii wszystkich prób. Model
pozwala później włączyć szczegółowe zapisywanie prób.

## Zestawy odpowiedzi

W konfiguracji startowej istnieją:

- score_0_3: 0, 1, 2, 3; wyłącznie liczby całkowite.
- pass_fail: Pass, Fail.
- pain_status: Positive, Negative, wyświetlane po polsku jako Ból i Brak bólu.

Nowy test nie wymaga zmiany struktury, jeśli korzysta z nowego zestawu
odpowiedzi, np. 0-5 albo Tak / Nie. Jeżeli ma mierzyć centymetry, sekundy lub
stopnie, test_field dostaje value_kind numeric, unit i walidowany zakres, a
assessment_answers.numeric_value przechowuje wartość. Nowa, niestandardowa
logika agregacji wymaga dodania nazwanego calculation_type w kodzie; nie
tworzyć ogólnego silnika dowolnych formuł.

## Reguła wpływu między testami

effect_rules nie odnosi się do konkretnego klienta ani numeru badania.
Konfiguruje relację raz dla danego screen_type. Przykład mechanizmu:

    źródło: Spine Extension Clearing / pain_status
    wyzwalacz: Positive
    cel: Squat
    działanie: set_final_score
    wartość: 0

W badaniu aplikacja sprawdza regułę, a po jej użyciu zapisuje applied_effects:

    Squat raw 3 -> Squat final 0
    powód: Spine Extension Clearing - Ból

source_side_condition może przyjmować none, any, same_side, left albo right.
Pozwala to zbudować zarówno regułę dla całego testu, jak i przyszłe reguły
stronowe.

## Obliczenia i historia

1. Najpierw odczytaj odpowiedzi źródłowe.
2. Oblicz wynik bazowy testu zgodnie z calculation_type.
3. Zastosuj aktywne effect_rules w ramach tego rodzaju badania.
4. Zapisz każdy zastosowany wpływ w applied_effects.
5. Wynik końcowy testu to wynik bazowy po zastosowaniu wpływów.
6. Total Screen Score to suma końcowych wyników liczbowych.

Nie zapisuj osobnej tabeli reports ani gotowych plików PDF. Nie twórz także
trwałej kolumny total_score jako źródła prawdy; można ją buforować wyłącznie
technicznie, jeżeli zawsze da się ją odtworzyć z odpowiedzi i applied_effects.

## Korekty

Po korekcie badania:

1. aktualizuj odpowiedzi;
2. przelicz wyniki;
3. odtwórz applied_effects dla tego badania;
4. zapisz updated_at oraz correction_note;
5. wszystkie przyszłe raporty i wykresy korzystają z poprawionej historii.

Nie zmieniaj danych konfiguracyjnych w codziennym widoku badania. Katalog
testów, pola i reguły powinny być dostępne wyłącznie w osobnym widoku
administracyjnym dla właściciela.

## Rozwój o FMS i SFMA

Dodanie kolejnego systemu oznacza w większości:

1. dodać screen_type;
2. dodać lub wykorzystać testy z katalogu;
3. przypisać je przez screen_tests;
4. dodać pola, zestawy odpowiedzi i reguły;
5. dodać calculation_type w kodzie tylko, gdy nowy sposób obliczeń nie
   istnieje.

Nie ma potrzeby tworzenia tabeli wersji protokołu w MVP. applied_effects
zachowuje jednak dowód, że dana reguła zmieniła wynik historycznego badania.

# Konkretne zalecenia po wyniku

Wersja: 4.1

## Cel

Ten plik odpowiada na pytania:

- `Co zrobić teraz?`
- `Co chwilowo ograniczyć?`
- `Co można kontynuować?`
- `Jaki jest następny krok?`

Zalecenia są przypisane do problemu ruchowego, nie do dyscypliny. Sport tylko tłumaczy je na konkretne sytuacje poprzez `movement_demand_tags`.

## Ważne: źródło reguły

Każda reguła ma `basis`:

- `manual_principle` — wynika z Protect / Correct / Develop lub zasad priorytetu;
- `manual_example` — jest bezpośrednio wsparta przykładem postępowania w materiałach źródłowych;
- `application_translation` — praktyczne przełożenie na klienta przygotowane dla tej aplikacji. Nie przedstawiaj tego jako oficjalnej recepty FMS.

Nie wymyślaj dodatkowych zakazów poza tym plikiem.

---

# 1. Reguły wspólne

## asymmetry_3_2

- `activity_status`: `continue_with_focus`
- `do_now`: `Kontynuuj aktywność. W pracy dodatkowej skup się na stronie, która wypadła słabiej.`
- `temporarily_limit`: `Brak automatycznego ograniczenia tylko z powodu wyniku 3/2.`
- `can_continue`: `Trening lub codzienna aktywność bez dodatkowych ograniczeń wynikających z samego wyniku 3/2.`
- `next_step`: `Pracuj nad bardziej podobną jakością obu stron i sprawdź wynik ponownie.`
- `basis`: `manual_principle`

## score_2_or_3

- `activity_status`: `continue_normal`
- `do_now`: `Kontynuuj i rozwijaj ten ruch.`
- `temporarily_limit`: `Brak ograniczeń wynikających wyłącznie z tego wyniku.`
- `can_continue`: `Normalna aktywność odpowiednia do poziomu przygotowania.`
- `next_step`: `Rozwijaj siłę, kontrolę, zakres lub złożoność zgodnie z celem.`
- `basis`: `manual_principle`

---

# 2. Cervical — ból

`rule_id`: `cervical.pain`

- `activity_status`: `protect_pain`
- `movement_demand_tags`: `HEAD_ORIENTATION`, `CONTACT`, `CYCLING`, `OVERHEAD`, `ROTATIONAL`
- `active_do_now`: `Trenuj dalej to, co nie wywołuje bólu szyi.`
- `active_temporarily_limit`: `Na razie ogranicz ruchy szyi i pozycje treningowe, które odtwarzają ból, szczególnie powtarzane lub obciążone ustawienia w bolesnym kierunku.`
- `active_can_continue`: `Pozostały bezbolesny trening możesz kontynuować.`
- `active_next_step`: `Sprawdź bolesny kierunek dokładniej przed progresją obciążenia lub zakresu.`
- `general_do_now`: `Poruszaj szyją w bezbolesnym zakresie podczas codziennych czynności.`
- `general_temporarily_limit`: `Nie wymuszaj bolesnego kierunku ani końcowego zakresu.`
- `general_can_continue`: `Codzienne czynności, które nie prowokują bólu.`
- `general_next_step`: `Jeśli ból się utrzymuje lub przeszkadza w funkcjonowaniu, sprawdź ten obszar dokładniej.`
- `basis`: `manual_principle + application_translation`

# 3. Cervical — FAIL bez bólu

`rule_id`: `cervical.fail`

- `activity_status`: `continue_with_focus`
- `movement_demand_tags`: `HEAD_ORIENTATION`, `CYCLING`, `OVERHEAD`, `ROTATIONAL`
- `active_do_now`: `Pracuj nad swobodą ograniczonego kierunku szyi.`
- `active_temporarily_limit`: `Nie ograniczaj całego treningu. Nie wymuszaj jednak końcowego zakresu szyi i nie zwiększaj trudności ćwiczeń, w których brak tego zakresu wyraźnie zmienia ustawienie całego tułowia.`
- `active_can_continue`: `Trening, w którym możesz utrzymać komfortową pozycję szyi.`
- `active_next_step`: `Popraw zakres i sprawdź ponownie przed zwiększaniem wymagań w ruchach mocno zależnych od ustawienia głowy.`
- `general_do_now`: `Regularnie wykorzystuj dostępny, komfortowy zakres szyi.`
- `general_temporarily_limit`: `Nie wymuszaj końcowego zakresu.`
- `general_can_continue`: `Normalne codzienne czynności w komfortowym zakresie.`
- `general_next_step`: `Sprawdź ponownie, czy zakres się poprawia.`
- `basis`: `manual_principle + application_translation`

---

# 4. Toe Touch — wynik 1

`rule_id`: `toe_touch.score_1`

- `activity_status`: `continue_with_specific_limits`
- `movement_demand_tags`: `HINGE`, `LIFTING`, `RUNNING`, `CYCLING`, `CLIMBING`
- `active_do_now`: `Najpierw popraw podstawowy skłon i kontrolę zgięcia bioder oraz tułowia.`
- `active_temporarily_limit`: `Na razie nie progresuj ciężkich lub bardzo wymagających ruchów opartych na głębokim zgięciu bioder, jeśli utrwalają ten sam słaby sposób wykonania.`
- `active_can_continue`: `Możesz trenować inne bezbolesne wzorce oraz lżejsze warianty zgięcia, które wykonujesz pod kontrolą.`
- `active_next_step`: `Po poprawie skłonu ponownie sprawdź ruch przed dokładaniem większego obciążenia lub trudności.`
- `general_do_now`: `Ćwicz kontrolowany skłon w komfortowym zakresie.`
- `general_temporarily_limit`: `Nie wymuszaj głębokiego pochylenia pod obciążeniem, np. przy podnoszeniu ciężkiego przedmiotu z podłogi.`
- `general_can_continue`: `Chodzenie, schody i zwykłe codzienne ruchy, które są bezbolesne.`
- `general_next_step`: `Popraw swobodę i kontrolę skłonu, a potem sprawdź go ponownie.`
- `basis`: `manual_example + manual_principle`

---

# 5. Shoulder Mobility — wynik 1 bez bólu

`rule_id`: `shoulder_mobility.score_1`

- `activity_status`: `continue_with_specific_limits`
- `movement_demand_tags`: `OVERHEAD`, `THROWING`, `RACKET`, `CLIMBING`, `SWIMMING`, `LIFTING`
- `active_do_now`: `Pracuj nad swobodą i kontrolą obręczy barkowej.`
- `active_temporarily_limit`: `Na razie ogranicz najbardziej wymagające pozycje nad głową, duże obciążenia w końcowym zakresie i ruchy, w których musisz wyraźnie kompensować tułowiem.`
- `active_can_continue`: `Bezbolesny trening góry ciała w zakresie, który kontrolujesz, oraz pozostałe dobrze ocenione wzorce.`
- `active_next_step`: `Popraw podstawowy zakres i kontrolę, a następnie ponownie oceń bark przed progresją najbardziej wymagających ruchów nad głową.`
- `general_do_now`: `Używaj barków w komfortowym zakresie i stopniowo pracuj nad swobodą sięgania.`
- `general_temporarily_limit`: `Nie wymuszaj skrajnego sięgania nad głowę lub za plecy, szczególnie z ciężkim przedmiotem.`
- `general_can_continue`: `Codzienne sięganie i przenoszenie lekkich przedmiotów w bezbolesnym, kontrolowanym zakresie.`
- `general_next_step`: `Stopniowo zwiększaj swobodę ruchu i sprawdź wynik ponownie.`
- `basis`: `manual_example + manual_principle`

# 6. Shoulder Mobility — ból / dodatni clearing

`rule_id`: `shoulder_mobility.pain`

- `activity_status`: `protect_pain`
- `movement_demand_tags`: `OVERHEAD`, `THROWING`, `RACKET`, `CLIMBING`, `SWIMMING`, `LIFTING`
- `active_do_now`: `Utrzymaj trening, który nie prowokuje bólu barku.`
- `active_temporarily_limit`: `Ogranicz ruchy i obciążenia odtwarzające ból, szczególnie bolesne pozycje nad głową, za plecami lub w końcowym zakresie.`
- `active_can_continue`: `Bezbolesne elementy treningu, w tym inne obszary ciała i zakresy barku, które nie wywołują objawów.`
- `active_next_step`: `Sprawdź bolesny bark dokładniej przed zwiększaniem obciążenia w bolesnych pozycjach.`
- `general_do_now`: `Używaj ręki w bezbolesnym zakresie.`
- `general_temporarily_limit`: `Nie wymuszaj sięgania lub podnoszenia w pozycjach, które wywołują ból.`
- `general_can_continue`: `Codzienne czynności niewywołujące bólu.`
- `general_next_step`: `Jeśli ból się utrzymuje, sprawdź obszar dokładniej.`
- `basis`: `manual_principle + application_translation`

---

# 7. Squat — wynik 1

`rule_id`: `squat.score_1`

- `activity_status`: `continue_with_specific_limits`
- `movement_demand_tags`: `LOWER_BODY`, `LIFTING`, `JUMPING`, `CHANGE_OF_DIRECTION`, `RUNNING`
- `active_do_now`: `Pracuj nad jakością przysiadu w zakresie, który kontrolujesz.`
- `active_temporarily_limit`: `Nie zwiększaj teraz głębokości, obciążenia ani szybkości przysiadu, jeśli przy podstawowej wersji nadal tracisz kontrolę.`
- `active_can_continue`: `Lżejsze warianty, stabilne ćwiczenia dolnej części ciała i inne bezbolesne ruchy wykonywane dobrą techniką.`
- `active_next_step`: `Po poprawie podstawowego przysiadu ponownie oceń ruch przed zwiększeniem obciążenia lub złożoności.`
- `general_do_now`: `Ćwicz kontrolowane siadanie i wstawanie z wysokości, na której utrzymujesz dobrą kontrolę.`
- `general_temporarily_limit`: `Nie wymuszaj bardzo głębokiego przysiadu pod obciążeniem.`
- `general_can_continue`: `Chodzenie, schody oraz siadanie i wstawanie w komfortowym zakresie.`
- `general_next_step`: `Stopniowo zwiększaj zakres i kontrolę.`
- `basis`: `manual_principle + application_translation`

---

# 8. Balance — wynik 1

`rule_id`: `balance.score_1`

- `activity_status`: `continue_with_specific_limits`
- `movement_demand_tags`: `SINGLE_LEG`, `CHANGE_OF_DIRECTION`, `JUMPING`, `RUNNING`, `KICKING`
- `active_do_now`: `Najpierw popraw kontrolę jednej nogi w prostych, stabilnych warunkach.`
- `active_temporarily_limit`: `Na razie ogranicz najbardziej wymagające dynamiczne zadania jednonóż, trudne lądowania, dużą objętość plyometrii i bardzo szybkie zmiany kierunku.`
- `active_can_continue`: `Stabilne ćwiczenia obunóż i bezbolesny trening siłowy możesz kontynuować. Prostsze zadania jednonóż wykonuj w warunkach, które kontrolujesz.`
- `active_next_step`: `Zwiększaj trudność dopiero wtedy, gdy kontrola jednonóż się poprawi, i sprawdź wynik ponownie.`
- `general_do_now`: `Ćwicz równowagę przy stabilnym podparciu i stopniowo zmniejszaj pomoc.`
- `general_temporarily_limit`: `Nie utrudniaj celowo zadań równoważnych przez zamykanie oczu, niestabilne podłoże lub brak podparcia, jeśli nie kontrolujesz pozycji.`
- `general_can_continue`: `Normalne chodzenie i codzienne czynności; przy trudniejszych sytuacjach użyj podparcia, jeśli go potrzebujesz.`
- `general_next_step`: `Popraw pewność stania na jednej nodze i sprawdź ją ponownie.`
- `basis`: `manual_example`

---

# 9. Rotation — wynik 1

`rule_id`: `rotation.score_1`

- `activity_status`: `continue_with_specific_limits`
- `movement_demand_tags`: `ROTATIONAL`, `RACKET`, `THROWING`, `COMBAT`, `CHANGE_OF_DIRECTION`, `KICKING`
- `active_do_now`: `Pracuj nad kontrolą rotacji bez zwiększania prędkości i złożoności.`
- `active_temporarily_limit`: `Nie zwiększaj teraz szybkości ani obciążenia ruchów rotacyjnych, jeśli nadal tracisz kontrolę albo zmieniasz ustawienie stóp.`
- `active_can_continue`: `Pozostałe dobrze ocenione ruchy oraz wolniejsze zadania rotacyjne, które wykonujesz pod kontrolą.`
- `active_next_step`: `Najpierw popraw jakość i koordynację rotacji, potem zwiększaj prędkość, obciążenie i złożoność.`
- `general_do_now`: `Ćwicz spokojne obracanie tułowia w komfortowym zakresie.`
- `general_temporarily_limit`: `Nie wymuszaj głębokiego skrętu pod obciążeniem, jeśli tracisz kontrolę ustawienia.`
- `general_can_continue`: `Normalne obracanie się i sięganie w codziennych sytuacjach, jeśli jest bezbolesne.`
- `general_next_step`: `Popraw swobodę i kontrolę skrętu, a potem sprawdź wynik ponownie.`
- `basis`: `manual_example + application_translation`

---

# 10. Spine Extension Clearing — ból

`rule_id`: `spine_extension_clearing.pain`

- `activity_status`: `protect_pain`
- `movement_demand_tags`: `LIFTING`, `OVERHEAD`, `CONTACT`, `ROTATIONAL`
- `active_do_now`: `Kontynuuj trening, który nie odtwarza bólu wyprostu kręgosłupa.`
- `active_temporarily_limit`: `Ogranicz powtarzane lub obciążone ruchy w kierunku wyprostu, jeśli prowokują ból.`
- `active_can_continue`: `Bezbolesne wzorce i zakresy ruchu.`
- `active_next_step`: `Sprawdź bolesny obszar dokładniej przed progresją ruchów, które odtwarzają ból.`
- `general_do_now`: `Pozostań aktywny w zakresie, który nie wywołuje bólu.`
- `general_temporarily_limit`: `Nie wymuszaj bolesnego wyprostu.`
- `general_can_continue`: `Codzienne ruchy niewywołujące bólu.`
- `general_next_step`: `Jeśli ból się utrzymuje lub ogranicza funkcjonowanie, sprawdź obszar dokładniej.`
- `basis`: `manual_principle + application_translation`

---

# 11. Asymetria 2/1 lub 3/1

Ta reguła nie zastępuje reguły testu. Modyfikuje ją.

- `activity_status`: użyj statusu z `test.score_1`
- `do_now_modifier`: `Skup pracę przede wszystkim na słabszej stronie, ale zachowaj jakość po stronie lepszej.`
- `temporarily_limit_modifier`: `Jeśli konkretna reguła testu ogranicza wymagające zadania, szczególnie uważaj na słabszą stronę.`
- `next_step_modifier`: `Celem jest zarówno podniesienie słabszej strony do podstawowego standardu, jak i zmniejszenie różnicy.`
- `basis`: `manual_principle`

# 12. Obustronny 1/1

- `activity_status`: użyj statusu z `test.score_1`
- `do_now_modifier`: `Pracuj nad całym ruchem, a nie nad wyrównywaniem stron.`
- `basis`: `manual_principle`

# 13. Zasada bezpieczeństwa generatora

Jeśli kombinacja `test + state` nie ma zdefiniowanej reguły:

1. nie generuj nowego zakazu,
2. użyj ogólnego `RESULT_STATE`,
3. napisz `Nie ma potrzeby automatycznie ograniczać całej aktywności. Skup się na jakości tego ruchu.`,
4. oznacz przypadek do przeglądu trenera.

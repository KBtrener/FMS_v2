# Baza stanów wyników

Wersja: 4.1

Ten plik zawiera teksty kierowane do użytkownika. Obowiązują zasady z `FMS_REPORT_LANGUAGE_GUIDE.md`.

---

## 1. Ból / wynik 0

- `id`: `pain_0`
- `status`: `PROTECT`
- `priority_class`: `pain`
- `headline`: `Najważniejsze: podczas tego ruchu pojawił się ból.`
- `description`: `Ból jest teraz ważniejszy niż sam wynik ruchowy.`
- `action_general`: `Nie dokładaj teraz większego zakresu ani obciążenia do ruchu, który wywołuje ból. Pozostań przy bezbolesnym zakresie i sprawdź ten obszar dokładniej.`
- `action_active`: `Nie zwiększaj teraz obciążenia, prędkości ani objętości w ruchu, który wywołuje ból. Bezbolesne elementy treningu możesz kontynuować.`

---

## 2. Wynik 1

- `id`: `score_1`
- `status`: `CORRECT`
- `priority_class`: `corrective`
- `headline`: `To jest słabszy obszar.`
- `description`: `Wynik 1 oznacza, że ten ruch nie spełnia jeszcze podstawowego standardu dzisiejszego badania.`
- `action_general`: `Zacznij od poprawy tego ruchu, zanim przejdziesz do trudniejszych wersji.`
- `action_active`: `Najpierw popraw jakość tego ruchu, potem zwiększaj obciążenie, prędkość lub trudność.`

---

## 3. Wynik 2

- `id`: `score_2`
- `status`: `DEVELOP`
- `priority_class`: `acceptable`
- `headline`: `Jest dobrze.`
- `description`: `Ten ruch spełnia podstawowy standard dzisiejszego badania.`
- `action_general`: `Możesz z niego swobodnie korzystać i dalej poprawiać jego jakość.`
- `action_active`: `Możesz go dalej trenować i rozwijać. Jest jeszcze przestrzeń do poprawy, ale nie jest to teraz główny priorytet.`

---

## 4. Wynik 3

- `id`: `score_3`
- `status`: `DEVELOP`
- `priority_class`: `optimal_screen_result`
- `headline`: `Bardzo dobry wynik.`
- `description`: `W tym ruchu spełniasz wszystkie kryteria dzisiejszego testu.`
- `action_general`: `To jest jedna z Twoich mocnych stron.`
- `action_active`: `To jest jedna z Twoich mocnych stron i możesz ją dalej rozwijać przez odpowiednio dobrane obciążenie, objętość i trudność.`

---

## 5. Asymetria 3/2

- `id`: `asymmetry_3_2`
- `status`: `CORRECT_MONITOR`
- `priority_class`: `asymmetry`
- `headline`: `Obie strony spełniają podstawowy standard, ale różnią się jakością.`
- `description`: `W raporcie zawsze nazwij stronę lepszą i słabszą. Słabsza nadal spełnia podstawowy standard.`
- `action_general`: `Pracuj nad bardziej podobną jakością obu stron i sprawdź zmianę przy kolejnym badaniu.`
- `action_active`: `Zmniejszaj tę różnicę, szczególnie jeśli ten ruch często powtarza się w Twoim sporcie.`

---

## 6. Asymetria 2/1

- `id`: `asymmetry_2_1`
- `status`: `CORRECT`
- `priority_class`: `corrective_asymmetry`
- `headline`: `Jedna strona wyraźnie odstaje.`
- `description`: `Jedna strona spełnia podstawowy standard, a druga ma wynik 1.`
- `action_general`: `Zacznij od słabszej strony i stopniowo zmniejszaj różnicę między stronami.`
- `action_active`: `Najpierw popraw słabszą stronę, zanim zaczniesz mocniej obciążać ten ruch.`

---

## 7. Asymetria 3/1

- `id`: `asymmetry_3_1`
- `status`: `CORRECT`
- `priority_class`: `corrective_asymmetry`
- `headline`: `Różnica między stronami jest duża.`
- `description`: `Jedna strona spełnia wszystkie kryteria, a druga nie spełnia jeszcze podstawowego standardu.`
- `action_general`: `To jest wyraźny obszar do pracy po słabszej stronie.`
- `action_active`: `To jest wyraźny priorytet. Najpierw popraw słabszą stronę, zanim dołożysz temu ruchowi większe wymagania.`

---

## 8. Obustronny wynik 1

- `id`: `bilateral_1_1`
- `status`: `CORRECT`
- `priority_class`: `corrective`
- `headline`: `Ten ruch jest słaby po obu stronach.`
- `description`: `Nie chodzi tu głównie o różnicę między stronami. Cały ruch nie spełnia jeszcze podstawowego standardu dzisiejszego badania.`
- `action_general`: `Najpierw popraw podstawową jakość tego ruchu.`
- `action_active`: `Najpierw popraw podstawową jakość tego ruchu, a dopiero potem zwiększaj jego obciążenie, prędkość lub trudność.`

---

## 9. Cervical Fail

- `id`: `cervical_fail`
- `status`: `CORRECT`
- `priority_class`: `corrective`
- `headline`: `Zakres ruchu szyi jest za mały w tym kierunku.`
- `description`: `Nie został osiągnięty podstawowy zakres wymagany w dzisiejszym badaniu.`
- `action_general`: `Popraw swobodę tego ruchu i sprawdź go ponownie.`
- `action_active`: `Popraw swobodę tego kierunku, szczególnie jeśli często wykorzystujesz go w treningu lub sporcie.`

---

## 10. Cervical asymmetry Pass/Fail

- `id`: `cervical_asymmetry`
- `status`: `CORRECT`
- `priority_class`: `asymmetry`
- `headline`: `Ruch szyi różni się między stronami.`
- `description`: `Jedna strona spełnia podstawowy zakres, a druga jeszcze nie.`
- `action_general`: `Pracuj nad bardziej podobną swobodą ruchu po obu stronach.`
- `action_active`: `Ta różnica ma większe znaczenie, jeśli Twój sport często wymaga szybkiego ustawiania głowy lub pracy asymetrycznej.`

---

## 11. Clearing Positive

- `id`: `clearing_positive`
- `status`: `PROTECT`
- `priority_class`: `pain`
- `headline`: `W teście bólowym pojawił się ból.`
- `description`: `To jest teraz ważniejsze niż wynik jakości ruchu.`
- `action_general`: `Nie dokładaj teraz większego obciążenia do bolesnego obszaru. Sprawdź go dokładniej i zostań przy bezbolesnych ruchach.`
- `action_active`: `Ogranicz ruchy i obciążenia, które odtwarzają ból. Pozostały bezbolesny trening możesz kontynuować.`

---

## Reguła nadrzędna

`score_2` bez asymetrii nie staje się problemem tylko dlatego, że można uzyskać 3.

`score_3` oznacza spełnienie wszystkich kryteriów dzisiejszego testu, ale nie oznacza „perfekcyjnego ciała” ani braku możliwości dalszego rozwoju.


---

# 12. Zasada dotycząca działania

Ten plik opisuje **znaczenie stanu**. Nie powinien sam generować szczegółowych zakazów treningowych.

Po rozpoznaniu stanu pobierz zalecenie z:

`FMS_REPORT_ACTION_RULES_DB.md`.

Ogólna zasada:

- `pain_0` / `clearing_positive` -> `protect_pain`,
- `score_1`, `bilateral_1_1`, `2/1`, `3/1`, `cervical_fail` -> zwykle `continue_with_specific_limits` albo `continue_with_focus` zależnie od konkretnego testu,
- `3/2` -> `continue_with_focus`; bez automatycznego ograniczenia aktywności,
- `2` / `3` -> `continue_normal`, chyba że inny element tego samego obszaru zmienia status.

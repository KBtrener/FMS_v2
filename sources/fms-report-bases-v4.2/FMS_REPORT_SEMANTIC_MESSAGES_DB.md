# FMS Report — semantyczna warstwa komunikatów

Wersja: 4.2

## Cel

Ten plik wprowadza deterministyczną warstwę pośrednią pomiędzy wynikiem testu a tekstem widocznym dla klienta.

Generator NIE powinien działać tak:

```text
wynik testu -> gotowe zdanie
```

Powinien działać tak:

```text
wynik testu
-> znormalizowane znalezisko
-> znaczenie dla raportu
-> intencja komunikatu
-> naturalny szablon
-> tekst klienta
```

Dzięki temu ten sam wynik może zostać opisany inaczej jako obserwacja, priorytet, działanie albo kontekst sportowy — bez używania LLM.

---

# 1. Znormalizowane znalezisko

Każdy wynik testu należy najpierw sprowadzić do struktury:

```text
finding.id
finding.test_id
finding.finding_type
finding.body_area
finding.side
finding.direction
finding.score
finding.left_score
finding.right_score
finding.better_side
finding.weaker_side
finding.pain
finding.priority_group
finding.priority_order
finding.client_area_label
finding.client_area_genitive
finding.client_area_locative
finding.client_movement_phrase
finding.technical_label
```

## finding_type

```text
pain
score_1
score_2
score_3
asymmetry_3_2
asymmetry_with_1
cervical_fail
cervical_pass
clear
not_assessable
```

`technical_label` służy do szczegółów technicznych.

`client_area_*` i `client_movement_phrase` służą do naturalnych tekstów klienta.

---

# 2. Język techniczny i język klienta

## Techniczne nazwy

Dozwolone w:
- `Pełnym obrazie wyników`,
- panelu trenera,
- logach i debugowaniu,
- dokumentacji technicznej.

Przykłady:
- Toe Touch,
- Shoulder Mobility,
- Shoulder Clearing,
- Cervical Rotation + Extension,
- Spine Extension Clearing.

## Język klienta

W głównej części raportu preferuj:
- szyja,
- bark,
- skłon,
- przysiad,
- równowaga na jednej nodze,
- rotacja.

Oraz naturalne frazy:
- podczas ruchu szyi w prawo,
- podczas testu prawego barku,
- podczas skłonu,
- podczas stania na prawej nodze,
- podczas rotacji w prawo.

Nie wstawiaj technicznej nazwy testu do naturalnego zdania, jeśli nie jest konieczna.

---

# 3. Intencja komunikatu

Każde zdanie ma `message_intent`:

```text
observation
priority
action
limitation
continuation
sport_meaning
daily_life_meaning
pain_1to1
retest
history
strength
technical_detail
```

## Najważniejsza zasada

Nagłówek i odpowiedź muszą należeć do tej samej kategorii znaczeniowej.

Źle:

```text
Co jest teraz najważniejsze?
Ból w szyi i obręczy barkowej.
```

To jest etykieta problemu, nie odpowiedź o priorytecie.

Dobrze:

```text
Co jest teraz najważniejsze?
Najpierw zajmij się bólem szyi i barku i omów wynik indywidualnie 1:1.
```

---

# 4. Szablony OBSERVATION

## Ból — jeden obszar

```text
W tym badaniu ból pojawił się {client_movement_phrase}.
```

## Ból — kilka obszarów

```text
Ból pojawił się {natural_movement_list}.
```

Przykład:

```text
Ból pojawił się podczas ruchu szyi w prawo oraz podczas testu prawego barku.
```

## Wynik 1

```text
{client_area_label_cap} jest teraz słabszym obszarem i nie spełnia podstawowego standardu badania.
```

## Asymetria z wynikiem 1

```text
{weaker_side_cap} strona wypada wyraźnie słabiej i nie spełnia podstawowego standardu.
```

## Asymetria 3/2

```text
Obie strony spełniają podstawowy standard, ale {better_side} wypada lepiej niż {weaker_side}.
```

---

# 5. Szablony PRIORITY

## Ból

```text
Najpierw zajmij się bólem {natural_area_list} i omów wynik indywidualnie 1:1.
```

## Wynik 1

```text
Najpierw skup się na poprawie {client_area_genitive}.
```

## Asymetria z wynikiem 1

```text
Najpierw skup się na {weaker_side_locative} stronie {client_area_genitive}.
```

## Asymetria 3/2

```text
Głównym zadaniem jest teraz zmniejszenie różnicy między stronami w {client_area_locative}.
```

---

# 6. ACTION / LIMITATION / CONTINUATION

Źródłem znaczenia pozostaje `FMS_REPORT_ACTION_RULES_DB.md`.

Warstwa semantyczna może:
- podstawić stronę,
- użyć naturalnej nazwy obszaru,
- odmienić rzeczownik,
- skrócić oczywiste powtórzenia,
- wybrać pasujący nagłówek.

Nie może tworzyć nowego zalecenia treningowego.

Mapowanie:

```text
do_now -> action
temporarily_limit -> limitation
can_continue -> continuation
```

Preferowane podnagłówki:
- `Nad czym pracować?`
- `Czego na razie nie zwiększać?`
- `Co możesz robić dalej?`

Jeśli realnego ograniczenia nie ma, sekcję `limitation` pomiń.

---

# 7. SPORT_MEANING

Nagłówek:

```text
Co ten wynik oznacza dla {sport_name_genitive}?
```

Pierwsze zdanie MUSI nazwać problem albo konkretny wynik.

Źle:

```text
Ten sam sposób pracy powtarza się przy każdym kroku.
```

Dobrze:

```text
Słabsza kontrola skłonu i zgięcia bioder ma znaczenie szczególnie przy szybszym biegu, sprintach i interwałach.
```

Nie używaj na początku sekcji niejasnych zaimków:
- `to`,
- `ten problem`,
- `ten obszar`,
- `ten ruch`,

jeżeli referent nie znajduje się w tym samym zdaniu.

---

# 8. DAILY_LIFE_MEANING

Nagłówek:

```text
Co ten wynik oznacza w codziennym ruchu?
```

Przykład:

```text
Słabsza kontrola równowagi na prawej nodze może być najbardziej odczuwalna przy schodach, ubieraniu się na stojąco i nierównym podłożu.
```

---

# 9. PAIN_1TO1

Nagłówek:

```text
Dlaczego ten wynik najlepiej omówić 1:1?
```

Tekst:

```text
Krótki test pokazuje, że podczas ruchu pojawił się ból, ale nie pozwala dobrze ocenić jego przyczyny. Dlatego ten wynik najlepiej omówić indywidualnie 1:1 przed dalszą zmianą treningu.
```

---

# 10. RETEST

Nagłówek:

```text
Kiedy sprawdzić ponownie?
```

Jeśli trener podał datę:

```text
Sprawdź ponownie {retest_date}.
```

Jeśli nie:

```text
Sprawdź ponownie za 1–2 tygodnie.
```

Druga linia:

```text
Szukamy przede wszystkim zmiany w dobrym kierunku, nie od razu idealnego wyniku.
```

Przy bólu termin może zostać zastąpiony komunikatem:

```text
Termin ponownego badania ustal po rozmowie 1:1.
```

---

# 11. Agregowanie kilku wyników

Główna część raportu nie powinna wyglądać jak surowa lista testów.

Dane:

```text
cervical rotation+extension right = pain
shoulder clearing right = positive
```

Nie:

```text
Szyja — rotacja z wyprostem po prawej stronie
Bark — Shoulder Clearing po prawej stronie
```

Tylko:

```text
Ból pojawił się podczas ruchu szyi w prawo z odchyleniem oraz podczas testu prawego barku.
```

Szczegóły techniczne mogą zostać niżej.

---

# 12. Słownik naturalnych nazw

## cervical

```text
client_area_label: szyja
client_area_genitive: szyi
client_area_locative: szyi
technical_label: Cervical
```

## toe_touch

```text
client_area_label: skłon
client_area_genitive: skłonu
client_area_locative: skłonie
technical_label: Toe Touch
```

## shoulder_mobility

```text
client_area_label: bark
client_area_genitive: barku
client_area_locative: barku
technical_label: Shoulder Mobility
```

## squat

```text
client_area_label: przysiad
client_area_genitive: przysiadu
client_area_locative: przysiadzie
technical_label: Squat
```

## balance

```text
client_area_label: równowaga na jednej nodze
client_area_genitive: równowagi na jednej nodze
client_area_locative: równowadze na jednej nodze
technical_label: Balance
```

## rotation

```text
client_area_label: rotacja
client_area_genitive: rotacji
client_area_locative: rotacji
technical_label: Rotation
```

## spine_extension_clearing

```text
client_area_label: wyprost kręgosłupa
client_area_genitive: wyprostu kręgosłupa
client_area_locative: wyproście kręgosłupa
technical_label: Spine Extension Clearing
```

---

# 13. Naturalne frazy ruchowe

```text
cervical.flexion = podczas zgięcia szyi
cervical.rotation.left = podczas ruchu szyi w lewo
cervical.rotation.right = podczas ruchu szyi w prawo
cervical.rotation_extension.left = podczas ruchu szyi w lewo z odchyleniem
cervical.rotation_extension.right = podczas ruchu szyi w prawo z odchyleniem
shoulder_clearing.left = podczas testu lewego barku
shoulder_clearing.right = podczas testu prawego barku
toe_touch.left = podczas skłonu z lewą nogą z tyłu
toe_touch.right = podczas skłonu z prawą nogą z tyłu
balance.left = podczas stania na lewej nodze
balance.right = podczas stania na prawej nodze
rotation.left = podczas rotacji w lewo
rotation.right = podczas rotacji w prawo
```

---

# 14. Test zgodności semantycznej

Każda sekcja musi przejść trzy pytania:

1. Czy nagłówek jasno mówi, jakiego rodzaju odpowiedź znajdzie klient?
2. Czy pierwsze zdanie naprawdę odpowiada na ten nagłówek?
3. Czy tekst używa naturalnej nazwy obszaru zamiast technicznej nazwy testu, jeśli techniczna nazwa nie jest potrzebna?

---

# 15. Deterministyczność

Generator NIE używa LLM.

Naturalność wynika z:
- znormalizowanych danych,
- `finding_type`,
- `message_intent`,
- słownika nazw i odmian,
- gotowych szablonów,
- reguł agregacji.

Dla tych samych danych wejściowych i tej samej wersji bazy generator ma zwrócić ten sam tekst.


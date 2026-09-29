# Baza testów, kryteriów i opisów

Wersja: 4.2

## Zasada wspólna

Każdy test opisuje cały ruch, a nie pojedynczy mięsień czy staw. W raporcie mów wprost, co zostało zaobserwowane. Nie przypisuj automatycznie przyczyny ograniczenia do jednej struktury.

---

# 1. Cervical Patterns

- `id`: `cervical`
- `action_key`: `cervical`
- `client_name`: `Ruchomość szyi`
- `priority_order`: `10`
- `primary_domain`: `mobility`
- `bilateral`: `partial`
- `sport_tags`: `HEAD_ORIENTATION`, `ROTATIONAL`, `OVERHEAD`, `COMBAT`, `SWIMMING`, `CYCLING`

## Co sprawdza

`technical_meaning`:
`Ocena podstawowego zakresu ruchu szyi w zgięciu i rotacji oraz obecności bólu w zgięciu, rotacji i połączeniu rotacji z wyprostem.`

`general_meaning`:
`Pokazuje, czy szyja porusza się swobodnie w podstawowych kierunkach potrzebnych na co dzień.`

`active_meaning`:
`Pokazuje, czy szyja ma wystarczającą swobodę ruchu do treningu, orientacji głowy i bardziej złożonych ruchów całego ciała.`

`report_short`:
`Zakres ruchu szyi i obecność bólu.`

## Kryteria

### Cervical Flexion

- `PASS`: broda dochodzi na odległość maksymalnie dwóch palców od górnej części mostka.
- `FAIL`: kryterium nie jest spełnione.
- ból: osobno `positive / negative`.

### Cervical Rotation

Dla każdej strony:

- `PASS`: broda dochodzi co najmniej do połowy długości obojczyka po stronie rotacji.
- `FAIL`: kryterium nie jest spełnione.
- ból: osobno `positive / negative`.

### Cervical Rotation + Extension

- brak kryterium zakresu,
- ocena tylko `positive / negative` dla bólu.

## Raportowanie

- dowolny ból -> `PROTECT`,
- bez bólu + dowolny `FAIL` -> `CORRECT`,
- wszystkie oceniane elementy PASS/NEGATIVE -> `DEVELOP`,
- różnica PASS/FAIL między stronami w rotacji -> kandydat do `CORRECT`.

---

# 2. Toe Touch

- `id`: `toe_touch`
- `action_key`: `toe_touch`
- `client_name`: `Skłon i praca bioder`
- `priority_order`: `20`
- `primary_domain`: `mobility`
- `bilateral`: `true`
- `sport_tags`: `HINGE`, `RUNNING`, `CYCLING`, `CLIMBING`, `ATHLETICS`, `COMBAT`

`technical_meaning`:
`Ocena zintegrowanego skłonu: mobilności, kolejności ruchu bioder i kręgosłupa, kontroli tułowia oraz utrzymania kolan i równowagi w pozycji asymetrycznej.`

`general_meaning`:
`Pokazuje, jak swobodnie i pod kontrolą wykonujesz skłon oraz jak biodra i tułów współpracują przy pochylaniu.`

`active_meaning`:
`Pokazuje jakość podstawowego ruchu zgięcia bioder i tułowia, który pojawia się w wielu ćwiczeniach siłowych, biegowych i sportowych.`

`report_short`:
`Skłon, praca bioder i kontrola tułowia.`

## Punktacja

Test nazywamy stroną nogi znajdującej się z tyłu.

- `3`: dotknięcie palców tylnej stopy bez zmiany wyjściowego ustawienia kolan.
- `2`: brak możliwości dotknięcia palców tylnej stopy, ale możliwość dotknięcia palców przedniej stopy bez zmiany ustawienia kolan.
- `1`: brak możliwości dotknięcia palców tylnej i przedniej stopy i/lub zmiana ustawienia kolan.
- `0`: ból w dowolnej części testu.

## Ważne dla tekstu raportu

Nie sprowadzaj wyniku do „elastyczności tyłu uda”. Test pokazuje jakość całego ruchu i może łączyć kwestie zakresu, stabilności i kontroli.

---

# 3. Shoulder Mobility

- `id`: `shoulder_mobility`
- `action_key`: `shoulder_mobility`
- `client_name`: `Mobilność obręczy barkowej`
- `priority_order`: `30`
- `primary_domain`: `mobility`
- `bilateral`: `true`
- `sport_tags`: `OVERHEAD`, `THROWING`, `CLIMBING`, `SWIMMING`, `RACKET`, `COMBAT`

`technical_meaning`:
`Ocena wzajemnej pracy obu kończyn górnych w przeciwnych kierunkach oraz współpracy barków, łopatek, odcinka piersiowego i kontroli postawy.`

`general_meaning`:
`Pokazuje, jak swobodnie pracują barki przy sięganiu nad głowę i za plecy.`

`active_meaning`:
`Pokazuje jakość pracy barków i tułowia w ruchach nad głową, ciągnięciu, rzucaniu, uderzaniu i innych zadaniach kończyn górnych.`

`report_short`:
`Swoboda ruchu barków i współpraca z tułowiem.`

## Punktacja

Test nazywamy stroną ręki poruszającej się nad głową. Długość ręki mierzy się od bliższej dłoni bruzdy nadgarstka do końca środkowego palca.

- `3`: pięści są w odległości nie większej niż jedna długość dłoni.
- `2`: pięści są w odległości nie większej niż półtorej długości dłoni.
- `1`: pięści są dalej niż półtorej długości dłoni.
- `0`: ból podczas ruchu lub dodatni Shoulder Clearing.

## Shoulder Clearing

Dla każdej strony ocenia się ból podczas:

1. sięgnięcia ręką nad głową do górnej części przeciwnej łopatki,
2. sięgnięcia ręką za plecy do dolnej części przeciwnej łopatki.

- `positive`: pojawia się ból,
- `negative`: brak bólu.

Shoulder Clearing nie ma punktacji zakresu. Dodatni wynik powoduje wynik 0 dla całego Shoulder Mobility.

---

# 4. Squat

- `id`: `squat`
- `action_key`: `squat`
- `client_name`: `Przysiad`
- `priority_order`: `40`
- `primary_domain`: `integrated_mobility_stability`
- `bilateral`: `false`
- `sport_tags`: `LOWER_BODY`, `RUNNING`, `JUMPING`, `CHANGE_OF_DIRECTION`, `ATHLETICS`, `COMBAT`, `CYCLING`

`technical_meaning`:
`Ocena zintegrowanej mobilności i stabilności kończyn dolnych oraz tułowia podczas głębokiego przysiadu z wąską bazą podparcia.`

`general_meaning`:
`Pokazuje, jak dobrze kontrolujesz obniżenie ciała i powrót do pozycji stojącej.`

`active_meaning`:
`Pokazuje jakość podstawowego ruchu obciążania kończyn dolnych, ważnego w treningu siłowym, lądowaniu, zmianie pozycji i wielu ruchach sportowych.`

`report_short`:
`Kontrola i zakres ruchu dolnej części ciała w przysiadzie.`

## Punktacja

- `3`: uda schodzą poniżej poziomu poziomego oraz pięści dotykają podłoża obok stóp.
- `2`: w wariancie z wyprostowanymi palcami osoba schodzi udami poniżej poziomu poziomego i dotyka palcami podłoża obok stóp, ale nie spełnia kryteriów wyniku 3.
- `1`: nie potrafi dotknąć palcami podłoża i/lub nie schodzi udami poniżej poziomu poziomego.
- `0`: ból w dowolnej części testu.

## Ważne dla tekstu raportu

Jeśli Toe Touch jest dobry, a Squat ma 1, napisz, że przysiad wymaga dokładniejszej oceny. Nie wskazuj automatycznie jednej przyczyny.

---

# 5. Balance

- `id`: `balance`
- `action_key`: `balance`
- `client_name`: `Równowaga jednonóż`
- `priority_order`: `50`
- `primary_domain`: `stability_motor_control`
- `bilateral`: `true`
- `sport_tags`: `SINGLE_LEG`, `RUNNING`, `JUMPING`, `CHANGE_OF_DIRECTION`, `RACKET`, `CLIMBING`, `COMBAT`, `ATHLETICS`

`technical_meaning`:
`Ocena stabilności na jednej nodze, kontroli postawy, propriocepcji i wykorzystania informacji sensorycznych z oczami otwartymi i zamkniętymi.`

`general_meaning`:
`Pokazuje, jak pewnie kontrolujesz ciało na jednej nodze, także wtedy, gdy wzrok przestaje pomagać.`

`active_meaning`:
`Pokazuje podstawową kontrolę jednonóż potrzebną w biegu, lądowaniu, zmianie kierunku i innych zadaniach wykonywanych asymetrycznie.`

`report_short`:
`Równowaga, propriocepcja i kontrola jednej nogi.`

## Punktacja

Test nazywamy stroną nogi podporowej.

- `3`: 10 s równowagi z oczami otwartymi i 10 s z oczami zamkniętymi, bez istotnego chwiania i bez istotnego opuszczania uda.
- `2`: nie utrzymuje 10 s z oczami zamkniętymi, ale utrzymuje 10 s z oczami otwartymi bez istotnego chwiania i opuszczania uda.
- `1`: nie utrzymuje 10 s z oczami otwartymi i/lub występuje istotne chwianie albo opuszczanie uda.
- `0`: ból w dowolnej części testu.

## Ważne dla tekstu raportu

Nie opisuj wyniku wyłącznie jako „siłę nogi”. Test obejmuje kontrolę równowagi, propriocepcję i korzystanie z informacji sensorycznych.

---

# 6. Rotation

- `id`: `rotation`
- `action_key`: `rotation`
- `client_name`: `Rotacja całego ciała`
- `priority_order`: `60`
- `primary_domain`: `motor_control_integration`
- `bilateral`: `true`
- `sport_tags`: `ROTATIONAL`, `RACKET`, `THROWING`, `CHANGE_OF_DIRECTION`, `COMBAT`, `CLIMBING`, `SWIMMING`, `ATHLETICS`

`technical_meaning`:
`Ocena zintegrowanej rotacji całego ciała obejmującej stopy, biodra, miednicę, tułów, klatkę piersiową, barki i przenoszenie ciężaru.`

`general_meaning`:
`Pokazuje, jak swobodnie i pod kontrolą obracasz całe ciało oraz czy obie strony robią to podobnie.`

`active_meaning`:
`Pokazuje, jak dobrze ciało organizuje skręt i przenoszenie ciężaru — szczególnie ważne w ruchach rotacyjnych, asymetrycznych, rakietowych, walki i części konkurencji lekkoatletycznych.`

`report_short`:
`Rotacja całego ciała i przenoszenie ciężaru.`

## Punktacja

Test nazywamy kierunkiem rotacji.

- `3`: rotacja przekracza 90 stopni w pozycji staggered stance bez zmiany ustawienia stóp.
- `2`: nie przekracza 90 stopni w staggered stance, ale przekracza 90 stopni przy stopach razem, bez zmiany ich ustawienia.
- `1`: nie przekracza 90 stopni przy stopach razem i/lub zmienia ustawienie stóp.
- `0`: ból w dowolnej części testu.

## Ważne dla tekstu raportu

Rotation jest najbardziej złożonym ruchem i znajduje się na końcu hierarchii. Jeśli wcześniejsze obszary wypadają dobrze, a rotacja nadal jest słaba, można mocniej podkreślić jakość kontroli i koordynacji ruchu.

---

# 7. Spine Extension Clearing

- `id`: `spine_extension_clearing`
- `action_key`: `spine_extension_clearing`
- `client_name`: `Wyprost kręgosłupa — test bólowy`
- `result_type`: `positive_negative`

`negative_meaning`:
`Wyprost kręgosłupa nie wywołał bólu.`

`positive_meaning`:
`Podczas wyprostu kręgosłupa pojawił się ból. To jest teraz ważniejsze niż pozostałe szczegóły tego testu. Ogranicz ruchy, które odtwarzają ból, i sprawdź ten obszar dokładniej.`

To nie jest wynik 0–3.


---

# 8. Zasada połączenia z Action Rules

Ten plik odpowiada na pytanie **co test pokazuje i jak jest punktowany**.

Nie zapisuj tutaj szczegółowych zaleceń treningowych. Po wyliczeniu stanu testu użyj:

```text
action_key + result_state
```

do pobrania konkretnej reguły z `FMS_REPORT_ACTION_RULES_DB.md`.

Przykład:

```text
test = balance
state = score_1
-> action rule = balance.score_1
```


---

# 9. Słownik kliencki testów

Każdy test udostępnia naturalne nazwy dla warstwy semantycznej.

```text
cervical:
  client_area_label: szyja
  client_area_genitive: szyi
  client_area_locative: szyi
  technical_label: Cervical

toe_touch:
  client_area_label: skłon
  client_area_genitive: skłonu
  client_area_locative: skłonie
  technical_label: Toe Touch

shoulder_mobility:
  client_area_label: bark
  client_area_genitive: barku
  client_area_locative: barku
  technical_label: Shoulder Mobility

squat:
  client_area_label: przysiad
  client_area_genitive: przysiadu
  client_area_locative: przysiadzie
  technical_label: Squat

balance:
  client_area_label: równowaga na jednej nodze
  client_area_genitive: równowagi na jednej nodze
  client_area_locative: równowadze na jednej nodze
  technical_label: Balance

rotation:
  client_area_label: rotacja
  client_area_genitive: rotacji
  client_area_locative: rotacji
  technical_label: Rotation

spine_extension_clearing:
  client_area_label: wyprost kręgosłupa
  client_area_genitive: wyprostu kręgosłupa
  client_area_locative: wyproście kręgosłupa
  technical_label: Spine Extension Clearing
```

Techniczna nazwa testu jest dozwolona w szczegółach, ale nie powinna automatycznie trafiać do naturalnej części raportu.


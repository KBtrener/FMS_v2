# Punktacja i konfiguracja Quick Screen

## Źródło i zasada nadrzędna

Reguły pochodzą z przekazanych PDF-ów. Szczegółowe instrukcje ruchu i pełne
kryteria pozostają w PDF-ach referencyjnych. W aplikacji należy użyć krótkich
opisów oraz odwołania do strony źródła, a nie kopiować pełnego podręcznika.

Wynik ruchowy:

- 3 - ruch zgodny z kryteriami;
- 2 - ruch wykonany z kompensacją;
- 1 - niewykonanie wymaganego ruchu lub istotna kompensacja;
- 0 - ból w dowolnym momencie ruchu.

Wyniki są całkowite. Osoba ma maksymalnie trzy próby, zapisywany jest najlepszy
wynik, a przy niepewności należy wybrać niższy. Ból ma pierwszeństwo przed
oceną jakości.

Test clearing nie ma wyniku 0-3. Positive oznacza ból, Negative brak bólu.
Niepewność traktuj jako Positive.

## Kolejność ekranu

Zalecana kolejność:

1. Cervical Flexion
2. Cervical Rotation and Extension
3. Toe Touch
4. Shoulder Mobility
5. Rotation
6. Balance
7. Squat
8. Spine Extension Clearing

Interfejs może użyć innego układu nawigacji, ale kolejność domyślna powinna
pozostać taka jak powyżej.

## Pola dla testów szyjnych

### Cervical Flexion

- Zakres ruchu: Pass / Fail.
- Ból przy zgięciu: Positive / Negative.
- Brak strony.
- Pass oznacza osiągnięcie minimalnego zakresu opisanego w podręczniku.

### Cervical Rotation, osobno lewa i prawa strona

Dla każdej strony zapisz niezależnie:

1. Zakres ruchu: Pass / Fail.
2. Ból przy samej rotacji: Positive / Negative.
3. Ból przy rotacji z wyprostem: Positive / Negative.

Rozdzielenie punktów 2 i 3 jest celowym rozszerzeniem szczegółowości zapisu:
podręcznik wymaga oceny bólu przy rotacji oraz osobnej oceny bólu dla rotacji
z wyprostem. Nie zmienia ono punktacji liczbowej, ponieważ wzorce szyjne są
oceniane przez Pass / Fail i Positive / Negative, nie przez 0-3.

W interfejsie nigdy nie używaj samej litery P bez objaśnienia. Pass i Positive
mają inne znaczenie.

## Testy liczbowe

| Kod | Strony | Znaczenie strony | Wynik końcowy |
|---|---|---|---|
| toe_touch | L/R | noga z tyłu | niższy wynik L/R |
| shoulder_mobility | L/R | ramię idące nad głowę | niższy wynik L/R, potem clearing |
| rotation | L/R | kierunek rotacji | niższy wynik L/R |
| balance | L/R | noga podporowa | niższy wynik L/R |
| squat | brak | nie dotyczy | pojedynczy wynik |

Kryteria zwięzłe do przycisku Kryteria oceny:

- Toe Touch: ocena zależy od dotknięcia palców tylnej lub przedniej stopy oraz
  utrzymania wyjściowej pozycji kolana.
- Shoulder Mobility: dystans między pięściami odniesiony do długości dłoni.
- Rotation: przekroczenie 90 stopni najpierw w pozycji wykrocznej, następnie
  symetrycznej.
- Balance: utrzymanie jednej nogi przez 10 sekund przy otwartych, a dla
  najwyższego wyniku także zamkniętych oczach bez znaczących kompensacji.
- Squat: kontakt pięści lub palców z podłożem obok stóp i głębokość uda poniżej
  poziomu, zależnie od wariantu.

Dokładna instrukcja i definicja kryteriów jest w PDF Manual, odpowiednio na
stronach 13, 16, 19, 22 i 25.

## Clearing tests i aktywne powiązania Quick Screen

| Clearing test | Strony | Domyślne powiązanie produkcyjne | Efekt |
|---|---|---|---|
| Cervical Flexion pain | brak | brak wyniku liczbowego | widoczna flaga bólu |
| Cervical Rotation pain | L/R | brak wyniku liczbowego | widoczna flaga bólu |
| Cervical Rotation with Extension pain | L/R | brak wyniku liczbowego | widoczna flaga bólu |
| Shoulder Clearing | L/R | Shoulder Mobility | Positive po dowolnej stronie ustawia końcowy wynik Shoulder Mobility na 0 |
| Spine Extension Clearing | brak | brak w Quick Screen seed | tylko flaga, dopóki właściciel nie ustawi relacji dla innego protokołu |

PDF podaje wprost powiązanie Shoulder Clearing z Shoulder Mobility. Spine
Extension Clearing jest w Quick Screen osobnym testem bólowym; pakiet nie
zakłada automatycznie powiązania z przysiadem. Mechanizm effect_rules pozwala
je dodać dla przyszłego FMS lub innego protokołu bez zmian kodu.

## Wyniki widoczne użytkownikowi

Przykład:

    Shoulder Mobility: raw L 3, raw R 2, wynik bazowy 2
    Shoulder Clearing: L Negative, R Positive
    Wynik końcowy Shoulder Mobility: 0
    Powód: Shoulder Clearing - Ból po stronie prawej

Każdy wynik musi pokazywać:

- wyniki surowe L/R, jeżeli test jest obustronny;
- wynik bazowy;
- wynik końcowy;
- aktywną przyczynę nadpisania, jeżeli istnieje;
- stan bólu i Pass / Fail tam, gdzie dotyczą.

## Total Screen Score

Suma to dodanie pięciu końcowych wyników liczbowych:

    Toe Touch + Shoulder Mobility + Rotation + Balance + Squat

Zakres wynosi 0-15. W interfejsie i raporcie używaj etykiety Total Screen
Score: N, bez przecinków. Wykres historii ma stałą oś 0-15.

## Algorytm

    dla każdego testu liczbowego:
        wynik bazowy = pojedynczy wynik albo minimum(L, R)
        wynik końcowy = wynik bazowy

    dla każdej aktywnej reguły wpływu:
        jeżeli odpowiedź źródłowa spełnia wyzwalacz:
            zapisz applied_effect
            zmień wynik końcowy celu zgodnie z regułą

    suma = suma końcowych wyników liczbowych

Jeżeli wiele reguł ustawia wynik na 0, wynik pozostaje 0, ale raport może
pokazać wszystkie przyczyny.

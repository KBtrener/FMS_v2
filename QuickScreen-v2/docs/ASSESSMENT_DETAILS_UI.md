# QuickScreen V2 — specyfikacja widoku podglądu badania

Ten dokument jest samodzielnym opisem widoku `#/assessment-details/demo`. Osoba rozwijająca makietę nie powinna potrzebować historii rozmów ani znajomości wcześniejszych wersji kodu.

## Zakres

Widok przedstawia statyczny podgląd kompletnego badania QuickScreen klienta Gaweł Kot. Jest to demonstracja UI. Nie wolno dodawać zapisu, obliczeń, API, backendu, Supabase, localStorage ani logiki biznesowej.

Główny renderer znajduje się w `js/assessment-details-clean.js`, a jego style w `css/assessment-details-clean.css`. Te pliki obsługują wyłącznie podgląd badania. Pozostałe widoki mają pozostać bez zmian.

## Hierarchia testów

Test nadrzędny i zależny muszą znajdować się na jednym wspólnym kaflu i mieć jeden wspólny punkt ostateczny po prawej stronie.

Zależności w demonstracji:

| Test nadrzędny | Test zależny |
|---|---|
| Cervical Rotation and Extension | Neck Extension Clearing |
| Shoulder Mobility | Shoulder Clearing |
| Squat | Spine Extension Clearing |

Test zależny nie może być osobnym kaflem na poziomie listy. Ma być wizualnie podrzędny przez wcięcie, jaśniejsze tło i pionowy akcent. Nie dodawaj opisów typu „Clearing podrzędny”, „Wynik clearingu”, „Clearing” ani „Powiązany z…”. Relację pokazuje sama struktura.

## Układ kafla

Każda grupa ma:

1. główną sekcję testu nadrzędnego,
2. surowe wyniki testu nadrzędnego,
3. opcjonalną sekcję testu zależnego,
4. kartę `Punkt ostateczny` po prawej stronie.

Na desktopie punkt ostateczny zajmuje całą wysokość grupy. Na mobile przechodzi pod wynikami. Nie powielaj wyniku bazowego, jeśli jest już widoczny w wynikach surowych i w punkcie ostatecznym.

Karta punktu ostatecznego zawiera wyłącznie napis `Punkt ostateczny` i wartość. Nie dodawaj dopisków `Końcowa odpowiedź` ani `Po uwzględnieniu clearingu`.

## Typy wyników

Nie wszystkie testy używają skali `0–3`.

- testy punktowane: `0 /3`, `1 /3`, `2 /3`, `3 /3` oraz opis `Ból`, `Słabo`, `W normie`, `Super!`,
- testy zakresu: `Pass / Fail`,
- testy bólu: `Ból / Brak bólu`,
- testy bilateralne zawsze pokazują pełne nazwy `Lewa strona` i `Prawa strona`.

Kolorowanie odpowiedzi:

- wartości prawidłowe (`Pass`, `Brak bólu`, `2 /3`, `3 /3`, `W normie`, `Super!`) są zielone,
- wartości wymagające uwagi (`1 /3`, `Słabo`) są żółte, wraz z liczbą,
- wartości bólowe lub niezaliczone (`Ból`, `Fail`, `0 /3`) są czerwone.

Aktualne przykładowe wyniki:

| Test | Surowe dane | Punkt ostateczny |
|---|---|---|
| Cervical Flexion | Zakres `Pass`, ból `Brak bólu` | `Pass` |
| Cervical Rotation and Extension | lewa `Pass`, prawa `Pass`, bez bólu | `Pass` |
| Neck Extension Clearing | lewa `Brak bólu`, prawa `Ból` | `Fail · Ból` |
| Toe Touch | lewa `3 /3`, prawa `3 /3`, `Super!` | `3 /3 · Super!` |
| Shoulder Mobility | lewa `1 /3`, prawa `2 /3` | `0 /3 · Ból` po clearingu |
| Shoulder Clearing | osobno wzorzec górny i dolny, lewa/prawa, ból i zakres | `0 /3 · Ból` |
| Rotation | lewa `0 /3`, prawa `1 /3` | `0 /3 · Ból` |
| Balance | lewa `1 /3`, prawa `2 /3` | `1 /3 · Słabo` |
| Squat | surowo `2 /3 · W normie` | `0 /3 · Ból` po clearingu |
| Spine Extension Clearing | wynik bólu `Ból`, bez `/3` | `Ból` |

## Shoulder Clearing

`Shoulder Clearing` jest jednym testem zależnym. Układ jest organizowany najpierw według stron:

- kafel `Lewa strona`,
- kafel `Prawa strona`.

W każdym kaflu strony znajdują się osobno:

- `Wzorzec górny`,
- `Wzorzec dolny`,
- `Ból`,
- `Zakres`.

Wynik po clearingu jest pokazany dopiero w karcie `Punkt ostateczny` grupy `Shoulder Mobility`.

Clearingi zawierające wyłącznie ocenę bólu pokazują jedną linię odpowiedzi na stronę: `Ból` albo `Brak bólu`. Nie powielaj etykiety `Ból` i wartości w dwóch osobnych liniach.

## Notatki i dokumentacja

Na desktopie prawa kolumna zawiera kolejno:

1. `Notatka trenera`,
2. `Dokumentacja`.

Nie pokazuj osobnej karty `Clearing effects`.

Na mobile karta notatki w prawej kolumnie jest ukryta. Zastępuje ją floating button `Notatki trenera`, który otwiera modal z tą samą statyczną treścią. Dokumentacja pozostaje na stronie.

## Minimalizm i ochrona przed regresją

- Nie dodawaj tekstów opisujących to, co wynika już z układu lub etykiety.
- Nie usuwaj istniejących wyników, jeśli nie są powtórzeniem tej samej informacji.
- Nie zmieniaj hierarchii, kolejności ani układu całej strony przy korekcie pojedynczego kafla.
- Nie twórz kolejnych globalnych override’ów. Style widoku trzymaj w `assessment-details-clean.css`.
- Po zmianach sprawdź route `#/assessment-details/demo` przy szerokości około 390 px i 1440 px.

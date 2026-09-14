# Język raportu — zasady redakcyjne

Wersja: 4.1

> **Wydanie UI 4.1 — obowiązujące uzupełnienie.** Pierwszy ekran ma trzy poziomy: jedna karta decyzji z nazwanym priorytetem, jeden blok `Co robić` (zacznij od / ogranicz / możesz kontynuować) i krótki kontekst z re-testem. Nie powtarzaj priorytetu. Re-test: `Sprawdź ponownie za 1–2 tygodnie.` oraz `Szukamy zmiany w dobrym kierunku, nie od razu idealnego wyniku.` To reguła pracy aplikacji, nie reguła medyczna ani FMS. Przy bólu użyj ustalonego komunikatu o rozmowie 1:1; przy wielu bólach pokaż wszystkie. W pełnych wynikach stosuj małą legendę 3/2/1/0 oraz PASS / FAIL dla Cervical.

## Cel

Raport ma brzmieć jak rozmowa dobrego trenera z klientem: krótko, konkretnie i naturalnie.

Pierwsza część raportu ma dać odpowiedzi na pytania:

1. `Czy mogę trenować / normalnie się ruszać?`
2. `Co jest teraz najważniejsze?`
3. `Co mam zrobić teraz?`
4. `Co chwilowo ograniczyć?`
5. `Co mogę dalej robić?`
6. `Dlaczego ma to znaczenie właśnie dla mnie?`

Jeśli istnieje historia:
7. `Co zmieniło się od poprzedniego badania?`

## 1. Najważniejsza zasada

Mów pewnie o tym, co badanie faktycznie pokazało. Ostrożność zostaw tylko dla przyczyny.

Dobrze:
- `Prawa strona nie spełnia podstawowego standardu.`
- `To jest teraz Twój główny obszar do pracy.`
- `Możesz trenować, ale na razie ogranicz najbardziej wymagające pozycje nad głową.`
- `Lewa strona wypada lepiej, ale obie spełniają podstawowy standard.`
- `Ten wynik jest dobry i nie wymaga teraz pierwszeństwa.`

Nie zgaduj przyczyny:
- nie pisz, że ograniczenie na pewno wynika z konkretnego mięśnia, stawu lub urazu;
- nie przewiduj kontuzji na podstawie samego wyniku.

## 2. Jedna informacja = jedno miejsce

Nie powtarzaj tego samego komunikatu w dwóch sąsiadujących sekcjach.

Źle:
`Najważniejszy obszar: mobilność obręczy barkowej.`
`Główny obszar do pracy: mobilność obręczy barkowej.`

Dobrze:
`Najważniejszy obszar: mobilność obręczy barkowej.`

Jeśli nagłówek już mówi, co jest priorytetem, tekst pod nim ma wyjaśnić **dlaczego** albo **co z tym zrobić**, a nie powtarzać nazwę.

## 3. Nie używaj „normalnie”, jeśli zaraz pojawia się ograniczenie

Jeżeli raport zawiera `temporarily_limit`, nie pisz:
`Możesz normalnie trenować.`

Napisz:
`Możesz trenować, ale na razie ogranicz...`

`Możesz trenować normalnie` jest dozwolone tylko wtedy, gdy dla głównego wyniku nie ma żadnych ograniczeń.

## 4. Zawsze podawaj stronę

Jeśli system zna stronę, raport ma ją nazwać.

Nie:
`Jedna strona wymaga poprawy.`

Tak:
`Prawa strona wymaga poprawy.`

Nie:
`Słabsza strona nadal spełnia podstawowy standard.`

Tak:
`Prawa strona nadal spełnia podstawowy standard, ale lewa wypada lepiej.`

Dla wyników bilateralnych zapisuj czytelnie:
- `Lewa: 1 · Prawa: 3`
- albo `L 1 · P 3`

Nie pokazuj klientowi samego `1/3`, jeśli może to zostać odczytane jako „1 punkt z 3”.

## 5. Ogranicz słowo „warto”

Nie używaj `warto` jako domyślnego czasownika w każdym zaleceniu.

Preferuj:
- `zacznij od...`
- `skup się na...`
- `ogranicz...`
- `kontynuuj...`
- `sprawdź ponownie...`
- `wróć do tego po...`

`Warto` zostaw tylko tam, gdzie komunikat ma być celowo miękki.

## 6. Nie kończ na „zmodyfikuj trening”

Jeśli `ACTION_RULES_DB` zawiera konkret, raport musi go użyć.

Źle:
`Trenuj, ale zmodyfikuj obciążenie.`

Dobrze:
`Możesz trenować. Na razie ogranicz najbardziej dynamiczne zadania na jednej nodze i trudne lądowania. Stabilne ćwiczenia obunóż możesz kontynuować.`

Jeśli baza nie definiuje konkretnego ograniczenia, nie wymyślaj go.

## 7. Nazwa Quick Screen

W tekstach dla klienta nie powtarzaj nazwy `Quick Screen`.

Preferuj:
- `dzisiejsze badanie`,
- `ten test`,
- `dzisiejszy wynik`,
- `podstawowy standard`,
- `wynik badania`.

Nazwa może pozostać w tytule modułu, dokumentacji technicznej i zakładce trenera.

## 8. Techniczne słownictwo

W dokumentacji można używać:
`wzorzec`, `korekcja`, `priorytet`, `asymetria`.

W raporcie klienta preferuj:
- `ruch`,
- `obszar`,
- `różnica między stronami`,
- `główny obszar do pracy`,
- `to jest kolejny obszar do poprawy`.

## 9. Gotowe brzmienie stanów

### Wynik 1
`To jest słabszy obszar. Ten ruch nie spełnia jeszcze podstawowego standardu dzisiejszego badania. Zacznij od poprawy jego jakości, zanim dołożysz większe obciążenie, szybkość lub trudność.`

### Wynik 2
`Dobry wynik. Ten ruch spełnia podstawowy standard. Możesz go dalej rozwijać; nie jest teraz głównym priorytetem.`

### Wynik 3
`Bardzo dobry wynik. W tym ruchu spełniasz wszystkie kryteria testu. To jedna z Twoich mocnych stron.`

### Asymetria 3/2
`Obie strony spełniają podstawowy standard, ale {better_side} wypada lepiej. {weaker_side} nadal ma dobry wynik. Nie musisz ograniczać treningu tylko z powodu tej różnicy, ale dobrze ją zmniejszać w kolejnych etapach pracy.`

### Asymetria z wynikiem 1
`{weaker_side} ma wynik 1 i nie spełnia jeszcze podstawowego standardu. {better_side} wypada lepiej. Zacznij od słabszej strony.`

### Ból
`Podczas tego ruchu pojawił się ból. Na razie ogranicz ruchy i obciążenia, które go odtwarzają. Pozostałą bezbolesną aktywność możesz kontynuować.`

## 10. GENERAL

Nie pisz do osoby nieaktywnej jak do sportowca.

Odnoś wynik do:
- chodzenia,
- schodów,
- siadania i wstawania,
- podnoszenia przedmiotów,
- sięgania,
- obracania się,
- równowagi,
- swobody codziennego ruchu.

Nie ograniczaj normalnych codziennych czynności tylko z powodu wyniku 1, jeśli nie ma bólu. Ograniczenie ma dotyczyć wymuszania trudniejszej wersji ruchu.

## 11. ACTIVE

Odnoś wynik do konkretnych wymagań sportu. Używaj 1–2 najbardziej trafnych przykładów.

Nie wrzucaj wszystkich tagów sportowych do jednego akapitu.

## 12. Historia

Sekcja `Od poprzedniego badania` pojawia się tylko wtedy, gdy istnieje porównywalne wcześniejsze badanie.

Jeśli konto istnieje, ale nie ma historii:
- nie pokazuj `Od poprzedniego badania`;
- użyj krótkiego komunikatu `Twój punkt wyjścia`.

Historia ma podawać fakty:
- co się poprawiło,
- co się pogorszyło,
- czy pojawił się lub ustąpił ból,
- czy pojawiła się lub zniknęła różnica między stronami,
- czy zmienił się główny priorytet.

Nie używaj sekcji historii do opisywania obecnej hierarchii.

## 13. Protect / Correct / Develop

Etykiety mogą zostać w UI.

Nie dodawaj pod nimi tekstu:
`nie są diagnozą`.

W środku raportu nie powtarzaj disclaimerów. Wystarczy jeden na końcu.

## 14. Kolejność komunikatu

Najważniejsza część raportu:

1. **Czy możesz trenować / funkcjonować**
2. **Najważniejszy obszar**
3. **Co zrobić teraz**
4. **Co chwilowo ograniczyć**
5. **Co możesz kontynuować**
6. **Dlaczego ma to znaczenie**
7. **Historia** — tylko gdy istnieje
8. dopiero potem pełne wyniki.

## 15. Ton sprzedażowy

Wartość raportu ma wynikać z konkretu.

Dobre:
- `Masz jeden wyraźny priorytet.`
- `Od tego zacznij.`
- `Pozostałe ruchy możesz dalej rozwijać.`
- `W Twoim sporcie ma to znaczenie szczególnie przy...`
- `Wiesz już, co ograniczyć i co możesz kontynuować.`

Nie stosuj:
- straszenia urazem,
- diagnozowania przyczyny,
- sztucznego problematyzowania wyniku 2,
- wielokrotnych zastrzeżeń,
- języka typu `kandydat do korekcji` w raporcie klienta.

## 16. Disclaimer

Jeden, na końcu:

`Badanie ma charakter przesiewowy. Pokazuje, które obszary wymagają uwagi i co można zrobić dalej, ale nie określa przyczyny bólu ani ograniczenia.`

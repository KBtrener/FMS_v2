# FMS Report Engine — baza treści, decyzji i logiki

Wersja: 4.1

## Cel

Ten pakiet ma wystarczyć Codexowi do zbudowania deterministycznego generatora raportów bez LLM i bez dostępu do rozmowy projektowej.

Generator ma nie tylko opisywać wyniki. Ma dawać badanemu konkretną odpowiedź:

1. **Czy mogę normalnie trenować / funkcjonować?**
2. **Co jest teraz najważniejsze?**
3. **Co powinienem zrobić teraz?**
4. **Co chwilowo ograniczyć?**
5. **Co mogę dalej robić normalnie?**
6. **Dlaczego ten wynik ma znaczenie dla mojego sportu albo codziennego życia?**
7. **Co zmieniło się od poprzedniego badania?** — jeśli istnieje historia.

## Pliki

- `FMS_REPORT_LANGUAGE_GUIDE.md` — nadrzędne zasady języka i stylu.
- `FMS_REPORT_DATA_CONTRACT.md` — model danych wejściowych i wyjściowych.
- `FMS_REPORT_TESTS_DB.md` — definicje testów, kryteria punktacji i znaczenie.
- `FMS_REPORT_RESULT_STATES_DB.md` — znaczenie 0/1/2/3, bólu, asymetrii i Fail.
- `FMS_REPORT_ACTION_RULES_DB.md` — **konkretne zalecenia: co robić, co ograniczyć, co można kontynuować**.
- `FMS_REPORT_SPORT_PROFILES_DB.md` — profile GENERAL / ACTIVE, tagi wymagań ruchowych, sporty i przykłady sportowe.
- `FMS_REPORT_USER_STATE_DB.md` — nowy użytkownik / klient / historia / CTA.
- `FMS_REPORT_LOGIC_AND_TEMPLATES.md` — wybór priorytetu i składanie raportu.
- `FMS_REPORT_EDGE_CASES_AND_VALIDATION.md` — przypadki graniczne i walidacja.
- `FMS_REPORT_EXAMPLES.md` — przykłady gotowych raportów.
- `FMS_QUICK_SCREEN_TRAINER_RULES.md` — skrócona ściąga do zakładki trenera.

## Najważniejsza architektura

```text
wynik badania
    ↓
ból / Protect
    ↓
wynik 1 / Fail / asymetria
    ↓
hierarchia priorytetów
    ↓
PRIMARY + SECONDARY + DEVELOP
    ↓
konkretne ACTION RULES
    ↓
GENERAL albo ACTIVE
    ↓
tagi wymagań ruchowych
    ↓
sport / codzienne funkcjonowanie
    ↓
historia
    ↓
raport
```

## Zasady domenowe

- Ból ma pierwszeństwo nad jakością ruchu.
- Wynik `1` oznacza, że ruch nie spełnia podstawowego standardu badania.
- Wynik `2` spełnia podstawowy standard i nie jest automatycznie problemem.
- Wynik `3` spełnia wszystkie kryteria testu.
- Asymetria jest osobną informacją i może zostać priorytetem nawet przy wyniku `3/2`.
- Priorytet wybiera się na podstawie bólu, wyniku 1 / Fail / asymetrii oraz hierarchii:
  `cervical -> toe_touch -> shoulder_mobility -> squat -> balance -> rotation`.
- Sport nie zmienia kolejności korekcji. Tłumaczy zalecenie na sytuacje występujące w danej dyscyplinie.
- Profil GENERAL używa tej samej logiki ruchowej, ale przekłada ją na codzienne czynności.
- Historia i status klienta nie zmieniają interpretacji ruchowej.

## Action Rules: ważne rozróżnienie

`FMS_REPORT_ACTION_RULES_DB.md` zawiera dwie warstwy:

- `basis: protocol/manual` — reguła wynika bezpośrednio z zasad testu lub przykładu korekcyjnego w materiałach źródłowych;
- `basis: application_translation` — praktyczne przełożenie wyniku na język treningu lub codziennego funkcjonowania przygotowane dla tej aplikacji.

Nie przedstawiaj `application_translation` jako oficjalnego protokołu FMS. Jest to warstwa aplikacyjna, która ma dać użytkownikowi użyteczny następny krok bez diagnozowania przyczyny.

## Zasada implementacyjna

Kod może:

- wybierać gotowe warianty,
- podstawiać stronę L/R,
- podstawiać nazwę sportu,
- wybierać konkretne przykłady na podstawie tagów,
- składać zdania,
- porównywać historię.

Kod nie powinien sam tworzyć nowych medycznych interpretacji ani nowych zakazów spoza zdefiniowanych reguł.

# Kanoniczny układ raportu klienta

Ten dokument opisuje **prezentację** raportu. Jest zgodny z zaakceptowaną makietą raportu klienta oraz skillem `simple-client-report-ui`.

Nie zmienia zasad punktacji, hierarchii priorytetów ani Action Rules. Te pozostają źródłem znaczenia. Blueprint określa wyłącznie kolejność, w jakiej klient otrzymuje gotową odpowiedź.

## Zasada nadrzędna

Raport nie jest panelem diagnostycznym ani surową tabelą wyników. Prowadzi klienta przez prostą historię:

```text
kontekst → wynik → jeden priorytet → działanie → pomoc → szczegóły
```

W razie rozbieżności dotyczącej **układu lub kolejności sekcji**, ten dokument ma pierwszeństwo przed starszymi przykładami i opisami prezentacji w pozostałych plikach bazy.

## Obowiązkowy rytm raportu

### Nagłówek — jaki to raport?

Krótko pokaż: klienta, nazwę raportu/badania, kontekst lub sport, datę i identyfikator, jeśli jest dostępny. Narzędzia powrotu i druku mogą pozostać kompaktowe.

### 01 / Wstęp — co sprawdziliśmy?

Jedno krótkie wyjaśnienie celu badania. Nie zaczynaj od metodologii ani tabeli punktów.

### 02 / Twój wynik — co wyszło?

Pokaż krótkie, naturalne opisy obserwacji. Wynik liczbowy, strony L/P i nazwy techniczne są pomocnicze — nie mogą wymagać od klienta samodzielnego wyboru priorytetu.

Na końcu tej sekcji umieść jeden wyraźny blok:

```text
Najważniejszy obszar do pracy
→ co jest pierwszym krokiem
→ dlaczego właśnie ten obszar
```

### 03 / Zalecenia — co robić teraz?

Użyj trzech bloków w tej kolejności:

1. **Chroń** — co konkretnie chwilowo ograniczyć.
2. **Popraw** — na czym skupić pracę teraz.
3. **Rozwijaj** — co można kontynuować lub rozwijać.

Treść każdego bloku pochodzi wyłącznie z `ACTION_RULES_DB` oraz warstwy semantycznej. Przy bólu należy ograniczać ruchy i obciążenia, które go odtwarzają; nie zakładać automatycznie przerwania całej aktywności.

Poniżej pokaż małą, widoczną notę o re-teście, jeśli reguła lub trener określają warunek albo termin.

Odpowiedź na pytanie „czy mogę trenować / funkcjonować?” ma wynikać jasno z bloków **Chroń** i **Rozwijaj**. Nie musi być pierwszym nagłówkiem raportu.

### 04 / Jak to zrobić — jak uzyskać pomoc?

Jeśli projekt udostępnia materiały lub ofertę wsparcia, pokaż dwie proste ścieżki:

- samodzielnie — wybrane materiały;
- z pomocą — program, konsultacja lub kontakt.

Nie twórz oferty, linku, ćwiczeń ani terminu, jeżeli nie występują w danych projektu.

### Szczegóły opcjonalne

Pełne wyniki, punktacja, pomiary stron, metodologia i techniczne nazwy testów mogą wystąpić niżej lub za rozwijanym szczegółem. Nigdy nie mogą przesłonić decyzji klienta.

### Stopka

Stopka może zawierać markę, prowadzącego, kontakt oraz jedno CTA, jeżeli dane są dostępne. Disclaimer pokazuj tylko raz:

> Badanie ma charakter przesiewowy. Pokazuje, które obszary wymagają uwagi i co można zrobić dalej, ale nie określa przyczyny bólu ani ograniczenia.

## Zasady języka

- Jedna sekcja odpowiada na jedno pytanie klienta.
- Mów o wyniku pewnie, ale nie zgaduj jego przyczyny.
- Gdy znana jest strona, nazwij ją.
- W głównej części używaj naturalnych nazw ruchu; techniczne nazwy zostaw do szczegółów.
- Nie powtarzaj tej samej informacji w sąsiednich blokach.
- Zachowaj kolejność `kontekst → wynik → priorytet → działanie → pomoc → szczegóły`.

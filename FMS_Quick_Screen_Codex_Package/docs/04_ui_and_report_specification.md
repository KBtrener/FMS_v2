# Interfejs i raport

## Zasady interfejsu

Interfejs ma być spokojny, prosty i szybki w użyciu podczas badania. Nie jest
CRM-em ani panelem medycznym. Priorytetem jest jednoznaczny zapis testu bez
szukania funkcji lub przewijania po wielu ekranach.

- Język interfejsu: polski.
- Priorytet: telefon i tablet, z pełnym działaniem na komputerze.
- Duże pola dotykowe, wysoki kontrast i jasny stan wybranej odpowiedzi.
- Nie koduj znaczenia wyłącznie kolorem.
- Wartości liczbowe bez miejsc po przecinku.
- Opis i Kryteria oceny są dostępne w rozwijanym panelu lub oknie; nie
  przenoszą trenera na inną stronę.

## Ekrany

### 1. Lista klientów

- wyszukiwarka po imieniu, nazwisku i e-mailu;
- przycisk Nowy klient;
- ostatnia data badania i ostatni Total Screen Score;
- możliwość wejścia w profil klienta.

### 2. Formularz klienta

Wymagane: imię, nazwisko, e-mail.

Opcjonalne: brak dodatkowych danych w MVP. Data dotyczy badania, nie profilu.
Przy podobnym e-mailu pokaż ostrzeżenie, ale pozwól kontynuować.

### 3. Badanie

Widok może być wizardem, serią kart albo hybrydą, o ile jest szybki.
Każda karta ma:

- nazwę testu;
- opcjonalny skrócony opis;
- przycisk Kryteria oceny;
- pola odpowiedzi;
- opcjonalną krótką notatkę do całego badania;
- jasne oznaczenie postępu.

Dla odpowiedzi binarnych:

    Zakres ruchu:  [ Pass ] [ Fail ]
    Ból:           [ Brak bólu ] [ Ból ]

Dla punktacji ruchu:

    Wynik: [ 0 - ból ] [ 1 ] [ 2 ] [ 3 ]

Przy Cervical Rotation dla lewej i prawej strony pokaż osobno:

    1. zakres rotacji;
    2. ból przy rotacji;
    3. ból przy rotacji z wyprostem.

Nie wolno łączyć dwóch ostatnich odpowiedzi w jeden przełącznik.

Na ostatniej karcie jest jeden przycisk Zakończ badanie. Zapisuje badanie i
natychmiast przechodzi do profilu klienta. Nie twórz osobnego przycisku
zapisania raportu.

Niedokończone dane mogą być przechowywane wyłącznie tymczasowo w aktualnej
sesji przeglądarki, aby ochronić przed przypadkowym odświeżeniem. Należy je
wyczyścić po udanym zapisie i nie traktować jako części historii.

### 4. Podsumowanie po badaniu i profil

Bezpośrednio po zapisie pokaż:

- bieżący Total Screen Score;
- wynik każdego testu;
- wynik surowy, bazowy i końcowy, gdy są różne;
- flagi bólu i Pass / Fail;
- powody nadpisania wyniku;
- historię klienta i wykres;
- przycisk Wygeneruj raport.

### 5. Konfiguracja

Oddzielny widok właściciela dla katalogu testów, kryteriów, pól odpowiedzi i
effect_rules. Nie powinien być elementem codziennego przebiegu badania.

## Raport

Raport jest generowany tylko na żądanie z aktualnych danych. Nie tworzy
diagnozy, nie interpretuje medycznie i nie zaleca ćwiczeń. Opisuje fakty.

### Zawartość

1. Dane klienta, data badania i tytuł raportu.
2. Bieżące podsumowanie:
   - Total Screen Score;
   - wyniki końcowe testów liczbowych;
   - Pass / Fail;
   - Positive / Negative;
   - flagi bólu;
   - wynik zmieniony przez clearing test wraz z przyczyną.
3. Historia:
   - wykres Total Screen Score w czasie;
   - dla jednego badania tekst Brak danych historycznych zamiast pustego
     wykresu;
   - dla co najmniej dwóch badań neutralne zmiany, np. 2 -> 3, Pass -> Fail,
     Negative -> Positive;
   - nie wyciągać wniosków typu poprawa funkcji albo problem zdrowotny.
4. Macierz historii:
   - testy w wierszach;
   - daty badań w kolumnach;
   - dla testów obustronnych wartości L/R i wynik końcowy;
   - dla clearing tests i szyi pełne słowa, nie same skróty P/N.

Przy do pięciu badaniach macierz może być ułożona na jednej stronie poziomej.
Przy większej liczbie należy dzielić kolumny na kolejne strony, a nie
zmniejszać tekst do nieczytelnego rozmiaru.

### Akcje raportu

- Podgląd raportu.
- Pobierz PDF.
- Przygotuj e-mail.

Przygotuj e-mail pokazuje edytowalnych odbiorców. E-mail klienta jest
podpowiedzią, a e-mail trenera wpisuje się lub wybiera przy generowaniu
raportu. Operacja tworzy szkic, nie wysyła go automatycznie.

Wygenerowany PDF nie może zostać trwałym plikiem na Dysku. Jeśli do technicznej
generacji potrzebny jest plik tymczasowy, musi zostać usunięty po przekazaniu
PDF do przeglądarki albo do szkicu Gmail.

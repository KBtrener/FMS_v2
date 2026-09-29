# QuickScreen V2 — flow rozpoczęcia badania i wizarda

Ten dokument opisuje zachowanie rozpoczęcia badania i kolejność testów. Nie określa wyglądu interfejsu; jedynym źródłem wytycznych wizualnych jest `../design.md`. Makieta pozostaje statyczna: wyszukiwanie korzysta wyłącznie z danych demonstracyjnych i nie zapisuje klienta ani badania do bazy.

## Pierwszy krok: klient

Kliknięcie „Nowe badanie” otwiera pierwszy ekran wizarda z jednym prostym formularzem klienta. Zawiera pola: **Imię**, **Nazwisko**, **E-mail** i **Dyscyplina**.

- Wejście z profilu klienta wypełnia wszystkie cztery pola danymi tego profilu.
- Wejście z ogólnej akcji „Nowe badanie” otwiera puste pola.
- Wpisywanie w pole imienia, nazwiska lub e-maila uruchamia wyszukiwanie po co najmniej 3 znakach wpisanych w tym polu.
- Wyniki podpowiedzi są filtrowane według wpisywanego pola. Wybór klienta uzupełnia wszystkie cztery pola jego zapisanymi danymi.
- Brak wybranego wyniku nie blokuje dalszego wpisywania danych nowej osoby.

### Docelowa reguła backendu

Przed utworzeniem klienta backend porównuje znormalizowane imię, nazwisko i e-mail z istniejącymi rekordami. Dyscyplina jest uzupełnianym polem profilu, nie identyfikatorem osoby. Jednoznaczne dopasowanie oznacza przypisanie badania do istniejącego klienta; brak dopasowania oznacza utworzenie nowego rekordu. Przy niejednoznacznym dopasowaniu trener wybiera właściwy profil zamiast automatycznego przypisania. Sam e-mail nie jest unikalnym identyfikatorem — mogą istnieć różne osoby z tym samym adresem.

W tej makiecie przyciski i podpowiedzi pokazują zamierzony przepływ na fixture’ach. Nie wykonują żądań ani zapisu do backendu.

## Testy w wizardzie

Po potwierdzeniu lub dodaniu danych klienta rozpoczyna się istniejąca kolejność testów. Liczbę kroków testowych należy brać z aktualnej konfiguracji makiety, nie z wpisanej na stałe wartości w briefie. W bieżącej konfiguracji V2 są 10 pozycji testowych.

Każdy test jest pełnym elementem badania w zwykłej sekwencji. **Shoulder Clearing jest zwykłym, kompletnym testem tej sekwencji**, a nie specjalnym trybem, dodatkową czynnością ani dwoma osobnymi testami. Zachowuje swoje własne odpowiedzi i kryteria.

### Dane testu Shoulder Clearing

- Test zachowuje odpowiedzi dla lewej i prawej strony.
- Dla każdej strony zapisz osobno ból i zakres dla wzorca górnego oraz dolnego.
- Clearing jest pełnym testem w zwykłej sekwencji; jego odpowiedzi wpływają na wynik Shoulder Mobility zgodnie z regułami punktacji.

Ta prezentacja nie zmienia merytorycznej relacji wyniku Shoulder Clearing do wyniku Shoulder Mobility ani reguł punktacji opisanych w źródłach scoringu.

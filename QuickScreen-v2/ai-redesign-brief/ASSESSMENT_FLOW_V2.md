# QuickScreen V2 — flow rozpoczęcia badania i wizarda

Ten dokument opisuje makietę V2. Jest nadrzędny wobec starszego audytu produkcyjnego `CURRENT_APP_UI_AUDIT.md` w zakresie rozpoczęcia badania i wyglądu wizarda. Makieta pozostaje statyczna: wyszukiwanie korzysta wyłącznie z danych demonstracyjnych i nie zapisuje klienta ani badania do bazy.

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

### Układ Shoulder Clearing

- Jeden kafelek testu `Shoulder Clearing`.
- Najpierw sekcja **Lewa strona**, pod nią sekcja **Prawa strona**.
- W każdej stronie znajdują się pola **Wzorzec górny** i **Wzorzec dolny**; każde zachowuje odpowiedzi bólu i zakresu zgodne z makietą.
- Nie używaj etykiet „Osobny test clearingowy”, „test podrzędny” ani komunikatu „Komplet odpowiedzi”. Nie opisuj tego testu jako szczególnego przypadku.
- Panel kryteriów nie zawiera niebieskiej belki informacyjnej.

Ta prezentacja nie zmienia merytorycznej relacji wyniku Shoulder Clearing do wyniku Shoulder Mobility ani reguł punktacji opisanych w źródłach scoringu.

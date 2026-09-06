# Decyzje i granice projektu

## Zatwierdzone decyzje

- Budujemy nową aplikację.
- Pierwszy moduł to FMS Quick Screen.
- Badanie zawsze wprowadza trener.
- Dane są przechowywane na koncie Google właściciela.
- Technologia MVP: Google Apps Script plus Google Sheets.
- W pierwszej wersji dostęp ma tylko właściciel.
- Nie ma tabeli wersji protokołu.
- Wyniki liczbowe są całkowite.
- Raporty są generowane na żądanie i nie są przechowywane jako pliki na Dysku.
- Po Zakończ badanie wynik zapisuje się automatycznie, a użytkownik przechodzi
  do profilu klienta.
- E-mail trenera jest wybierany przy tworzeniu raportu.
- Dane klienta: imię, nazwisko, e-mail; w badaniu data i notatka opcjonalna.
- Możliwa jest korekta oraz archiwizacja danych.
- Historia ma pokazywać trend sumy punktów i macierz wyników.
- Raport opisuje zmianę danych, nie wnioskuje o stanie zdrowia.

## Domyślne decyzje implementacyjne

- Domyślnym sposobem przygotowania wiadomości jest szkic Gmaila, nigdy
  automatyczna wysyłka.
- Klient jest identyfikowany przez client_id, a nie przez e-mail.
- Poprawione badanie aktualizuje przyszłe raporty i wykresy.
- Testy są konfigurowalne, ale codzienny ekran badań nie pozwala przypadkowo
  zmieniać reguł.
- Przyciski w Quick Screen mają pełne słowa: Pass, Fail, Ból, Brak bólu.

## Ważne ograniczenia źródłowe

- Shoulder Clearing ma w Quick Screen bezpośredni wpływ na wynik Shoulder
  Mobility.
- Spine Extension Clearing jest zapisywany jako Positive / Negative, ale
  przekazane materiały nie przypisują mu automatycznie przysiadu. Dlatego
  produkcyjna konfiguracja Quick Screen nie ma takiej relacji.
- Mechanizm relacji jest gotowy dla przyszłego FMS lub innego protokołu.
- Aplikacja ma korzystać z własnego wyglądu, nie z kopii identyfikacji FMS.

## Do decyzji dopiero przed rozszerzeniem

- Dostęp dla innych trenerów i role użytkowników.
- Trwałe usuwanie danych zamiast samej archiwizacji.
- Docelowa marka raportu: logo, kolorystyka, stopka i dane firmy.
- Pełna konfiguracja FMS i SFMA po dostarczeniu odpowiednich źródeł.

## Ochrona danych

Nawet prosty MVP powinien używać prywatnego arkusza i właścicielskiego konta
Google. Nie wolno udostępniać arkusza publicznie ani osadzać tajnych danych w
przeglądarce. Przed użyciem aplikacji z rzeczywistymi danymi należy ustalić
odpowiednią podstawę i informacje dla klientów dotyczące przetwarzania danych.

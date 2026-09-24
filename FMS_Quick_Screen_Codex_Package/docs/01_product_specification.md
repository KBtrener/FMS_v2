# Specyfikacja produktu

## Cel

Prosta, szybka aplikacja dla trenera do przeprowadzania FMS Quick Screen,
zapisu historii klienta, obserwacji zmian w czasie oraz przygotowania
neutralnego raportu do przekazania klientowi lub innemu trenerowi.

## Zakres MVP

- Nowa aplikacja, niezależna od fms.kbtrener.pl.
- Tylko jeden użytkownik: trener-właściciel konta Google.
- Tylko moduł FMS Quick Screen w pierwszej wersji.
- Klienci bez kont i bez samodzielnego wypełniania.
- Dane: imię, nazwisko, e-mail, data badania, opcjonalna notatka.
- Historia badań klienta, wykres sumy punktów i tabela porównawcza.
- Raport na żądanie jako podgląd, PDF i opcjonalny szkic e-maila.
- Edycja klienta i korekta badania.
- Archiwizacja i przywracanie badania lub klienta.

## Poza zakresem MVP

- Diagnostyka medyczna, zalecenia terapeutyczne, automatyczne programy ćwiczeń.
- Konta klientów, portal klienta, płatności, nagrywanie wideo i automatyczna
  ocena obrazu.
- Automatyczna wysyłka e-maili.
- Pełne moduły FMS i SFMA. Model danych ma jednak umożliwić ich dodanie.

## Główny przepływ

1. Trener rozpoczyna badanie w pierwszym kroku wyboru klienta. Z profilu klienta jego imię, nazwisko, e-mail i dyscyplina są wstępnie uzupełnione.
2. W pustym formularzu trener może wpisać imię, nazwisko lub e-mail. Po minimum 3 znakach w danym polu system pokazuje pasujące profile z bazy; wybranie profilu uzupełnia wszystkie cztery pola. Trener może też kontynuować wpisywanie danych nowej osoby.
3. Przed utworzeniem rekordu backend dopasowuje znormalizowane imię, nazwisko i e-mail: jednoznaczne dopasowanie używa istniejącego klienta, brak dopasowania tworzy nowego, a wiele dopasowań wymaga wskazania właściwego profilu. Dyscyplina jest daną profilu, nie identyfikatorem osoby. Sam e-mail nie jest kluczem, bo różne osoby mogą go współdzielić.
4. Rozpoczyna Quick Screen w jednym szybkim widoku krokowym lub układzie kart.
   Dokładny wariant interfejsu może zostać wybrany pod kątem szybkości, nie
   jest wymagane kopiowanie istniejącego wizarda.
5. Przy każdym teście widzi krótki opis oraz przycisk Kryteria oceny.
6. Wprowadza wyniki. Odpowiedzi binarne mają dwa duże, jednoznaczne przyciski:
   Pass / Fail albo Brak bólu / Ból.
7. W ostatnim kroku naciska jeden przycisk Zakończ badanie.
8. Aplikacja waliduje dane, zapisuje odpowiedzi i oblicza wyniki.
9. Pojawia się profil klienta z aktualnym wynikiem, historią i przyciskiem
   Wygeneruj raport.

## Profil klienta

Profil pokazuje:

- dane klienta z możliwością edycji;
- najnowsze badanie i datę;
- sumę punktów oraz wyniki końcowe testów;
- flagi bólu, Pass / Fail i asymetrie;
- chronologiczną listę badań;
- wykres Total Screen Score w czasie;
- przyciski: Nowe badanie, Edytuj dane, Edytuj badanie, Archiwizuj.

E-mail klienta nie jest kluczem głównym. Jest możliwe, że dwie osoby użyją
tego samego adresu. Przy rozpoznawaniu istniejącego profilu e-mail należy
łączyć z imieniem i nazwiskiem; nie wolno automatycznie przypisać badania
wyłącznie na podstawie wspólnego adresu. Jeśli dopasowanie pozostaje
niejednoznaczne, trener wskazuje właściwy profil.

## Korekta i archiwizacja

Korekta starego badania aktualizuje kolejne widoki historii i przyszłe
raporty. Aplikacja zapisuje datę modyfikacji oraz opcjonalną notatkę korekty.
PDF pobrany lub wysłany wcześniej nie zmienia się.

Standardowa akcja Usuń oznacza archiwizację z możliwością przywrócenia.
Trwałe usunięcie może zostać dodane jako osobna, silnie potwierdzana operacja,
ale nie jest potrzebne do pierwszego odbioru.

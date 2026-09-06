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

1. Trener wyszukuje klienta albo zakłada nowy profil.
2. Rozpoczyna Quick Screen w jednym szybkim widoku krokowym lub układzie kart.
   Dokładny wariant interfejsu może zostać wybrany pod kątem szybkości, nie
   jest wymagane kopiowanie istniejącego wizarda.
3. Przy każdym teście widzi krótki opis oraz przycisk Kryteria oceny.
4. Wprowadza wyniki. Odpowiedzi binarne mają dwa duże, jednoznaczne przyciski:
   Pass / Fail albo Brak bólu / Ból.
5. W ostatnim kroku naciska jeden przycisk Zakończ badanie.
6. Aplikacja waliduje dane, zapisuje odpowiedzi i oblicza wyniki.
7. Pojawia się profil klienta z aktualnym wynikiem, historią i przyciskiem
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
tego samego adresu; aplikacja ma jedynie ostrzegać o możliwym duplikacie.

## Korekta i archiwizacja

Korekta starego badania aktualizuje kolejne widoki historii i przyszłe
raporty. Aplikacja zapisuje datę modyfikacji oraz opcjonalną notatkę korekty.
PDF pobrany lub wysłany wcześniej nie zmienia się.

Standardowa akcja Usuń oznacza archiwizację z możliwością przywrócenia.
Trwałe usunięcie może zostać dodane jako osobna, silnie potwierdzana operacja,
ale nie jest potrzebne do pierwszego odbioru.

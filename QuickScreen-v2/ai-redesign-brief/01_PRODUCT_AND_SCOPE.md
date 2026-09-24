# Produkt i zakres przeprojektowania

## Produkt

QuickScreen to robocze narzędzie dla trenera do przeprowadzania screeningu FMS: zarządzania klientami, wykonania badania według aktualnej konfiguracji, interpretacji wyniku oraz wygenerowania raportu. To nie jest aplikacja medyczna ani generyczny dashboard SaaS.

Użytkownik pracuje w ruchu, często jedną ręką, między klientami i w trakcie sesji. Interfejs musi więc być szybki do zeskanowania, odporny na przerwania i wygodny na telefonie, ale również czytelny na desktopie.

## Najważniejszy przebieg

```text
Logowanie → lista klientów → profil klienta → nowe badanie
→ krok 1 wizarda: wybór / potwierdzenie klienta → skonfigurowane testy
→ wynik / korekty → podgląd raportu → PDF
```

## Ekrany do przeprojektowania teraz

- logowanie i odzyskiwanie hasła,
- pierwszy krok nowego badania: wybór klienta albo wpisanie danych nowego klienta,
- wizard badania: postęp, instrukcja, ocena, notatka, kryteria,
- szczegóły zapisanego badania i historia,
- konfiguracja testów i reguł,
- konto trenera oraz panel zespołu,
- stany puste, ładowanie, błąd, sukces i tryb offline/synchronizacji.

## Ekrany poza zakresem pierwszej rundy

Nie twórz nowych wariantów tych widoków. Zachowaj je jako referencje spójności:

- panel/lista klientów,
- podgląd raportu PDF.

## Wymagania UX

- Mobile-first; kluczowe akcje mają obszar dotyku min. 48 × 48 px.
- Krok wyboru klienta poprzedza testy i nie wchodzi do ich punktacji. Liczba i kolejność testów po nim wynikają z aktualnej konfiguracji; w bieżącej makiecie V2 jest 10 pozycji.
- Wybór klienta używa jednego prostego formularza: imię, nazwisko, e-mail i dyscyplina. Wejście z profilu wypełnia go automatycznie; wyszukiwanie po imieniu, nazwisku lub e-mailu pokazuje dopasowania po wpisaniu minimum 3 znaków.
- Po wybraniu podpowiedzi wszystkie dane klienta są uzupełniane. Bez wyboru trener może kontynuować wpisywanie danych nowej osoby. Docelowo backend przed utworzeniem rekordu sprawdza jednoznaczne dopasowanie danych: przypisuje istniejącego klienta, tworzy nowego przy braku dopasowania, a przy niejednoznaczności prosi o wybór. Sam e-mail nie jest unikalnym identyfikatorem.
- Wyniki i ból muszą być rozróżnialne bez polegania wyłącznie na kolorze.
- Testy bilateralne mają osobne odpowiedzi dla lewej/prawej strony. Shoulder Clearing jest zwykłym, kompletnym testem w kolejności badania; jeden kafelek zawiera najpierw lewą, potem prawą stronę, a w każdej wzorzec górny i dolny.
- Zapis szkicu lokalnego i stan synchronizacji muszą być widoczne, ale dyskretne.
- Długie treści kryteriów otwieraj w panelu dolnym lub drawerze; nie wyrywaj użytkownika z badania.
- Zachowaj polskie etykiety i naturalny, konkretny język.

## Dane, które interfejs musi umieć pokazać

- klient: imię, kontakt, dyscyplina, status archiwalny,
- badanie: data, kontekst, wynik /15, wyniki testów, ból, asymetria, notatki,
- raport: gotowość, dodatkowe sekcje, wydruk/pobranie, historia snapshotów,
- konto: certyfikacje, rola w zespole, konfiguracja reguł clearingu.

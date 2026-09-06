# Gotowość do implementacji

Przegląd: 2026-09-06.

## Dostępne materiały

- Siedem dokumentów: produkt, dane, punktacja, UI/raport, wdrożenie, odbiór, decyzje.
- Konfiguracja: jeden protokół, dziewięć pozycji testowych, dwanaście definicji
  pól i trzy zestawy odpowiedzi. Shoulder Clearing jest osobną pozycją
  konfiguracji, którą interfejs może pokazać razem z Shoulder Mobility.
- Pięć fikcyjnych badań, trzech klientów i oczekiwany raport historii.
- Weryfikator danych testowych: PASS, w tym historia 9/11/11, Shoulder Clearing
  i oddzielny scenariusz demonstracyjnego wpływu Spine Extension na Squat.
- Podręcznik PDF: 47 stron pliku; arkusz punktacji PDF: jedna strona.
- Lokalnie dostępne Git 2.52.0, Node.js 24.12.0 i npm 11.7.0.
- Zdalne repozytorium odpowiada; przed przygotowaniem nie zawierało referencji Git.

## Ustalenia do implementacji

1. Obowiązuje zakres MVP z pakietu. Nie trzeba wybierać technologii, hostingu,
   modułów ani projektu marki przed rozpoczęciem pracy.
2. Numery stron w specyfikacji odnoszą się do numeracji drukowanej podręcznika;
   numer strony pliku PDF jest o dwa większy. Szczegółowa punktacja Toe Touch
   jest na stronie drukowanej 14, Rotation na 20, a Cervical Flexion na 10.
   Przy tworzeniu podpowiedzi uzupełnić precyzyjne odwołania; zachować oryginał pakietu.
3. Kontrola wizualna arkusza potwierdza, że Flexion Clearing Test znajduje się
   w sekcji Cervical Flexion. W pakiecie odpowiada mu pole bólu przy zgięciu
   szyi; nie jest potrzebny dodatkowy test. Osobne pola bólu przy rotacji i
   rotacji z wyprostem są opisane na stronie drukowanej 11 podręcznika.
4. Ból ma pierwszeństwo również przy zapisie najlepszego wyniku z prób.
   MVP może zapisywać jedną ocenę podsumowującą na stronę, zgodnie ze specyfikacją.
5. Powiązanie Shoulder Clearing z Shoulder Mobility potwierdza podręcznik,
   strona drukowana 17. Spine Extension Clearing na stronie 26 nie przypisuje
   wyniku do Squat; reguła demonstracyjna pozostaje poza produkcją.
6. Historia zachowuje zapis zastosowanych wpływów. Edycja konfiguracji nie
   może usuwać ani po cichu zmieniać skutków zapisanych dla dawnych badań.
   Korekta konkretnego badania odtwarza jego wpływy zgodnie z wymaganiami pakietu.
7. Weryfikator pakietu nie zastępuje walidacji serwera i testów aplikacji.
8. Integracja Gmail wymaga osobnego uruchomienia i zgody; bazowa aplikacja
   powinna działać bez niej. Szczegóły OAuth trzeba zweryfikować przy implementacji.

## Kolejność prac po zatwierdzeniu

1. Narzędzia budowania, silnik punktacji i walidacja wraz z testami.
2. Warstwa Sheets: inicjalizacja tabel, identyfikatory, blokady zapisu,
   obsługa klientów, badań, korekt, archiwizacji i przywracania.
3. Interfejs telefonu/tabletu/komputera, historia, wykres i konfiguracja.
4. Podgląd raportu, pobieranie PDF i opcjonalna obsługa szkiców.
5. Autoryzacja właściwego konta Google, zasoby prywatne, wdrożenie testowe,
   testy odbiorowe i wdrożenie produkcyjne z instrukcją przekazania.

## Informacje od właściciela

Przed kodowaniem: zatwierdzenie rozpoczęcia zgodnie z pakietem.
Właściciel wskazał konto `info@kbtrener.pl` oraz folder
`1jFAX9C5JROxTTrnNRt9QXUMEjsKD88yZ`. Operacje Google Drive są ograniczone do
tego folderu i jego podfolderów, zgodnie z `DRIVE_SCOPE.md` i
`config/deployment.json`. Nie sprawdzono jeszcze dostępu do folderu.
Przed wdrożeniem będzie potrzebna interaktywna zgoda OAuth na tym koncie.
Hasła i tokeny nie są potrzebne w rozmowie. Istnienie lokalnego pliku clasp
nie potwierdza tożsamości konta ani ważności autoryzacji; jego treści nie odczytywano.

Nie wdrożono jeszcze aplikacji ani nie utworzono zasobów Google.

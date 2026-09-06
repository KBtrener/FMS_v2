# Granica operacji Google Drive

Ustalenie właściciela z 2026-09-06. Obowiązuje wszystkie prace nad tym projektem,
narzędzia wdrożeniowe, testy integracyjne i docelową aplikację.

Konto właściciela: `info@kbtrener.pl`.
Dozwolony folder: `1jFAX9C5JROxTTrnNRt9QXUMEjsKD88yZ`.
Konfiguracja maszynowa: `config/deployment.json`.

Wszystkie pliki projektu na Dysku i potrzebne podfoldery wolno tworzyć,
odczytywać i edytować wyłącznie w tym folderze lub jego podfolderach.
Nie przeglądać pozostałego Dysku, folderów nadrzędnych ani sąsiednich.
Nie zmieniać, nie przenosić i nie usuwać samego folderu granicznego.
Odczyt jego metadanych i uprawnień w celu weryfikacji jest dozwolony.

Przed operacją sprawdzać identyfikator obiektu i jego przynależność do
dozwolonego drzewa. Weryfikacja nie może polegać na nazwie folderu, samym
identyfikatorze podanym przez frontend ani na umieszczeniu skrótu w folderze.
Skróty do zasobów poza granicą nie rozszerzają zakresu.
Brak potwierdzenia przynależności oznacza odmowę operacji.

Nowe zasoby tworzyć od razu w dozwolonym folderze. Zakaz obejmuje także
tworzenie tymczasowo w katalogu głównym Dysku i późniejsze przenoszenie.
Jeżeli wybrany mechanizm tworzenia Sheets lub Apps Script nie pozwala zachować
tej zasady, znaleźć zgodny mechanizm albo zgłosić ograniczenie przed operacją.
Nie rozszerzać granicy automatycznie, także w razie błędu lub braku uprawnień.

Ograniczenie dotyczy Google Drive; lokalne źródła, Git i pliki robocze pozostają
w lokalnym projekcie. Szkice Gmail podlegają odrębnej zgodzie z pakietu.

To zapisana polityka i wymaganie implementacyjne. Konfiguracja sama nie zawęża
uprawnień OAuth Google i nie stanowi jeszcze działającego zabezpieczenia.
Warstwa dostępu do danych oraz wdrożenie muszą egzekwować ją po stronie serwera.
Testy mają potwierdzić odmowę operacji poza folderem, także dla zasobów
przeniesionych poza niego i skrótów prowadzących poza granicę.

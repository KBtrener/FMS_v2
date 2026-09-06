# Wdrożenie FMS Quick Screen

## Zasoby i granica

- Konto właściciela: `info@kbtrener.pl`.
- Folder nadrzędny: `1jFAX9C5JROxTTrnNRt9QXUMEjsKD88yZ`.
- Projekt Apps Script i arkusz danych muszą być bezpośrednimi dziećmi folderu.
- Aplikacja odmawia działania, jeśli projekt lub arkusz zostanie przeniesiony.
- Kod nie korzysta ze skrótów ani plików tymczasowych na Dysku.

## Przepływ

1. `npm run verify` sprawdza konfigurację, składnię, fixture'y i testy rdzenia.
2. `npm run apps:create` tworzy samodzielny projekt Apps Script od razu w
   dozwolonym folderze. Parametr folderu jest zapisany w komendzie.
3. Lokalny `.clasp.json` otrzymuje `rootDir` wskazujący `apps-script`.
4. `npm run apps:push` wysyła zweryfikowane źródła.
5. Wdrożenie testowe i produkcyjne powstaje przez `clasp create-deployment`.
6. Pierwsze wejście właściciela uruchamia OAuth. Po zgodzie aplikacja
   automatycznie tworzy arkusz bezpośrednio w dozwolonym folderze przez Drive
   API i zapisuje jego ID we właściwościach projektu.
7. Po testach odbiorowych zachowujemy identyfikatory wdrożenia, numer wersji,
   link aplikacji, arkusza i projektu w tej instrukcji przekazania.

## Zgody Google

Wersja bazowa wymaga dostępu do tożsamości właściciela, wskazanego folderu
Drive i utworzonego arkusza. Scope Drive jest technicznie szerszy niż folder;
Google nie oferuje scope OAuth ograniczonego do pojedynczego folderu.
`FmsDriveGuard` wymusza granicę po stronie serwera przed każdą operacją.

Szkic Gmail jest oddzielnym etapem. Scope `gmail.compose` zostanie dodany do
manifestu dopiero przy włączeniu tej funkcji i po osobnej zgodzie właściciela.
Do tego czasu kliknięcie tworzenia szkicu zakończy się komunikatem o braku zgody.

## Bieżący stan

- Projekt Apps Script: https://script.google.com/d/104KJVLyykpUi3pP0yQs82BS1V6ZnF9NZPitHnB8kcMiTP2R4boEFNFni/edit
- Wdrożenie testowe, wersja 2: https://script.google.com/a/macros/kbtrener.pl/s/AKfycbzg3-KXf1YP13qC7cnrA675b7wMbp4dV7onbVzA3ECMQAHMx59qfSzZhsD11bJPxms/exec
- Dostęp: `MYSELF`, wykonanie jako właściciel wdrożenia.
- Konto clasp ponownie uwierzytelniono jako `info@kbtrener.pl`.
- Projekt znajduje się w dozwolonym folderze; odczyt Drive potwierdził, że nie
  jest udostępniony.
- Google Workspace zwrócił domenowy adres web app z segmentem
  `/a/macros/kbtrener.pl/`; tylko ten kanoniczny adres należy przekazywać.
- Pierwsza zgoda OAuth aplikacji i automatyczna inicjalizacja arkusza pozostają
  do wykonania. Arkusz danych jeszcze nie istnieje.

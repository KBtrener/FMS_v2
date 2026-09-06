# FMS v2 - Quick Screen

Repozytorium: https://github.com/KBtrener/FMS_v2.git

Status: pierwsza wersja MVP jest zaimplementowana, zweryfikowana lokalnie i
wysłana do prywatnego wdrożenia testowego Apps Script. Do pełnych testów
integracyjnych potrzebna jest pierwsza zgoda OAuth właściciela.

Przed operacjami Google Drive obowiązkowo przeczytaj [DRIVE_SCOPE.md](DRIVE_SCOPE.md).
Właściciel i nieprzekraczalna granica folderu: `config/deployment.json`.
Te późniejsze ustalenia właściciela mają pierwszeństwo przed pakietem źródłowym.

## Materiały

Oryginalny, rozpakowany pakiet znajduje się w `FMS_Quick_Screen_Codex_Package/`.
Instrukcja wejściowa: [AGENT_PROMPT.md](FMS_Quick_Screen_Codex_Package/AGENT_PROMPT.md).
Specyfikacja: pliki `docs/01-07` wewnątrz pakietu.

ZIP i źródłowe PDF-y pozostają lokalnie i są wyłączone z Git. Nowy checkout
wymaga uzupełnienia dwóch PDF-ów w `FMS_Quick_Screen_Codex_Package/references/`
z oryginalnego pakietu. Nie publikujemy podręcznika jako części repozytorium.

## Weryfikacja pakietu

Wymagany Node.js 24.x. Na tym etapie nie są potrzebne dodatkowe zależności.

```powershell
npm run verify:fixtures
```

To weryfikacja dostarczonych przykładów punktacji, a nie test gotowej aplikacji.
Pełny odbiór obejmuje AT-01 do AT-17 oraz testy telefonu i komputera.

## Docelowe rozwiązanie

Aplikacja w języku polskim, Google Apps Script jako backend i web app,
prywatny Google Sheets jako baza. Dostęp wyłącznie dla właściciela.
Raport PDF na żądanie, opcjonalny niewysłany szkic Gmail.

Szczegóły przeglądu i kolejność implementacji:
[PROJECT_READINESS.md](PROJECT_READINESS.md).

## Kod aplikacji

Źródła Apps Script znajdują się w `apps-script/`. Pełna kontrola lokalna:

```powershell
npm install
npm run verify
```

Wdrożenie korzysta z lokalnego `clasp` i tworzy projekt bezpośrednio w
zatwierdzonym folderze przez jawny parametr `parentId`. Plik `.clasp.json`
pozostaje lokalny. Szczegóły: [DEPLOYMENT.md](DEPLOYMENT.md).

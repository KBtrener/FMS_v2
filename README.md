# FMS v2 - Quick Screen

Repozytorium: https://github.com/KBtrener/FMS_v2.git

Status: przygotowany pakiet wejściowy i środowisko repozytorium. Kodowanie
aplikacji rozpocznie się po zatwierdzeniu przez właściciela.

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

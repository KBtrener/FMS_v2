# Architektura i wdrożenie

## Wybrana architektura MVP

    Aplikacja webowa Apps Script
             |
             v
      Logika serwerowa Apps Script
             |
             v
      Prywatny Google Sheets

Google Sheets jest magazynem danych, a Apps Script obsługuje walidację,
obliczenia, reguły powiązań, raport i zapis. Formuły arkusza mogą służyć
wyłącznie do pomocniczego podglądu dla właściciela.

## Zasoby na Dysku Google

W prywatnym folderze właściciela utwórz:

- FMS Quick Screen - Dane: jeden Google Sheet z kartami opisanymi w
  docs/02_data_model.md;
- FMS Quick Screen - Aplikacja: samodzielny projekt Apps Script;
- opcjonalnie FMS Quick Screen - Kopia źródeł: kopia kodu i README dla
  odzyskania projektu.

Przechowuj identyfikator arkusza w właściwościach projektu Apps Script, nie w
kodzie frontendu. Nie umieszczaj haseł, tokenów ani prywatnych danych w
kodzie, dokumentacji lub arkuszu konfiguracji.

## Uprawnienia

MVP:

- właściciel loguje się na swoje konto Google;
- web app jest dostępna tylko dla właściciela;
- arkusz nie jest udostępniany przez publiczny link;
- dostęp do Gmaila jest proszony tylko po włączeniu tworzenia szkicu e-maila.

Nie używaj dostępu anonimowego. Jeżeli w przyszłości aplikacja ma być
dostępna dla innych trenerów, należy dodać role i politykę dostępu zamiast
po prostu udostępniać arkusz.

## Implementacja serwera

Wymagane operacje:

- getInitialConfiguration
- searchClients
- createClient
- updateClient
- archiveClient i restoreClient
- startAssessment
- saveAssessment
- getClientProfile
- updateAssessment
- archiveAssessment i restoreAssessment
- generateReportData
- createEmailDraft, tylko gdy właściciel zaakceptuje Gmail scope

saveAssessment jest jedną operacją serwerową. Ma:

1. sprawdzić wymagane pola i dozwolone odpowiedzi;
2. zapisać odpowiedzi wsadowo;
3. obliczyć wynik bazowy;
4. zastosować effect_rules;
5. zapisać applied_effects;
6. zwrócić pełne podsumowanie do widoku.

Wykorzystaj blokadę zapisu Apps Script, by równoczesne kliknięcia nie utworzyły
duplikatu. Odczyty i zapisy do Sheets wykonuj wsadowo, a nie komórka po
komórce.

## Kod i aktualizacje

Przechowuj źródła lokalnie podczas tworzenia i użyj clasp albo równoważnego
mechanizmu do wysłania ich do projektu Apps Script. Projekt Apps Script ma
pozostać możliwy do otwarcia i aktualizacji przez właściciela po odbiorze.

Przy każdej wersji produkcyjnej:

1. uruchom testowe wdrożenie;
2. wykonaj testy odbiorowe;
3. utwórz wersję Apps Script;
4. wdroż lub zaktualizuj produkcyjny link;
5. zanotuj numer wersji i datę w instrukcji przekazania.

## Odbiór wdrożenia

Codex ma zakończyć pracę dopiero po przekazaniu:

- linku produkcyjnego web app;
- linku do arkusza danych;
- linku do projektu Apps Script;
- potwierdzenia, że dostęp produkcyjny ma tylko właściciel;
- wyniku testów z docs/06_acceptance_tests.md;
- instrukcji wejścia i cofnięcia dostępu;
- listy zgód Google, które zostały wykorzystane.

Jedynym krokiem po stronie właściciela może być zatwierdzenie ekranów
autoryzacji Google. Nie prosić właściciela o ręczne kopiowanie kodu lub
samodzielne wdrażanie projektu.

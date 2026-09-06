# Prompt dla Codexu implementującego

Zbuduj od zera i wdroż gotową aplikację FMS Quick Screen. Ten pakiet jest
pełną specyfikacją produktu. Nie odtwarzaj ustaleń z rozmowy i nie zmieniaj
reguł punktacji bez wyraźnego oznaczenia problemu.

## Materiały obowiązujące

1. Przeczytaj README.md.
2. Traktuj pliki docs/01-07 jako umowę implementacyjną.
3. Użyj references/FMS Quick Screen Manual V2.pdf oraz
   references/FMS_Quick Screen_Scoresheet.v3.pdf wyłącznie jako źródeł
   referencyjnych do zgodności punktacji.
4. Załaduj config/quick_screen_seed.json jako konfigurację początkową.
5. Uruchom fixtures/assessment_fixtures.json i wszystkie przypadki z
   docs/06_acceptance_tests.md.

## Cel wdrożenia

Wdroż samowystarczalną aplikację webową opartą na Google Apps Script i
Google Sheets. Utwórz prywatny folder projektu na Dysku Google właściciela,
arkusz danych, projekt Apps Script oraz produkcyjne wdrożenie web app.

W pierwszej wersji z aplikacji korzysta wyłącznie właściciel konta Google.
Klienci nie mają kont ani dostępu do aplikacji. Ustaw dostęp produkcyjny
wyłącznie dla właściciela. Nie publikuj aplikacji anonimowo ani publicznie.

## Bezwzględne wymagania

- Dane klientów: imię, nazwisko, e-mail, data badania, opcjonalna notatka.
- Wyniki liczbowe są wyłącznie liczbami całkowitymi 0, 1, 2 albo 3.
- Aplikacja zapisuje odpowiedzi źródłowe, a wynik końcowy wylicza z reguł.
- Wynik surowy, wynik końcowy i przyczyna ewentualnego nadpisania wyniku muszą
  być widoczne.
- Reguły clearing tests nie mogą być zaszyte na stałe w kodzie. Muszą być
  konfigurowalne w danych, osobno dla każdego rodzaju badania.
- Dla Quick Screen użyj tylko powiązań potwierdzonych w źródle. Przykładowa
  reguła Spine Extension Clearing -> Squat jest wyłącznie testem mechanizmu,
  nie aktywną regułą produkcyjnego Quick Screen.
- Zakończenie badania zapisuje wynik automatycznie. Nie twórz dwóch przycisków
  typu Zapisz i Zapisz z raportem.
- Po zapisaniu pokaż profil klienta, bieżące podsumowanie i historię.
- Raport generuj na żądanie; nie zapisuj plików raportu na Dysku.
- Tworzenie e-maila ma przygotowywać szkic, nigdy nie wysyłać wiadomości
  automatycznie.
- Nie twórz diagnoz ani zaleceń terapeutycznych w raporcie.

## Technika

- Wybierz Google Apps Script jako backend i aplikację webową; Google Sheets
  jako warstwę danych. Formuły Sheets mogą być tylko pomocnicze, nie mogą być
  źródłem logiki punktacji.
- Zapisuj dane wsadowo, używaj stabilnych identyfikatorów zamiast numerów
  wierszy i waliduj wejście po stronie serwera.
- Przechowuj projekt w sposób umożliwiający późniejszą aktualizację
  (preferowane: lokalne źródła i clasp lub równoważny, bezpieczny przepływ).
- Nie przechowuj haseł, tokenów ani danych uwierzytelniających w kodzie lub
  arkuszu.
- Jeżeli potrzebne jest zatwierdzenie Google OAuth, zatrzymaj się tylko przy
  ekranie autoryzacji i dokładnie wskaż właścicielowi, co ma zatwierdzić.
  Nigdy nie proś o hasło.

## Odbiór

Przed przekazaniem:

1. Uruchom wszystkie testy z docs/06_acceptance_tests.md.
2. Sprawdź działanie na widoku telefonu i komputera.
3. Sprawdź, że wygenerowanie PDF nie zostawia raportu jako pliku na Dysku.
4. Przekaż produkcyjny link aplikacji, link do arkusza danych, link do
   projektu Apps Script, krótką instrukcję startową i listę wymaganych zgód.
5. Wskaż wszystkie znane ograniczenia. Nie deklaruj zakończenia, jeżeli
   aplikacja nie jest wdrożona i przetestowana.

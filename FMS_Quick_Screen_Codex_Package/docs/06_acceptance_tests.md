# Testy odbiorowe

Każdy test musi przejść przed przekazaniem aplikacji. Dane są w
fixtures/assessment_fixtures.json.

Najpierw uruchom:

    node tools/verify_fixtures.mjs

| ID | Scenariusz | Oczekiwany wynik |
|---|---|---|
| AT-01 | Założenie klienta bez imienia, nazwiska albo e-maila | Zapis zablokowany z jasnym komunikatem |
| AT-02 | Dwa profile z tym samym e-mailem | Ostrzeżenie o duplikacie, bez blokowania zapisu |
| AT-03 | Marta Nowak, AS-0001 | Total Screen Score = 9 |
| AT-04 | Marta Nowak, AS-0002 | Total Screen Score = 11 |
| AT-05 | Marta Nowak, AS-0003 | Total Screen Score = 11; wykres ma trzy punkty 9, 11, 11 |
| AT-06 | Wynik obustronny 3 po lewej i 2 po prawej | Wynik końcowy testu = 2 |
| AT-07 | Shoulder Mobility raw L 3, R 3; Shoulder Clearing Right Positive | Wynik Shoulder Mobility = 0 oraz widoczny powód |
| AT-08 | Spine Extension Clearing Positive bez aktywnej relacji Quick Screen | Squat nie zmienia wyniku; clearing jest widoczny jako flaga |
| AT-09 | Testowa aktywacja reguły Spine Extension Clearing Positive -> Squat 0 | Squat raw 3, final 0; zapis applied_effect z przyczyną |
| AT-10 | Cervical Rotation left: Pass, Negative, Positive; right: Fail, Negative, Negative | Wszystkie sześć odpowiedzi jest osobno zapisane i widoczne |
| AT-11 | Próba zapisu liczby 2.5 albo 4 jako wyniku 0-3 | Walidacja odrzuca wartość |
| AT-12 | Korekta AS-0001 z wyniku Rotation final 1 na 2 | Historia i przyszły raport przeliczają się; updated_at i correction_note są zapisane |
| AT-13 | Archiwizacja AS-0002 | Badanie znika ze zwykłego wykresu i raportu, ale można je przywrócić |
| AT-14 | Raport Marty przy trzech aktywnych badaniach | Zawiera wykres 0-15, macierz wyników i tylko neutralne opisy zmian |
| AT-15 | Wygenerowanie PDF | PDF jest pobierany lub przekazany do szkicu; na Dysku nie pozostaje plik raportu |
| AT-16 | Przygotuj e-mail | Powstaje niewysłany szkic z edytowalnymi odbiorcami i PDF-em, jeśli Gmail scope zatwierdzono |
| AT-17 | Wejście pod innym kontem Google albo bez logowania | Brak dostępu do produkcyjnej aplikacji |

## Kontrole jakości

- Na telefonie przyciski Pass / Fail i Ból / Brak bólu są łatwe do kliknięcia.
- Aplikacja nie używa samej litery P jako etykiety.
- Nie ma dwóch końcowych przycisków zapisu.
- Zmiana reguły testowej nie usuwa śladu applied_effect z istniejącego badania.
- Raport nie zawiera diagnozy, zaleceń ani automatycznego wniosku klinicznego.

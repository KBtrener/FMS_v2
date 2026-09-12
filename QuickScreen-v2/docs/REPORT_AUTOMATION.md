# Raport QuickScreen v2 - specyfikacja makiety

## Cel

Raport ma dawać klientowi jeden czytelny wniosek, kontekst wyniku i następny krok. Nie jest diagnozą ani samodzielną oceną ryzyka kontuzji.

## Dane wejściowe po integracji

- niezmienny snapshot ukończonego screeningu: identyfikator klienta, data, wersja protokołu, wyniki surowe, wyniki końcowe i clearingi;
- wyliczony wynik łączny oraz historia ukończonych badań;
- wynik silnika priorytetów: ból -> wynik 1 -> asymetria;
- wybrane przez trenera ćwiczenia: identyfikator, opis klientowy, dawka, cel i data przeglądu;
- dane marki: logo, nazwa trenera, stopka oraz tekst bezpieczeństwa.

## Reguły dokumentu

1. Raport pokazuje jeden priorytet, nie listę wszystkich problemów.
2. Dodatni clearing bólowy ustawia wynik powiązanego testu na `0`; raport opisuje ból i nie generuje automatycznie ćwiczeń.
3. Wyniki stron oraz finalne punkty są zapisywane w snapshotie; nie liczy się ich ponownie podczas odtwarzania PDF.
4. Każda wersja PDF dostaje identyfikator badania, czas wygenerowania, wersję szablonu i jest niezmienna po wysłaniu.
5. Język raportu ma wyjaśniać obserwację i następny krok, bez obietnic zapobiegania urazom.

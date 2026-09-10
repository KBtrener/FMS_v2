# Decyzje i granice projektu

- Aktualna architektura to frontend webowy + Supabase.
- Wynik bazowy jest wynikiem rzeczywiście uzyskanym w teście.
- Wynik końcowy jest bazą po aktywnych regułach clearingowych.
- Clearing nie nadpisuje odpowiedzi, wyników stron ani bazy.
- applied_effects przechowuje źródło, cel, zmianę i przyczynę.
- parent_screen_test_id tworzy hierarchię nadrzędny → clearing.
- Neck Extension Clearing jest dzieckiem Cervical Rotation.
- Shoulder Clearing jest dzieckiem Shoulder Mobility.
- Spine Extension Clearing jest dzieckiem Squat i może zerować Squat.
- Testy obustronne pokazują L/R i asymetrię także po wyzerowaniu.
- Panel administratora zarządza katalogiem i regułami.
- UI zachowuje obecny system wizualny.

Każda przyszła zmiana kodu lub konfiguracji wymaga wpisu do planu zmian, aktualizacji dokumentów, testu odbiorowego oraz migracji/seed, jeśli dotyczy danych. Zmiana nie jest zakończona, dopóki dokumentacja opisuje nowe zachowanie.


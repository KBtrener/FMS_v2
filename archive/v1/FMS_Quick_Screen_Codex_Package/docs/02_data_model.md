# Model danych

Model jest znormalizowanym modelem PostgreSQL w Supabase. Źródłem prawdy są odpowiedzi assessment_answers; applied_effects zachowuje ślad reguł.

## Tabele i hierarchia

Główne tabele: profiles, clients, assessments, screen_types, tests, screen_tests, test_fields, answer_sets, answer_options, assessment_answers, effect_rules, applied_effects, test_descriptions oraz report_instances.

screen_tests.parent_screen_test_id tworzy hierarchię test nadrzędny → clearing. Clearing jest osobnym testem i osobno zapisuje odpowiedzi, ale wizard, profil i raport pokazują go pod testem nadrzędnym.

## Odpowiedzi i wyniki

Każda odpowiedź przechowuje badanie, pole, stronę left/right/none, opcję i ewentualną wartość liczbową. Dla testów obustronnych zawsze zachowaj oba wyniki i pokaż asymetrię. Wynik bazowy to minimum wyników stron.

Kolejność obliczeń: odczytaj odpowiedzi; oblicz wynik bazowy; zastosuj aktywne effect_rules; zapisz każdy wpływ w applied_effects; użyj wyniku końcowego do sumy.

Reguła może zmienić wyłącznie wynik końcowy. Nie wolno zmieniać wyniku bazowego, wyników stron, odpowiedzi clearingowych ani historii. applied_effects zawiera źródło, cel, wynik przed/po i przyczynę.

Reguły są konfigurowane dla screen_type w panelu administratora. Nie używaj sort_order jako identyfikatora. Zmiana konfiguracji nie może usuwać śladu reguły w historycznym badaniu.


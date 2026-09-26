# Granica modułu i przyszłe API

## Zakres

QuickScreen pozostaje osobnym modułem w `v2.1`. Makieta korzysta obecnie z danych demonstracyjnych. Schemat Supabase jest przygotowany z istniejących tabel, zasad punktacji, odpowiedzi, clearingów, notatek i raportów.

Aplikacja główna ma integrować moduł przez stabilne API. Widoki nie powinny zależeć od wewnętrznych tabel Supabase ani wywoływać ich bezpośrednio po wprowadzeniu tej integracji.

## Dane i identyfikatory

Zachowujemy klucze domenowe backendu: `client_id`, `assessment_id`, `screen_test_id`, `test_field_id`, `answer_option_id`, kody stron `left/right/none` i wersję manuala. Pozwala to zachować wyniki historyczne i reguły oceniania przy zmianach prezentacji.

Kontrakt obejmuje zasoby:

- profile i dostęp trenera do klientów;
- konfigurację protokołu oraz opisów testów;
- badania, odpowiedzi, notatki i zastosowane efekty clearingów;
- raporty, ich sekcje i niezmienne snapshoty;
- pliki prywatne powiązane z klientem lub badaniem.

## Zasada integracji

Przed połączeniem z aplikacją główną należy ustalić jej uwierzytelnianie, bazowy URL i wersjonowanie API. Następnie należy dodać jeden adapter danych dla QuickScreen i mapować odpowiedzi API na model modułu. Proponowana granica wersji to `/api/v1/quickscreen`; konkretne endpointy i role ustalimy przy implementacji integracji, żeby nie utrwalać teraz nieuzgodnionego kontraktu.

Makieta i seed nie zawierają kluczy ani adresów żadnego projektu Supabase. Migracje można zastosować w wybranym środowisku, a konfigurację klienta dodać dopiero po wskazaniu projektu.

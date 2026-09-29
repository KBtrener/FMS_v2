# Polityka aktualizacji dokumentacji

Dokumentacja jest częścią definicji gotowej zmiany.

Aktualizację trzeba zaplanować, gdy zmiana dotyczy modelu danych, migracji, RLS, API, punktacji, wyników, asymetrii, clearingu, katalogu testów, opisów, hierarchii, wizarda, profilu, raportu, PDF, routingu, panelu administratora, uprawnień albo wdrożenia.

Każdy plan zmian musi zawierać sekcję Dokumentacja z listą dotkniętych plików, opisem zmian, testami odbiorowymi oraz informacją o seedzie/migracji i opisach EN/PL.

Jeżeli wpływ na dokumentację ujawni się podczas implementacji, trzeba dopisać go do planu przed zakończeniem i wykonać w tym samym cyklu.

Kod i migracje opisują działanie techniczne, docs/01-08 wymagania i decyzje, a 09_manual_test_descriptions_bilingual.md treść opisów testów. Nie wolno pozostawiać sprzecznych zapisów w starszych plikach, fixture'ach ani seedzie.

Zmiana jest kompletna dopiero po aktualizacji dokumentacji i uruchomieniu właściwych testów.


# Przypadki graniczne i walidacja

Wersja: 4.1

> **Walidacja nagłówków.** Po ukryciu tekstów pomocniczych same nagłówki muszą tworzyć logiczną kolejność pytań klienta. Ból ma własną sekwencję nagłówków. Nie renderuj pustego ograniczenia, kontekstu sportowego bez sportu ani historii bez porównywalnego badania.

> **Wydanie UI 4.1 — walidacja layoutu.** Hero ma jedną decyzję i jeden PRIMARY; re-test jest zawsze widoczny (z datą trenera, jeśli istnieje); przy wielu bólach widoczne są wszystkie obszary i komunikat rozmowy 1:1; bez porównywalnego badania nie pokazuj historii; pełne wyniki mają pojedyncze testy oraz L/P; disclaimer występuje raz w stopce PDF.

Wszystkie komunikaty użytkowe muszą być zgodne z `FMS_REPORT_LANGUAGE_GUIDE.md`.

---

# 1. Brak danych / not_assessable

Nigdy nie zamieniaj `not_assessable` na 0 lub 1.

Tekst:

`Tego elementu nie udało się dobrze ocenić, dlatego nie wpływa na wybór głównego priorytetu.`

Jeśli badanie było z wideo:

`Na nagraniu nie było dobrze widać wszystkich kryteriów tego testu, dlatego tego elementu nie oceniamy.`

---

# 2. Jakość nagrania

## high

`Nagranie pozwalało dobrze ocenić wszystkie potrzebne elementy.`

## acceptable

`Nagranie wystarczyło do oceny, choć część szczegółów była mniej wyraźna.`

## limited

`Na tym nagraniu część szczegółów była słabo widoczna. Wyniki, których nie dało się ocenić pewnie, zostały pominięte.`

`limited` nie zmienia automatycznie wyniku. Jeśli konkretnego kryterium nie widać, ten element musi być `not_assessable`.

---

# 3. Kilka bolesnych obszarów

Nie wybieraj jednego sztucznie.

Nagłówek:

`W kilku ruchach pojawił się ból.`

Opis:

`To jest teraz najważniejsza informacja z badania. Ogranicz ruchy, które odtwarzają ból, i sprawdź bolesne obszary dokładniej.`

---

# 4. Ból + inne wyniki 1

PRIMARY pozostaje ból / PROTECT.

Wyniki 1 pokaż niżej jako dodatkowe obserwacje, np.:

`Poza bólem w badaniu pojawiły się też obszary z wynikiem 1. Wrócimy do nich po wyjaśnieniu bolesnych ruchów.`

---

# 5. Dodatni Shoulder Clearing

Niezależnie od liczbowego wyniku Shoulder Mobility:

- report state = pain / PROTECT,
- shoulder mobility final result w logice FMS = 0,
- nie opisuj go jako zwykłego wyniku 1/2/3.

Tekst użytkowy:

`W teście barku pojawił się ból. To ma teraz większe znaczenie niż sam wynik mobilności barków.`

---

# 6. Cervical

- ból w flexion, rotation lub rotation+extension -> PROTECT,
- bez bólu + Fail -> CORRECT,
- prawa rotacja PASS, lewa FAIL lub odwrotnie -> asymetria + CORRECT,
- Rotation+Extension nie ma kryterium zakresu.

Nie powtarzaj przy każdym wyniku szyi, że test „nie diagnozuje”.

---

# 7. Asymetria 3/2

Może być PRIMARY tylko wtedy, gdy:

- nie ma bólu,
- nie ma wcześniejszego kandydata w hierarchii.

Tekst powinien jasno powiedzieć:

`Obie strony radzą sobie dobrze, ale jedna wyraźnie lepiej.`

Nie nazywaj słabszej strony „złą”, „dysfunkcyjną” ani „nieprawidłową”. Wynik 2 spełnia podstawowy standard.

---

# 8. 1/1

To nie jest asymetria.

Tekst:

`Ten ruch jest słaby po obu stronach. Najważniejsze jest poprawienie całego ruchu, a nie wyrównywanie stron.`

---

# 9. 2/2

Nie jest kandydatem do poprawy tylko dlatego, że nie jest 3/3.

Tekst:

`Jest dobrze. Obie strony spełniają podstawowy standard.`

---

# 10. Wiele sportów

Nie zmieniaj hierarchii na podstawie sportu.

Sport tylko zmienia znaczenie wyniku dla użytkownika. Przy wielu sportach dodaj maksymalnie dwa niepowtarzające się zdania.

---

# 11. Aktywny bez wybranego sportu

Użyj `active_meaning`, ale bez `sport_context_sentence`.

---

# 12. GENERAL z przypadkowo wybranym sportem

Profil `general` ma pierwszeństwo. Nie dodawaj sportowego kontekstu, chyba że użytkownik ma profil `active`.

---

# 13. Konto istnieje, ale brak poprzednich testów

Stan: `CLIENT_NO_HISTORY`.

Nie pokazuj pustej sekcji historii.

Tekst:

`To jest Twój punkt wyjścia. Kolejne badanie pokaże, co się zmieniło.`

---

# 14. Historia nieporównywalna

Jeśli zmienił się protokół, brakuje poprzedniego wyniku lub test był `not_assessable`:

`Tego elementu nie porównujemy z poprzednim badaniem, bo nie mamy dwóch porównywalnych wyników.`

---

# 15. Total Score

Może być przechowywany i pokazany pomocniczo, ale nie steruje głównym priorytetem i nie powinien dominować raportu indywidualnego.

---

# 16. Granica między konkretem a nadinterpretacją

Raport ma być konkretny w opisie wyniku, ale ostrożny w opisie przyczyny.

### Można powiedzieć wprost

- `Ten ruch nie spełnia podstawowego standardu.`
- `To jest teraz główny obszar do pracy.`
- `Jedna strona wyraźnie odstaje.`
- `Ten wynik jest dobry.`
- `Podczas ruchu pojawił się ból.`

### Nie należy generować

- `Masz sztywne hamstringi.`
- `Masz niestabilny bark.`
- `Ten wynik oznacza, że się kontuzjujesz.`
- `To na pewno problem biodra / stawu skokowego / kręgosłupa.`
- `Wynik 3 oznacza perfekcyjny ruch.`
- `Asymetria zawsze oznacza patologię.`

### Jeśli przyczyna jest nieznana

Użyj krótkiego zdania tylko wtedy, gdy jest potrzebne:

`Sam test pokazuje, że ruch jest ograniczony. Jeśli chcesz wiedzieć dlaczego, ten obszar trzeba sprawdzić dokładniej.`

Nie dodawaj tego automatycznie do każdego testu.

---

# 17. Disclaimer

Nie wstawiaj disclaimerów w środku raportu.

Użyj jednego, na końcu:

`Badanie ma charakter przesiewowy. Pokazuje, które obszary wymagają uwagi i co można zrobić dalej, ale nie określa przyczyny bólu ani ograniczenia.`


---

# 18. Konkretne zalecenia vs nadmierne ograniczanie

Nie każde odchylenie oznacza konieczność ograniczenia aktywności.

## 3/2
Nie generuj `temporarily_limit` poza:
`Brak automatycznego ograniczenia.`

## 2 lub 3
Nie ograniczaj treningu z powodu samego wyniku.

## wynik 1
Użyj wyłącznie ograniczeń zapisanych dla konkretnego testu w `ACTION_RULES_DB`.

## ból
Ogranicz ruchy prowokujące ból, a nie automatycznie całą aktywność.

# 19. Brak dopasowania sportowego

Jeśli sport nie ma tagu pasującego do Action Rule:

- nie wymyślaj sportowego przykładu,
- użyj bazowego zalecenia ACTIVE,
- nadal wygeneruj poprawny raport.

Dzięki temu dodanie nowej dyscypliny nie może zepsuć logiki.

# 20. Nowy sport

Walidacja nowego sportu wymaga:

- unikalnego `id`,
- co najmniej jednego `tag`,
- `sport_relevance_text`,
- co najmniej jednego `activity_examples` dla używanych tagów.

Brak jednego przykładu nie blokuje raportu — generator wraca do ogólnej reguły.

# 21. GENERAL

Nie pokazuj osobie nieaktywnej:

- sprintów,
- plyometrii,
- cięć,
- serwisów,
- martwych ciągów,

chyba że użytkownik faktycznie oznaczył taką aktywność.

Użyj wyłącznie `general_*` z Action Rules i codziennych przykładów.

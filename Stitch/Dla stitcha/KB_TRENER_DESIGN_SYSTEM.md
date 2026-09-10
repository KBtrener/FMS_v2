# KB Trener Design System

## 1. Brand hierarchy

```text
KB Trener
└── QuickScreen
    └── przyszłe inne moduły jako rozszerzenie systemu
```

KB Trener jest marką nadrzędną. QuickScreen jest obecnym modułem testowym. Przyszłe moduły, takie jak FMS, SFMA, testy siłowe lub inne systemy oceny, mogą korzystać z warstwy KB Trener Core, ale nie są częścią obecnego zakresu QuickScreen.

Logo marki to istniejące logo KB Trener dostępne w repozytorium. Nie tworzyć nowego logo ani nie traktować przykładowych zewnętrznych URL-i z eksportów Stitch jako docelowych assetów.

## 2. Visual direction

Zachowaj istniejący kierunek wizualny materiałów Stitch: jasne, spokojne i precyzyjne narzędzie pracy trenera, z mocną strukturą deep/slate, tealowym akcentem, wysoką czytelnością i ergonomią obsługi jedną ręką. Kierunek nie powinien być przedstawiany jako estetyka medyczna ani jako generyczny dashboard SaaS.

Ekrany Stitch są referencją wizualną. Obecna aplikacja i `CURRENT_APP_UI_AUDIT.md` są referencją funkcjonalną, domenową i przepływów.

## 3. Core visual tokens

### Kolory

| Token | Wartość | Znaczenie |
|---|---:|---|
| `primary` / deep slate | `#0F172A` | struktura, tekst, główne akcje |
| `primary-accent` | `#1E293B` / `#334155` | elementy strukturalne i aktywne |
| `secondary` / teal | `#0D9488` | główny accent interfejsu, CTA, postęp |
| `surface-base` | `#F8FAFC` | tło aplikacji |
| `surface-card` | `#FFFFFF` | karty i formularze |
| `surface-muted` | `#F1F5F9` | tła pomocnicze i hover |
| `border-subtle` | `#E2E8F0` | domyślne obramowanie |
| `border-strong` | `#CBD5E1` | mocniejsze obramowanie |
| `state-pass` | `#059669` | pozytywny wynik / brak bólu |
| `state-fail` | `#D97706` | uwaga, asymetria, wynik wymagający uwagi |
| `state-pain` | `#E11D48` | ból / red flag jako wynik screeningu |
| `state-draft` | `#0284C7` | szkic, informacja, zapis lokalny |

### Typografia

- Outfit dla nagłówków i mocnych wartości prezentacyjnych.
- Inter dla treści, etykiet, danych i wyników.
- Nie wprowadzać nowych fontów ani nie używać przypadkowych wariantów Manrope/Fraunces.
- Zachować czytelność danych liczbowych i tabular figures dla wyników.

### Spacing, radius i ergonomia

- podstawowa skala spacingu: 4, 8, 12, 16, 24, 32 px;
- gutter: 16 px mobile, 24 px desktop;
- karta: najczęściej 16 px paddingu i radius 12–16 px;
- większy modal/bottom sheet może używać radius 24 px;
- touch target minimum: 48 × 48 px;
- focus powinien być wyraźny i tealowy;
- zachowaj istniejące proporcje, breakpointy, spacing, cienie i układy ekranów Stitch.

## 4. Semantic states

| Stan | Token | Zastosowanie w QuickScreen |
|---|---|---|
| Pass | `state-pass` / `#ECFDF5` | wynik 2–3, zaliczenie, brak bólu |
| Attention | `state-fail` / `#FFFBEB` | wynik 1, fail, asymetria, uwaga |
| Pain | `state-pain` / `#FFF1F2` | wynik 0, ból, red flag |
| Draft / Info | `state-draft` | szkic, zapis lokalny, informacja |

Kolor nie może być jedynym nośnikiem znaczenia. Status powinien mieć także tekst i ikonę/znak. Nazwa `state-fail` jest zachowana dla zgodności z istniejącymi tokenami, choć semantycznie obejmuje również uwagę i asymetrię, nie tylko literalne „fail”.

## 5. KB Trener Core Components

Elementy potencjalnie wspólne dla wszystkich obecnych i przyszłych modułów:

- branding i lokalne logo KB Trener;
- `AppShell`;
- `TopBar`;
- przyszłościowy `ModuleSwitcher` z aktywnym modułem `QuickScreen`;
- mobile navigation;
- użytkownik/trener i avatar;
- klient/zawodnik jako wspólny obiekt osoby ocenianej;
- breadcrumbs;
- `Button`, `IconButton`;
- `Input`, `Select`, `Textarea`;
- `Card`, `Badge`;
- `Modal`, `BottomSheet`, `ConfirmDialog`;
- `Toast`;
- `EmptyState`, `LoadingState`, `ErrorState`;
- system spacingu, typografii, powierzchni, focus states i touch targets.

Nie tworzyć teraz globalnego dashboardu osoby ani ekranów przyszłych modułów. Wspólne komponenty oznaczają wspólny język i potencjalną współdzielność, nie dodatkowy zakres bieżącej makiety.

## 6. QuickScreen Components

Elementy specyficzne dla modułu QuickScreen:

- `QuickScreenWizard`;
- progres badania i nazwane kroki;
- `ScoreSelector` 0–3;
- `PassFailSelector`;
- `PainClearingSelector`;
- pełne oznaczenia `Lewa strona` / `Prawa strona` z opcjonalnymi skrótami L/P;
- `ShoulderClearing` z wzorcem górnym i dolnym;
- kryteria testu;
- wynik bieżącego testu;
- status asymetrii;
- clearing effect / informacja o efekcie reguły;
- raport QuickScreen;
- status szkicu badania.

## 7. QuickScreen domain rules

- QuickScreen prowadzi przez 9 etapów/testów; przykładowy zapis postępu to `Krok 4 z 9` albo `Test 4 z 9`.
- Wynik łączny QuickScreen jest prezentowany jako `x / 15`.
- Nie każdy test ma skalę 0–3. Konfiguracja może używać `score 0–3`, `Pass / Fail`, `Brak bólu / Ból` oraz innych wariantów odpowiedzi.
- Dla testów bilateralnych zawsze rozróżniaj `Lewa strona` i `Prawa strona`. L/P są dopuszczalnymi skrótami pomocniczymi, ale nie jedynym oznaczeniem.
- Clearing i zależności między testami wynikają z konfiguracji aplikacji. Nie wymyślać nowych kryteriów, efektów ani interpretacji.
- Ból, asymetria, wynik 0/1/2/3 i statusy są danymi screeningu. Nie używać niepotwierdzonych medycznych deklaracji ani rekomendacji.
- Nowe badanie może mieć status szkicu zapisanego lokalnie; korekta istniejącego badania powinna być wyraźnie odróżniona od nowego badania.

## 8. Future module compatibility

KB Trener może w przyszłości udostępniać moduły FMS, SFMA, testy siłowe i inne systemy oceny. `ModuleSwitcher` może koncepcyjnie pokazywać aktywny moduł `QuickScreen` oraz przyszłe pozycje, ale nie należy teraz implementować ani projektować ekranów tych modułów.

Osoba oceniana powinna być rozumiana jako wspólny obiekt systemu. W przyszłości może mieć historię QuickScreen, FMS, SFMA, testów siłowych i innych ocen. Nie tworzyć teraz globalnego widoku tej historii ani zmieniać modelu danych.

## 9. Rules for future mockups

- Korzystaj z tego dokumentu jako kanonicznego skrótu systemu.
- Istniejące ekrany Stitch są wizualną referencją; zachowuj ich kompozycję, layout, proporcje, spacing, typografię, kolory, radiusy, cienie i responsywność.
- Obecna aplikacja oraz `CURRENT_APP_UI_AUDIT.md` są referencją funkcjonalną, domenową i przepływów, nie wzorem graficznym.
- Nie kopiuj przypadkowych danych demonstracyjnych Stitch jako logiki produktu.
- Przed utrwaleniem liczby, statusu, nazwy testu lub komunikatu porównaj je z regułami QuickScreen i aktualną konfiguracją.
- Nie przedstawiaj QuickScreen jako całej platformy KB Trener ani jako jedynego możliwego modułu.
- Nie utrwalaj niepotwierdzonych certyfikacji, zgodności, standardów, parametrów technicznych ani medycznych rekomendacji.
- Brakujący ekran należy zaprojektować w tym samym języku wizualnym, bez tworzenia nowej estetyki.

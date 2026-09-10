# KB Trener Design System — QuickScreen

Wersja: 2.0 · język produktu: polski · motyw: jasny

Ten dokument jest nadrzędnym źródłem prawdy dla FMS QuickScreen, kolejnych aplikacji FMS, portalu `fms.kbtrener.pl`, ekranów Stitch oraz raportów HTML/PDF. Materiały w `stitch_fms_quickscreen_design_system` są wzorcem wizualnym. Istniejąca aplikacja jest źródłem funkcji, danych i przepływów, lecz nie wyglądu. W razie konfliktu obowiązuje ten dokument.

## 1. Kierunek wizualny KB Trener / QuickScreen

Interfejs jest spokojnym, precyzyjnym narzędziem studia treningowego. Ma kojarzyć się z ruchem, pomiarem i sprawną pracą trenera, nie ze szpitalem ani generycznym panelem SaaS. Hierarchię budują typografia, rytm i kontrast. Ozdobniki ustępują czytelności, szczególnie podczas badania jedną ręką.

## 2. Core tokens

```css
:root {
  --fms-primary: #0F172A;
  --fms-primary-accent: #1E293B;
  --fms-secondary: #0D9488;
  --fms-surface-base: #F8FAFC;
  --fms-surface-card: #FFFFFF;
  --fms-surface-muted: #F1F5F9;
  --fms-border-subtle: #E2E8F0;
  --fms-border-strong: #CBD5E1;
  --fms-state-pass: #059669;
  --fms-state-pass-bg: #ECFDF5;
  --fms-state-attention: #D97706;
  --fms-state-attention-bg: #FFFBEB;
  --fms-state-pain: #E11D48;
  --fms-state-pain-bg: #FFF1F2;
  --fms-state-info: #0284C7;
  --fms-radius-sm: 8px;
  --fms-radius-md: 12px;
  --fms-radius-lg: 16px;
  --fms-shadow-card: 0 4px 20px rgba(15, 23, 42, .045);
  --fms-shadow-raised: 0 18px 50px rgba(15, 23, 42, .09);
  --fms-space-1: 4px; --fms-space-2: 8px; --fms-space-3: 12px;
  --fms-space-4: 16px; --fms-space-6: 24px; --fms-space-8: 32px;
}
```

Nie używać `#000000` jako primary. Nagłówki: Outfit 600–700. Tekst, etykiety i liczby: Inter 400–700 z cyframi tablicowymi. Body mobile ma minimum 16 px. Minimalny target dotykowy to 48 × 48 px.

## 3. Globalny system statusów

| Stan | Dane | Kolor / tło | Znak i tekst |
|---|---|---|---|
| Zielony | wynik 2–3, Pass, brak bólu | `#059669` / `#ECFDF5` | `✓ W normie` |
| Pomarańczowy | wynik 1, Fail, asymetria, uwaga | `#D97706` / `#FFFBEB` | `! Uwaga` |
| Czerwony | wynik 0, ból, red flag | `#E11D48` / `#FFF1F2` | `! Ból / red flag` |
| Niebieski | szkic, synchronizacja, informacja | `#0284C7` / jasny błękit | `i Informacja` |

Kolor nigdy nie jest jedynym nośnikiem znaczenia: zawsze występują ikona/znak, nazwa i dostępny tekst. Czerwony wynik bólowy jest danymi screeningu. Błąd techniczny ma oddzielny komunikat i nie używa etykiety „ból”.

## 4. Siatka responsywna

- Mobile 360–430 px: gutter 16 px, jedna kolumna, dolna nawigacja, sticky `Wstecz / Dalej / Zakończ`, bez poziomego przewijania formularza. Kryteria jako accordion lub bottom sheet. Lewa i prawa strona zawsze mają pełną nazwę.
- Tablet 768–1024 px: układ 1–2 kolumn zależnie od zadania; widoczna lista testów; obsługa jedną ręką pozostaje możliwa.
- Desktop 1280–1440 px: kontrolowana szerokość maksymalna 1200 px, pełna nawigacja, szersze tabele i responsywny podgląd A4.
- Dokument PDF: stały A4, margines 14 mm, bez przecinania nagłówków, kart wyniku i wierszy tabel.

## 5. Komponenty współdzielone

Jeden topbar ma lokalne logo, app switcher, status synchronizacji i konto. Na mobile główne obszary są w dolnej nawigacji. Karty mają promień 16 px, kontrolowany cień i obrys subtle. Przyciski oraz pola mają co najmniej 48 px wysokości. Focus ma wyraźny ring teal.

Wizard pokazuje `Test n z 9`, nazwę każdego kroku i stany: bieżący, ukończony, niepełny i błąd. Testy obustronne porównują `Lewa strona` i `Prawa strona` w jednej osi. Shoulder Clearing grupuje `Wzorzec górny` i `Wzorzec dolny`. Kryteria są domyślnie zamknięte. Sticky action bar pozostaje pod kciukiem. Status szkicu brzmi `Szkic zapisany na tym urządzeniu`.

Empty, loading i error mają komunikat, jednoznaczną ikonę oraz następną akcję. Stan archiwalny nie jest komunikowany samą przezroczystością. Akcje destrukcyjne są drugorzędne i wymagają potwierdzenia.

## 6. Logo

Produkcyjnym masterem jest lokalny `web/assets/fms-logo.svg`. Nie wolno używać zewnętrznych URL Stitch. Wariant jasny używa znaku slate na jasnym tle; ciemny — biały logotyp na slate; monochromatyczny — 100% czerni lub bieli. Minimalna wysokość cyfrowa: 28 px, druk: 10 mm. Clear space: co najmniej 1/4 wysokości znaku.

## 7. Raporty

HTML i PDF korzystają z tego samego modelu oraz rejestru sekcji: `report_header`, `executive_summary`, `latest_assessment`, `priority_findings`, `test_descriptions`, `history`, `recommendations`, `next_steps`, `methodology`, `trainer_signature`.

Raport bazuje na ostatnim kompletnym badaniu, nie na ostatnim teście ani szkicu. `history` pojawia się od dwóch kompletnych badań, a sekcje opcjonalne nie renderują pustych bloków. Priorytet: ból/red flag → clearing → asymetria → wynik 1. Profile: `free_current_result`, `assessment_report`, `full_coaching_report`. Nagłówek, wynik, metodologia i disclaimer są obowiązkowe. Finalny raport zapisuje snapshot, listę sekcji, wersję manuala, generatora i PDF; późniejsze edycje nie zmieniają historii.

Disclaimer: `Raport opisuje zapisane wyniki screeningu. Nie stanowi diagnozy ani zalecenia terapeutycznego.`

## 8. Podział systemu

1. KB Trener Core — branding, shell, topbar, app switcher, formularze, selektory, badges, nawigacja i stany.
2. QuickScreen Module — wizard, progres, scoring, strony L/P, clearing i status szkicu.
3. Report components — okładka, wynik, findings, macierz, metodologia i podpis raportu QuickScreen.
4. Module configuration — nazwy, kolejność testów, pola i reguły punktacji QuickScreen.

Przyszłe moduły KB Trener mogą importować warstwy Core i Report, a QuickScreen korzysta z warstwy modułowej. Żaden moduł nie powinien definiować własnej semantyki statusów bez uzasadnienia.

## 9. Zakazane odstępstwa

- własne kolory statusów albo primary `#000000`;
- zewnętrzne, wygasające URL logo;
- znaczenie przekazywane wyłącznie kolorem;
- anonimowe kropki postępu bez nazw testów;
- pełne kryteria rozwinięte domyślnie;
- tabele/formularze przewijane poziomo na mobile;
- historia przy jednym badaniu lub puste sekcje opcjonalne;
- generowanie HTML i PDF z różnych modeli danych;
- ponowne składanie historycznego raportu z aktualnych danych;
- estetyka medyczna, przesadne gradienty, glassmorphism i przypadkowe promienie.

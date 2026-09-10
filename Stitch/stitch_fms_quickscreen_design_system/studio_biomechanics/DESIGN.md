---
name: KB Trener / QuickScreen Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#111c2d'
  on-tertiary-container: '#79849a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-base: '#F8FAFC'
  surface-card: '#FFFFFF'
  surface-muted: '#F1F5F9'
  border-subtle: '#E2E8F0'
  border-strong: '#CBD5E1'
  state-pass: '#059669'
  state-pass-bg: '#ECFDF5'
  state-pass-border: '#A7F3D0'
  state-fail: '#D97706'
  state-fail-bg: '#FFFBEB'
  state-pain: '#E11D48'
  state-pain-bg: '#FFF1F2'
  state-pain-border: '#FECDD3'
  state-draft: '#0284C7'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  numeric-score:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-min: 48px
  gutter-mobile: 16px
  gutter-desktop: 24px
  section-gap: 24px
  element-gap: 12px
  padding-card: 16px
  sticky-bar-height: 76px
---

# KB Trener / QuickScreen — System Projektowania UX/UI

## 1. Filozofia i kierunek wizualny
- **Kontekst:** Prywatny moduł QuickScreen w systemie KB Trener, przeznaczony do pracy trenera na sali treningowej (obsługa jedną ręką na smartfonie 390px, tablecie lub desktopie).
- **Stylistyka:** Nowoczesne studio treningowe i precyzyjna analiza ruchu (biomechanika, ergonomia, spokój). Wykluczamy estetykę chłodnego szpitala/medycyny oraz generyczny panel SaaS.
- **Hierarchia:** Czysta, wysokokontrastowa (WCAG AA), zoptymalizowana pod kątem ergonomii dotyku (targety min. 48x48px).

## 2. Paleta kolorów
- **Primary / Brand Dark:** `#0F172A` (Głęboki grafit / Deep Slate — stabilny, techniczny, profesjonalny)
- **Primary Accent / Dynamic Slate:** `#1E293B` & `#334155` (Subtelne akcenty strukturalne i aktywne zaznaczenia)
- **Accent Brand (Movement / Energy):** `#0D9488` (Teal / Morska zieleń — świeżość studia treningowego, precyzja, neutralność)
- **Surface & Backgrounds:**
  - `Surface Base`: `#F8FAFC` (Czyste, jasne tło redukujące odblaski na sali)
  - `Surface Card`: `#FFFFFF`
  - `Surface Muted / Hover`: `#F1F5F9`
  - `Border Subtle`: `#E2E8F0`
  - `Border Strong`: `#CBD5E1`
- **Stany semantyczne (FMS Specific):**
  - `Pass / Brak bólu`: `#059669` (Czysty szmaragd, pozytywny zakres) / Tło: `#ECFDF5` / Obrys: `#A7F3D0`
  - `Fail`: `#D97706` (Bursztyn/Ciepły pomarańcz — neutralna uwaga, brak zaliczenia) / Tło: `#FFFBEB`
  - `Ból / 0-ból`: `#E11D48` (Malinowa czerwień — wyraźna flaga bólu, niealarmistyczna, lecz natychmiast widoczna) / Tło: `#FFF1F2` / Obrys: `#FECDD3`
  - `Draft Saved`: `#0284C7` (Spokojny błękit indygo)
  - `Zaznaczenie aktywne (Segmented button)`: `#0F172A` z białym tekstem `#FFFFFF` i ikoną check/markera.

## 3. Typografia
- **Font podstawowy:** Inter lub Plus Jakarta Sans — zoptymalizowany pod kątem cyfr i skanowalności tabelarycznej.
- **Font akcentowy:** Outfit lub Plus Jakarta Sans (mocne, geometryczne nagłówki).
- **Skala:**
  - H1 (Desktop/Tablet): 28px, semi-bold, letter-spacing -0.02em
  - H2 / Nazwa testu: 20px-22px, bold
  - Body text: min. 16px na mobile dla czytelności w ruchu
  - Caption / Etykieta pomocnicza: 13-14px, medium
  - Wartości liczbowe wyników (0-3, Total /15): Tabular figures, bold font-weight.

## 4. Komponenty kluczowe (FMS Wizard & Hub)
- **Segmented Control / Selektory odpowiedzi:** Min. wysokość 48px, duże obszary dotyku, jednoczesne kodowanie kolorem, obrysem i etykietą tekstową (nigdy sam kolor).
- **Porównanie Lewa / Prawa strona:** Wyrównane w jednej osi L/P z wyraźnym rozróżnieniem stron (brak możliwości pomylenia kończyn).
- **Kompaktowy Header badania:** Klient, data i status zapisu lokalnego w jednym zwięzłym pasku, nie dominującym nad pytaniami testowymi.
- **Drawer / Bottom Sheet dla Kryteriów oceny:** Pełne kryteria dostępne pod ręką na żądanie, domyślnie zwinięte.
- **Sticky Action Bar:** Dolny pasek z nawigacją Wstecz / Dalej / Zakończ badanie zawsze pod kciukiem.
- **Portal KB Trener App Switcher:** Elegancki przełącznik modułów (FMS, SFMA, QuickScreen) w nagłówku.

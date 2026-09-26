# QuickScreen V2 — wytyczne wizualne

> Aplikacja QuickScreen V2 dla KB Trener / Karol Bilecki  
> Źródło prawdy projektu: Figma `eUlk8pZzLoeMtggipYvy97`

Ten dokument opisuje nowy system wizualny aplikacji. Przy implementacji należy zachować poniższe tokeny, zasady responsywności i komponenty. W przypadku rozbieżności między tym dokumentem a wskazanym plikiem Figma, Figma jest źródłem prawdy.

## 1. Kolory

### Kolory główne

| Token | Wartość | Zastosowanie |
|---|---|---|
| `accent` | `#3B82F6` | Przyciski CTA, linki, aktywne zakładki, wykresy trendów |
| `text-primary` | `#0F172A` | Nagłówki i główny tekst |
| `text-body` | `#475569` | Tekst treści i opisy |
| `text-muted` | `#94A3B8` | Tekst pomocniczy i placeholdery |
| `white` | `#FFFFFF` | Tła kart, nagłówka i dolnego paska nawigacji |
| `border` | `#E2E8F0` | Obramowania kart, separatory i pola formularzy |
| `bg-page` | `#F8FAFC` | Tło strony |
| `bg-blue-light` | `#EFF6FF` | Tła przycisków ghost i secondary |
| `bg-section` | `#F9FAFB` | Tło sekcji wewnątrz kart |
| `bg-blue-soft` | `#DBEAFE` | Tło podświetlonych elementów |

### Statusy wyników

| Status | Kolor | Ikona | Znaczenie |
|---|---|---|---|
| OK | `#219666` | Kółko z `✓` | Wynik prawidłowy |
| Uwaga | `#D98C1A` | Trójkąt z `!` | Wynik wymaga uwagi |
| Problem | `#E01C24` | Kółko z `!` | Wynik nieprawidłowy |

Ikony statusu mają ramkę 18 × 18 px i obrys 1,5 px w kolorze statusu. Kółka mają `border-radius: 50%`; ikonę Uwaga należy przedstawić jako trójkąt. Znak wewnątrz ikony używa koloru statusu. Statusy komunikuj ikonami — nie dodawaj tekstowych etykiet oceny, takich jak „Dobry” lub „Słaby”.

## 2. Typografia

W całej aplikacji stosuj rodzinę **Inter**.

| Rola | Rozmiar | Grubość | Zastosowanie |
|---|---:|---:|---|
| Hero / tytuł strony | 48 px | 800 (Extra Bold) | Ekran powitalny |
| H1 | 24 px | 600 (Semi Bold) | Główne tytuły sekcji |
| H2 | 18 px | 600 (Semi Bold) | Tytuły kart |
| H3 | 16 px | 600 (Semi Bold) | Podtytuły w kartach |
| Body | 14 px | 400 (Regular) | Główna treść |
| Body Medium | 14 px | 500 (Medium) | Wyróżniony tekst treści |
| Small / Caption | 12–13 px | 400 (Regular) | Etykiety i metadane |
| Fine | 10–11 px | 400 (Regular) | Drobne adnotacje |

Kolory tekstu: `#0F172A` dla tekstu głównego, `#475569` dla treści i `#94A3B8` dla tekstu pomocniczego.

## 3. Odstępy

Bazowa jednostka odstępów wynosi 4 px. Stosuj wielokrotności tej wartości.

| Token | Wartość | Typowe zastosowanie |
|---|---:|---|
| `xs` | 4 px | Mały odstęp, np. ikona–tekst |
| `sm` | 8 px | Wnętrze małych komponentów |
| `md` | 12 px | Domyślny odstęp między elementami |
| `base` | 16 px | Padding małych kart |
| `lg` | 20 px | Odstępy między sekcjami |
| `xl` | 24 px | Padding kart i odstęp między sekcjami |
| `2xl` | 32 px | Większe odstępy |
| `3xl` | 40 px | Margines treści na desktopie |
| `4xl` | 80 px | Odstępy w hero i separatory sekcji |

## 4. Zaokrąglenia

| Wartość | Zastosowanie |
|---:|---|
| 6 px | Małe przyciski secondary/ghost i tagi |
| 8 px | Domyślne przyciski, inputy i mniejsze karty |
| 10 px | Przyciski CTA |
| 12 px | Większe przyciski i inputy formularzy |
| 16 px | Karty i kontenery treści |
| 100% | Okrągłe awatary i badge |

## 5. Cienie i obramowania

Domyślnie karty używają obramowania `1px solid #E2E8F0`, bez cienia. Delikatny cień stosuj oszczędnie, wyłącznie dla kart wymagających wizualnego uniesienia:

```css
box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
```

## 6. Układ i nawigacja

### Desktop — punkt odniesienia 1440 px

- Nagłówek: wysokość 72 px, białe tło; logo po lewej, zakładki nawigacji i avatar.
- Kontener treści: maksymalna szerokość 1360 px, wyśrodkowany, padding poziomy 40 px, odstęp między elementami 24 px.
- Karty: białe tło, obramowanie `#E2E8F0`, promień 16 px.
- Stopka: wysokość 56 px.

Nawigacja desktop zawiera zakładki: **Dashboard, Klienci, Nowy test, Ściąga, Profil**. Aktywna zakładka używa tekstu `#3B82F6` i podkreślenia; nieaktywne zakładki używają `#475569`.

### Mobile — punkt odniesienia 390 px

- Pasek statusu: 36 px.
- Nagłówek: 64 px, białe tło, logo.
- Przewijana treść: padding poziomy 16 px.
- Dolny pasek nawigacji: 72 px plus 20 px safe area; pięć równomiernie rozmieszczonych pozycji.
- Każda pozycja nawigacji zawiera ikonę i etykietę pod ikoną.
- Aktywna pozycja używa `#3B82F6`, nieaktywna `#94A3B8`.
- Nie używaj menu hamburgerowego. Cała nawigacja znajduje się w dolnym pasku.

Nawigacja mobile zawiera te same pozycje co desktop: **Dashboard, Klienci, Nowy test, Ściąga, Profil**.

## 7. Komponenty

### Inputy i wyszukiwarka

```css
.input {
  height: 37px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  color: #0F172A;
  font-size: 14px;
}

.input::placeholder {
  color: #94A3B8;
}
```

### Tabele

```css
.table-header {
  height: 47px;
  border-bottom: 1px solid #E2E8F0;
  color: #94A3B8;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}
```

Wiersze tabeli zachowują czytelny układ, odstępy i obramowania zgodne z tokenami. Na wąskich ekranach zawartość tabeli musi pozostać dostępna i czytelna.

## 8. Widoki aplikacji

Każdy widok ma wariant desktopowy (punkt odniesienia 1440 px) i mobilny (punkt odniesienia 390 px).

| Obszar | Ekran | Opis |
|---|---|---|
| Trener | `trainer-dashboard` | Panel główny: powitanie, ostatnia aktywność i szybka nawigacja |
| Trener | `trainer-clients` | Lista klientów z wyszukiwarką i tabelą |
| Trener | `trainer-client-profile` | Dane klienta, historia badań i trend |
| Klient | `client-dashboard` | Podsumowanie, trend i ostatnie badanie |
| Klient | `client-report` | Pełny raport z badania |
| Wspólne | `assessment-client` | Wybór klienta lub rozpoczęcie badania |
| Wspólne | `toe-touch` / `shoulder-clearing` | Ekrany poszczególnych testów |
| Wspólne | `assessment-results` | Wyniki badania w tabeli z ikonami statusów |
| Wspólne | `cheat-sheet` | Ściąga z testami i instrukcjami |

## 9. Wykresy trendów

- Linia i punkty danych: `#3B82F6`.
- Używaj jednego koloru trendu; nie stosuj czerwieni ani zieleni do kodowania linii wykresu.
- Linie siatki: `#E2E8F0`; etykiety osi: `#94A3B8`.
- Wykres zajmuje pełną szerokość karty i ma około 200 px wysokości.

## 10. Logo

Używaj oryginalnego rastrowego logo QB/KB wskazanego w Figmie (image hash `1773d83a9d46ead25a088bdeafb39598a77f1509`). Logo występuje po lewej stronie nagłówka desktopowego oraz w nagłówku mobilnym. Nie twórz ani nie stosuj zastępczego logo.


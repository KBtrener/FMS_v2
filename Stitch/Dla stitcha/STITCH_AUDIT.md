# Audyt rozbieżności Stitch → produkcja

| Obszar | Materiał Stitch | Stan wcześniejszy | Decyzja produkcyjna |
|---|---|---|---|
| primary | `#000000` w części kodu | zielono-koralowa paleta | `#0F172A` |
| akcent | teal | coral | `#0D9488` |
| fonty | Outfit + Inter | Fraunces + Manrope | Outfit + Inter |
| statusy | 4 stany semantyczne | alert głównie czerwony | wspólny badge: znak + nazwa + kolor |
| wizard | nazwane kroki | anonimowe segmenty | nazwy 1–9 i stan tekstowy |
| akcje wizardu | sticky | zwykły footer | sticky action bar + safe area |
| raport | modularne karty A4 | monolit zawsze z historią | rejestr sekcji i profile |
| historia | warunkowa | pusty placeholder | od dwóch kompletnych badań |
| zapis raportu | snapshot | brak utrwalenia | immutable snapshot + PDF Storage |
| logo | zewnętrzne URL | litera Q | lokalny master SVG |
| screenshoty | 2 uszkodzone | brak walidacji | fallback do `code.html` |

Audyt wykonano na plikach dostępnych 2026-09-08. Dark mode jest poza zakresem wersji 2.0.

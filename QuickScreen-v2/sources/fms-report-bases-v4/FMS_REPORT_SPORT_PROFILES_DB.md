# Profile użytkownika, tagi wymagań ruchowych i dyscypliny

Wersja: 4.0

## 1. Profile

### GENERAL

- `id`: `general`
- `label`: `Osoba ogólna / nieaktywna`
- `description`: `Raport odnosi wynik do codziennego ruchu, schodów, siadania i wstawania, podnoszenia, sięgania, równowagi i swobody poruszania się.`
- `sport_required`: `false`

### ACTIVE

- `id`: `active`
- `label`: `Osoba aktywna / sportowiec`
- `description`: `Raport odnosi wynik do treningu i konkretnych wymagań wybranej aktywności.`
- `sport_required`: `false`

Profil nie zmienia kolejności korekcji.

---

# 2. Tagi wymagań ruchowych

Tagi opisują wymaganie ruchowe, a nie diagnozę.

- `OVERHEAD` — ruchy rękami nad głową.
- `RACKET` — szybkie ruchy rakietą, asymetria i rotacja.
- `ROTATIONAL` — skręt całego ciała i przenoszenie ciężaru.
- `THROWING` — sekwencyjne przenoszenie siły do kończyny górnej.
- `CLIMBING` — asymetryczna praca kończyn, barków i bioder.
- `SWIMMING` — powtarzana praca barków i rotacji.
- `RUNNING` — powtarzalna praca naprzemienna.
- `SINGLE_LEG` — duża rola jednej nogi.
- `CHANGE_OF_DIRECTION` — hamowanie, cięcie, zwrot, ponowne przyspieszenie.
- `JUMPING` — odbicie i lądowanie.
- `HINGE` — zgięcie bioder i kontrola tułowia.
- `LOWER_BODY` — duże wymagania dla kończyn dolnych.
- `CYCLING` — powtarzalna praca nóg w zgięciu i długotrwała pozycja.
- `ATHLETICS` — tag ogólny lekkoatletyczny.
- `COMBAT` — szybka zmiana pozycji, rotacja, reakcja i praca jednostronna.
- `ENDURANCE` — duża liczba powtórzeń i długi czas pracy.
- `HEAD_ORIENTATION` — częste ustawianie głowy względem otoczenia.
- `KICKING` — kopnięcie i dynamiczna praca nogi podporowej.
- `LIFTING` — zewnętrzne obciążenie w ćwiczeniach siłowych.
- `CONTACT` — kontakt fizyczny i szybka stabilizacja po zaburzeniu pozycji.

---

# 3. Jak dodawać nowy sport

Nowa dyscyplina wymaga tylko:

```text
id
label
tags[]
sport_relevance_text
activity_examples[tag] = konkretny przykład z tej dyscypliny
```

Nie dopisuj nowej logiki FMS.

Algorytm:

```text
matched_tags = intersection(sport.tags, action_rule.movement_demand_tags)
```

Jeśli jest dopasowanie, użyj maksymalnie 1–2 przykładów `activity_examples`.

---

# 4. Dyscypliny

## Piłka nożna
- `id`: `football`
- `tags`: `RUNNING`, `SINGLE_LEG`, `CHANGE_OF_DIRECTION`, `JUMPING`, `ROTATIONAL`, `KICKING`, `ENDURANCE`, `CONTACT`
- `sport_relevance_text`: `W piłce nożnej duże znaczenie mają kontrola jednej nogi, hamowanie, zmiana kierunku, przyspieszenie i praca asymetryczna.`
- `activity_examples.RUNNING`: `sprinty i przyspieszenia`
- `activity_examples.SINGLE_LEG`: `praca nogi podporowej i zadania na jednej nodze`
- `activity_examples.CHANGE_OF_DIRECTION`: `ostre hamowania, cięcia i szybkie zwroty`
- `activity_examples.JUMPING`: `wyskoki i lądowania`
- `activity_examples.KICKING`: `mocne kopnięcia i dynamiczna praca nogi podporowej`
- `activity_examples.ROTATIONAL`: `zwroty tułowia podczas prowadzenia, podania i strzału`

## Bieganie
- `id`: `running`
- `tags`: `RUNNING`, `SINGLE_LEG`, `ENDURANCE`, `LOWER_BODY`
- `sport_relevance_text`: `W biegu ten sam schemat obciążania nóg powtarza się przy każdym kroku, dlatego kontrola i różnice między stronami mają praktyczne znaczenie.`
- `activity_examples.RUNNING`: `sprinty, interwały i dłuższe odcinki`
- `activity_examples.SINGLE_LEG`: `przyjęcie obciążenia na jednej nodze przy każdym kroku`
- `activity_examples.ENDURANCE`: `duża liczba powtórzeń w trakcie biegu`

## Trening siłowy / siłownia
- `id`: `strength_training`
- `tags`: `LIFTING`, `HINGE`, `LOWER_BODY`, `OVERHEAD`, `ROTATIONAL`
- `sport_relevance_text`: `W treningu siłowym jakość podstawowych ruchów ma znaczenie szczególnie wtedy, gdy dokładamy zewnętrzne obciążenie.`
- `activity_examples.LIFTING`: `ciężkie serie i progresja obciążenia`
- `activity_examples.HINGE`: `martwy ciąg, RDL i inne ruchy zawiasowe`
- `activity_examples.LOWER_BODY`: `przysiady, wykroki i ćwiczenia nóg`
- `activity_examples.OVERHEAD`: `wyciskania i inne ruchy nad głową`
- `activity_examples.ROTATIONAL`: `ćwiczenia rotacyjne z oporem`

## Siatkówka
- `id`: `volleyball`
- `tags`: `OVERHEAD`, `JUMPING`, `SINGLE_LEG`, `CHANGE_OF_DIRECTION`, `ROTATIONAL`
- `sport_relevance_text`: `W siatkówce duże znaczenie mają powtarzane ruchy nad głową, wyskok, lądowanie i szybkie ustawianie się do piłki.`
- `activity_examples.OVERHEAD`: `atak, zagrywka i blok`
- `activity_examples.JUMPING`: `duża liczba wyskoków i lądowań`
- `activity_examples.CHANGE_OF_DIRECTION`: `szybkie dojścia i korekty ustawienia`
- `activity_examples.SINGLE_LEG`: `lądowania i przejścia obciążenia między nogami`

## Koszykówka
- `id`: `basketball`
- `tags`: `RUNNING`, `JUMPING`, `CHANGE_OF_DIRECTION`, `SINGLE_LEG`, `ROTATIONAL`, `CONTACT`
- `sport_relevance_text`: `W koszykówce duże znaczenie mają przyspieszenie, hamowanie, skok, lądowanie i szybkie zmiany kierunku.`
- `activity_examples.JUMPING`: `wyskoki i lądowania`
- `activity_examples.CHANGE_OF_DIRECTION`: `cięcia, zatrzymania i zwroty`
- `activity_examples.SINGLE_LEG`: `wybicia i lądowania na jednej nodze`
- `activity_examples.RUNNING`: `sprinty i szybkie przejścia`

## Tenis
- `id`: `tennis`
- `tags`: `RACKET`, `OVERHEAD`, `ROTATIONAL`, `CHANGE_OF_DIRECTION`, `SINGLE_LEG`, `RUNNING`
- `sport_relevance_text`: `W tenisie duże znaczenie mają szybka rotacja, praca rakietą, hamowanie i częste zmiany kierunku.`
- `activity_examples.RACKET`: `serwis, forehand i backhand`
- `activity_examples.OVERHEAD`: `serwis i smecz`
- `activity_examples.ROTATIONAL`: `dynamiczna rotacja podczas uderzeń`
- `activity_examples.CHANGE_OF_DIRECTION`: `starty, hamowania i zmiany kierunku`

## Padel
- `id`: `padel`
- `tags`: `RACKET`, `OVERHEAD`, `ROTATIONAL`, `CHANGE_OF_DIRECTION`, `SINGLE_LEG`
- `sport_relevance_text`: `W padlu często łączysz rotację, pracę rakietą nad głową, szybkie hamowanie i zmianę kierunku.`
- `activity_examples.RACKET`: `uderzenia po odbiciu od ściany i szybkie akcje przy siatce`
- `activity_examples.OVERHEAD`: `bandeja, vibora i smecz`
- `activity_examples.CHANGE_OF_DIRECTION`: `krótkie starty, hamowania i zwroty`
- `activity_examples.ROTATIONAL`: `dynamiczna rotacja przy uderzeniach`

## Piłka ręczna
- `id`: `handball`
- `tags`: `THROWING`, `OVERHEAD`, `RUNNING`, `CHANGE_OF_DIRECTION`, `JUMPING`, `SINGLE_LEG`, `CONTACT`, `ROTATIONAL`
- `sport_relevance_text`: `W piłce ręcznej bark i tułów łączą się z biegiem, wyskokiem, lądowaniem, rzutem i kontaktem.`
- `activity_examples.THROWING`: `rzuty z podłoża i z wyskoku`
- `activity_examples.OVERHEAD`: `duża liczba ruchów ręki nad głową`
- `activity_examples.JUMPING`: `wyskok do rzutu i lądowanie`
- `activity_examples.CHANGE_OF_DIRECTION`: `zwody, hamowanie i ponowne przyspieszenie`

## Narciarstwo alpejskie
- `id`: `alpine_skiing`
- `tags`: `LOWER_BODY`, `SINGLE_LEG`, `ROTATIONAL`, `CHANGE_OF_DIRECTION`, `ENDURANCE`
- `sport_relevance_text`: `W narciarstwie duże znaczenie mają kontrola kończyn dolnych, przenoszenie ciężaru i utrzymanie jakości ruchu podczas kolejnych skrętów.`
- `activity_examples.LOWER_BODY`: `utrzymanie pozycji i obciążenia nóg w skręcie`
- `activity_examples.SINGLE_LEG`: `zmiana dominującego obciążenia między nartami`
- `activity_examples.ROTATIONAL`: `kontrola tułowia podczas skrętu`
- `activity_examples.CHANGE_OF_DIRECTION`: `kolejne dynamiczne skręty`

## Wspinanie
- `id`: `climbing`
- `tags`: `CLIMBING`, `OVERHEAD`, `SINGLE_LEG`, `ROTATIONAL`, `HINGE`
- `sport_relevance_text`: `We wspinaniu duże znaczenie mają praca w asymetrycznych pozycjach, kontrola barków, przenoszenie ciężaru i współpraca całego ciała.`
- `activity_examples.CLIMBING`: `dalekie sięgnięcia, skręty i asymetryczne pozycje`
- `activity_examples.OVERHEAD`: `praca rękami wysoko nad głową`
- `activity_examples.SINGLE_LEG`: `wysokie stopnie i przenoszenie ciężaru na jedną nogę`

## Badminton
- `id`: `badminton`
- `tags`: `RACKET`, `OVERHEAD`, `ROTATIONAL`, `CHANGE_OF_DIRECTION`, `SINGLE_LEG`, `JUMPING`
- `sport_relevance_text`: `W badmintonie duże znaczenie mają szybka zmiana kierunku, praca jednonóż, rotacja i ruchy rakietą nad głową.`
- `activity_examples.RACKET`: `smasz, clear i szybkie uderzenia rakietą`
- `activity_examples.OVERHEAD`: `smasz i clear nad głową`
- `activity_examples.CHANGE_OF_DIRECTION`: `dynamiczne dojścia do lotki i powroty`
- `activity_examples.SINGLE_LEG`: `głębokie wykroki i odbicia z jednej nogi`

## Squash
- `id`: `squash`
- `tags`: `RACKET`, `ROTATIONAL`, `CHANGE_OF_DIRECTION`, `SINGLE_LEG`, `LOWER_BODY`
- `sport_relevance_text`: `W squashu duże znaczenie mają kontrola przy zmianach kierunku, rotacja i stabilne obciążanie jednej nogi.`
- `activity_examples.RACKET`: `dynamiczne uderzenia z różnych ustawień`
- `activity_examples.CHANGE_OF_DIRECTION`: `gwałtowne starty, zatrzymania i zwroty`
- `activity_examples.SINGLE_LEG`: `głębokie wykroki`

## Lekkoatletyka
- `id`: `athletics`
- `tags`: `ATHLETICS`, `RUNNING`, `SINGLE_LEG`, `LOWER_BODY`, `JUMPING`, `ROTATIONAL`
- `sport_relevance_text`: `Znaczenie wyniku zależy od konkurencji. Jeśli jest znana, preferuj bardziej precyzyjne tagi konkurencji.`
- `activity_examples.RUNNING`: `sprint i biegi`
- `activity_examples.JUMPING`: `skoki i lądowania`
- `activity_examples.ROTATIONAL`: `konkurencje rzutowe`

## Pływanie
- `id`: `swimming`
- `tags`: `SWIMMING`, `OVERHEAD`, `ROTATIONAL`, `ENDURANCE`
- `sport_relevance_text`: `W pływaniu szczególne znaczenie mają swobodna praca barków, rotacja tułowia i jakość ruchu powtarzanego wiele razy.`
- `activity_examples.SWIMMING`: `powtarzane cykle pracy ramion`
- `activity_examples.OVERHEAD`: `wejście i przeniesienie ręki nad głową`
- `activity_examples.ROTATIONAL`: `rotacja tułowia w kraulu i grzbiecie`

## Kolarstwo
- `id`: `cycling`
- `tags`: `CYCLING`, `ENDURANCE`, `LOWER_BODY`, `HINGE`, `HEAD_ORIENTATION`
- `sport_relevance_text`: `W kolarstwie ważne są zgięcie bioder, kontrola kończyn dolnych i swoboda szyi podczas długotrwałej pozycji.`
- `activity_examples.CYCLING`: `długotrwała pozycja na rowerze`
- `activity_examples.ENDURANCE`: `wiele tysięcy powtórzeń pedałowania`
- `activity_examples.HEAD_ORIENTATION`: `utrzymanie głowy i obserwacja drogi`
- `activity_examples.HINGE`: `długotrwałe zgięcie bioder i tułowia`

## Triathlon
- `id`: `triathlon`
- `tags`: `SWIMMING`, `CYCLING`, `RUNNING`, `ENDURANCE`, `SINGLE_LEG`, `OVERHEAD`, `HINGE`
- `sport_relevance_text`: `W triathlonie łączą się wymagania pływania, kolarstwa i biegu.`
- `activity_examples.SWIMMING`: `powtarzana praca ramion w pływaniu`
- `activity_examples.CYCLING`: `długotrwała pozycja i pedałowanie`
- `activity_examples.RUNNING`: `powtarzalna praca jednonóż w biegu`

## Sztuki walki
- `id`: `martial_arts`
- `tags`: `COMBAT`, `ROTATIONAL`, `SINGLE_LEG`, `CHANGE_OF_DIRECTION`, `OVERHEAD`, `LOWER_BODY`, `HEAD_ORIENTATION`, `KICKING`, `CONTACT`
- `sport_relevance_text`: `W sztukach walki szczególnie liczą się rotacja, kontrola jednej nogi, szybka zmiana pozycji i podobna jakość ruchu po obu stronach.`
- `activity_examples.COMBAT`: `szybkie wejścia, wyjścia i reakcje`
- `activity_examples.ROTATIONAL`: `ciosy i kopnięcia wykorzystujące rotację`
- `activity_examples.SINGLE_LEG`: `kopnięcia i pozycje wymagające kontroli jednej nogi`
- `activity_examples.KICKING`: `dynamiczne kopnięcia`

---

# 5. ACTIVE bez wybranego sportu

Użyj `active_meaning` i bazowego `ACTION_RULES_DB`.

Nie wymyślaj konkretnej dyscypliny.

---

# 6. GENERAL — codzienny kontekst

Profil GENERAL nie potrzebuje sportowych tagów.

Konkretne zalecenia są zapisane w `general_*` każdego Action Rule.

W opisach można używać przykładów:

- `cervical`: patrzenie w bok, prowadzenie samochodu, obserwacja otoczenia;
- `toe_touch`: schylanie się, podnoszenie przedmiotów z podłogi;
- `shoulder_mobility`: sięganie na wysoką półkę, zakładanie ubrania, sięganie za plecy;
- `squat`: siadanie, wstawanie, niskie pozycje;
- `balance`: schody, ubieranie się na stojąco, przechodzenie przez nierówne podłoże;
- `rotation`: obracanie się, sięganie za siebie, zmiana kierunku ciała.

Nie sugeruj, że osoba nieaktywna powinna unikać normalnego życia tylko z powodu wyniku 1. Ograniczenia mają dotyczyć przede wszystkim wymuszania trudniejszej wersji ruchu lub bolesnego zakresu.

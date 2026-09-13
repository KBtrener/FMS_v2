# Profile użytkownika, tagi sportowe i dyscypliny

Wersja: 3.0

## 1. Profile

### GENERAL

- `id`: `general`
- `label`: `Osoba ogólna / nieaktywna`
- `description`: `Raport odnosi wynik do codziennego ruchu, swobody poruszania się, równowagi i podstawowej sprawności.`

### ACTIVE

- `id`: `active`
- `label`: `Osoba aktywna / sportowiec`
- `description`: `Raport odnosi wynik do treningu, obciążenia, prędkości, pracy asymetrycznej i konkretnych wymagań wybranego sportu.`

Profile nie sterują CTA biznesowym. CTA zależy od `account_exists` i historii.

---

# 2. Tagi sportowe

## OVERHEAD
`Dużo pracy rękami nad głową i potrzeba dobrej współpracy barku, łopatki i tułowia.`

## RACKET
`Szybka rotacja, praca asymetryczna, zmiana kierunku i duża rola kończyny górnej.`

## ROTATIONAL
`Dużo skrętu całego ciała, przenoszenia ciężaru i kontroli rotacji.`

## THROWING
`Przenoszenie siły od podłoża przez tułów do kończyny górnej.`

## CLIMBING
`Dużo pracy barków, bioder, tułowia i kończyn w asymetrycznych pozycjach.`

## SWIMMING
`Powtarzalna praca kończyn górnych, rotacja tułowia i duże wymagania dla barków.`

## RUNNING
`Powtarzalna praca naprzemienna i duża rola kontroli jednej nogi.`

## SINGLE_LEG
`Dużo pracy na jednej nodze i przyjmowania obciążenia asymetrycznie.`

## CHANGE_OF_DIRECTION
`Hamowanie, ponowne przyspieszanie i szybka zmiana kierunku.`

## JUMPING
`Odbicie, lądowanie i szybkie przyjmowanie obciążenia.`

## HINGE
`Duża rola zgięcia bioder i kontroli tułowia.`

## LOWER_BODY
`Duże wymagania dla kończyn dolnych.`

## CYCLING
`Powtarzalna praca nóg w zgięciu i długotrwała pozycja tułowia.`

## ATHLETICS
`Tag ogólny dla lekkoatletyki. Jeśli znana jest konkurencja, warto używać bardziej precyzyjnych tagów.`

## COMBAT
`Rotacja, zmiana pozycji, praca jednostronna, równowaga i szybkie reakcje.`

## ENDURANCE
`Dużo powtarzalnych ruchów i długi czas ekspozycji na tę samą strategię ruchu.`

## HEAD_ORIENTATION
`Częste i szybkie ustawianie głowy względem otoczenia.`

---

# 3. Dyscypliny

## Wspinanie

- `id`: `climbing`
- `tags`: `CLIMBING`, `OVERHEAD`, `SINGLE_LEG`, `ROTATIONAL`, `HINGE`
- `sport_relevance_text`: `We wspinaniu duże znaczenie mają praca w asymetrycznych pozycjach, kontrola barków, przenoszenie ciężaru i współpraca całego ciała.`

## Badminton

- `id`: `badminton`
- `tags`: `RACKET`, `OVERHEAD`, `ROTATIONAL`, `CHANGE_OF_DIRECTION`, `SINGLE_LEG`, `JUMPING`
- `sport_relevance_text`: `W badmintonie ten wynik ma szczególne znaczenie dla szybkiej zmiany kierunku, pracy jednonóż, rotacji i ruchów rakietą nad głową.`

## Squash

- `id`: `squash`
- `tags`: `RACKET`, `ROTATIONAL`, `CHANGE_OF_DIRECTION`, `SINGLE_LEG`, `LOWER_BODY`
- `sport_relevance_text`: `W squashu duże znaczenie mają kontrola przy zmianach kierunku, rotacja i stabilne obciążanie jednej nogi.`

## Lekkoatletyka

- `id`: `athletics`
- `tags`: `ATHLETICS`, `RUNNING`, `SINGLE_LEG`, `LOWER_BODY`, `JUMPING`, `ROTATIONAL`
- `sport_relevance_text`: `W lekkoatletyce znaczenie wyniku zależy od konkurencji: biegi mocniej wykorzystują kontrolę jednonóż, skoki — kontrolę kończyn dolnych, a rzuty — rotację i barki.`

## Pływanie

- `id`: `swimming`
- `tags`: `SWIMMING`, `OVERHEAD`, `ROTATIONAL`, `ENDURANCE`
- `sport_relevance_text`: `W pływaniu szczególne znaczenie mają swobodna praca barków, rotacja tułowia i jakość ruchu powtarzanego wiele razy.`

## Kolarstwo

- `id`: `cycling`
- `tags`: `CYCLING`, `ENDURANCE`, `LOWER_BODY`, `HINGE`, `HEAD_ORIENTATION`
- `sport_relevance_text`: `W kolarstwie ważne są zgięcie bioder, kontrola kończyn dolnych i swoboda szyi podczas długotrwałej pozycji na rowerze.`

## Triathlon

- `id`: `triathlon`
- `tags`: `SWIMMING`, `CYCLING`, `RUNNING`, `ENDURANCE`, `SINGLE_LEG`, `OVERHEAD`, `HINGE`
- `sport_relevance_text`: `W triathlonie wynik trzeba odnieść do połączenia wymagań pływania, kolarstwa i biegu — szczególnie barków, kontroli jednej nogi i zgięcia bioder.`

## Sztuki walki

- `id`: `martial_arts`
- `tags`: `COMBAT`, `ROTATIONAL`, `SINGLE_LEG`, `CHANGE_OF_DIRECTION`, `OVERHEAD`, `LOWER_BODY`, `HEAD_ORIENTATION`
- `sport_relevance_text`: `W sztukach walki szczególnie liczą się rotacja, kontrola jednej nogi, podobna jakość ruchu po obu stronach i utrzymanie kontroli podczas szybkich zmian pozycji.`

---

# 4. Teksty kontekstowe per tag

Używaj maksymalnie 1–2 zdań sportowych dla jednego testu. Zdanie ma wyjaśniać, dlaczego wynik jest ważny dla danej osoby, a nie tylko powtarzać nazwę sportu.

- `RACKET`: `W sportach rakietowych ten ruch często łączy się z szybką rotacją, pracą asymetryczną i zmianą kierunku.`
- `CLIMBING`: `We wspinaniu ten ruch często pojawia się w asymetrycznych pozycjach i podczas przenoszenia ciężaru między kończynami.`
- `SWIMMING`: `W pływaniu ten ruch jest powtarzany wiele razy, dlatego jakość i podobna swoboda po obu stronach mają duże znaczenie.`
- `RUNNING`: `W biegu ten ruch powtarza się przy każdym kroku, dlatego kontrola i różnice między stronami mają praktyczne znaczenie.`
- `CYCLING`: `W kolarstwie ten sposób ustawienia i pracy ciała jest powtarzany przez długi czas, więc ograniczenie może być wielokrotnie utrwalane podczas jazdy.`
- `COMBAT`: `W sztukach walki ten ruch pojawia się podczas szybkiej zmiany pozycji, rotacji i pracy jednostronnej.`
- `CHANGE_OF_DIRECTION`: `Ten obszar ma znaczenie przy hamowaniu, ponownym przyspieszaniu i zmianie kierunku.`
- `SINGLE_LEG`: `Ma duże znaczenie w zadaniach wykonywanych na jednej nodze i podczas przyjmowania obciążenia asymetrycznie.`
- `OVERHEAD`: `Ma duże znaczenie w ruchach nad głową, gdzie bark, łopatka i tułów muszą dobrze ze sobą współpracować.`
- `ROTATIONAL`: `Ma duże znaczenie w ruchach wymagających skrętu całego ciała i przenoszenia ciężaru.`
- `JUMPING`: `Ma znaczenie przy odbiciu i lądowaniu, kiedy ciało musi szybko przyjąć i kontrolować obciążenie.`
- `HINGE`: `Ma znaczenie w ruchach wymagających sprawnego zgięcia w biodrach i kontroli tułowia.`
- `ENDURANCE`: `Przy dużej liczbie powtórzeń nawet niewielka różnica w sposobie ruchu może być powtarzana setki lub tysiące razy.`
- `HEAD_ORIENTATION`: `Ma znaczenie wtedy, gdy musisz szybko i swobodnie ustawiać głowę względem otoczenia.`

---

# 5. Wiele sportów

Jeśli użytkownik ma więcej niż jeden sport:

1. zbierz sumę tagów wszystkich sportów,
2. wybierz tylko tagi pasujące do danego testu,
3. dodaj maksymalnie dwa zdania kontekstowe,
4. unikaj dwóch zdań mówiących praktycznie to samo,
5. jeśli oba sporty są bezpośrednio istotne, użyj naturalnej formy, np. `We wspinaniu i pływaniu ten obszar jest szczególnie ważny, bo...`.

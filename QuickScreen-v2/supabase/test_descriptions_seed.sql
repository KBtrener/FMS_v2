-- Generated from 09_manual_test_descriptions_bilingual.md.
update public.test_descriptions set is_active = false where manual_version <> '1.0';

insert into public.test_descriptions (test_id, locale, purpose, procedure, verbal_instruction, side_definition, scoring_criteria, report_description, source_reference, manual_version, content_hash, is_active) values
((select test_id from public.tests where code = 'cervical_flexion'), 'en', 'Assesses whether the person can comfortably flex the neck forward without
pain or restriction. Observe smooth, controlled movement and whether
discomfort is present rather than the exact degree of range.', 'The person stands upright with feet together, arms relaxed at the sides, and
mouth closed. Two fingers are placed vertically at the top of the sternum.
The person slowly lowers the chin toward the fingers, holds the bottom
position for one count, and returns to the starting position.', 'Stand tall with your feet together, arms at your sides, and mouth closed.
Place two fingers at the top of your chest bone. Slowly bring your chin down
to your fingers, hold for one count, and return to the starting position.', '', '- **Range:** Pass when the chin comes within two fingers of the sternum;
  Fail when it does not.
- **Pain:** Positive when pain is present; Negative when there is no pain.', 'Assesses whether the person can comfortably flex the neck forward without
pain or restriction. Observe smooth, controlled movement and whether
discomfort is present rather than the exact degree of range.', 'FMS Quick Screen Manual, 9', '1.0', 'c0a829d53674df4ca37663a03d82f2a1e62fad27e2e42330ff1757b8779eefb7', true),
((select test_id from public.tests where code = 'cervical_flexion'), 'pl', 'Ocena, czy osoba może komfortowo wykonać zgięcie szyi do przodu bez bólu lub
ograniczenia. Obserwuj płynność i kontrolę ruchu oraz obecność bólu, a nie
dokładny kąt zakresu.', 'Osoba stoi prosto, ze stopami razem, rękami wzdłuż tułowia i zamkniętymi
ustami. Dwa palce ustawia pionowo na górze mostka. Powoli opuszcza brodę w
kierunku palców, utrzymuje dolną pozycję przez jedno odliczenie i wraca do
pozycji wyjściowej.', 'Stań prosto, ze stopami razem, rękami wzdłuż tułowia i zamkniętymi ustami.
Ustaw dwa palce na górze mostka. Powoli opuść brodę do palców, przytrzymaj
przez jedno odliczenie i wróć do pozycji wyjściowej.', '', '- **Zakres:** Pass, gdy broda znajduje się w odległości nie większej niż dwa
  palce od mostka; Fail, gdy nie osiąga tej odległości.
- **Ból:** Positive, gdy występuje ból; Negative, gdy bólu nie ma.', 'Ocena, czy osoba może komfortowo wykonać zgięcie szyi do przodu bez bólu lub
ograniczenia. Obserwuj płynność i kontrolę ruchu oraz obecność bólu, a nie
dokładny kąt zakresu.', 'FMS Quick Screen Manual, 9', '1.0', '5f07bc803e53811cedb7916bf98670b800edebc9b059d2d3916b9837c59a1c1a', true),
((select test_id from public.tests where code = 'cervical_rotation_extension'), 'en', 'Assesses comfortable, controlled head rotation to both sides and checks for
pain during rotation and during the combined rotation-and-extension position.
Side-to-side differences should be observed.', 'The person stands upright with feet together, arms at the sides, and mouth
closed. They slowly rotate the head as far as possible to one side and hold
the end position for one count. Without returning to neutral, they lower the
ear toward the same-side shoulder. They return to the start and repeat on the
opposite side.', 'Stand tall with your feet together, arms at your sides, and mouth closed.
Slowly rotate your head to the side and hold for one count. Lower that ear
toward the same-side shoulder, return to the start, and repeat on the other
side.', '', '- **Rotation range:** Pass when the chin reaches at least the midpoint of the
  clavicle on the tested side; Fail when it does not.
- **Pain with rotation:** Positive when pain is present; Negative when there
  is no pain.
- **Pain with rotation and extension:** Positive when pain is present;
  Negative when there is no pain.

Record all three fields independently for the left and right sides.', 'Assesses comfortable, controlled head rotation to both sides and checks for
pain during rotation and during the combined rotation-and-extension position.
Side-to-side differences should be observed.', 'FMS Quick Screen Manual, 10-11', '1.0', '23816f2c2f4fb7fb3916c65774c6280f2d0adfc937b2c2f2b362bd07be1be9ef', true),
((select test_id from public.tests where code = 'cervical_rotation_extension'), 'pl', 'Ocena kontrolowanego obrotu głowy w obie strony oraz bólu podczas samej
rotacji i podczas pozycji łączącej rotację z wyprostem. Obserwuj różnice
między stronami.', 'Osoba stoi prosto, ze stopami razem, rękami wzdłuż tułowia i zamkniętymi
ustami. Powoli obraca głowę maksymalnie w jedną stronę i utrzymuje pozycję
przez jedno odliczenie. Bez powrotu do pozycji neutralnej opuszcza ucho w
kierunku barku po tej samej stronie. Wraca do początku i powtarza po drugiej
stronie.', 'Stań prosto, ze stopami razem, rękami wzdłuż tułowia i zamkniętymi ustami.
Powoli obróć głowę w stronę i przytrzymaj przez jedno odliczenie. Opuść ucho
w kierunku barku po tej samej stronie, wróć do początku i powtórz po drugiej
stronie.', '', '- **Zakres rotacji:** Pass, gdy broda dochodzi co najmniej do połowy obojczyka
  po ocenianej stronie; Fail, gdy nie osiąga tego punktu.
- **Ból przy rotacji:** Positive, gdy występuje ból; Negative, gdy bólu nie ma.
- **Ból przy rotacji z wyprostem:** Positive, gdy występuje ból; Negative, gdy
  bólu nie ma.

Zapisz wszystkie trzy pola niezależnie dla lewej i prawej strony.', 'Ocena kontrolowanego obrotu głowy w obie strony oraz bólu podczas samej
rotacji i podczas pozycji łączącej rotację z wyprostem. Obserwuj różnice
między stronami.', 'FMS Quick Screen Manual, 10-11', '1.0', 'baa7d9ecce9a3e7950e8d17696042319ac079c7694c8106aff72b48fcb4e94d2', true),
((select test_id from public.tests where code = 'neck_extension_clearing'), 'en', 'Checks whether neck extension after rotation produces pain. This is a clearing
test and does not receive a 0-3 movement score.', 'After rotating the head to one side, gently extend the neck in the instructed
pattern. Return to neutral and repeat on the other side.', '', '', 'Record pain independently for the left and right sides. Positive means pain;
Negative means no pain. An active clearing rule may change only the final score
of the configured parent test; the rotation result remains preserved.', 'Checks whether neck extension after rotation produces pain. This is a clearing
test and does not receive a 0-3 movement score.', 'FMS Quick Screen Manual, 10-11', '1.0', '4ff652e81549ffbe5a7a43b31427669db188e2ebd2a307214bfdb6e546e00277', true),
((select test_id from public.tests where code = 'neck_extension_clearing'), 'pl', 'Sprawdzenie, czy wyprost szyi po rotacji wywołuje ból. To test clearing, bez
wyniku ruchowego 0-3.', 'Po rotacji głowy w jedną stronę delikatnie wykonaj wyprost szyi. Wróć do
pozycji neutralnej i powtórz po drugiej stronie.', '', '', 'Zapisz ból niezależnie po lewej i prawej stronie. Positive oznacza ból,
Negative jego brak. Reguła może zmienić tylko wynik końcowy testu nadrzędnego;
wynik rotacji pozostaje zachowany.', 'Sprawdzenie, czy wyprost szyi po rotacji wywołuje ból. To test clearing, bez
wyniku ruchowego 0-3.', 'FMS Quick Screen Manual, 10-11', '1.0', '047049e139ed7b3229fe936e210d064bbd6bb4025cc606e979fa5363f8b31258', true),
((select test_id from public.tests where code = 'toe_touch'), 'en', 'Screens how the body coordinates mobility and stability during forward bending.
The focus is movement sequencing, control, balance, and pain-free execution,
not a diagnosis of flexibility or tissue restriction.', 'Start standing with feet together and arms relaxed. Step one foot forward so
the inside of the forward heel aligns with the end of the opposite big toe.
Place the hands on top of each other. Keeping the knees straight but not
locked, bend forward and reach toward the toes of the back foot. If the back
foot cannot be reached after three attempts, reach toward the front foot for
up to three attempts. Switch the foot position and repeat on the other side.', '', '', '- **3:** Touch the toes of the back foot without changing the starting knee
  position.
- **2:** Cannot touch the back foot, but can touch the front foot without
  changing the starting knee position.
- **1:** Cannot touch either foot or changes the starting knee position.
- **0:** Pain is associated with any portion of the test.

The side is named for the leg in the back position. Record left and right
separately; the final bilateral score is the lower side score.', 'Screens how the body coordinates mobility and stability during forward bending.
The focus is movement sequencing, control, balance, and pain-free execution,
not a diagnosis of flexibility or tissue restriction.', 'FMS Quick Screen Manual, 12-14', '1.0', '33481dee84c8c1fb4233cb622c7da69ae266da4e943077781a459eb4a44ef9c9', true),
((select test_id from public.tests where code = 'toe_touch'), 'pl', 'Ocena tego, jak ciało koordynuje mobilność i stabilność podczas skłonu do
przodu. Liczy się kolejność ruchu, kontrola, równowaga i wykonanie bez bólu,
a nie diagnoza elastyczności ani ograniczenia tkanek.', 'Zacznij od stania ze stopami razem i rękami wzdłuż tułowia. Zrób krok jedną
stopą do przodu tak, aby wewnętrzna część pięty nogi z przodu była na
wysokości końca dużego palca drugiej stopy. Połóż dłonie jedna na drugiej.
Trzymając kolana proste, ale nie zablokowane, pochyl się i sięgnij do palców
stopy z tyłu. Jeżeli po trzech próbach nie można dotknąć stopy z tyłu, sięgnij
do stopy z przodu, również maksymalnie trzy razy. Zmień ustawienie nóg i
powtórz po drugiej stronie.', '', '', '- **3:** Dotknięcie palców stopy z tyłu bez zmiany wyjściowego ustawienia
  kolana.
- **2:** Brak dotknięcia stopy z tyłu, ale dotknięcie stopy z przodu bez zmiany
  wyjściowego ustawienia kolana.
- **1:** Brak dotknięcia obu stóp albo zmiana wyjściowego ustawienia kolana.
- **0:** Ból w dowolnej części testu.

Strona jest nazywana od nogi znajdującej się z tyłu. Zapisz lewą i prawą
stronę osobno; końcowy wynik obustronny to niższy wynik strony.', 'Ocena tego, jak ciało koordynuje mobilność i stabilność podczas skłonu do
przodu. Liczy się kolejność ruchu, kontrola, równowaga i wykonanie bez bólu,
a nie diagnoza elastyczności ani ograniczenia tkanek.', 'FMS Quick Screen Manual, 12-14', '1.0', 'd9bb1ae64e587595440f476805d5a2a1a6680822d8e4e6755aecc384ec1ecc4e', true),
((select test_id from public.tests where code = 'shoulder_mobility'), 'en', 'Assesses upper-quarter mobility, postural control, coordination, and
side-to-side asymmetry while both shoulders work in reciprocal positions.', 'First measure the dominant hand from the wrist crease to the tip of the
middle finger for scoring reference. The person stands with feet together and
arms relaxed. With both hands in fists, one fist reaches overhead and down the
back while the opposite fist reaches upward from below the back. Do not move
the fists closer after the initial placement. Repeat on the opposite side.', '', '', '- **3:** Fists are within one hand length.
- **2:** Fists are within one and a half hand lengths.
- **1:** Fists are not within one and a half hand lengths.
- **0:** Pain is associated with any portion of the test.

The side is named for the arm moving overhead. Record left and right
separately; the final bilateral score is the lower side score unless a
clearing rule sets it to zero.', 'Assesses upper-quarter mobility, postural control, coordination, and
side-to-side asymmetry while both shoulders work in reciprocal positions.', 'FMS Quick Screen Manual, 15-16', '1.0', 'cfcc0dd97ac9d66800f4237b7f3a1e4acd1525e1e88f8490c8a7cf94750cc352', true),
((select test_id from public.tests where code = 'shoulder_mobility'), 'pl', 'Ocena ruchomości górnej części ciała, kontroli postawy, koordynacji i
asymetrii podczas pracy obu barków w pozycjach wzajemnych.', 'Najpierw zmierz dominującą dłoń od bruzdy nadgarstka do końca palca
środkowego, aby użyć jej jako odniesienia w punktacji. Osoba stoi ze stopami
razem i rękami rozluźnionymi. Obie dłonie są zaciśnięte w pięści; jedna pięść
idzie nad głową i w dół pleców, a druga od dołu pleców w górę. Po początkowym
ułożeniu nie przesuwaj pięści bliżej siebie. Powtórz po drugiej stronie.', '', '', '- **3:** Pięści są w odległości nie większej niż jedna długość dłoni.
- **2:** Pięści są w odległości nie większej niż półtorej długości dłoni.
- **1:** Pięści są dalej niż półtorej długości dłoni.
- **0:** Ból w dowolnej części testu.

Strona jest nazywana od ręki przechodzącej nad głową. Zapisz lewą i prawą
stronę osobno; końcowy wynik obustronny to niższy wynik strony, chyba że
reguła clearing ustawi go na zero.', 'Ocena ruchomości górnej części ciała, kontroli postawy, koordynacji i
asymetrii podczas pracy obu barków w pozycjach wzajemnych.', 'FMS Quick Screen Manual, 15-16', '1.0', 'd73a24c75bd332d32213c8711670052758fe4c29825c0c7d2bb074bf3d3c4f42', true),
((select test_id from public.tests where code = 'shoulder_clearing'), 'en', 'Checks whether shoulder pain is present in overhead and behind-the-back
positions. Pain changes how the Shoulder Mobility result should be
interpreted and must be recorded separately.', 'Standing upright, reach one arm overhead, bend the elbow, and try to touch the
top of the opposite shoulder blade. Return to the start. Then reach the same
hand behind the back and upward toward the lower part of the opposite shoulder
blade. Repeat both patterns with the other arm.', '', '', 'This is a clearing test, not a 0-3 movement score. Record each side and each
pattern independently:

- upper pattern: pain / no pain;
- lower pattern: pain / no pain.

Positive means pain is present; Negative means no pain. If any recorded field
is Positive, the final Shoulder Mobility score is set to 0. The report should
identify the side and pattern that produced the Positive response.', 'Checks whether shoulder pain is present in overhead and behind-the-back
positions. Pain changes how the Shoulder Mobility result should be
interpreted and must be recorded separately.', 'FMS Quick Screen Manual, 17', '1.0', 'c90f8a3b2353488ad414fdb5738a19276bef8317305dfde63b1b3219cef4b656', true),
((select test_id from public.tests where code = 'shoulder_clearing'), 'pl', 'Sprawdzenie, czy ból występuje w barku podczas pozycji ręki nad głową oraz
podczas pozycji ręki za plecami. Ból zmienia sposób interpretacji wyniku
Shoulder Mobility i musi być zapisany osobno.', 'Stojąc prosto, przeprowadź jedną rękę nad głową, zegnij łokieć i spróbuj
dotknąć górnej części przeciwnej łopatki. Wróć do początku. Następnie
przeprowadź tę samą dłoń za plecy i w górę, próbując dotknąć dolnej części
przeciwnej łopatki. Powtórz oba wzorce drugą ręką.', '', '', 'To test clearing, a nie wynik ruchowy 0-3. Zapisz niezależnie stronę i wzorzec:

- wzorzec górny: ból / brak bólu;
- wzorzec dolny: ból / brak bólu.

Positive oznacza obecność bólu, a Negative jego brak. Jeżeli którekolwiek
pole ma wartość Positive, końcowy wynik Shoulder Mobility wynosi 0. Raport
powinien wskazać stronę i wzorzec, przy którym pojawił się wynik Positive.', 'Sprawdzenie, czy ból występuje w barku podczas pozycji ręki nad głową oraz
podczas pozycji ręki za plecami. Ból zmienia sposób interpretacji wyniku
Shoulder Mobility i musi być zapisany osobno.', 'FMS Quick Screen Manual, 17', '1.0', '75763095c122003f03c79e9ed27e4be1f29ba9a00f4c1d6b3d72814fb949b23a', true),
((select test_id from public.tests where code = 'rotation'), 'en', 'Screens total-body rotation and side-to-side asymmetry. Observe how the feet,
hips, pelvis, trunk, shoulders, and balance system coordinate without trying
to diagnose the source of a limitation.', 'Start standing with feet together. Step one foot forward into a narrow,
staggered stance. Extend the arms in front of the chest with fingers
interlocked, thumbs up, and hands aligned with the nose. Without changing foot
position, rotate toward the side of the forward foot and return. If rotation
does not pass 90 degrees after three attempts, repeat in a symmetrical stance
with the feet together.', '', '', '- **3:** Rotates past 90 degrees in a staggered stance without changing foot
  position.
- **2:** Rotates past 90 degrees in a symmetrical stance, but not in a
  staggered stance, without changing foot position.
- **1:** Cannot rotate past 90 degrees in a symmetrical stance or changes foot
  position.
- **0:** Pain is associated with any portion of the test.

The side is named for the direction of rotation. Record left and right
separately; the final bilateral score is the lower side score.', 'Screens total-body rotation and side-to-side asymmetry. Observe how the feet,
hips, pelvis, trunk, shoulders, and balance system coordinate without trying
to diagnose the source of a limitation.', 'FMS Quick Screen Manual, 18-20', '1.0', '19c8c9573946b56e977f47f1a60dee146eeb47a4147f39eed21d4648eaad9b9e', true),
((select test_id from public.tests where code = 'rotation'), 'pl', 'Ocena rotacji całego ciała i asymetrii między stronami. Obserwuj współpracę
stóp, bioder, miednicy, tułowia, barków i układu równowagi, bez prób ustalania
źródła ograniczenia.', 'Zacznij od stania ze stopami razem. Zrób krok jedną nogą do przodu do wąskiej
pozycji wykrocznej. Wyprostuj ręce przed klatką piersiową, spleć palce,
skieruj kciuki w górę i ustaw dłonie na wysokości nosa. Bez zmiany ustawienia
stóp obróć ciało w stronę nogi z przodu i wróć. Jeżeli po trzech próbach
rotacja nie przekroczy 90 stopni, powtórz test ze stopami razem.', '', '', '- **3:** Rotacja powyżej 90 stopni w pozycji wykrocznej bez zmiany ustawienia
  stóp.
- **2:** Rotacja powyżej 90 stopni w pozycji symetrycznej, ale nie w
  wykrocznej, bez zmiany ustawienia stóp.
- **1:** Brak rotacji powyżej 90 stopni w pozycji symetrycznej albo zmiana
  ustawienia stóp.
- **0:** Ból w dowolnej części testu.

Strona jest nazywana od kierunku rotacji. Zapisz lewy i prawy kierunek osobno;
końcowy wynik obustronny to niższy wynik strony.', 'Ocena rotacji całego ciała i asymetrii między stronami. Obserwuj współpracę
stóp, bioder, miednicy, tułowia, barków i układu równowagi, bez prób ustalania
źródła ograniczenia.', 'FMS Quick Screen Manual, 18-20', '1.0', 'c540c58c36556054250b294e01be15b6d379c1d08d97f056727fb2b7bfa633e5', true),
((select test_id from public.tests where code = 'balance'), 'en', 'Assesses single-leg stability and balance under different sensory conditions.
Observe side-to-side differences, posture, alignment, and control with and
without visual input.', 'Stand with feet together and arms relaxed. Lift one knee and thigh to about
waist height and hold a single-leg stance with the eyes open. If the position
is held for 10 seconds, close the eyes without changing position and repeat.', '', '', '- **3:** Holds single-leg balance for 10 seconds with eyes open and closed,
  without significant sway or hip/thigh movement.
- **2:** Holds for 10 seconds with eyes open, but not with eyes closed, without
  significant sway or hip/thigh movement with eyes open.
- **1:** Cannot hold for 10 seconds with eyes open, or shows significant sway
  and/or hip/thigh movement.
- **0:** Pain is associated with any portion of the test.

The side is named for the supporting leg. Record left and right separately;
the final bilateral score is the lower side score.', 'Assesses single-leg stability and balance under different sensory conditions.
Observe side-to-side differences, posture, alignment, and control with and
without visual input.', 'FMS Quick Screen Manual, 21-22', '1.0', '903952e2912f959c90952147b96c54b07e88f17c7cd41f61eab196f5c904e67f', true),
((select test_id from public.tests where code = 'balance'), 'pl', 'Ocena stabilności na jednej nodze i równowagi w różnych warunkach czuciowych.
Obserwuj różnice między stronami, postawę, ustawienie i kontrolę z otwartymi
oraz zamkniętymi oczami.', 'Stań ze stopami razem i rękami wzdłuż tułowia. Unieś jedno kolano i udo mniej
więcej do wysokości talii, a następnie utrzymaj stanie na jednej nodze z
otwartymi oczami. Jeżeli pozycja jest utrzymana przez 10 sekund, zamknij oczy
bez zmiany ustawienia i powtórz próbę.', '', '', '- **3:** Utrzymanie równowagi na jednej nodze przez 10 sekund z otwartymi i
  zamkniętymi oczami, bez istotnego kołysania i ruchu biodra/uda.
- **2:** Utrzymanie przez 10 sekund z otwartymi, ale nie z zamkniętymi oczami,
  bez istotnego kołysania i ruchu biodra/uda przy otwartych oczach.
- **1:** Brak utrzymania przez 10 sekund z otwartymi oczami albo istotne
  kołysanie i/lub ruch biodra/uda.
- **0:** Ból w dowolnej części testu.

Strona jest nazywana od nogi podporowej. Zapisz lewą i prawą stronę osobno;
końcowy wynik obustronny to niższy wynik strony.', 'Ocena stabilności na jednej nodze i równowagi w różnych warunkach czuciowych.
Obserwuj różnice między stronami, postawę, ustawienie i kontrolę z otwartymi
oraz zamkniętymi oczami.', 'FMS Quick Screen Manual, 21-22', '1.0', '2f2e8937a408b27f54b0aa568b09b9c00886819906c3f1d8b597ca597add7027', true),
((select test_id from public.tests where code = 'squat'), 'en', 'Assesses lower-body mobility, stability, and the ability to perform a deep
squat with control and without pain. The simplified arms-down pattern focuses
on the hips, knees, ankles, and trunk.', 'Stand with feet together and arms extended in front, first with fists. Squat
as deeply as possible while keeping the heels on the floor and chest upright.
At the bottom, lower the fists beside the feet and try to touch the floor. If
the fists cannot touch, repeat with fingers extended and thumbs up, using the
same depth, heel, and posture criteria.', '', '', '- **3:** Touches the floor beside the feet with the fists and the thigh is
  below horizontal.
- **2:** Cannot touch with the fists and/or the thigh is not below horizontal,
  but can touch with the fingers while the thigh is below horizontal.
- **1:** Cannot touch with the fingers and/or the thigh is not below
  horizontal.
- **0:** Pain is associated with any portion of the test.

This is a single, non-bilateral score.', 'Assesses lower-body mobility, stability, and the ability to perform a deep
squat with control and without pain. The simplified arms-down pattern focuses
on the hips, knees, ankles, and trunk.', 'FMS Quick Screen Manual, 23-25', '1.0', '8616289d8fe8765dfa9ca2ae948c68ff5f32dca33a3a8ea341519ad7c5516704', true),
((select test_id from public.tests where code = 'squat'), 'pl', 'Ocena ruchomości i stabilności dolnej części ciała oraz możliwości wykonania
głębokiego przysiadu z kontrolą i bez bólu. Uproszczony układ rąk pozwala
skupić się na biodrach, kolanach, stawach skokowych i tułowiu.', 'Stań ze stopami razem i rękami wyprostowanymi przed klatką piersiową,
najpierw z dłońmi w pięściach. Zejdź w przysiad tak nisko, jak potrafisz,
utrzymując pięty na podłożu i wyprostowaną klatkę piersiową. W dole opuść
pięści obok stóp i spróbuj dotknąć podłoża. Jeżeli pięści nie dosięgają,
powtórz z wyprostowanymi palcami i kciukami skierowanymi w górę, zachowując te
same kryteria głębokości, kontaktu pięt i postawy.', '', '', '- **3:** Dotknięcie podłoża obok stóp pięściami oraz udo poniżej poziomu.
- **2:** Brak dotknięcia pięściami i/lub brak uda poniżej poziomu, ale
  dotknięcie podłoża palcami przy udzie poniżej poziomu.
- **1:** Brak dotknięcia palcami i/lub brak uda poniżej poziomu.
- **0:** Ból w dowolnej części testu.

To pojedynczy wynik, bez podziału na strony.', 'Ocena ruchomości i stabilności dolnej części ciała oraz możliwości wykonania
głębokiego przysiadu z kontrolą i bez bólu. Uproszczony układ rąk pozwala
skupić się na biodrach, kolanach, stawach skokowych i tułowiu.', 'FMS Quick Screen Manual, 23-25', '1.0', '2f7e26cb53cb2e78c161b38522f53008e8cff4fdc7cb5c95f94c0051e92b6675', true),
((select test_id from public.tests where code = 'spine_extension_clearing'), 'en', 'Checks whether spinal extension can be performed comfortably and without pain.
It is a clearing test used to flag a painful response; it is not intended to
diagnose spinal pathology.', 'The person lies face down with the hands directly under the shoulders and
palms flat on the floor. Keeping the pelvis, hips, and lower body relaxed,
they press the upper body upward until the elbows are straight, then return
to the starting prone position.', 'Lie on your stomach with your hands under your shoulders and palms down. Keep
your lower body relaxed on the floor and press your upper body up until your
elbows are straight. Return to the starting position.', '', 'This is not scored on the 0-3 scale. Record **Positive** when pain is produced
and **Negative** when no pain is produced. In the current Quick Screen
configuration this is a pain flag and does not automatically change Squat.', 'Checks whether spinal extension can be performed comfortably and without pain.
It is a clearing test used to flag a painful response; it is not intended to
diagnose spinal pathology.', 'FMS Quick Screen Manual, 26', '1.0', 'b49b23789492e3e74dad1f1668f1c51816b5f295b2f9d4a9a43e24db248abbc2', true),
((select test_id from public.tests where code = 'spine_extension_clearing'), 'pl', 'Sprawdzenie, czy wyprost kręgosłupa można wykonać komfortowo i bez bólu. To
test clearing służący do oznaczenia bolesnej reakcji, a nie do diagnozowania
problemów kręgosłupa.', 'Osoba leży przodem, z dłońmi ułożonymi bezpośrednio pod barkami i płasko na
podłożu. Utrzymując miednicę, biodra i dolną część ciała rozluźnione, wypycha
górną część ciała do góry aż do wyprostu łokci, a następnie wraca do pozycji
leżącej.', 'Połóż się na brzuchu, z dłońmi pod barkami i wnętrzami dłoni skierowanymi w
podłoże. Utrzymując dolną część ciała rozluźnioną, wypchnij górną część ciała
do góry aż do wyprostu łokci. Wróć do pozycji wyjściowej.

## Shared application labels

| English | Polski |
|---|---|
| Pass | Pass |
| Fail | Fail |
| Positive | Positive / Ból |
| Negative | Negative / Brak bólu |
| Pain | Ból |
| No pain | Brak bólu |
| Left side | Lewa strona |
| Right side | Prawa strona |
| Score | Wynik |
| Test criteria | Kryteria oceny |
| Local draft saved on this device | Szkic zapisany na tym urządzeniu |', '', 'To nie jest wynik w skali 0-3. Zapisz **Positive**, gdy pojawi się ból, oraz
**Negative**, gdy bólu nie ma. W aktualnej konfiguracji Quick Screen jest to
flaga bólu i nie zmienia automatycznie wyniku Squat.', 'Sprawdzenie, czy wyprost kręgosłupa można wykonać komfortowo i bez bólu. To
test clearing służący do oznaczenia bolesnej reakcji, a nie do diagnozowania
problemów kręgosłupa.', 'FMS Quick Screen Manual, 26', '1.0', '3985cc5343736ed9b2139f902731cfde0ea92210a6172c626b02d5ad4201aebc', true)
on conflict (test_id, locale, manual_version) do update set purpose = excluded.purpose, procedure = excluded.procedure, verbal_instruction = excluded.verbal_instruction, side_definition = excluded.side_definition, scoring_criteria = excluded.scoring_criteria, report_description = excluded.report_description, source_reference = excluded.source_reference, content_hash = excluded.content_hash, is_active = true;

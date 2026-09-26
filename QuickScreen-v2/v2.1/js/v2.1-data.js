(() => {
  const score = (label, left, right = left) => ({ label, type: 'score', sideMode: 'bilateral', left, right });
  const pain = (label, sideMode = 'none') => ({ label, type: 'pain', sideMode });
  const passFail = (label, sideMode = 'none') => ({ label, type: 'passfail', sideMode });
  window.QS.tests = [
    {
      code: 'cervical_flexion', name: 'Cervical Flexion', instruction: 'Sprawdź zakres zgięcia szyi i zapytaj o ból.',
      criteria: 'PASS: broda dochodzi maksymalnie na odległość dwóch palców od górnej części mostka. Zapisz zakres i ból osobno.',
      fields: [passFail('Zakres ruchu'), pain('Ból przy zgięciu')]
    },
    {
      code: 'cervical_rotation_extension', name: 'Cervical Rotation and Extension', instruction: 'Porównaj zakres rotacji szyi i odnotuj reakcję bólową po obu stronach.',
      criteria: 'PASS: broda dochodzi co najmniej do połowy długości obojczyka po stronie rotacji. Zapisz zakres i ból osobno dla lewej i prawej strony.',
      fields: [passFail('Zakres rotacji', 'bilateral'), pain('Ból przy rotacji', 'bilateral')]
    },
    {
      code: 'neck_extension_clearing', name: 'Neck Extension Clearing', instruction: 'Sprawdź ból przy wyproście szyi po obu stronach.',
      criteria: 'Zapisz osobno dla lewej i prawej strony: Brak bólu albo Ból. Wynik jest zależny od Cervical Rotation and Extension.',
      parent: 'cervical_rotation_extension', fields: [pain('Ból przy wyproście szyi', 'bilateral')]
    },
    {
      code: 'toe_touch', name: 'Toe Touch', instruction: 'Wykonaj skłon w pozycji wykrocznej.', image: true,
      criteria: 'Strona oznacza nogę z tyłu. 3: dotykasz palców tylnej stopy bez zmiany ustawienia kolan. 2: dotykasz palców przedniej stopy. 1: nie dotykasz palców lub zmieniasz ustawienie kolan. Ból oznacza 0.',
      fields: [score('Wybierz wynik (score)')]
    },
    {
      code: 'shoulder_mobility', name: 'Shoulder Mobility', instruction: 'Oceń wzorzec ruchomości barków po obu stronach.',
      criteria: 'Strona oznacza rękę poruszającą się nad głową. 3: pięści w odległości do jednej długości dłoni. 2: do półtorej długości dłoni. 1: większa odległość. Ból lub dodatni Shoulder Clearing oznacza 0.',
      fields: [score('Wybierz wynik (score)')]
    },
    {
      code: 'shoulder_clearing', name: 'Shoulder Clearing', instruction: 'Sprawdź ból i zakres w obu wzorcach po lewej i prawej stronie.',
      criteria: 'W każdym wzorcu zapisz ból i zakres ruchu osobno. Górny: sięgnięcie nad głową do przeciwnej łopatki. Dolny: sięgnięcie za plecy do przeciwnej łopatki. Dodatni wynik bólowy wpływa na Shoulder Mobility.',
      parent: 'shoulder_mobility',
      patterns: [
        { label: 'Wzorzec górny', fields: [pain('Ból'), passFail('Zakres ruchu')] },
        { label: 'Wzorzec dolny', fields: [pain('Ból'), passFail('Zakres ruchu')] }
      ],
      fields: []
    },
    {
      code: 'rotation', name: 'Rotation', instruction: 'Oceń kontrolę i zakres rotacji po obu stronach.',
      criteria: 'Strona oznacza kierunek rotacji. Wynik 3: przekracza 90° w staggered stance bez zmiany ustawienia stóp. Wynik 2: przekracza 90° przy stopach razem. Wynik 1: nie osiąga 90° lub zmienia ustawienie stóp. Ból oznacza 0.',
      fields: [score('Wybierz wynik (score)')]
    },
    {
      code: 'balance', name: 'Balance', instruction: 'Oceń równowagę na nodze podporowej po obu stronach.',
      criteria: 'Strona oznacza nogę podporową. Ocena obejmuje utrzymanie pozycji przez 10 sekund z oczami otwartymi i zamkniętymi oraz kontrolę chwiania i ustawienia uda. Ból oznacza 0.',
      fields: [score('Wybierz wynik (score)')]
    },
    {
      code: 'squat', name: 'Squat', instruction: 'Oceń przysiad bez przypisywania wyniku do strony.',
      criteria: '3: uda poniżej poziomu i pięty dotykają podłoża obok stóp. 2: w wariancie z wyprostowanymi palcami uda są poniżej poziomu, a palce dotykają podłoża. 1: nie są spełnione kryteria 2. Ból oznacza 0.',
      fields: [score('Wybierz wynik (score)', 'none')]
    },
    {
      code: 'spine_extension_clearing', name: 'Spine Extension Clearing', instruction: 'Sprawdź ból przy wyproście kręgosłupa.',
      criteria: 'Zapisz Brak bólu albo Ból. Wynik jest zależny od Squat.',
      parent: 'squat', fields: [pain('Ból')]
    }
  ];
})();

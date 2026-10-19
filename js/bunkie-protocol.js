(() => {
  const TESTS = Object.freeze([
    { code: 'bunkie_apl', short: 'APL', en: 'Anterior Power Line', pl: 'Przednia linia siłowa', figure: 1 },
    { code: 'bunkie_lsl', short: 'LSL', en: 'Lateral Stabilizing Line', pl: 'Boczna linia stabilizacyjna', figure: 2 },
    { code: 'bunkie_ppl', short: 'PPL', en: 'Posterior Power Line', pl: 'Tylna linia siłowa', figure: 3 },
    { code: 'bunkie_psl', short: 'PSL', en: 'Posterior Stabilizing Line', pl: 'Tylna linia stabilizacyjna', figure: 4 },
    { code: 'bunkie_msl', short: 'MSL', en: 'Medial Stabilizing Line', pl: 'Przyśrodkowa linia stabilizacyjna', figure: 5 },
  ]);
  const parse = value => value === '' || value == null ? null : Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  function analyze(leftRaw, rightRaw, goalRaw) {
    const left = parse(leftRaw), right = parse(rightRaw), goal = parse(goalRaw);
    if (left === null || right === null) return { left, right, difference: null, asymmetryPercent: null, weakerSide: null, leftMetGoal: left !== null && goal !== null ? left >= goal : null, rightMetGoal: right !== null && goal !== null ? right >= goal : null, interpretation: 'Brak danych do porównania stron.' };
    const difference = Math.abs(left - right);
    const asymmetryPercent = Math.max(left, right) === 0 ? 0 : Math.round(difference / Math.max(left, right) * 1000) / 10;
    const weakerSide = left === right ? null : left < right ? 'left' : 'right';
    const leftMetGoal = goal === null ? null : left >= goal;
    const rightMetGoal = goal === null ? null : right >= goal;
    const targetText = (met, side) => met === null ? '' : `${side} ${met ? 'osiągnęła przyjęty cel' : `pozostaje poniżej przyjętego celu ${goal} s`}`;
    let interpretation;
    if (difference === 0 && leftMetGoal && rightMetGoal) interpretation = 'Obie strony osiągnęły przyjęty cel czasowy i wykazują pełną symetrię wyniku. Jest to korzystna obserwacja zarówno pod względem wytrzymałości, jak i równowagi między stronami.';
    else if (difference === 0 && leftMetGoal === false) interpretation = 'Obie strony uzyskały identyczny wynik, co stanowi korzystną obserwację w zakresie symetrii. Pomimo nieosiągnięcia celu czasowego nie występuje różnica między stronami. Głównym obszarem do rozwoju pozostaje ogólna wytrzymałość tego wzorca.';
    else if (leftMetGoal && rightMetGoal) interpretation = `Obie strony osiągnęły przyjęty cel wytrzymałości, jednak ${weakerSide === 'left' ? 'lewa' : 'prawa'} strona uzyskała wynik słabszy o ${difference} s (${asymmetryPercent.toFixed(1).replace('.', ',')}%). Różnica między stronami pozostaje obserwacją do monitorowania.`;
    else if (!leftMetGoal && !rightMetGoal) interpretation = `Obie strony pozostają poniżej przyjętego celu. ${weakerSide === 'left' ? 'Lewa' : 'Prawa'} strona uzyskała wynik słabszy o ${difference} s (${asymmetryPercent.toFixed(1).replace('.', ',')}%). Wskazuje to na potrzebę rozwijania wytrzymałości tego wzorca, ze szczególnym uwzględnieniem zaobserwowanej różnicy między stronami.`;
    else interpretation = `${weakerSide === 'left' ? 'Lewa' : 'Prawa'} strona uzyskała wynik słabszy o ${difference} s (${asymmetryPercent.toFixed(1).replace('.', ',')}%) względem drugiej. ${targetText(leftMetGoal, 'Lewa strona')}, natomiast ${targetText(rightMetGoal, 'prawa strona')}.`;
    return { left, right, difference, asymmetryPercent, weakerSide, leftMetGoal, rightMetGoal, interpretation };
  }
  function summary(items) {
    const complete = items.length === 5 && items.every(item => item.left != null && item.right != null);
    const symmetric = complete && items.every(item => Number(item.left) === Number(item.right));
    const allGoalsMet = complete && items.every(item => Number(item.left) >= Number(item.goalLeft) && Number(item.right) >= Number(item.goalRight));
    const belowTargets = complete && items.flatMap(item => [Number(item.left) < Number(item.goalLeft), Number(item.right) < Number(item.goalRight)]).filter(Boolean).length;
    return { complete, symmetric, allGoalsMet, belowTargets,
      symmetryText: symmetric ? 'Badanie wykazało symetryczne wyniki we wszystkich ocenianych wzorcach. Jest to korzystna obserwacja, mimo że nie wszystkie cele czasowe zostały osiągnięte. Głównym kierunkiem dalszej pracy jest rozwijanie wytrzymałości w poszczególnych pozycjach, a nie wyrównywanie różnic między stronami.' : complete ? 'Wyniki nie były identyczne we wszystkich wzorcach. Raport podaje konkretne różnice; nie stosuje progu klinicznej istotności asymetrii.' : 'Brakuje pomiarów do podsumowania symetrii całego badania.',
      enduranceText: complete ? allGoalsMet ? 'Obie strony osiągnęły wszystkie przyjęte cele czasowe.' : `Poniżej przyjętego celu pozostaje ${belowTargets} z 10 pomiarów.` : 'Uzupełnij pomiary, aby podsumować wytrzymałość względem celów.' };
  }
  const api = Object.freeze({ TESTS, analyze, summary, parse });
  globalThis.BunkieProtocol = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();

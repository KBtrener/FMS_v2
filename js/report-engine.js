(() => {
  const BLOCKS = [
    { id: 'intro', title: 'Wstęp', label: '01 / Wstęp' },
    { id: 'results', title: 'Twój wynik', label: '02 / Twój wynik' },
    { id: 'plan', title: 'Plan', label: '03 / Plan' },
    { id: 'help', title: 'Jak to zrobić', label: '04 / Jak to zrobić' },
  ];
  const LABELS = {
    cervical_flexion: 'Zgięcie karku', cervical_rotation: 'Rotacje karku', cervical_rotation_extension: 'Rotacje karku', neck_extension_clearing: 'Wyprost karku',
    toe_touch: 'Skłon do palców', shoulder_mobility: 'Ruchomość barków', shoulder_clearing: 'Test barku', squat: 'Przysiad',
    balance: 'Równowaga na jednej nodze', rotation: 'Rotacja tułowia', spine_extension_clearing: 'Wyprost kręgosłupa',
  };
  const PRIORITY = ['cervical', 'toe_touch', 'shoulder_mobility', 'squat', 'balance', 'rotation', 'spine_extension_clearing'];
  const PATTERN_CONTEXT = {
    cervical_flexion: 'Swobodne pochylenie głowy pomaga patrzeć w dół podczas pracy przy ziemi, na przykład w ogrodzie, i kontrolować ustawienie ciała przy schylaniu.',
    cervical_rotation_extension: 'Swobodny obrót głowy pomaga kierować wzrok na boki i ku górze: przy szukaniu chwytów podczas wspinania, obserwowaniu trasy podczas biegu oraz rozglądaniu się przy pracy w ogrodzie.',
    neck_extension_clearing: 'Ten test sprawdza ból przy odchyleniu głowy po obrocie. Taki ruch pojawia się, gdy patrzysz w górę lub za siebie, między innymi podczas wspinania i pracy w ogrodzie.',
    toe_touch: 'Kontrolowany skłon pomaga sięgać do podłoża, podnosić rzeczy i pracować w pochyleniu, na przykład przy zakładaniu butów lub pieleniu.',
    shoulder_mobility: 'Ruchomość barków ułatwia sięganie nad głowę i za plecy, co przydaje się przy wspinaniu, ubieraniu się i odkładaniu rzeczy na wysoką półkę.',
    shoulder_clearing: 'Pozycje z ręką nad głową lub za plecami występują przy wspinaniu, ubieraniu się i sięganiu po przedmioty. Ból w tym teście jest sygnałem, by nie forsować bolesnej pozycji.',
    rotation: 'Kontrolowany obrót tułowia pomaga zmieniać kierunek, sięgać na bok i obracać się podczas biegu, sportu oraz pracy z narzędziami.',
    balance: 'Równowaga na jednej nodze pomaga utrzymać stabilność przy każdym kroku, na schodach, nierównym podłożu i podczas biegania.',
    squat: 'Kontrolowany przysiad pomaga siadać i wstawać, schodzić nisko oraz podnosić przedmioty z podłogi; te ruchy często powtarzają się w ogrodzie.',
    spine_extension_clearing: 'Test sprawdza ból przy odchyleniu tułowia do tyłu. Ten ruch pojawia się przy patrzeniu w górę, sięganiu wysoko i zmianie pozycji podczas pracy.',
  };
  const codeOf = test => String(test.code || '').toLowerCase();
  const baseCode = code => code.startsWith('cervical_') ? 'cervical' : code === 'shoulder_clearing' ? 'shoulder_mobility' : code;
  const nameOf = test => test.name || LABELS[codeOf(test)] || LABELS[baseCode(codeOf(test))] || 'Test ruchowy';
  const fieldsOf = test => test.fields || [];
  const isPain = test => fieldsOf(test).some(field => (field.valueCode || '').toLowerCase() === 'positive' || (field.valueCode || '').toLowerCase() === 'pain');
  const isFail = test => fieldsOf(test).some(field => (field.valueCode || '').toLowerCase() === 'fail');
  const scoreOf = test => Number.isFinite(test.finalScore) ? test.finalScore : Number.isFinite(test.value) ? test.value : null;
  const assessable = test => scoreOf(test) !== null || fieldsOf(test).some(field => field.valueCode);
  const categoryOf = test => {
    const score = scoreOf(test);
    if (isPain(test) || score === 0) return 'pain';
    const sided = test.leftScore != null && test.rightScore != null;
    const statusSides = fieldsOf(test).filter(field => field.side === 'left' || field.side === 'right').map(field => String(field.valueCode || '').toLowerCase());
    if ((sided && test.leftScore !== test.rightScore) || (statusSides.includes('pass') && statusSides.includes('fail'))) return 'asymmetry';
    if (score === 1 || isFail(test)) return 'improve';
    if (score === 2 || (sided && test.leftScore === 2 && test.rightScore === 2)) return 'good';
    if (score === 3 || (sided && test.leftScore === 3 && test.rightScore === 3)) return 'veryGood';
    if (score != null) return 'good';
    return null;
  };
  const sideText = test => {
    if (test.leftScore != null || test.rightScore != null) return `Lewa ${test.leftScore ?? '—'} · Prawa ${test.rightScore ?? '—'}`;
    const sides = [...new Set(fieldsOf(test).filter(field => isPain({ fields: [field] }) || isFail({ fields: [field] })).map(field => field.side).filter(side => side === 'left' || side === 'right'))];
    return sides.length === 2 ? 'lewa i prawa strona' : sides[0] === 'left' ? 'lewa strona' : sides[0] === 'right' ? 'prawa strona' : null;
  };
  function priorityFor(tests) {
    let pain = tests.filter(test => isPain(test) || scoreOf(test) === 0);
    if (pain.some(test => codeOf(test) === 'shoulder_clearing' && isPain(test))) pain = pain.filter(test => !(codeOf(test) === 'shoulder_mobility' && scoreOf(test) === 0));
    if (pain.some(test => codeOf(test) === 'spine_extension_clearing' && isPain(test))) pain = pain.filter(test => !(codeOf(test) === 'squat' && scoreOf(test) === 0));
    if (pain.length) return { type: 'pain', items: pain, all: pain };
    const candidates = tests.filter(test => scoreOf(test) === 1 || isFail(test) || (test.leftScore != null && test.rightScore != null && test.leftScore !== test.rightScore));
    candidates.sort((a, b) => {
      const ai = PRIORITY.indexOf(baseCode(codeOf(a))), bi = PRIORITY.indexOf(baseCode(codeOf(b)));
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || Number(a.order || 0) - Number(b.order || 0);
    });
    return { type: candidates.length ? 'movement' : 'none', items: candidates.slice(0, 1), all: candidates };
  }
  function buildReport(assessment, options = {}) {
    const tests = (assessment.tests || assessment.rows || []).map((test, index) => ({ ...test, order: test.order ?? index + 1 })).sort((a, b) => a.order - b.order);
    const selected = new Set(options.selectedBlocks || BLOCKS.map(block => block.id));
    const available = options.blockVisibility || Object.fromEntries(BLOCKS.map(block => [block.id, true]));
    const visibleBlocks = BLOCKS.filter(block => selected.has(block.id) && available[block.id] !== false);
    const priority = priorityFor(tests);
    const main = priority.items[0] || null;
    const mainCode = main ? baseCode(codeOf(main)) : null;
    const allPain = priority.type === 'pain';
    const side = main ? sideText(main) : null;
    const important = tests.filter(test => priority.all.includes(test));
    const positive = tests.filter(test => assessable(test) && !priority.all.includes(test) && (scoreOf(test) === 2 || scoreOf(test) === 3 || (!isPain(test) && !isFail(test))));
    const resources = (options.resources || []).filter(item => item.isActive !== false && (!item.testCode || !mainCode || baseCode(item.testCode) === mainCode)).slice(0, 4);
    const history = assessment.history || options.history || [];
    const sport = options.sport || '';
    const profile = options.profile || (sport ? 'active' : 'general');
    const name = `${assessment.client?.firstName || ''} ${assessment.client?.lastName || ''}`.trim();
    const date = assessment.date ? new Date(`${assessment.date}T00:00:00`).toLocaleDateString('pl-PL') : '';
    const assessmentName = assessment.scenarioName || assessment.name || 'Bazowy Test Funkcjonalny';
    const title = main ? nameOf(main) : null;
    const reason = allPain
      ? (priority.items.length > 1 ? 'W kilku ruchach pojawił się ból. To najważniejsza informacja z badania.' : `Ból pojawił się podczas: ${title}${side ? ` (${side})` : ''}.`)
      : main ? `${title}${side ? ` — ${side}` : ''} wymaga teraz największej uwagi według kolejności badania.`
        : 'W badaniu nie pojawił się ból ani wyraźny obszar, który wymaga pierwszeństwa.';
    const items = tests.map(test => ({
      code: codeOf(test), name: nameOf(test),
      score: scoreOf(test), leftScore: test.leftScore ?? null, rightScore: test.rightScore ?? null,
      sideText: sideText(test), fields: fieldsOf(test), status: isPain(test) || scoreOf(test) === 0 ? 'pain' : (scoreOf(test) === 1 || isFail(test) ? 'attention' : assessable(test) ? 'ok' : 'unknown'),
      description: test.description || test.descriptionShort || '', priority: priority.all.includes(test),
    }));
    const describeObservation = test => {
      const affectedSides = [...new Set(fieldsOf(test).filter(field => isPain({ fields: [field] }) || isFail({ fields: [field] })).map(field => field.side).filter(sideName => sideName === 'left' || sideName === 'right'))];
      const side = affectedSides.length === 2 ? ' po obu stronach' : affectedSides[0] === 'left' ? ' po lewej stronie' : affectedSides[0] === 'right' ? ' po prawej stronie' : '';
      const asymmetric = test.leftScore != null && test.rightScore != null && test.leftScore !== test.rightScore;
      const context = PATTERN_CONTEXT[codeOf(test)] || 'Ten wzorzec pomaga wykonywać codzienne ruchy w sposób kontrolowany.';
      const weakerSide = test.leftScore < test.rightScore ? 'lewa' : 'prawa';
      const asymmetryNote = asymmetric ? ` Różnica między stronami jest ważna do poprawy: ${weakerSide} strona wymaga większej pracy, bo ciało wykonuje ten sam ruch inaczej po lewej i prawej stronie.` : '';
      const observation = isPain(test) || scoreOf(test) === 0
        ? `Podczas testu ${nameOf(test)}${side} pojawił się ból.`
        : isFail(test)
          ? `W teście ${nameOf(test)}${side} zakres ruchu nie spełnił kryterium.`
          : asymmetric
            ? `W teście ${nameOf(test)} widać różnicę między stronami.`
            : `Test ${nameOf(test)} wymaga dalszej pracy.`;
      return `${observation} ${context}${asymmetryNote}`;
    };
    const observations = important.map(describeObservation);
    const positiveNames = positive.map(nameOf);
    const summary = priority.type === 'none'
        ? 'Ocenione wzorce spełniły podstawowe kryteria. W badaniu nie pojawił się ból ani wyraźna asymetria wymagająca pierwszeństwa.'
        : allPain
        ? `W badaniu pojawił się ból w obszarze: ${priority.items.map(nameOf).join(', ')}. To wymaga uwagi w pierwszej kolejności.`
        : `Najwięcej uwagi wymaga ${nameOf(main)}. Pozostałe obserwacje i ich znaczenie opisano poniżej.`;
    const descriptionSections = [
      { title: 'Obraz całości', text: summary, tone: 'overview' },
      { title: 'Co działa dobrze', text: positiveNames.length ? `Bez bólu i większych trudności wypadły: ${positiveNames.join(', ')}. Ruchy korzystające z tych wzorców powinny być bezpieczne i nie powinny powodować problemów, o ile nie wywołują bólu.` : 'Nie ma wyników, które można wyróżnić jako bezbolesne i bez większych trudności.', tone: 'good' },
      { title: 'Co wymaga uwagi', text: observations.length ? observations.join(' ') : 'W ocenionych testach nie pojawił się ból ani wyraźne ograniczenie.', tone: observations.length ? allPain ? 'problem' : 'watch' : 'good' },
      { title: 'Priorytet', text: main ? (allPain ? `Ból jest najważniejszą informacją z badania. W pierwszej kolejności zajmij się: ${priority.items.map(nameOf).join(', ')}.` : `Skup teraz uwagę na teście ${nameOf(main)}. Nie musisz poprawiać wszystkiego jednocześnie.`) : 'Badanie nie wskazuje jednego obszaru, od którego trzeba zacząć.', tone: main ? allPain ? 'problem' : 'priority' : 'overview' },
    ];
    const groupDefinitions = [
      ['veryGood', 'Bardzo dobrze'], ['good', 'Dobrze'], ['asymmetry', 'Asymetria'], ['improve', 'Do poprawy'], ['pain', 'Ból'],
    ];
    const groups = groupDefinitions.map(([key, label]) => ({ title: label, items: tests.filter(test => categoryOf(test) === key).map(test => ({ name: nameOf(test), score: scoreOf(test), leftScore: test.leftScore ?? null, rightScore: test.rightScore ?? null, status: key })) })).filter(group => group.items.length);
    const allPainful = tests.filter(test => categoryOf(test) === 'pain');
    const candidates = tests.filter(test => categoryOf(test) === 'improve' || categoryOf(test) === 'asymmetry').sort((a, b) => {
      const ai = PRIORITY.indexOf(baseCode(codeOf(a))), bi = PRIORITY.indexOf(baseCode(codeOf(b)));
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || Number(a.order || 0) - Number(b.order || 0);
    });
    const cervicalIssue = candidates.some(test => baseCode(codeOf(test)) === 'cervical');
    const cervicalSecondTest = cervicalIssue
      ? candidates.find(test => baseCode(codeOf(test)) !== 'cervical') || tests.find(test => baseCode(codeOf(test)) === 'toe_touch') || tests.find(test => baseCode(codeOf(test)) !== 'cervical') || null
      : null;
    const priorityMessage = allPainful.length
      ? `Priorytet: najpierw zajmij się bólem w testach: ${allPainful.map(nameOf).join(', ')}.`
      : cervicalIssue && cervicalSecondTest ? `Priorytet: zacznij od testu ${nameOf(candidates[0])}. Drugim priorytetem jest test ${nameOf(cervicalSecondTest)}.`
        : candidates.length ? `Priorytet: zacznij od testu ${nameOf(candidates[0])}, zgodnie z hierarchią FMS.`
        : 'Priorytet: żaden wynik nie wymaga teraz szczególnej uwagi.';
    const hasIssue = allPainful.length > 0 || candidates.length > 0;
    const congratulation = !hasIssue && tests.some(test => categoryOf(test) !== null)
      ? 'Gratulacje! Wyniki są bezbolesne i symetryczne, a ocenione ruchy uzyskały 2 lub 3.' : null;
    const ending = !hasIssue
      ? 'Pełny FMS nie wskazuje obszaru wymagającego poprawy.'
      : 'Po osiągnięciu bezbolesnych, symetrycznych wyników 2 lub 3 wykonaj ponowny test.';
    const plan = allPain ? [
      { title: 'Krok 1', text: summary },
    ] : [
      { title: 'Krok 1', text: cervicalIssue && cervicalSecondTest
        ? `Popraw test ${nameOf(candidates[0])} oraz drugi test ${nameOf(cervicalSecondTest)}.`
        : candidates.length ? `Popraw test ${nameOf(candidates[0])}.` : 'Nie ma obecnie testu oznaczonego do poprawy.' },
      { title: 'Krok 2', text: 'Wykonaj ponowny test, aby sprawdzić, co się zmieniło.' },
      { title: 'Krok 3', text: cervicalIssue && cervicalSecondTest
        ? `${candidates.filter(test => test !== candidates[0] && test !== cervicalSecondTest).length ? `Dodatkowe testy wymagające uwagi: ${candidates.filter(test => test !== candidates[0] && test !== cervicalSecondTest).map(nameOf).join(', ')}. ` : ''}Jeśli po ponownym teście wszystko będzie dobrze, wróć do sportu, wykonaj testy motoryczne lub przejdź do trudniejszego FMS.`
        : candidates.length > 1
          ? `Popraw kolejne testy wymagające uwagi: ${candidates.slice(1).map(nameOf).join(', ')}. Jeśli po ponownym teście wszystko będzie dobrze, wróć do sportu, wykonaj testy motoryczne lub przejdź do trudniejszego FMS.`
        : 'Jeśli po ponownym teście wszystko będzie dobrze, wróć do sportu, wykonaj testy motoryczne lub przejdź do trudniejszego FMS.' },
    ];
    const absentFindings = [];
    if (!allPainful.length) absentFindings.push('bólu');
    if (!groups.some(group => group.title === 'Asymetria')) absentFindings.push('asymetrii');
    if (!tests.some(test => scoreOf(test) === 1)) absentFindings.push('słabych wzorców (wynik 1)');
    const encouragement = absentFindings.length
      ? `Super, że w Twoim teście nie ma: ${absentFindings.join(', ')}.`
      : null;
    return {
      generatorVersion: '5.0.0', assessmentId: assessment.assessmentId, client: assessment.client || {}, assessmentDate: assessment.date || '',
      assessmentName, sport, profile, totalScore: assessment.totalScore ?? null, maximum: assessment.maximum ?? null,
      visibleBlocks: visibleBlocks.map(block => block.id), blocks: {
        intro: { title: 'Hej! Oto Twój raport z badania.', text: 'Badanie sprawdza podstawowe wzorce ruchu, różnice między stronami i ból, aby pomóc ustalić kolejność dalszej pracy.' },
        results: { title: 'Obraz całości i priorytety', summary, descriptionSections, groups, priorityMessage, congratulation, ending, encouragement, priority: main ? { title, reason, side, type: priority.type } : null,
          findings: important.map(test => ({ title: nameOf(test), text: `${isPain(test) ? 'Pojawił się ból' : isFail(test) ? 'Zakres ruchu nie osiągnął kryterium' : `Wynik ${scoreOf(test) ?? 'do oceny'}`}${sideText(test) ? ` · ${sideText(test)}` : ''}.`, status: 'attention' })),
          positive: positive.slice(0, 4).map(test => ({ title: nameOf(test), text: `${sideText(test) || `Wynik ${scoreOf(test) ?? 'bez bólu'}`} — bez bólu.`, status: 'good' })),
          history: history.slice(0, 1).flatMap(entry => (entry.changes || []).filter(change => change.change !== 'unchanged' && change.change !== 'not_comparable').slice(0, 5).map(change => ({ date: entry.date, name: change.name, change: change.change, text: change.change === 'new_pain' ? 'W tym badaniu pojawił się ból.' : change.change === 'pain_resolved' ? 'Tym razem ból się nie pojawił.' : change.change === 'new_asymmetry' ? 'Pojawiła się różnica między stronami.' : change.change === 'resolved_asymmetry' ? 'Wcześniejsza różnica między stronami nie pojawia się w tym badaniu.' : change.change === 'improved' ? `Wynik poprawił się: ${change.previousScore} → ${change.currentScore}.` : `Wynik jest niższy: ${change.previousScore} → ${change.currentScore}.` }))), tests: items },
        plan: { title: 'Co dalej?', steps: plan },
        help: { title: 'Wybierz ścieżkę dla siebie', intro: main ? `Materiały dobrane do obszaru: ${title}.` : 'Materiały udostępnione przez trenera.', resources, profile },
      },
      history, manualVersion: assessment.manualVersion || null,
    };
  }
  window.QuickScreenReport = { BLOCKS, buildReport };
})();

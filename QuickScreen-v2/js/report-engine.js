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
  const TEST_ACTIONS = {
    cervical: {
      name: 'ruch szyi', limit: 'Ogranicz ruchy szyi i pozycje, które odtwarzają ból. Przy sportach walki i szybkich zmianach kierunku zmniejsz tempo, jeśli gwałtowny ruch głową nasila objawy.',
      do: 'Poruszaj szyją spokojnie w zakresie, który nie wywołuje bólu. Jeśli ból utrzymuje się, nasila lub ogranicza codzienne czynności, skonsultuj go ze specjalistą. Jeśli chcesz działać samodzielnie, nie forsuj bolesnego kierunku ani końcowego zakresu.',
      continue: 'Możesz kontynuować pozostałą aktywność, o ile nie odtwarza bólu szyi.',
    },
    toe_touch: { name: 'skłon i zgięcie bioder', limit: 'Nie zwiększaj ciężaru w martwym ciągu ani w głębokich skłonach, jeśli tracisz kontrolę ruchu.', do: 'Ćwicz kontrolowany skłon w komfortowym zakresie.', continue: 'Możesz kontynuować inne bezbolesne ruchy oraz lżejsze warianty skłonu, które kontrolujesz.' },
    shoulder_mobility: { name: 'ruchomość barków', limit: 'Ogranicz wymagające pozycje z rękami nad głową i duże obciążenia w końcowym zakresie, jeśli musisz kompensować tułowiem.', do: 'Pracuj nad swobodnym, kontrolowanym ruchem barków w bezbolesnym zakresie.', continue: 'Możesz trenować bezbolesne ruchy, które nie wymagają ograniczonego zakresu barków.' },
    squat: { name: 'przysiad', limit: 'Nie zwiększaj ciężaru ani objętości przysiadów, jeśli nie utrzymujesz kontrolowanego wykonania.', do: 'Pracuj nad jakością przysiadu w zakresie, który wykonujesz stabilnie.', continue: 'Możesz kontynuować inne bezbolesne, dobrze kontrolowane wzorce.' },
    balance: { name: 'równowaga na jednej nodze', limit: 'Ogranicz ciężkie ćwiczenia jednonóż, skoki i szybkie zmiany kierunku, jeśli tracisz równowagę.', do: 'Ćwicz stanie na jednej nodze przy stabilnym podparciu i stopniowo zmniejszaj pomoc.', continue: 'Możesz kontynuować stabilne, bezbolesne ćwiczenia obunóż.' },
    rotation: { name: 'rotacja tułowia', limit: 'Nie zwiększaj szybkości ani obciążenia gwałtownych skrętów, rzutów i zmian kierunku, jeśli tracisz kontrolę.', do: 'Ćwicz spokojną rotację tułowia bez zwiększania szybkości i złożoności.', continue: 'Możesz kontynuować bezbolesne ćwiczenia bez dużej rotacji oraz wolniejsze skręty pod kontrolą.' },
    spine_extension_clearing: { name: 'wyprost kręgosłupa', limit: 'Ogranicz powtarzane lub obciążone odchylanie do tyłu, jeśli odtwarza ból.', do: 'Pozostań aktywny w zakresie, który nie wywołuje bólu. Przy utrzymującym się bólu skonsultuj obszar ze specjalistą.', continue: 'Możesz kontynuować codzienne ruchy, które nie prowokują bólu.' },
    default: { name: 'ten ruch', limit: 'Nie zwiększaj trudności ruchu, jeśli nie utrzymujesz jego kontroli.', do: 'Pracuj nad jakością ruchu w komfortowym zakresie.', continue: 'Możesz kontynuować pozostałe bezbolesne aktywności.' },
  };
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
  const nameOf = test => LABELS[codeOf(test)] || LABELS[baseCode(codeOf(test))] || test.name || 'Test ruchowy';
  const fieldsOf = test => test.fields || [];
  const isPain = test => fieldsOf(test).some(field => (field.valueCode || '').toLowerCase() === 'positive' || (field.valueCode || '').toLowerCase() === 'pain');
  const isFail = test => fieldsOf(test).some(field => (field.valueCode || '').toLowerCase() === 'fail');
  const scoreOf = test => Number.isFinite(test.finalScore) ? test.finalScore : Number.isFinite(test.value) ? test.value : null;
  const assessable = test => scoreOf(test) !== null || fieldsOf(test).some(field => field.valueCode);
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
    const action = TEST_ACTIONS[mainCode] || TEST_ACTIONS.default;
    const allPain = priority.type === 'pain';
    const painRules = [...new Map(priority.items.map(test => {
      const code = baseCode(codeOf(test));
      const rule = TEST_ACTIONS[code] || TEST_ACTIONS.default;
      return [code, `${LABELS[code] || nameOf(test)}: ${rule.limit}`];
    })).values()];
    const mildAsymmetry = Boolean(main && main.leftScore != null && main.rightScore != null && Math.abs(main.leftScore - main.rightScore) === 1 && Math.min(main.leftScore, main.rightScore) >= 2);
    const side = main ? sideText(main) : null;
    const important = tests.filter(test => priority.all.includes(test));
    const positive = tests.filter(test => assessable(test) && !priority.all.includes(test) && (scoreOf(test) === 2 || scoreOf(test) === 3 || (!isPain(test) && !isFail(test))));
    const resources = (options.resources || []).filter(item => item.isActive !== false && (!item.testCode || !mainCode || baseCode(item.testCode) === mainCode)).slice(0, 4);
    const history = assessment.history || options.history || [];
    const sport = options.sport || '';
    const profile = options.profile || (sport ? 'active' : 'general');
    const name = `${assessment.client?.firstName || ''} ${assessment.client?.lastName || ''}`.trim();
    const date = assessment.date ? new Date(`${assessment.date}T00:00:00`).toLocaleDateString('pl-PL') : '';
    const assessmentName = assessment.scenarioName || 'Bazowy Test Funkcjonalny';
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
    const plan = main ? [
      { title: 'Chroń', label: title, text: allPain ? painRules.join(' ') : (mainCode === 'cervical' && isFail(main) ? 'Nie wymuszaj końcowego zakresu szyi. Stopniowo zwiększaj zakres przed ruchem gwałtownym, szybkimi zmianami kierunku i sportami walki, które wymagają szybkiego ustawienia głowy.' : mildAsymmetry ? 'Nie ma potrzeby ograniczać aktywności tylko z powodu asymetrii 3/2.' : (scoreOf(main) === 1 || isFail(main) ? action.limit : 'Nie ma potrzeby automatycznie ograniczać całej aktywności z powodu tej różnicy.')) },
      { title: 'Popraw', label: title, text: mildAsymmetry ? `Obie strony spełniają podstawowy standard. Skup dodatkową pracę na stronie z niższym wynikiem (${main.leftScore < main.rightScore ? 'lewa' : 'prawa'}).` : allPain ? (mainCode === 'cervical' ? action.do : `${action.do} Przy bólu warto skonsultować się ze specjalistą, zwłaszcza jeśli utrzymuje się lub ogranicza codzienne czynności. Do tego czasu samodzielnie pozostań przy bezbolesnej aktywności i nie forsuj bolesnego zakresu.`) : action.do },
      { title: 'Rozwijaj', label: 'Co możesz kontynuować', text: action.continue },
    ] : [
      { title: 'Chroń', label: 'Brak dodatkowych ograniczeń', text: 'Nie ma ograniczeń wynikających z dzisiejszego badania.' },
      { title: 'Popraw', label: 'Utrzymuj jakość ruchu', text: 'Kontynuuj regularny ruch i ćwiczenia dopasowane do swojego poziomu.' },
      { title: 'Rozwijaj', label: 'Kontynuuj aktywność', text: 'Możesz kontynuować codzienną aktywność lub trening bez ograniczeń wynikających z badania.' },
    ];
    const descriptionSections = [
      { title: 'Obraz całości', text: summary, tone: 'overview' },
      { title: 'Co działa dobrze', text: positiveNames.length ? `Bez bólu i większych trudności wypadły: ${positiveNames.join(', ')}. Ruchy korzystające z tych wzorców powinny być bezpieczne i nie powinny powodować problemów, o ile nie wywołują bólu.` : 'Nie ma wyników, które można wyróżnić jako bezbolesne i bez większych trudności.', tone: 'good' },
      { title: 'Co wymaga uwagi', text: observations.length ? observations.join(' ') : 'W ocenionych testach nie pojawił się ból ani wyraźne ograniczenie.', tone: observations.length ? allPain ? 'problem' : 'watch' : 'good' },
      { title: 'Priorytet', text: main ? (allPain ? `Ból jest najważniejszą informacją z badania. W pierwszej kolejności zajmij się: ${priority.items.map(nameOf).join(', ')}.` : `Skup teraz uwagę na teście ${nameOf(main)}. Nie musisz poprawiać wszystkiego jednocześnie.`) : 'Badanie nie wskazuje jednego obszaru, od którego trzeba zacząć.', tone: main ? allPain ? 'problem' : 'priority' : 'overview' },
    ];
    return {
      generatorVersion: '5.0.0', assessmentId: assessment.assessmentId, client: assessment.client || {}, assessmentDate: assessment.date || '',
      assessmentName, sport, profile, totalScore: assessment.totalScore ?? null, maximum: assessment.maximum ?? null,
      visibleBlocks: visibleBlocks.map(block => block.id), blocks: {
        intro: { title: 'Hej! Oto Twój raport z badania.', text: 'Badanie sprawdza podstawowe wzorce ruchu, różnice między stronami i ból, aby pomóc ustalić kolejność dalszej pracy.' },
        results: { title: 'Obraz całości i priorytety', summary, descriptionSections, priority: main ? { title, reason, side, type: priority.type } : null,
          findings: important.map(test => ({ title: nameOf(test), text: `${isPain(test) ? 'Pojawił się ból' : isFail(test) ? 'Zakres ruchu nie osiągnął kryterium' : `Wynik ${scoreOf(test) ?? 'do oceny'}`}${sideText(test) ? ` · ${sideText(test)}` : ''}.`, status: 'attention' })),
          positive: positive.slice(0, 4).map(test => ({ title: nameOf(test), text: `${sideText(test) || `Wynik ${scoreOf(test) ?? 'bez bólu'}`} — bez bólu.`, status: 'good' })),
          history: history.slice(0, 1).flatMap(entry => (entry.changes || []).filter(change => change.change !== 'unchanged' && change.change !== 'not_comparable').slice(0, 5).map(change => ({ date: entry.date, name: change.name, change: change.change, text: change.change === 'new_pain' ? 'W tym badaniu pojawił się ból.' : change.change === 'pain_resolved' ? 'Tym razem ból się nie pojawił.' : change.change === 'new_asymmetry' ? 'Pojawiła się różnica między stronami.' : change.change === 'resolved_asymmetry' ? 'Wcześniejsza różnica między stronami nie pojawia się w tym badaniu.' : change.change === 'improved' ? `Wynik poprawił się: ${change.previousScore} → ${change.currentScore}.` : `Wynik jest niższy: ${change.previousScore} → ${change.currentScore}.` }))), tests: items },
        plan: { title: 'Sugerowany plan działania', steps: plan, nextStep: main ? `Po poprawie ${title.toLocaleLowerCase('pl-PL')} sprawdź ten ruch ponownie.` : 'Kontynuuj aktywność i sprawdź postęp podczas kolejnego badania.' },
        help: { title: 'Wybierz ścieżkę dla siebie', intro: main ? `Materiały dobrane do obszaru: ${title}.` : 'Materiały udostępnione przez trenera.', resources, profile },
      },
      history, manualVersion: assessment.manualVersion || null,
    };
  }
  window.QuickScreenReport = { BLOCKS, buildReport };
})();

(() => {
  const html = value => QSUI.esc(value);
  const optionLabel = type => type === 'score'
    ? [['0','Ból'],['1','Słabo'],['2','W normie'],['3','Super!']]
    : type === 'passfail' ? [['Pass',''],['Fail','']] : [['Brak bólu',''],['Ból','']];
  function answers(field) {
    const choices = optionLabel(field.type);
    return '<div class="options qs21-options">' + choices.map(([label, detail], index) => {
      const cls = field.type === 'score'
        ? index === 0 ? 'pain' : index === 1 ? 'fail' : 'pass'
        : index === 0 ? 'pass' : 'fail';
      const selected = (field.type === 'score' && index === 2) || (field.type !== 'score' && index === 0);
      return '<button type="button" class="option ' + cls + (selected ? ' selected' : '') + '" aria-pressed="' + selected + '" data-action="select">' + html(label) + (detail ? '<small>' + html(detail) + '</small>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function fieldBlock(field) {
    return '<div class="selector"><span class="selector-title">' + html(field.label) + '</span>' + answers(field) + '</div>';
  }
  function sidePanel(title, groups, letter) {
    return '<section class="side qs21-side"><h3><span>' + letter + '</span>' + title + '</h3>' + groups.map(group => group.label
      ? '<div class="qs21-pattern"><b>' + html(group.label) + '</b>' + group.fields.map(fieldBlock).join('') + '</div>'
      : group.fields.map(fieldBlock).join('')).join('') + '</section>';
  }
  function fieldGroups(test) {
    const bilateral = test.fields.filter(field => field.sideMode === 'bilateral');
    const single = test.fields.filter(field => field.sideMode !== 'bilateral');
    const parts = [];
    if (bilateral.length) {
      parts.push('<div class="sides qs21-sides">' + ['Lewa strona', 'Prawa strona'].map((label, index) =>
        sidePanel(label, [{ fields: bilateral }], index === 0 ? 'L' : 'P')).join('') + '</div>');
    }
    if (single.length) parts.push('<div class="qs21-single-fields">' + single.map(fieldBlock).join('') + '</div>');
    return parts.join('');
  }
  function renderTestFields(test) {
    if (test.code === 'shoulder_clearing') {
      return '<div class="qs21-clearing-sides">' + ['Lewa strona', 'Prawa strona'].map((side, sideIndex) => {
        const patterns = test.patterns.map(pattern => ({
          label: pattern.label,
          fields: pattern.fields
        }));
        return sidePanel(side, patterns, sideIndex === 0 ? 'L' : 'P');
      }).join('') + '</div>';
    }
    return fieldGroups(test);
  }
  window.QSViews.assessment = function (state) {
    const tests = window.QS.tests;
    const n = Math.max(1, Math.min(tests.length, Number((state.path.match(/\/(\d+)$/) || [])[1] || 1)));
    const test = tests[n - 1];
    const progress = Math.round(n * 100 / tests.length);
    const steps = tests.map((item, index) => '<button class="qs21-step ' + (index + 1 < n ? 'done' : index + 1 === n ? 'active' : '') + '" data-route="#/assessment/demo/' + (index + 1) + '" aria-label="Test ' + (index + 1) + ': ' + html(item.name) + '" aria-current="' + (index + 1 === n ? 'step' : 'false') + '"></button>').join('');
    const client = window.QS.client;
    const nextPath = n < tests.length ? '#/assessment/demo/' + (n + 1) : '#/assessment-details/demo';
    const nextLabel = n < tests.length ? 'Dalej: ' + tests[n].name : 'Zakończ badanie';
    const content = '<main class="shell-main qs21-assessment">' +
      '<section class="qs21-assessment-meta"><div class="qs21-client-context"><span class="initials">' + html(client.initials) + '</span><b>' + html(client.name) + '</b><span>Dyscyplina: ' + html(client.discipline) + '</span><span>Data badania: 07.09.2026</span></div><span class="qs21-protocol">Protokół QuickScreen</span></section>' +
      '<section class="qs21-progress"><div><b>Postęp badania (Krok ' + n + ' z ' + tests.length + ')</b><span>Test: ' + html(test.name) + '</span></div><div class="qs21-progress-track" role="progressbar" aria-valuenow="' + progress + '" aria-valuemin="0" aria-valuemax="100">' + steps + '</div></section>' +
      '<section class="qs21-test-card"><header class="qs21-test-head"><h1>Test ' + n + ' z ' + tests.length + ': ' + html(test.name) + '</h1><button class="btn btn-outline" data-action="criteria">ⓘ Standardy</button></header>' +
      renderTestFields(test) +
      '<label class="field qs21-test-note"><span>Notatka / uwagi do testu (opcjonalnie)</span><textarea class="textarea" placeholder="Wpisz ewentualne obserwacje dotyczące kompensacji ruchowych..."></textarea></label>' +
      '<div class="qs21-test-actions"><a class="btn btn-outline" href="#/assessment/demo/' + Math.max(1, n - 1) + '">← Wstecz</a><a class="btn btn-primary" href="' + nextPath + '">' + html(nextLabel) + ' →</a></div></section></main>';
    return QSUI.shell(content, 'assessment');
  };
})();

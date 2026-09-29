(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeUrl = value => /^https:\/\//i.test(String(value || '')) ? String(value) : '';
  const BLOCKS = window.QuickScreenReport.BLOCKS;

  function resourcesMarkup(resources) {
    if (!resources.length) return '<span class="report-path-link-placeholder">Przykładowy film 1</span><span class="report-path-link-placeholder">Przykładowy film 2</span>';
    return resources.map(resource => `<a class="report-path-link" href="${esc(safeUrl(resource.url))}" target="_blank" rel="noopener noreferrer">${esc(resource.title)}${resource.description ? `<small>${esc(resource.description)}</small>` : ''}</a>`).join('');
  }

  function trendChart(history = []) {
    const points = [...history].filter(item => Number.isFinite(item.score) && item.maximum > 0).reverse().slice(-4);
    const coordinates = points.map((item, index) => ({ x: points.length === 1 ? 250 : 42 + index * (429 / (points.length - 1)), y: 150 - (item.score / item.maximum) * 120, item }));
    const labels = coordinates.map(point => `<text x="${point.x}" y="178">${new Date(`${point.item.date}T00:00:00`).toLocaleDateString('pl-PL')}</text>`).join('');
    const values = coordinates.map(point => `<text x="${point.x}" y="${point.y - 12}" fill="#3A353B">${point.item.score}/${point.item.maximum}</text>`).join('');
    const circles = coordinates.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4"/>`).join('');
    const line = coordinates.map(point => `${point.x},${point.y}`).join(' ');
    return `<svg class="trend-svg" viewBox="0 0 500 190" role="img" aria-label="Wykres trendu wyników QuickScreen"><g stroke="#E0DDD9" stroke-dasharray="2 3"><path d="M0 30H500M0 90H500M0 150H500"/></g>${coordinates.length > 1 ? `<polyline points="${line}" fill="none" stroke="#C1D445" stroke-width="2.5"/>` : ''}<g fill="#C1D445" stroke="white" stroke-width="2">${circles}</g><g fill="#3A353B" font-size="12" font-weight="700" text-anchor="middle">${values}</g><g fill="#8A8389" font-size="10" text-anchor="middle">${labels}</g></svg>`;
  }

  function reportMarkup(model, options = {}) {
    const audience = options.audience || 'client';
    const clientVisible = new Set(model.clientVisibleBlocks || model.visibleBlocks || BLOCKS.map(block => block.id));
    const visible = new Set(audience === 'trainer' ? BLOCKS.map(block => block.id) : clientVisible);
    const blockAttrs = id => `data-report-block="${id}" data-client-visible="${clientVisible.has(id)}"`;
    const b = model.blocks;
    const sections = [];

    if (visible.has('intro')) sections.push(`<section class="report-section" ${blockAttrs('intro')}><p class="report-index">01 / Wstęp</p><h2>${esc(b.intro.title)}</h2><p>${esc(b.intro.text)}</p><details class="report-details report-explainer"><summary>Co oznacza wynik Quick Screen?</summary><div class="report-explainer-copy"><p>Quick Screen pokazuje, które wzorce ruchowe działają dobrze, które warto poprawić i czy podczas ruchu pojawia się ból. Nie chodzi o zdobycie jak największej liczby punktów, tylko o znalezienie rzeczy, które naprawdę mają znaczenie dla dalszego treningu.</p><p><b>3 — jest dobrze.</b> Wzorzec spełnia wszystkie kryteria testu. Nie trzeba go poprawiać — można go normalnie rozwijać w treningu.</p><p><b>2 — jest wystarczająco dobrze.</b> Ruch nie jest idealny, ale spełnia podstawowy standard. Zwykle nie trzeba się nim szczególnie przejmować, zwłaszcza jeśli są inne ważniejsze ograniczenia. FMS traktuje wynik 2 jako akceptowalny.</p><p><b>1 — warto nad tym popracować.</b> Wzorzec jest wyraźnie ograniczony albo wymaga dużej kompensacji. To sygnał, że warto sprawdzić, co utrudnia ruch i potraktować ten obszar jako priorytet.</p><p><b>0 — pojawia się ból.</b> Ból jest ważniejszy niż jakość ruchu. Nawet jeśli ruch wygląda dobrze, obecność bólu oznacza wynik 0. Quick Screen nie diagnozuje jego przyczyny, ale pokazuje, że tego wzorca nie należy traktować jak zwykłego problemu z mobilnością czy techniką.</p><h3>Dlaczego ból jest ważny?</h3><p>Ból może zmieniać sposób, w jaki się poruszasz — ciało może ograniczać ruch albo kompensować, żeby chronić wrażliwe miejsce. Dlatego zależy nam przede wszystkim na tym, żeby podstawowe ruchy były wykonywane bez bólu. Jeśli ból się pojawia, warto najpierw wyjaśnić jego przyczynę, zamiast po prostu „ćwiczyć więcej” dany ruch.</p><h3>Czy trzeba poprawiać każdy wynik poniżej 3?</h3><p>Nie. Celem Quick Screen nie jest perfekcyjny wynik. Wyniki 2 i 3 są zwykle wystarczające, a największą uwagę warto poświęcić bólowi, wynikom 1 oraz wyraźnym różnicom między stronami.</p><p><b>Najprościej:</b> 3 — rozwijaj; 2 — zwykle zostaw w spokoju; 1 — popraw; 0 — najpierw zajmij się bólem.</p><small>Źródło: FMS Quick Screen Manual V2</small></div></details></section>`);
    if (visible.has('results')) {
      const sideValue = (fields, side) => fields.filter(field => field.side === side && field.answerSetCode !== 'score_0_3').map(field => {
        if (field.answerSetCode === 'pass_fail') return field.valueCode === 'pass' ? 'OK' : field.valueCode === 'fail' ? 'Nie OK' : field.valueLabel;
        if (field.answerSetCode === 'pain_status') return field.valueCode === 'positive' ? 'ból' : field.valueCode === 'negative' ? 'brak bólu' : field.valueLabel;
        return field.valueLabel || field.valueCode;
      }).filter(Boolean).join(' · ');
      const rows = b.results.tests.flatMap(item => {
        const fields = item.fields || [];
        if (item.code === 'shoulder_clearing') return ['upper', 'lower'].flatMap(pattern => {
          const patternFields = fields.filter(field => String(field.code || '').includes(`_${pattern}_`));
          if (!patternFields.length) return [];
          const left = sideValue(patternFields, 'left');
          const right = sideValue(patternFields, 'right');
          return [{ name: `${item.name} — wzorzec ${pattern === 'upper' ? 'górny' : 'dolny'}`, value: [left, right].filter(Boolean).join(' / ') || '—' }];
        });
        if (item.leftScore != null || item.rightScore != null || item.leftDistanceCm != null || item.rightDistanceCm != null) { const scoreText = (score, distance) => score == null ? distance == null ? '—' : `(${Number(distance).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} cm)` : `${score}${distance == null ? '' : ` (${Number(distance).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} cm)`}`; return [{ name: item.name, value: `L: ${scoreText(item.leftScore, item.leftDistanceCm)} / P: ${scoreText(item.rightScore, item.rightDistanceCm)}` }]; }
        const left = sideValue(fields, 'left');
        const right = sideValue(fields, 'right');
        const single = sideValue(fields, 'none');
        return [{ name: item.name, value: [left, right].filter(Boolean).join(' / ') || single || (item.score == null ? '—' : String(item.score)) }];
      });
      const columnMarkup = columnRows => columnRows.map(row => `<div class="report-test-row"><span>${esc(row.name)}</span><span>${esc(row.value)}</span></div>`).join('');
      const leftColumn = columnMarkup(rows.slice(0, 6));
      const rightColumn = columnMarkup(rows.slice(6));
      const groupStyle = { veryGood: ['very-good', '✓'], good: ['good', '✓✓'], asymmetry: ['asymmetry', '△'], improve: ['improve', '!'], pain: ['pain', '!'] };
      const groups = (b.results.groups || []).map(group => {
        const [tone, icon] = groupStyle[group.items[0]?.status] || ['good', '✓'];
        const items = group.items.map(item => { const sideValue = (score, distance) => score == null ? distance == null ? '—' : `(${Number(distance).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} cm)` : `${score}${distance == null ? '' : ` (${Number(distance).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} cm)`}`; const value = item.leftDistanceCm != null || item.rightDistanceCm != null ? `L: ${sideValue(item.leftScore, item.leftDistanceCm)} / P: ${sideValue(item.rightScore, item.rightDistanceCm)}` : item.leftScore != null || item.rightScore != null ? `${item.leftScore ?? '—'}/${item.rightScore ?? '—'}` : item.score; return `<li>${esc(item.name)}${value != null ? ` (${esc(value)})` : ''}</li>`; }).join('');
        return `<article class="report-result-group ${tone}"><div class="report-result-group-head"><b>${esc(group.title)}</b><span aria-hidden="true">${icon}</span></div><ul>${items}</ul></article>`;
      }).join('');
      const callouts = [
        b.results.priorityMessage && ['priority', '◎', b.results.priorityMessage],
        b.results.ending && ['recommendation', '↻', b.results.ending],
        (b.results.encouragement || b.results.congratulation) && ['comfort', '☻', b.results.encouragement || b.results.congratulation],
      ].filter(Boolean).map(([tone, icon, text]) => `<article class="report-result-callout ${tone}"><span class="report-result-callout-icon" aria-hidden="true">${icon}</span><p>${esc(text)}</p></article>`).join('');
      const trendHistory = (model.trendHistory || []).filter(item => Number.isFinite(item.score) && Number.isFinite(item.maximum) && item.maximum > 0);
      const trend = trendHistory.length > 1 ? `<section class="report-trend-card trend-card card"><div class="section-title"><h2>Podsumowanie trendów</h2><span class="body-copy"><i class="chart-dot"></i><small>Wynik QS</small></span></div>${trendChart(trendHistory)}</section>` : '';
      const fallback = (b.results.descriptionSections || [{ title: 'Obraz całości', text: b.results.summary, tone: 'overview' }]).map(item => `<article class="report-description-card ${esc(item.tone)}"><b>${esc(item.title)}</b><p>${esc(item.text)}</p></article>`).join('');
      const description = `${groups ? `<div class="report-result-groups">${groups}</div>` : fallback}${callouts}`;
      sections.push(`<section class="report-section" ${blockAttrs('results')}><p class="report-index">02 / Twój wynik</p><h2>${esc(b.results.title)}</h2><div class="report-description-sections">${description}</div><details class="report-details"><summary>Szczegółowe wyniki wszystkich testów</summary><div class="report-test-grid"><div class="report-test-column">${leftColumn}</div><div class="report-test-column">${rightColumn}</div></div></details>${trend}</section>`);
    }
    if (visible.has('plan')) {
      const steps = b.plan.steps.map((step, index) => `${index ? '<span class="plan-arrow" aria-hidden="true">→</span>' : ''}<article class="plan-step"><span class="plan-num">0${index + 1}</span><div class="plan-copy"><b>${esc(step.title)}</b>${step.label ? `<small>${esc(step.label)}</small>` : ''}<p>${esc(step.text)}</p></div></article>`).join('');
      sections.push(`<section class="report-section" ${blockAttrs('plan')}><p class="report-index">03 / Plan</p><h2>${esc(b.plan.title)}</h2><div class="report-plan" data-step-count="${b.plan.steps.length}">${steps}</div></section>`);
    }
    if (visible.has('help')) {
      const materials = (b.help.resources || []).filter(resource => resource.type !== 'trainerize');
      const programs = (b.help.resources || []).filter(resource => resource.type === 'trainerize');
      const programLinks = programs.length
        ? programs.map(resource => `<a class="btn btn-blue btn-small report-help-cta" href="${esc(safeUrl(resource.url))}" target="_blank" rel="noopener noreferrer">${esc(resource.title)} <span aria-hidden="true">→</span></a>`).join('')
        : '<span class="btn btn-blue btn-small report-help-cta is-placeholder" aria-disabled="true">Kup program w Trainerize <span aria-hidden="true">→</span></span>';
      sections.push(`<section class="report-section" ${blockAttrs('help')}><p class="report-index">04 / Jak to zrobić</p><h2>Wybierz ścieżkę dla siebie</h2><div class="report-paths"><article class="report-path"><h3>Samodzielnie</h3><p>Materiały wideo na start, jeśli chcesz spróbować na własną rękę:</p>${resourcesMarkup(materials)}</article><article class="report-path"><h3>Z pomocą</h3><p>Dedykowany program naprawczy online i pełny kontakt ze mną.</p>${programLinks}</article></div></section>`);
    }

    return `<main class="report-page"><div class="report-toolbar"><a class="btn btn-small" href="#/results/${esc(model.assessmentId)}">← Wróć do wyników</a><button class="btn btn-small" onclick="window.QuickScreenReportUI.printClientReport()">Drukuj raport klienta</button></div><header class="report-hero"><span class="report-client-tag">Raport dla ${esc(`${model.client.firstName || ''} ${model.client.lastName || ''}`.trim())}${model.sport ? ` · ${esc(model.sport)}` : ''}</span><h1>${esc(model.assessmentName)}</h1><p>Badanie z ${esc(model.assessmentDate ? new Date(`${model.assessmentDate}T00:00:00`).toLocaleDateString('pl-PL') : '—')}${model.totalScore != null ? ` · Wynik ${esc(model.totalScore)}/${esc(model.maximum)}` : ''}</p></header>${sections.join('')}<p class="report-disclaimer">Badanie ma charakter przesiewowy. Pokazuje, które obszary wymagają uwagi i co można zrobić dalej, ale nie określa przyczyny bólu ani ograniczenia.</p><footer class="report-footer"><div class="report-footer-brand"><img src="assets/logo/kb-logo.png" alt="KB Trener"><span>KB Trener / QuickScreen</span></div><span class="report-footer-meta">Raport ruchowy<br>${esc(model.assessmentDate || '')} · ${esc(model.assessmentId || '')}</span></footer></main>`;
  }

  function settingsPage(settings) {
    const visibility = settings.blockVisibility || {};
    const checks = BLOCKS.map(block => `<label class="report-select-block"><input type="checkbox" name="blockVisibility" value="${block.id}" ${visibility[block.id] !== false ? 'checked' : ''}><span><b>${esc(block.title)}</b><small>Widoczny w raporcie klienta</small></span></label>`).join('');
    return `<main class="page report-settings"><div class="page-heading"><div><h1>Ustawienia raportu</h1><p>Wybierz bloki widoczne dla klienta. Trener zawsze widzi pełny raport.</p></div><a class="btn" href="#/dashboard">Wróć do panelu</a></div><section class="card report-settings-card"><h2>Bloki widoczne dla klienta</h2><p>Zmiana zapisuje się od razu i obowiązuje przy każdym następnym otwarciu raportu.</p><form id="report-settings-form"><div class="report-block-options">${checks}</div><span id="report-settings-status" class="report-save-status" role="status"></span></form></section></main>`;
  }

  function printClientReport() {
    document.body.classList.add('printing-client-report');
    const cleanup = () => document.body.classList.remove('printing-client-report');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 1000);
  }

  window.QuickScreenReportUI = { render: reportMarkup, settings: settingsPage, printClientReport, trendChart };
})();

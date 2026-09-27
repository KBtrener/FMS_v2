(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeUrl = value => /^https:\/\//i.test(String(value || '')) ? String(value) : '';
  const BLOCKS = window.QuickScreenReport.BLOCKS;

  function resourcesMarkup(resources) {
    if (!resources.length) return '<p>Trener nie dodał jeszcze materiałów do tego obszaru.</p>';
    return resources.map(resource => `<a class="report-resource" href="${esc(safeUrl(resource.url))}" target="_blank" rel="noopener noreferrer"><b>${esc(resource.title)}</b><span>${esc(resource.description || resource.type)}</span></a>`).join('');
  }

  function reportMarkup(model, options = {}) {
    const audience = options.audience || 'client';
    const clientVisible = new Set(model.clientVisibleBlocks || model.visibleBlocks || BLOCKS.map(block => block.id));
    const visible = new Set(audience === 'trainer' ? BLOCKS.map(block => block.id) : clientVisible);
    const blockAttrs = id => `data-report-block="${id}" data-client-visible="${clientVisible.has(id)}"`;
    const b = model.blocks;
    const sections = [];

    if (visible.has('intro')) sections.push(`<section class="report-section" ${blockAttrs('intro')}><p class="report-index">01 / Wstęp</p><h2>${esc(b.intro.title)}</h2><p>${esc(b.intro.text)}</p></section>`);
    if (visible.has('results')) {
      const priority = b.results.priority;
      const priorityMarkup = priority ? `<article class="insight ${priority.type === 'pain' ? 'problem' : 'watch'}"><b>Najważniejsze teraz · ${esc(priority.title)}</b><p>${esc(priority.reason)}</p></article>` : '<article class="insight good"><b>Brak jednego głównego priorytetu</b><p>Kontynuuj aktywność dopasowaną do swojego poziomu.</p></article>';
      const findings = [...(b.results.findings || []), ...(b.results.positive || [])].map(item => `<article class="insight ${item.status === 'good' ? 'good' : 'watch'}"><b>${esc(item.title)}</b><p>${esc(item.text)}</p></article>`).join('');
      const history = (b.results.history || []).map(item => `<article class="insight ${item.change === 'improved' || item.change === 'pain_resolved' ? 'good' : 'watch'}"><b>Zmiana · ${esc(item.name)}</b><p>${esc(item.text)} <small>Badanie z ${esc(item.date)}</small></p></article>`).join('');
      const tests = b.results.tests.map(item => {
        const statusText = item.status === 'pain' ? 'Ból' : item.status === 'attention' ? 'Wymaga uwagi' : item.status === 'unknown' ? 'Nie oceniono' : item.score == null ? 'Bez bólu' : `Wynik ${item.score}`;
        const score = item.score == null ? '' : ` · ${item.score}/3`;
        const sides = item.sideText ? ` · ${item.sideText}` : item.leftScore != null || item.rightScore != null ? ` · Lewa ${item.leftScore ?? '—'} · Prawa ${item.rightScore ?? '—'}` : '';
        const details = (item.fields || []).map(field => `${field.side === 'left' ? 'Lewa' : field.side === 'right' ? 'Prawa' : ''}${field.side && field.side !== 'none' ? ' strona · ' : ''}${field.label}: ${field.valueLabel || field.valueCode}`).join(' · ');
        const tone = item.status === 'pain' ? 'problem' : item.status === 'attention' ? 'warn' : '';
        return `<div class="report-score-row"><span><b>${esc(item.name)}</b>${item.description ? `<small>${esc(item.description)}</small>` : ''}${details ? `<small>${esc(details)}</small>` : ''}</span><b class="report-score-value ${tone}">${esc(statusText + score + sides)}</b></div>`;
      }).join('');
      sections.push(`<section class="report-section" ${blockAttrs('results')}><p class="report-index">02 / Twój wynik</p><h2>${esc(b.results.title)}</h2><p>${esc(b.results.summary)}</p><div class="report-insights">${priorityMarkup}${findings}${history}</div><details class="report-details"><summary>Szczegółowe wyniki wszystkich testów</summary><div class="report-scores">${tests}</div></details></section>`);
    }
    if (visible.has('plan')) {
      const steps = b.plan.steps.map((step, index) => `<article class="plan-step"><span class="plan-num">0${index + 1}</span><div class="plan-copy"><b>${esc(step.title)}</b><small>${esc(step.label)}</small><p>${esc(step.text)}</p></div></article>`).join('');
      sections.push(`<section class="report-section" ${blockAttrs('plan')}><p class="report-index">03 / Plan</p><h2>${esc(b.plan.title)}</h2><p>Na podstawie Twojego wyniku — oto kolejne kroki.</p><div class="report-plan">${steps}</div><p class="report-next-step"><b>Następny krok:</b> ${esc(b.plan.nextStep)}</p></section>`);
    }
    if (visible.has('help')) sections.push(`<section class="report-section" ${blockAttrs('help')}><p class="report-index">04 / Jak to zrobić</p><h2>${esc(b.help.title)}</h2><p>${esc(b.help.intro)}</p><div class="report-paths">${resourcesMarkup(b.help.resources)}</div></section>`);

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

  window.QuickScreenReportUI = { render: reportMarkup, settings: settingsPage, printClientReport };
})();

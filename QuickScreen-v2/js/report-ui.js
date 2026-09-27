(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeUrl = value => /^https:\/\//i.test(String(value || '')) ? String(value) : '';
  const BLOCKS = window.QuickScreenReport.BLOCKS;

  function resourcesMarkup(resources) {
    if (!resources.length) return '<span class="report-path-link-placeholder">Przykładowy film 1</span><span class="report-path-link-placeholder">Przykładowy film 2</span>';
    return resources.map(resource => `<a class="report-path-link" href="${esc(safeUrl(resource.url))}" target="_blank" rel="noopener noreferrer">${esc(resource.title)}${resource.description ? `<small>${esc(resource.description)}</small>` : ''}</a>`).join('');
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
        if (item.leftScore != null || item.rightScore != null) return [{ name: item.name, value: `${item.leftScore ?? '—'}/${item.rightScore ?? '—'}` }];
        const left = sideValue(fields, 'left');
        const right = sideValue(fields, 'right');
        const single = sideValue(fields, 'none');
        return [{ name: item.name, value: [left, right].filter(Boolean).join(' / ') || single || (item.score == null ? '—' : String(item.score)) }];
      });
      const testRows = rows.map(row => `<div class="report-test-row"><span>${esc(row.name)}</span><span>${esc(row.value)}</span></div>`).join('');
      sections.push(`<section class="report-section" ${blockAttrs('results')}><p class="report-index">02 / Twój wynik</p><h2>${esc(b.results.title)}</h2><p class="report-results-description">${esc(b.results.summary)}</p><details class="report-details"><summary>Szczegółowe wyniki wszystkich testów</summary><div class="report-test-grid">${testRows}</div></details></section>`);
    }
    if (visible.has('plan')) {
      const steps = b.plan.steps.map((step, index) => `<article class="plan-step"><span class="plan-num">0${index + 1}</span><div class="plan-copy"><b>${esc(step.title)}</b><small>${esc(step.label)}</small><p>${esc(step.text)}</p></div></article>`).join('');
      sections.push(`<section class="report-section" ${blockAttrs('plan')}><p class="report-index">03 / Plan</p><h2>${esc(b.plan.title)}</h2><p>Na podstawie Twojego wyniku — oto kolejne kroki.</p><div class="report-plan">${steps}</div><p class="report-next-step"><b>Następny krok:</b> ${esc(b.plan.nextStep)}</p></section>`);
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

  window.QuickScreenReportUI = { render: reportMarkup, settings: settingsPage, printClientReport };
})();

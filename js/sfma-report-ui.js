(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const labels = { FN: 'Functional Non-painful', FP: 'Functional Painful', DN: 'Dysfunctional Non-painful', DP: 'Dysfunctional Painful' };
  const tone = code => code === 'FN' ? 'ok' : code === 'DP' ? 'problem' : code ? 'warn' : 'muted';
  function result(assessment, back, report = false) {
    const rows = assessment.rows || [];
    const person = assessment.client || {};
    const results = rows.map((row,index) => {
      const values = row.sides === 'bilateral' ? [['left','Lewa'],['right','Prawa']].map(([side,label]) => [label,row[side === 'left' ? 'leftClassification' : 'rightClassification']]) : [['Wzorzec',row.classification]];
      const breakout = row.breakout || {};
      const details = Object.entries(breakout).filter(([,value])=>value).map(([key,value])=>`<span class="sfma-breakout-result"><b>${esc(key.replaceAll(':',' · '))}:</b> ${esc(value)} — ${esc(labels[value])}</span>`).join('');
      return `<article class="sfma-result-row card"><span class="sfma-index">${index+1}</span><span class="sfma-name"><b>${esc(row.name)}</b>${values.map(([side,code])=>`<span class="sfma-classification ${tone(code)}"><small>${side}</small><b>${esc(code||'—')}</b><span>${esc(labels[code]||'Nieuzupełniono')}</span></span>`).join('')}<details class="sfma-result-details" ${report&&details?'open':''}><summary>Breakouty · ${details?'zapisane wyniki':'brak wykonanych badań'}</summary>${details||'<p>Nie wykonano opcjonalnych testów szczegółowych.</p>'}</details></span></article>`;
    }).join('');
    const client=esc(`${person.firstName||''} ${person.lastName||''}`.trim());
    const date=assessment.date?new Date(`${assessment.date}T00:00:00`).toLocaleDateString('pl-PL'):'';
    return `<main class="page sfma-results-page"><section class="action-tile card" aria-label="Akcje"><div class="action-tile-actions">${back}<button class="btn nav-button nav-button-secondary" data-action="edit-assessment" data-assessment="${esc(assessment.assessmentId)}">Edytuj badanie</button>${report?'<button class="btn nav-button nav-button-primary" data-action="print-sfma">Drukuj / Zapisz PDF</button>':`<a class="btn nav-button nav-button-primary" href="#/report/${esc(assessment.assessmentId)}">Otwórz raport</a>`}</div></section><header class="page-heading"><div><h1>${report?'Raport SFMA':'Wyniki SFMA'} · ${date}</h1><p>${client}</p></div></header><section class="results-summary card sfma-summary"><div><small>Rodzaj wyniku</small><strong>Wyniki opisowe</strong></div><p>Klasyfikacje Top Tier oraz zapisane badania breakout. Klasyfikacje są przedstawione bez łącznej punktacji.</p></section><section class="sfma-results-list"><h2>Top Tier · 10 wzorców</h2>${results}</section></main>`;
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-action="print-sfma"]'))window.print();});
  globalThis.SfmaReportUI=Object.freeze({results:result,report:(assessment,back)=>result(assessment,back,true)});
})();

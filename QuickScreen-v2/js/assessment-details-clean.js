/* Wspólny, techniczny podgląd surowych wyników badania. */
(function () {
  const tests = [
    ['1', 'Cervical Flexion', 'PASS', '—', 'PASS', 'pass'],
    ['2', 'Cervical Rotation + Extension', 'PASS', 'PASS', 'PASS', 'pass'],
    ['2a', 'Neck Extension Clearing', 'Brak bólu', 'Ból', 'FAIL', 'pain'],
    ['3', 'Toe Touch', '3', '3', '3 / 3', 'pass'],
    ['4', 'Shoulder Mobility', '1', '2', '0 / 3', 'pain'],
    ['4a', 'Shoulder Clearing', 'PASS', 'FAIL', '0 / 3', 'pain'],
    ['5', 'Rotation', '0', '1', '0 / 3', 'pain'],
    ['6', 'Balance', '1', '2', '1 / 3', 'attention'],
    ['7', 'Squat', '—', '—', '0 / 3', 'pain'],
    ['7a', 'Spine Extension Clearing', '—', 'Ból', 'FAIL', 'pain']
  ];
  const statusLabel = { pass: 'PASS', attention: 'UWAGA', pain: 'BÓL' };

  QSViews.details = function () {
    const role = window.QSPreview?.getRole?.() || 'trainer';
    const backRoute = role === 'client' ? '#/client-panel' : '#/client/demo';
    const backLabel = role === 'client' ? '← Mój panel' : '← Profil klienta';
    const rows = tests.map(([number, name, left, right, result, status]) => `<tr class="technical-result-row ${status}"><td>${number}</td><th scope="row">${name}</th><td>${left}</td><td>${right}</td><td><strong class="technical-result-value ${status}">${result}</strong></td><td>${QSUI.status(status, statusLabel[status])}</td></tr>`).join('');

    return QSViews.layout(`<main class="technical-result-page" aria-labelledby="technical-result-title">
      <header class="technical-result-head">
        <div><a class="btn btn-ghost btn-sm" href="${backRoute}">${backLabel}</a><span class="eyebrow">PODGLĄD WYNIKU · QUICKSCREEN</span><h1 id="technical-result-title">Badanie z 07.09.2026</h1><p>Surowe dane badania</p></div>
        <div class="technical-result-summary"><span>Wynik łączny</span><strong>5<small>/15</small></strong><a class="btn btn-teal" href="#/report/demo">Otwórz raport badania <span aria-hidden="true">→</span></a></div>
      </header>
      <section class="technical-result-table-wrap" aria-label="Tabela wyników badania">
        <table class="technical-result-table"><thead><tr><th scope="col">#</th><th scope="col">Test</th><th scope="col">L</th><th scope="col">P</th><th scope="col">Wynik</th><th scope="col">Status</th></tr></thead><tbody>${rows}</tbody></table>
      </section>
    </main>`, 'clients');
  };
})();

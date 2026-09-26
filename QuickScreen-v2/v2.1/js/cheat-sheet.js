window.QSViews.cheatSheet = function () {
  const hierarchy = [
    'Cervical Patterns', 'Toe Touch', 'Shoulder Mobility',
    'Squat', 'Balance', 'Rotation'
  ];
  const priorities = [
    'Ból / wynik 0 (Protect + konsultacja)',
    'Wynik 1 / FAIL / asymetria',
    'Wynik 2 (akceptowalny)',
    'Wynik 3 (optymalny)'
  ];
  const actions = [
    ['PROTECT', 'Zabezpiecz obszar z bólem', 'pain'],
    ['CORRECT', 'Pracuj nad głównym priorytetem', 'attention'],
    ['RETEST', 'Sprawdź ponownie postęp', 'pass'],
    ['DEVELOP', 'Rozwijaj pozostałe wzorce', 'info']
  ];
  const content = `
    <div class="page-head cheat-sheet-head">
      <div><div class="eyebrow">KB Trener / QuickScreen</div><h1>Ściąga trenera — QuickScreen</h1>
      <p>Szybka pomoc przy interpretacji wyników i wyborze priorytetu korekcyjnego</p></div>
    </div>
    <div class="cheat-sheet-grid">
      <section class="card cheat-panel">
        <div class="card-head"><h2>Hierarchia wzorców</h2></div>
        <ol class="cheat-list">${hierarchy.map((label,index)=>`<li><span>${index+1}</span><b>${label}</b></li>`).join('<li class="cheat-arrow" aria-hidden="true">↓</li>')}</ol>
        <p class="cheat-note"><b>Uwaga:</b> Mobility jest rozpatrywane przed stability/motor control. Ta kolejność jest hierarchią korekcyjną, a nie kolejnością wykonywania samych testów.</p>
      </section>
      <section class="card cheat-panel">
        <div class="card-head"><h2>Jak wybrać priorytet?</h2></div>
        <ol class="cheat-list cheat-priorities">${priorities.map((label,index)=>`<li><span>${index+1}</span><b>${label}</b></li>`).join('<li class="cheat-arrow" aria-hidden="true">↓</li>')}</ol>
        <p class="cheat-note"><b>Uwaga:</b> Celem jest wybranie jednego głównego weak link, a nie poprawianie wszystkiego jednocześnie.</p>
      </section>
    </div>
    <section class="card cheat-flow">
      <div class="card-head"><h2>Co dalej?</h2></div>
      <ol class="cheat-action-flow">${actions.map(([label,description,state],index)=>`
        <li class="cheat-action cheat-action--${state}">
          <span class="cheat-action-kicker">Krok ${index+1}</span><b>${label}</b><small>${description}</small>
        </li>`).join('<li class="cheat-action-arrow" aria-hidden="true">›</li>')}</ol>
      <ul class="cheat-guidance">
        <li>Najpierw zajmij się głównym priorytetem — wdrażaj celowane ćwiczenia korekcyjne.</li>
        <li>Pozostałe wzorce z akceptowalnym wynikiem mogą być dalej rozwijane w bezpiecznych zakresach.</li>
        <li>Po cyklu korekcji wykonaj ponowną ocenę (Retest) i ponownie ustal priorytet.</li>
      </ul>
    </section>`;
  return QSUI.page(content, 'cheat-sheet');
};

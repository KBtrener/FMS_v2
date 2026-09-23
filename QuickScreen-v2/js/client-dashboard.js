/* Panel klienta: jedna decyzja, prosty plan, konkretna historia badań. */
QSViews.clientPanel = function () {
  const client = QS.client;
  const latest = QS.history[0];
  const role = window.QSPreview?.getRole?.() || 'trainer';
  const canManageHistory = role === 'trainer' || role === 'trainer-admin';
  const historyCopy = [
    'Ból przy przysiadzie i wyproście kręgosłupa.',
    'Różnica między stronami w rotacji.',
    'Dobry punkt wyjścia.'
  ];
  const plan = [
    ['01', 'Chroń', 'Nie zwiększaj obciążenia w przysiadach ani w ruchach, które wywołują ból przy wyproście pleców.', 'protect'],
    ['02', 'Popraw', 'Wróć do swobodnego ruchu stopniowo, gdy ruch jest komfortowy.', 'improve'],
    ['03', 'Rozwijaj', 'Możesz zostać przy aktywności, która nie wywołuje ani nie nasila objawów.', 'develop'],
    ['↻', 'Sprawdź ponownie', 'Wróć do testu po ustąpieniu bólu i omów termin z trenerem.', 'retest']
  ];
  const historyActions = canManageHistory
    ? '<a class="btn btn-ghost btn-sm" href="#/assessment-details/demo">Podgląd</a><button class="btn btn-ghost btn-sm" type="button" data-action="toast" data-toast="Edycja badania jest prezentacyjna w tej makiecie.">Edytuj</button><button class="btn btn-ghost btn-sm client-history-delete" type="button" data-action="toast" data-kind="error" data-toast="Usuwanie badania jest prezentacyjne w tej makiecie.">Usuń</button>'
    : '<a class="btn btn-ghost btn-sm" href="#/assessment-details/demo">Podgląd</a>';

  return QSViews.layout(`<main class="role-dashboard client-dashboard client-dashboard-simple">
    <section class="client-simple-hero" aria-labelledby="client-simple-title">
      <div class="client-simple-copy">
        <span class="eyebrow">Twoja strefa ruchu · badanie ${latest.date}</span>
        <h1 id="client-simple-title">Cześć, ${client.name.split(' ')[0]}.</h1>
        <h2>Najpierw zajmij się bólem, potem wróć do pozostałych celów treningowych.</h2>
        <p>Ból pojawił się przy przysiadzie i wyproście kręgosłupa. To wynik do spokojnego omówienia — nie diagnoza.</p>
        <div class="client-simple-actions"><a class="btn btn-teal" href="#/report/demo">Zobacz raport <span aria-hidden="true">→</span></a></div>
      </div>
      <div class="client-simple-score"><span>Ostatni screening</span><strong>${latest.score}<small>/15</small></strong>${QSUI.status(latest.status, 'Do omówienia')}<small>${latest.date}</small></div>
    </section>

    <section class="client-simple-plan" aria-labelledby="client-plan-title">
      <header><div><span class="eyebrow">CO ROBIĆ TERAZ</span><h2 id="client-plan-title">Prosty plan</h2></div><span>Wskazówki po badaniu</span></header>
      <div class="client-plan-list">${plan.map(([number, title, text, tone]) => `<article class="client-plan-row ${tone}"><span class="client-plan-number">${number}</span><div><h3>${title}</h3><p>${text}</p></div></article>`).join('')}</div>
    </section>

    <section class="client-history-simple" aria-labelledby="client-history-title">
      <header><div><span class="eyebrow">HISTORIA</span><h2 id="client-history-title">Ostatnie badania</h2></div></header>
      <div class="client-history-list">${QS.history.slice(0, 3).map((item, index) => `<article class="client-history-item"><span class="history-dot ${item.status}" aria-hidden="true"></span><time>${item.date}</time><div class="client-history-summary"><b>Screening ruchowy</b><p>${historyCopy[index] || item.note}</p></div><strong>${item.score}<small>/15</small></strong><div class="client-history-actions">${historyActions}</div></article>`).join('')}</div>
    </section>
  </main>`, 'client-panel');
};

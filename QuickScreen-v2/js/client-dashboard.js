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

/* Jedna karta klienta dla klienta i trenera; różnią się wyłącznie uprawnienia. */
QSViews.profile = function (state, archived = false) {
  const role = window.QSPreview?.getRole?.() || 'trainer';
  const isClient = role === 'client';
  const canManage = role === 'trainer' || role === 'trainer-admin';
  const noHistory = state.path === '/client/new';
  const client = archived
    ? { ...QS.client, name: 'Piotr Archiwalny', initials: 'PA', email: 'p.archiwalny@example.com', archived: true }
    : QS.client;
  const backHref = isClient ? '#/client-panel' : '#/clients';
  const backText = isClient ? '← Mój panel' : '← Klienci';
  const primaryActions = canManage && !client.archived
    ? '<a class="btn btn-teal" href="#/assessment/demo/1">＋ Nowe badanie</a>'
    : '';
  const history = QS.history.map(item => {
    const statusText = item.status === 'pain' ? 'BÓL' : item.status === 'attention' ? 'UWAGA' : 'PASS';
    const management = canManage
      ? '<button class="btn btn-ghost btn-sm" type="button" data-action="toast" data-toast="Edycja badania jest prezentacyjna w tej makiecie.">Edytuj</button><button class="btn btn-ghost btn-sm client-history-delete" type="button" data-action="toast" data-kind="error" data-toast="Usuwanie badania jest prezentacyjne w tej makiecie.">Usuń</button>'
      : '';
    return `<article class="shared-profile-history-row"><time>${item.date}</time><span class="shared-profile-protocol">QuickScreen</span><strong>${item.score}<small>/15</small></strong>${QSUI.status(item.status, statusText)}<div class="shared-profile-history-actions"><a class="btn btn-ghost btn-sm" href="#/assessment-details/demo">Podgląd</a><a class="btn btn-ghost btn-sm" href="#/report/demo">Raport</a>${management}</div></article>`;
  }).join('');

  return QSViews.layout(`<main class="shared-client-profile role-dashboard">
    <header class="shared-profile-head">
      <div><a class="btn btn-ghost btn-sm" href="${backHref}">${backText}</a><span class="eyebrow">PROFIL KLIENTA</span><div class="shared-profile-name"><span class="initials">${client.initials}</span><div><h1>${client.name}</h1><p>${client.discipline} · ${client.club}</p></div></div></div>
      <div class="shared-profile-primary-actions">${primaryActions}</div>
    </header>

    ${noHistory ? `<section class="shared-profile-empty card"><span class="eyebrow">BADANIA</span><h2>Nie ma jeszcze badań</h2><p>Po pierwszym badaniu jego wynik i raport pojawią się tutaj.</p>${canManage ? '<a class="btn btn-teal" href="#/assessment/demo/1">＋ Rozpocznij badanie</a>' : ''}</section>` : `<section class="shared-profile-latest ${QS.history[0].status}" aria-labelledby="shared-profile-latest-title">
      <div class="shared-profile-section-title"><div><span class="eyebrow">NAJNOWSZY WYNIK</span><h2 id="shared-profile-latest-title">Badanie z ${QS.history[0].date}</h2></div><span class="shared-profile-latest-score">${QS.history[0].score}<small>/15</small></span></div>
      <div class="shared-profile-latest-meta"><span>QuickScreen</span>${QSUI.status(QS.history[0].status, QS.history[0].status === 'pain' ? 'BÓL' : QS.history[0].status === 'attention' ? 'UWAGA' : 'PASS')}</div>
      <div class="shared-profile-latest-actions"><a class="btn btn-outline" href="#/assessment-details/demo">Podgląd danych</a><a class="btn btn-teal" href="#/report/demo">Otwórz raport <span aria-hidden="true">→</span></a></div>
    </section>

    <section class="shared-profile-history" aria-labelledby="shared-profile-history-title">
      <header class="shared-profile-section-title"><div><span class="eyebrow">HISTORIA</span><h2 id="shared-profile-history-title">Badania</h2></div><span class="shared-profile-history-count">${QS.history.length} zapisane</span></header>
      <div class="shared-profile-table-head"><span>Data</span><span>Protokół</span><span>Wynik</span><span>Status</span><span>Akcje</span></div>
      <div class="shared-profile-history-list">${history}</div>
    </section>

    <section class="shared-profile-data" aria-labelledby="shared-profile-data-title">
      <header class="shared-profile-section-title"><div><span class="eyebrow">DANE</span><h2 id="shared-profile-data-title">Dane profilu</h2></div><button class="btn btn-ghost btn-sm" type="button" data-action="modal" data-modal="edit-client">Edytuj dane</button></header>
      <dl><div><dt>E-mail</dt><dd>${client.email}</dd></div><div><dt>Dyscyplina</dt><dd>${client.discipline}</dd></div><div><dt>Klub</dt><dd>${client.club}</dd></div><div><dt>Status profilu</dt><dd>${client.archived ? 'Archiwalny' : 'Aktywny'}</dd></div></dl>
    </section>
  </main>`, 'clients');
};

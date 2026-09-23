/* Dashboard klienta: spokojna decyzja po raporcie, nie panel diagnostyczny. */
QSViews.clientPanel = function () {
  const client = QS.client;
  const latest = QS.history[0];
  const historyCopy = [
    'Wynik do omówienia: ból pojawił się przy przysiadzie i wyproście kręgosłupa.',
    'Wcześniej widoczna była różnica między stronami w rotacji.',
    'To był dobry wynik bazowy.'
  ];
  const nextSteps = [
    ['01', 'Chroń', 'Na razie ogranicz', 'Nie zwiększaj obciążenia w przysiadach ani w ruchach, które wywołują ból przy wyproście pleców.', 'protect'],
    ['02', 'Popraw', 'Wróć do swobodnego ruchu', 'Nie próbuj „rozruszać” bólu na siłę. Omów objawy ze specjalistą i wracaj stopniowo, gdy ruch jest komfortowy.', 'improve'],
    ['03', 'Rozwijaj', 'Zostań przy bezbolesnej aktywności', 'Możesz wykonywać ćwiczenia, które nie wywołują ani nie nasilają objawów.', 'develop']
  ];
  return QSViews.layout(`<div class="role-dashboard client-dashboard client-dashboard-v2">
    <header class="client-welcome">
      <div><span class="eyebrow">Twoja strefa ruchu · badanie z ${latest.date}</span><h1>Cześć, ${client.name.split(' ')[0]}.</h1><p>Nie musisz analizować całego wyniku. Poniżej znajdziesz prostą kolejność działania na teraz.</p></div>
      <a class="client-profile-quiet" href="#/client/demo">Mój profil <span aria-hidden="true">→</span></a>
    </header>

    <section class="client-decision" aria-labelledby="client-decision-title">
      <div class="client-decision-copy">
        <span class="eyebrow">NAJWAŻNIEJSZE TERAZ</span>
        <h2 id="client-decision-title">Najpierw zajmij się bólem, potem wróć do pozostałych celów treningowych.</h2>
        <p>Podczas badania ból pojawił się przy przysiadzie i wyproście kręgosłupa. To sygnał do spokojnego omówienia wyniku — nie diagnoza.</p>
        <div class="client-decision-actions"><a class="btn btn-teal" href="#/report/demo">Zobacz pełny raport <span aria-hidden="true">→</span></a><a class="client-text-link" href="#/assessment-details/demo">Sprawdź wyniki testów</a></div>
      </div>
      <div class="client-score-status"><span>Ostatni screening</span><strong>${latest.score}<small>/15</small></strong>${QSUI.status(latest.status, 'Wymaga omówienia')}<small>${latest.date}</small></div>
    </section>

    <section class="client-action-plan" aria-labelledby="client-plan-title">
      <header class="client-section-heading"><div><span class="eyebrow">TWÓJ PLAN NA TERAZ</span><h2 id="client-plan-title">Trzy proste kroki</h2></div><span>Nie zastępuje konsultacji medycznej</span></header>
      <div class="client-next-steps">${nextSteps.map(([number, label, title, body, tone]) => `<article class="client-next-step ${tone}"><div class="client-step-marker"><span>${number}</span><b>${label}</b></div><h3>${title}</h3><p>${body}</p></article>`).join('')}</div>
      <aside class="client-retest"><span aria-hidden="true">↻</span><div><b>Kiedy sprawdzić postęp?</b><p>Wróć do testu po ustąpieniu bólu i odzyskaniu swobodnego ruchu. Termin ustal wspólnie z trenerem.</p></div><a href="#/report/demo">Przejdź do zaleceń <span aria-hidden="true">→</span></a></aside>
    </section>

    <div class="client-dashboard-grid">
      <section class="card client-history-card">
        <div class="card-head"><div><span class="eyebrow">POSTĘP</span><h2>Twoja historia</h2><p class="muted">Wynik pomaga śledzić zmianę, ale najważniejszy jest komfort i jakość ruchu.</p></div><a href="#/report/demo" class="client-inline-link">Porównaj raporty →</a></div>
        <div class="list">${QS.history.map((item, index) => `<div class="client-history-row"><span class="history-dot ${item.status}"></span><span><b>${item.date}</b><small>${historyCopy[index] || item.note}</small></span><strong>${item.score}<small>/15</small></strong><span aria-hidden="true">→</span></div>`).join('')}</div>
      </section>
      <section class="card client-records-card">
        <div class="card-head"><div><span class="eyebrow">PRZYGOTUJ ROZMOWĘ</span><h2>Twoje pytania i materiały</h2><p class="muted">Zapisz to, do czego chcesz wrócić podczas spotkania z trenerem.</p></div></div>
        <div class="client-record-actions">
          <button class="client-record-action" data-action="toast" data-toast="Dodawanie pytania jest prezentacyjne w makiecie."><b>?</b><span>Zapisz pytanie do trenera<small>Co chcesz wyjaśnić po raporcie?</small></span></button>
          <button class="client-record-action" data-action="toast" data-toast="Dodawanie materiału jest prezentacyjne w makiecie."><b>↗</b><span>Dodaj materiał<small>Dołącz dokument lub nagranie ruchu</small></span></button>
        </div>
        <a class="btn btn-soft client-profile-link" href="#/client/demo">Otwórz mój profil <span aria-hidden="true">→</span></a>
      </section>
    </div>
  </div>`, 'client-panel');
};

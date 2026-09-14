/* Dashboard klienta: decyzja na dziś, historia oraz narzędzia osobiste. */
QSViews.clientPanel = function () {
  const client = QS.client;
  const latest = QS.history[0];
  const historyCopy = [
    'W tym badaniu pojawił się ból prawego barku.',
    'Wcześniej widoczna była różnica między stronami w rotacji.',
    'To był dobry wynik bazowy.'
  ];
  return QSViews.layout(`<div class="role-dashboard client-dashboard">
    <div class="page-head client-page-head">
      <div><div class="eyebrow">Twoja strefa · ostatnie badanie ${latest.date}</div><h1>Twój kierunek na dziś</h1><p>Najważniejsze informacje, historia badań i materiały w jednym miejscu.</p></div>
      <a class="btn btn-outline" href="#/client/demo">Mój profil</a>
    </div>

    <section class="client-decision">
      <div class="client-decision-copy">
        <span class="eyebrow">Czy możesz trenować?</span>
        <h2>Możesz utrzymać aktywność, która nie prowokuje bólu.</h2>
        <p><b>Najważniejsze teraz:</b> najpierw zajmij się bólem szyi i barku i omów wynik indywidualnie 1:1.</p>
        <a class="btn btn-teal" href="#/report/demo?case=pain">Zobacz pełny raport →</a>
      </div>
      <div class="client-score-status"><span>Wynik pomocniczy</span><strong>${latest.score}<small>/15</small></strong>${QSUI.status(latest.status, 'Do omówienia')}</div>
    </section>

    <section class="client-next-steps" aria-label="Co zrobić po badaniu">
      <article class="client-next-step limit"><span>NA RAZIE OGRANICZ</span><h2>Ruchy, które odtwarzają ból</h2><p>Nie zwiększaj obciążenia w ruchach szyi ani w pozycjach barku nad głową i za plecami.</p></article>
      <article class="client-next-step continue"><span>MOŻESZ KONTYNUOWAĆ</span><h2>Bezbolesną aktywność</h2><p>Pozostałe elementy treningu możesz dalej wykonywać w zakresie, który kontrolujesz.</p></article>
      <article class="client-next-step next"><span>NASTĘPNY KROK</span><h2>Omów wynik 1:1</h2><p>Krótki test nie określa przyczyny bólu — przygotuj pytania do rozmowy z trenerem.</p></article>
    </section>

    <div class="client-dashboard-grid">
      <section class="card client-history-card">
        <div class="card-head"><div><span class="eyebrow">Historia</span><h2>Co zmienia się w czasie?</h2><p class="muted">Porównuj konkretne obserwacje, nie tylko sumę punktów.</p></div></div>
        <div class="list">${QS.history.map((item, index) => `<a class="client-history-row" href="#/report/demo?case=${index === 0 ? 'pain' : index === 1 ? 'history' : 'toe'}"><span class="history-dot ${item.status}"></span><span><b>${item.date}</b><small>${historyCopy[index] || item.note}</small></span><strong>${item.score}<small>/15</small></strong><span aria-hidden="true">→</span></a>`).join('')}</div>
      </section>
      <section class="card client-records-card">
        <div class="card-head"><div><span class="eyebrow">Twoje materiały</span><h2>Notatki i pliki</h2><p class="muted">Dodaj informacje, do których chcesz wrócić z trenerem.</p></div></div>
        <div class="client-record-actions">
          <button class="client-record-action" data-action="toast" data-toast="Dodawanie notatki jest prezentacyjne w makiecie."><b>＋</b><span>Dodaj notatkę<small>Zapisz pytanie lub obserwację</small></span></button>
          <button class="client-record-action" data-action="toast" data-toast="Dodawanie pliku jest prezentacyjne w makiecie."><b>↥</b><span>Dodaj plik<small>Dołącz dokument lub materiał</small></span></button>
        </div>
        <a class="btn btn-soft client-profile-link" href="#/client/demo">Otwórz dane profilu →</a>
      </section>
    </div>
  </div>`, 'client-panel');
};

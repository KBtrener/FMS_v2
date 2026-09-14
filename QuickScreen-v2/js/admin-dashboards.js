/* Proste dashboardy administracyjne: wejścia do pracy, nie centrum alertów. */
QSViews.adminPanel = function () {
  const activeClients = QS.clients.filter(client => !client.archived).length;
  const activeRules = QS.rules.filter(rule => rule.active).length;
  return QSViews.layout(`<div class="role-dashboard admin-dashboard">
    <div class="page-head admin-page-head"><div><div class="eyebrow">QuickScreen · administracja</div><h1>Utrzymanie workspace</h1><p>Zespół, dostęp i konfiguracja protokołu — bez mieszania ich z codzienną pracą trenera.</p></div><span class="badge badge-pass">System aktywny</span></div>
    <section class="admin-primary-actions" aria-label="Narzędzia administracyjne">
      <a class="btn btn-primary admin-primary-button" href="#/team"><span>♙</span><span><b>Zespół i dostęp</b><small>Osoby, role i uprawnienia workspace</small></span></a>
      <a class="btn btn-outline admin-primary-button" href="#/configuration"><span>⚙</span><span><b>Protokół QuickScreen</b><small>Testy, clearingi i reguły wyniku</small></span></a>
    </section>
    <div class="admin-overview">
      <section class="card"><span class="eyebrow">Stan workspace</span><div class="admin-metrics"><div><b>2</b><span>osoby w zespole</span></div><div><b>${activeClients}</b><span>aktywnych klientów</span></div><div><b>${QS.history.length}</b><span>zapisane badania</span></div></div></section>
      <section class="card admin-protocol-status"><span class="eyebrow">Aktywny protokół</span><h2>FMS QuickScreen</h2><p><b>9 elementów badania</b> · <b>${activeRules} reguły</b> · wersja bazy 4.2</p><a class="btn btn-soft btn-sm" href="#/configuration">Otwórz konfigurację →</a></section>
    </div>
  </div>`, 'admin-panel');
};

QSViews.trainerAdminPanel = function () {
  const recent = QS.history.slice(0, 3);
  const rawNotes = ['Ból barku po prawej stronie', 'Asymetria rotacji', 'Wynik bazowy'];
  return QSViews.layout(`<div class="role-dashboard trainer-admin-dashboard">
    <div class="page-head"><div><div class="eyebrow">QuickScreen · trener + admin</div><h1>Praca z klientami</h1><p>Najpierw badanie i surowe wyniki. Ustawienia administracyjne są dostępne poniżej.</p></div><a class="btn btn-primary" href="#/assessment">＋ Nowe badanie</a></div>
    <section class="trainer-admin-primary">
      <a class="btn btn-primary trainer-primary-button" href="#/assessment"><span>＋</span><span><b>Przeprowadź badanie</b><small>Wybierz klienta i rozpocznij QuickScreen</small></span></a>
      <a class="btn btn-outline trainer-primary-button" href="#/clients"><span>⌕</span><span><b>Otwórz klientów</b><small>Profile, historia i zapisane wyniki</small></span></a>
    </section>
    <section class="card trainer-admin-results"><div class="card-head"><div><span class="eyebrow">Ostatnie kompletne badania</span><h2>Surowe sygnały do przeglądu</h2><p class="muted">Bez automatycznej interpretacji — wynik jest punktem wyjścia do Twojej oceny.</p></div><a class="btn btn-ghost btn-sm" href="#/trainer-panel">Pełny workspace trenera</a></div><div class="trainer-admin-result-list">${recent.map((item, index) => { const client = QS.clients[index] || QS.client || {}; return `<a href="#/client/${client.id || 'demo'}"><span class="initials ${item.status}">${client.initials || 'KB'}</span><span><b>${client.name || 'Klient'}</b><small>${item.date} · ${rawNotes[index] || item.note}</small></span><strong>${item.score}<small>/15</small></strong><i>→</i></a>`; }).join('')}</div></section>
    <section class="trainer-admin-tools"><div><span class="eyebrow">Administracja</span><h2>Ustawienia workspace</h2><p>Użyj ich wtedy, gdy zmieniasz zespół lub protokół — nie są częścią codziennej oceny klienta.</p></div><div><a class="btn btn-soft" href="#/team">Zespół i dostęp</a><a class="btn btn-soft" href="#/configuration">Testy i reguły</a></div></section>
  </div>`, 'trainer-admin-panel');
};

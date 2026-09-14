const previewRoleKey = 'qs-preview-role';

const roleDefinitions = {
  client: {
    label: 'Klient',
    route: '#/client-panel',
    allowed: ['/client-panel', '/client/', '/assessment-details', '/report/'],
    menu: [['Mój panel', '#/client-panel'], ['Wyniki', '#/assessment-details/demo'], ['Raport', '#/report/demo'], ['Mój profil', '#/client/demo']]
  },
  trainer: {
    label: 'Trener',
    route: '#/trainer-panel',
    allowed: ['/trainer-panel', '/clients', '/client/', '/assessment', '/assessment-details', '/report/', '/trainer'],
    menu: [['Panel pracy', '#/trainer-panel'], ['Klienci', '#/clients'], ['Nowe badanie', '#/assessment'], ['Mój profil', '#/trainer']]
  },
  admin: {
    label: 'Admin',
    route: '#/admin-panel',
    allowed: ['/admin-panel', '/team', '/configuration', '/trainer'],
    menu: [['Panel administracji', '#/admin-panel'], ['Zespół', '#/team'], ['Konfiguracja', '#/configuration'], ['Mój profil', '#/trainer']]
  },
  'trainer-admin': {
    label: 'Trener + admin',
    route: '#/trainer-admin-panel',
    allowed: ['/trainer-admin-panel', '/clients', '/client/', '/assessment', '/assessment-details', '/report/', '/trainer', '/team', '/configuration'],
    menu: [['Panel łączony', '#/trainer-admin-panel'], ['Klienci', '#/clients'], ['Nowe badanie', '#/assessment'], ['Zespół', '#/team'], ['Konfiguracja', '#/configuration'], ['Mój profil', '#/trainer']]
  }
};

function getPreviewRole() {
  const saved = localStorage.getItem(previewRoleKey);
  return saved && roleDefinitions[saved] ? saved : 'trainer';
}

function routePath(route) {
  return route.replace(/^#/, '').split('?')[0].split('#')[0] || '/trainer-panel';
}

function isAllowed(role, route) {
  const path = routePath(route);
  return roleDefinitions[role].allowed.some(prefix => path === prefix || (prefix.endsWith('/') && path.startsWith(prefix)) || (!prefix.endsWith('/') && path.startsWith(`${prefix}/`)));
}

window.QSPreview = { getRole: getPreviewRole, isAllowed };

const previousShell = QSUI.shell;
QSUI.shell = function (content, active = 'clients') {
  const role = getPreviewRole();
  const definition = roleDefinitions[role];
  const currentPath = routePath(location.hash);
  const activeRoute = definition.menu.find(([, route]) => currentPath === routePath(route));
  const menu = `<details class="main-menu"><summary aria-label="Otwórz menu">Menu <span aria-hidden="true">⌄</span></summary><nav class="main-menu-panel" aria-label="Menu ${definition.label}">${definition.menu.map(([label, route]) => `<a class="${activeRoute?.[1] === route ? 'active' : ''}" href="${route}">${label}</a>`).join('')}</nav></details>`;
  const switcher = `<section class="preview-role-switch" aria-label="Podgląd roli w makiecie"><span>Podgląd roli</span><div>${Object.entries(roleDefinitions).map(([key, item]) => `<a class="${role === key ? 'active' : ''}" href="${item.route}" data-preview-role="${key}">${item.label}</a>`).join('')}</div></section>`;
  const profileLink = role === 'client'
    ? '<a class="avatar" href="#/client/demo" title="Mój profil">KB</a>'
    : '<a class="avatar" href="#/trainer" title="Mój profil">KB</a>';

  document.body.dataset.previewRole = role;
  const shell = previousShell.call(this, content, active)
    .replace(/<nav class="main-menu"[\s\S]*?<\/nav>/, menu)
    .replace(/<nav class="bottom-nav">[\s\S]*?<\/nav>/, '')
    .replace(/<button class="nav-fab"[\s\S]*?<\/button>/, '')
    .replace(/<a class="avatar" href="#\/trainer" title="Profil trenera">KB<\/a>/, profileLink)
    .replace('href="#/clients"', `href="${definition.route}"`)
    .replace('</header>', `</header>${switcher}`);

  if (!isAllowed(role, currentPath)) setTimeout(() => QSRouter.go(definition.route), 0);
  return shell;
};

document.addEventListener('click', event => {
  const control = event.target.closest('[data-preview-role]');
  if (!control) return;
  event.preventDefault();
  const role = control.dataset.previewRole;
  localStorage.setItem(previewRoleKey, role);
  QSRouter.go(roleDefinitions[role].route);
}, true);

QSViews.trainerPanel = function () {
  const activeClients = QS.clients.filter(client => !client.archived).length;
  const rawResults = [
    {client:'Gaweł Kot', initials:'GK', date:'07.09.2026', scores:['F: PASS · R: L PASS / P FAIL','L 1 · P 3','0 · clearing +','2','L 2 · P 1','L 0 · P 1'], status:'pain', route:'#/client/demo'},
    {client:'Anna Nowak', initials:'AN', date:'04.09.2026', scores:['F: PASS · R: PASS','L 1 · P 3','L 2 · P 2','2','L 3 · P 3','L 3 · P 3'], status:'attention', route:'#/client/anna'},
    {client:'Katarzyna Wiśniewska', initials:'KW', date:'15.08.2026', scores:['F: PASS · R: PASS','L 3 · P 3','L 2 · P 2','3','L 3 · P 2','L 3 · P 2'], status:'attention', route:'#/client/kasia'}
  ];
  return QSViews.layout(`<div class="role-dashboard trainer-dashboard trainer-workbench">
    <div class="page-head trainer-page-head">
      <div><div class="eyebrow">QuickScreen · workspace trenera</div><h1>Wyniki i protokół</h1><p>Surowe wyniki wspierają Twoją ocenę — aplikacja nie wybiera za Ciebie priorytetu pracy.</p></div>
      <div class="trainer-page-actions"><a class="btn btn-outline" href="#/clients">Klienci</a><a class="btn btn-primary" href="#/assessment">＋ Nowe badanie</a></div>
    </div>

    <section class="trainer-utility-bar">
      <div><b>${activeClients}</b><span>aktywnych klientów</span></div>
      <div><b>${QS.history.length}</b><span>zapisane badania demo</span></div>
      <div><b>9</b><span>elementów QuickScreen</span></div>
      <a href="#trainer-fms-rules">Zasady FMS / QuickScreen ↓</a>
    </section>

    <section class="card trainer-results-card">
      <div class="card-head"><div><span class="eyebrow">Ostatnie kompletne badania</span><h2>Surowe wyniki</h2><p class="muted">Wynik zapisany zgodnie z protokołem. Ocenę znaczenia i kolejność pracy ustala trener.</p></div><a class="btn btn-soft btn-sm" href="#/clients">Pełna lista klientów</a></div>
      <div class="trainer-results-scroll"><table class="trainer-results-table"><thead><tr><th>Klient / data</th><th>Szyja</th><th>Skłon</th><th>Bark</th><th>Przysiad</th><th>Równowaga</th><th>Rotacja</th><th></th></tr></thead><tbody>${rawResults.map(row => `<tr><td><span class="initials ${row.status}">${row.initials}</span><span><b>${row.client}</b><small>${row.date}</small></span></td>${row.scores.map(score => `<td>${score}</td>`).join('')}<td><a class="btn btn-ghost btn-sm" href="${row.route}">Profil</a></td></tr>`).join('')}</tbody></table></div>
      <footer class="trainer-table-note"><span class="trainer-status-key pain">0 / ból</span><span class="trainer-status-key attention">1 / różnica stron</span><span>Wyniki 2 i 3 nie są automatycznie problemem.</span></footer>
    </section>

    <div class="trainer-work-grid">
      <section class="card trainer-rules-card" id="trainer-fms-rules">
        <div class="card-head"><div><span class="eyebrow">Ściąga protokołu</span><h2>Zasady FMS / QuickScreen</h2><p class="muted">Reguły do zastosowania podczas interpretacji — nie automatyczna diagnoza.</p></div><span class="badge badge-info">wersja 4.2</span></div>
        <div class="trainer-rule-sections">
          <details open><summary><b>1. Ból ma pierwszeństwo</b><span>PROTECT</span></summary><p>Wynik 0, dodatni clearing lub ból szyi: zapisz bolesny obszar. Nie traktuj bezbolesnego wyniku jako ważniejszego problemu.</p></details>
          <details><summary><b>2. Wynik 1 i Fail</b><span>CORRECT</span></summary><p>Wynik 1 nie spełnia podstawowego standardu. Przy danych stron zawsze zachowaj zapis L / P.</p></details>
          <details><summary><b>3. Asymetria</b><span>PORÓWNAJ STRONY</span></summary><p>3/2 to różnica przy spełnionym standardzie; 2/1 i 3/1 wskazują stronę, która go nie spełnia. Wynik 1/1 nie jest asymetrią.</p></details>
          <details><summary><b>4. Kolejność przeglądu</b><span>HIERARCHIA</span></summary><p>Cervical → Toe Touch → Shoulder Mobility → Squat → Balance → Rotation.</p></details>
        </div>
      </section>
      <section class="card trainer-actions-card">
        <div class="card-head"><div><span class="eyebrow">Praca z klientem</span><h2>Badania</h2></div></div>
        <a class="trainer-action-link primary" href="#/assessment"><b>＋</b><span>Przeprowadź nowe badanie<small>Wybierz klienta i rozpocznij testy</small></span></a>
        <a class="trainer-action-link" href="#/assessment/demo/6"><b>↻</b><span>Wznów zapisany szkic<small>Gaweł Kot · Shoulder Clearing</small></span></a>
        <a class="trainer-action-link" href="#/clients?modal=new"><b>＋</b><span>Dodaj klienta<small>Utwórz profil przed badaniem</small></span></a>
        <div class="trainer-method-note"><b>Przypomnienie</b><p>QuickScreen jest badaniem przesiewowym. Wynik pokazuje obserwację, nie przyczynę ograniczenia ani diagnozę.</p></div>
      </section>
    </div>
  </div>`, 'trainer-panel');
};

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
  const recent = QS.history.slice(0, 3);
  return QSViews.layout(`<div class="role-dashboard trainer-dashboard"><div class="page-head"><div><div class="eyebrow">QuickScreen · trener</div><h1>Twoja praca</h1><p>Rozpocznij badanie albo dodaj nowego klienta.</p></div></div><section class="trainer-primary-actions" aria-label="Najważniejsze działania"><a class="btn btn-primary trainer-primary-button" href="#/assessment"><span>＋</span><span><b>Nowe badanie</b><small>Wybierz klienta i przejdź do wizarda</small></span></a><a class="btn btn-outline trainer-primary-button" href="#/clients?modal=new"><span>＋</span><span><b>Nowy klient</b><small>Dodaj profil przed rozpoczęciem badania</small></span></a></section><div class="grid-2 trainer-summary"><section class="card stat"><span>Klienci</span><strong>${QS.clients.filter(client => !client.archived).length}</strong><span>aktywnych profili</span></section><section class="card stat"><span>Wykonane badania</span><strong>${QS.history.length}</strong><span>łącznie w systemie</span></section></div><section class="card trainer-recent"><div class="card-head"><div><span class="eyebrow">Ostatnio badani</span><h2>Ostatnie osoby</h2></div><a class="btn btn-ghost btn-sm" href="#/clients">Wszyscy klienci</a></div><div class="list">${recent.map((item, index) => { const client = QS.clients[index] || QS.client; return `<a class="list-row trainer-recent-row" href="#/client/${client.id || 'demo'}"><span class="initials">${client.initials || 'KB'}</span><span><b>${client.name || QS.client.name}</b><small>${item.date} · wynik ${item.score}/15</small></span><strong>→</strong></a>`; }).join('')}</div></section></div>`, 'trainer-panel');
};

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

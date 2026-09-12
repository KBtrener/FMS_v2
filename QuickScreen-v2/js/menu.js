const previewRoleKey = 'qs-preview-role';
const roleDefinitions = {
  client: {
    label: 'Klient',
    route: '#/client-panel',
    allowed: ['/client-panel', '/client/', '/assessment-details', '/report/'],
    items: [
      ['Start', 'Dashboard klienta', '#/client-panel', 'Twój podgląd postępów i wyników'],
      ['Wyniki', 'Mój profil', '#/client/demo', 'Dane profilu i historia badań'],
      ['Wyniki', 'Szczegóły wyniku', '#/assessment-details/demo', 'Pełne wyniki ostatniego badania'],
      ['Wyniki', 'Raport', '#/report/demo', 'Podgląd raportu screeningowego']
    ],
    bottom: [['Start', '⌂', '#/client-panel'], ['Profil', '◉', '#/client/demo'], ['Wynik', '◌', '#/assessment-details/demo']]
  },
  trainer: {
    label: 'Trener',
    route: '#/trainer-panel',
    allowed: ['/trainer-panel', '/clients', '/client/', '/assessment', '/assessment-details', '/report/', '/trainer'],
    items: [
      ['Praca', 'Klienci', '#/clients', 'Profile i historia klientów'],
      ['Praca', 'Badanie', '#/assessment', 'Rozpocznij screening ruchowy'],
      ['Praca', 'Dashboard trenera', '#/trainer-panel', 'Priorytety i aktywność workspace'],
      ['Konto', 'Profil trenera', '#/trainer', 'Dane i certyfikacje']
    ],
    bottom: [['Klienci', '♧', '#/clients'], ['Badanie', '⊕', '#/assessment'], ['Profil', '◉', '#/trainer']]
  },
  admin: {
    label: 'Admin',
    route: '#/admin-panel',
    allowed: ['/admin-panel', '/team', '/configuration', '/trainer'],
    items: [
      ['Administracja', 'Dashboard administratora', '#/admin-panel', 'Stan workspace i audyt'],
      ['Administracja', 'Zespół i role', '#/team', 'Członkowie oraz zaproszenia'],
      ['Administracja', 'Konfiguracja', '#/configuration', 'Testy i reguły clearingu'],
      ['Konto', 'Profil trenera', '#/trainer', 'Dane właściciela i certyfikacje']
    ],
    bottom: [['Dashboard', '⌂', '#/admin-panel'], ['Zespół', '♧', '#/team'], ['Konfiguracja', '☷', '#/configuration']]
  },
  'trainer-admin': {
    label: 'Trener + admin',
    route: '#/trainer-admin-panel',
    allowed: ['/trainer-admin-panel', '/clients', '/client/', '/assessment', '/assessment-details', '/report/', '/trainer', '/team', '/configuration'],
    items: [
      ['Praca', 'Klienci', '#/clients', 'Profile i historia klientów'],
      ['Praca', 'Badanie', '#/assessment', 'Rozpocznij screening ruchowy'],
      ['Praca', 'Dashboard łączony', '#/trainer-admin-panel', 'Widok trenera i administratora'],
      ['Administracja', 'Zespół i role', '#/team', 'Członkowie oraz zaproszenia'],
      ['Administracja', 'Konfiguracja', '#/configuration', 'Testy i reguły clearingu'],
      ['Konto', 'Profil trenera', '#/trainer', 'Dane i certyfikacje']
    ],
    bottom: [['Klienci', '♧', '#/clients'], ['Zespół', '♙', '#/team'], ['Konfiguracja', '☷', '#/configuration']]
  }
};

function getPreviewRole() {
  const saved = localStorage.getItem(previewRoleKey);
  return saved && roleDefinitions[saved] ? saved : 'trainer';
}

function setPreviewRole(role) {
  if (roleDefinitions[role]) localStorage.setItem(previewRoleKey, role);
}

function routePath(route) {
  return route.replace(/^#/, '').split('?')[0].split('#')[0] || '/clients';
}

function isAllowed(role, route) {
  const path = routePath(route);
  return roleDefinitions[role].allowed.some(prefix => path === prefix || (prefix.endsWith('/') && path.startsWith(prefix)) || (!prefix.endsWith('/') && path.startsWith(`${prefix}/`)));
}

const previousShell = QSUI.shell;
QSViews.trainerAdminPanel = function () {
  return QSViews.adminPanel().replace('Administracja · QuickScreen', 'Tryb łączony · QuickScreen').replace('Panel administratora', 'Panel trenera + administratora').replace('Administrator', 'Trener + admin');
};

QSUI.shell = function (content, active = 'clients') {
  const role = getPreviewRole();
  const definition = roleDefinitions[role];
  const current = location.hash;
  const currentPath = routePath(current);

  if (!isAllowed(role, currentPath)) setTimeout(() => QSRouter.go(definition.route), 0);

  const switcher = `<section class="preview-role-switch" aria-label="Wybór widoku makiety"><span>Podgląd jako</span><div>${Object.entries(roleDefinitions).map(([key, item]) => `<a class="${role === key ? 'active' : ''}" href="${item.route}" data-preview-role="${key}">${item.label}</a>`).join('')}</div></section>`;
  const grouped = definition.items.reduce((groups, [group, label, route, description]) => {
    (groups[group] ??= []).push([label, route, description]);
    return groups;
  }, {});
  const menu = `<details class="main-menu"><summary>Menu <span aria-hidden="true">⌄</span></summary><div class="main-menu-panel">${Object.entries(grouped).map(([title, links]) => `<div class="main-menu-group"><span>${title}</span>${links.map(([label, route, description]) => `<a class="${current.includes(route.replace('#', '')) ? 'active' : ''}" href="${route}"><b>${label}</b><small>${description}</small></a>`).join('')}</div>`).join('')}</div></details>`;
  const bottom = `<nav class="bottom-nav"><div class="bottom-nav-inner">${definition.bottom.map(([label, icon, route]) => `<a class="nav-item" href="${route}"><span class="icon">${icon}</span>${label}</a>`).join('')}</div></nav>`;

  document.body.dataset.previewRole = role;
  return previousShell.call(this, content, active)
    .replace(/<nav class="main-menu">[\s\S]*?<\/nav>/, menu)
    .replace(/<nav class="bottom-nav">[\s\S]*?<\/nav>/, bottom)
    .replace(/<button class="nav-fab"[\s\S]*?<\/button>/, '')
    .replace('</header>', `</header>${switcher}`);
};

document.addEventListener('click', event => {
  const control = event.target.closest('[data-preview-role]');
  if (control) setPreviewRole(control.dataset.previewRole);
}, true);

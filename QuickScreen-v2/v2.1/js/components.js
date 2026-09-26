(() => {
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
    clients: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-6A3.5 3.5 0 0 0 3 18.5V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M17 4.3a3.5 3.5 0 0 1 0 6.8M17 15h.5a3.5 3.5 0 0 1 3.5 3.5V20"/></svg>',
    assessment: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4.5" width="14" height="17" rx="2"/><path d="M9 4.5v-1h6v1M12 9v7M8.5 12.5h7"/></svg>',
    guide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V5.5a1 1 0 0 1 1-1Z"/><path d="M9 8h6"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-1.5a7 7 0 0 1 14 0V21"/></svg>'
  };
  const navigation = [
    { id: 'dashboard', label: 'Panel pracy', mobile: 'Panel', href: '#/trainer-panel', icon: icons.dashboard, active: ['trainer-panel', 'client-panel'] },
    { id: 'clients', label: 'Klienci', mobile: 'Klienci', href: '#/clients', icon: icons.clients, active: ['clients'] },
    { id: 'assessment', label: 'Nowe badanie', mobile: 'Badanie', href: '#/assessment', icon: icons.assessment, active: ['assessment'] },
    { id: 'guide', label: 'Ściąga', mobile: 'Ściąga', href: '#/cheat-sheet', icon: icons.guide, active: ['cheat-sheet'] },
    { id: 'profile', label: 'Mój profil', mobile: 'Profil', href: '#/trainer', icon: icons.profile, active: ['trainer'] }
  ];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
  const status = (kind, label) => {
    const meta = {
      pass: { mark: '✓', label: label || 'Wynik prawidłowy', shape: 'circle' },
      attention: { mark: '!', label: label || 'Wymaga uwagi', shape: 'triangle' },
      pain: { mark: '!', label: label || 'Wynik nieprawidłowy', shape: 'circle' },
      info: { mark: 'i', label: label || 'Informacja', shape: 'circle' },
      neutral: { mark: '·', label: label || 'Brak wyniku', shape: 'circle' }
    }[kind] || { mark: 'i', label: label || 'Informacja', shape: 'circle' };
    const cssKind = kind === 'attention' ? 'attention' : kind === 'pain' ? 'pain' : kind === 'pass' ? 'pass' : kind === 'neutral' ? 'neutral' : 'info';
    const shape = meta.shape === 'triangle'
      ? '<svg viewBox="0 0 18 18" focusable="false"><path d="M9 2.1 16 15.5H2L9 2.1Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 6v4.3M9 12.4v.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 18 18" focusable="false"><circle cx="9" cy="9" r="7.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="' + (meta.mark === '✓' ? 'm5.5 9.1 2.2 2.2 4.8-5' : meta.mark === '!' ? 'M9 5.4v4.2M9 12.2v.1' : 'M9 5.4v.1M9 8v4.6') + '" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<span class="status-icon ' + cssKind + '" role="img" aria-label="' + esc(meta.label) + '" title="' + esc(meta.label) + '">' + shape + '</span>';
  };
  function shell(content, active = 'clients') {
    const links = navigation.map(item => {
      const isActive = item.active.includes(active);
      return '<a class="main-menu-link' + (isActive ? ' active' : '') + '" href="' + item.href + '"' + (isActive ? ' aria-current="page"' : '') + '>' + item.label + '</a>';
    }).join('');
    const tabs = navigation.map(item => {
      const isActive = item.active.includes(active);
      return '<a class="nav-item' + (isActive ? ' active' : '') + '" href="' + item.href + '"' + (isActive ? ' aria-current="page"' : '') + '>' + item.icon + '<span>' + item.mobile + '</span></a>';
    }).join('');
    const isClient = active === 'client-panel';
    const account = isClient ? (window.QS?.client?.name || 'Klient') : (window.QS?.trainer?.name || 'Trener');
    const initials = isClient ? (window.QS?.client?.initials || 'K') : 'KB';
    const logo = 'assets/logo/kb-logo.png';
    return '<header class="topbar"><div class="topbar-inner"><a class="brand" href="#/trainer-panel" aria-label="QuickScreen — panel pracy"><img class="brand-logo" src="' + logo + '" alt="KB Trener"></a><nav class="main-menu" aria-label="Główna nawigacja">' + links + '</nav><div class="top-actions"><span class="avatar-name">' + esc(account) + '</span><a class="avatar" href="' + (isClient ? '#/client-panel' : '#/trainer') + '" aria-label="Profil: ' + esc(account) + '">' + esc(initials.slice(0, 2).toUpperCase()) + '</a></div></div></header>' + content + '<nav class="bottom-nav" aria-label="Główna nawigacja mobilna"><div class="bottom-nav-inner">' + tabs + '</div></nav>';
  }
  window.QSUI = {
    esc,
    status,
    shell,
    page(content, active) { return shell('<main class="shell-main">' + content + '</main>', active); },
    card(title, body, actions = '') { return '<section class="card"><div class="card-head"><h2>' + title + '</h2>' + actions + '</div>' + body + '</section>'; },
    modal(title, body) { return '<div class="modal-backdrop" data-close-overlay><div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="modal-head"><h2>' + title + '</h2><button class="close" data-action="close-overlay" aria-label="Zamknij">×</button></div>' + body + '</div></div>'; },
    sheet(title, body) { return '<div class="sheet-backdrop" data-close-overlay><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="sheet-grab"></div><div class="modal-head"><h2>' + title + '</h2><button class="close" data-action="close-overlay" aria-label="Zamknij">×</button></div>' + body + '</div></div>'; },
    toast(text, kind = 'success') { return '<div class="toast" role="status">' + (kind === 'error' ? '!' : '✓') + ' ' + esc(text) + '</div>'; }
  };
})();

window.QSUI={
 esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))},
 status(status,label){const map={pass:['✓','badge-pass',label||'W normie'],attention:['!','badge-attention',label||'Uwaga / asymetria'],pain:['!','badge-pain',label||'Ból / red flag'],info:['i','badge-info',label||'Informacja'],neutral:['•','badge-neutral',label||'Archiwalny']};const [i,c,t]=map[status]||map.info;return `<span class="badge ${c}">${i} ${t}</span>`},
 shell(content,active='clients'){return `<header class="topbar"><div class="topbar-inner"><a class="brand" href="#/clients"><img class="brand-logo" src="/quick-screen-v2/assets/logo/kb-logo.png?v=20260913" alt="KB Trener"><span class="brand-copy"><strong>KB Trener</strong><small><b>QuickScreen</b> · zapisano lokalnie</small></span><span class="module">QuickScreen <span>▾</span></span></a><div class="top-actions"><span class="cloud">☁</span><a class="avatar" href="#/trainer" title="Profil trenera">KB</a></div></div></header>${content}<nav class="bottom-nav"><div class="bottom-nav-inner">${[['clients','♧','Klienci','#/clients'],['assessment','⊕','Badanie','#/assessment'],['config','☷','Konfiguracja','#/configuration']].map(x=>`<a class="nav-item ${active===x[0]?'active':''}" href="${x[3]}"><span class="icon">${x[1]}</span>${x[2]}</a>`).join('')}</div></nav><button class="nav-fab" data-action="navigator" aria-label="Prototype Navigator">⌘</button>`},
 page(content,active){return this.shell(`<main class="shell-main">${content}</main>`,active)},
 card(title,body,actions=''){return `<section class="card"><div class="card-head"><h2>${title}</h2>${actions}</div>${body}</section>`},
 modal(title,body){return `<div class="modal-backdrop" data-close-overlay><div class="modal" role="dialog"><div class="modal-head"><h2>${title}</h2><button class="close" data-action="close-overlay">×</button></div>${body}</div></div>`},
 sheet(title,body){return `<div class="sheet-backdrop" data-close-overlay><div class="sheet"><div class="sheet-grab"></div><div class="modal-head"><h2>${title}</h2><button class="close" data-action="close-overlay">×</button></div>${body}</div></div>`},
 toast(text,kind='success'){return `<div class="toast">${kind==='error'?'!':'✓'} ${text}</div>`}
};
const baseShell=QSUI.shell;
QSUI.shell=function(content,active='clients'){
 const menu=[['clients','Klienci','#/clients'],['assessment','Badanie','#/assessment'],['client-panel','Dashboard klienta','#/client-panel'],['trainer-panel','Panel trenera','#/trainer-panel'],['admin-panel','Panel administratora','#/admin-panel'],['config','Konfiguracja','#/configuration'],['trainer','Profil trenera','#/trainer']];
 const menuMarkup=`<nav class="main-menu" aria-label="Główne menu">${menu.map(x=>`<a class="main-menu-link ${active===x[0]?'active':''}" href="${x[2]}">${x[1]}</a>`).join('')}</nav>`;
 return baseShell.call(this,content,active).replace(/<span class="brand-copy">.*?<\/span>/,'').replace(/<span class="module">[\s\S]*?<\/span><\/span>/,'').replace('<div class="top-actions">',`${menuMarkup}<div class="top-actions">`);
};

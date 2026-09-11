const previousShell=QSUI.shell;
QSUI.shell=function(content,active='clients'){
 const groups=[['Praca',[['Klienci','#/clients','Przegląd profili i historii'],['Badanie','#/assessment','Rozpocznij screening ruchowy']]],['Dashboardy',[['Dashboard klienta','#/client-panel','Postępy i wyniki klienta'],['Panel trenera','#/trainer-panel','Codzienna praca z klientami'],['Panel administratora','#/admin-panel','Zespół, role i kontrola systemu']]],['Ustawienia',[['Konfiguracja','#/configuration','Testy i reguły clearingu'],['Profil trenera','#/trainer','Dane i certyfikacje']]]];
 const organized=`<details class="main-menu"><summary>Menu <span aria-hidden="true">⌄</span></summary><div class="main-menu-panel">${groups.map(([title,links])=>`<div class="main-menu-group"><span>${title}</span>${links.map(([label,route,description])=>`<a href="${route}"><b>${label}</b><small>${description}</small></a>`).join('')}</div>`).join('')}</div></details>`;
 return previousShell.call(this,content,active).replace(/<nav class="main-menu"[\s\S]*?<\/nav>/,organized);
};

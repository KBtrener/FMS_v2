/* Snapshot of the current configured QuickScreen catalog. It is presentation-only. */
QS.tests=[
 {code:'cervical_flexion',name:'Cervical Flexion',type:'mixed',side:'none',parent:null,instruction:'Ocena zakresu zgięcia szyi oraz obecności bólu.'},
 {code:'cervical_rotation_extension',name:'Cervical Rotation and Extension',type:'mixed-bilateral',side:'bilateral',parent:null,instruction:'Dla każdej strony oceń zakres rotacji i ból.'},
 {code:'neck_extension_clearing',name:'Neck Extension Clearing',type:'pain-bilateral',side:'bilateral',parent:'Cervical Rotation and Extension',instruction:'Po rotacji wykonaj delikatny wyprost szyi i zapisz ból osobno dla stron.'},
 {code:'toe_touch',name:'Toe Touch',type:'score-bilateral',side:'bilateral',parent:null,instruction:'Oceń zgięcie w pozycji wykrocznej. Wynik końcowy to niższa strona.' ,image:true},
 {code:'shoulder_mobility',name:'Shoulder Mobility',type:'score-bilateral',side:'bilateral',parent:null,instruction:'Oceń wzorzec ruchomości barków po obu stronach.'},
 {code:'shoulder_clearing',name:'Shoulder Clearing',type:'clearing-bilateral',side:'bilateral',parent:'Shoulder Mobility',instruction:'Sprawdź wzorzec górny i dolny, zakres oraz ból po obu stronach.'},
 {code:'rotation',name:'Rotation',type:'score-bilateral',side:'bilateral',parent:null,instruction:'Oceń rotację całego ciała po lewej i prawej stronie.'},
 {code:'balance',name:'Balance',type:'score-bilateral',side:'bilateral',parent:null,instruction:'Oceń równowagę na lewej i prawej nodze podporowej.'},
 {code:'squat',name:'Squat',type:'score-single',side:'none',parent:null,instruction:'Oceń przysiad bez przypisania do strony.'},
 {code:'spine_extension_clearing',name:'Spine Extension Clearing',type:'pain-single',side:'none',parent:'Squat',instruction:'Wykonaj wyprost kręgosłupa i zapisz Brak bólu albo Ból.'}
];

QSViews.assessment=function(state){
 const n=Math.max(1,Math.min(QS.tests.length,Number((state.path.match(/\/(\d+)$/)||[])[1]||1))),t=QS.tests[n-1];
 const options=(label,items,selected=0)=>`<div class="selector"><span class="selector-title">${label}</span><div class="options">${items.map((x,i)=>`<button class="option ${i===selected?'selected ':''}${x[1]||''}" data-action="select">${x[0]}</button>`).join('')}</div></div>`;
 const score=()=>options('Score 0–3',[['0 · Ból','pain'],['1 · Słabo','fail'],['2 · W normie','pass'],['3 · Super!','pass']],1);
 const pass=()=>options('Zakres ruchu',[['✓ Pass','pass'],['× Fail','fail']],0);
 const pain=()=>options('Objawy bólowe',[['☺ Brak bólu','pass'],['! Ból','pain']],0);
 const fields=t.type==='mixed'?`${pass()}${pain()}`:t.type==='mixed-bilateral'?`${pass()}${pain()}`:t.type==='score-bilateral'||t.type==='score-single'?score():t.type==='clearing-bilateral'?`${options('Wzorzec górny',[['✓ Brak bólu','pass'],['! Ból','pain']],0)}${options('Wzorzec dolny',[['✓ Brak bólu','pass'],['! Ból','pain']],0)}${options('Zakres · dodatkowa obserwacja',[['✓ Pass','pass'],['× Fail','fail']],0)}`:pain();
 const side=(name,letter)=>`<div class="side"><h3><span>${letter}</span>${name}</h3>${fields}</div>`;
 const body=t.side==='bilateral'?`<div class="sides">${side('Lewa strona','L')}${side('Prawa strona','P')}</div>`:fields;
 const parent=t.parent?`<div class="status-line info">i Clearing powiązany z testem nadrzędnym: <b>${t.parent}</b>. Wynik tego testu jest zapisywany osobno.</div>`:'';
 const content=`<div class="wizard-shell"><div class="wizard-top"><div class="wizard-client"><span class="initials">GK</span><span class="wizard-title"><strong>Gaweł Kot</strong><br>07.09.2026 · <span class="badge badge-info">Szkic demonstracyjny</span></span></div><button class="btn btn-ghost" data-route="#/client/demo">× Zamknij</button></div><section class="card wizard-progress-card"><div class="card-head"><div><h2>Test ${n} z ${QS.tests.length}</h2><p class="tiny muted">${t.name}</p></div><b class="teal-text">${Math.round(n/QS.tests.length*100)}%</b></div><div class="stepper">${QS.tests.map((x,i)=>`<button class="step ${i+1===n?'active':i+1<n?'done':''}" data-route="#/assessment/demo/${i+1}">${i+1}<small>${x.name}</small></button>`).join('')}</div></section><section class="card wizard-card"><div class="wizard-heading"><div><div class="eyebrow">${t.parent?'Clearing testu nadrzędnego':'Etap '+n+' / '+QS.tests.length}</div><h1>${t.name}</h1><p>${t.instruction}</p></div><button class="btn btn-soft btn-sm" data-action="criteria">▤ Kryteria</button></div><figure class="instruction">${t.image?'<img src="assets/tests/toe-touch-instruction.jpg" alt="Instrukcja Toe Touch">':'<span class="diagram">◌</span>'}<figcaption>Instrukcja demonstracyjna · odpowiedzi nie są zapisywane</figcaption></figure>${parent}${body}<div class="field"><label>Notatka do testu · opcjonalnie</label><textarea class="textarea" placeholder="Obserwacje, kompensacje lub uwagi…"></textarea></div><div class="status-line ${t.type.includes('pain')||t.type.includes('clearing')?'attention':'pass'}">✓ Stan demonstracyjny odpowiedzi · gotowe do przejścia dalej</div></section><div class="action-bar"><button class="btn btn-soft" data-route="#/assessment/demo/${Math.max(1,n-1)}">← Wstecz</button><button class="btn btn-teal" data-route="#/assessment/demo/${n<QS.tests.length?n+1:n}">${n===QS.tests.length?'Zakończ badanie':'Dalej: '+(QS.tests[n]?.name||'Podsumowanie')} →</button></div></div>`;
 return QSViews.layout(content,'assessment');
};

const detailsWithSideResults=QSViews.details;
QSViews.details=function(state){
 const html=detailsWithSideResults.call(QSViews,state);
 const scoreValues=[1,2,0,1,0,1,0,1,0];
 return html.replace(/(<div class="matrix-row"><span><b>[^<]+<\/b><br><small class="muted">)[^<]+(<\/small><\/span><strong>)[^<]+(<\/strong>)/g,(match,prefix,middle,suffix)=>{
  const number=Number((match.match(/<b>(\d+)\./)||[])[1]);
  const test=QS.tests[number-1];
  if(!test || test.side!=='bilateral') return match.replace('Ocena testu','Wynik testu');
  let sides;
  if(test.type==='score-bilateral') sides=[`${scoreValues[number-1]}/3`,`${[2,1,1,2,1,0,1,1,0][number-1]}/3`];
  else if(test.type==='pain-bilateral') sides=['Brak bólu','Ból'];
  else if(test.type==='clearing-bilateral') sides=['2/4','1/4'];
  else sides=['Pass','Fail'];
  return `${prefix}Lewa strona · Prawa strona${middle}<span class="matrix-side-results"><span>Lewa strona: ${sides[0]}</span><span>Prawa strona: ${sides[1]}</span></span>${suffix}`;
 });
};

const profileWithoutHistoryNotes=QSViews.profile;
QSViews.profile=function(state,archived=false){
 return profileWithoutHistoryNotes.call(QSViews,state,archived)
  .replace(/(<div class="list-row"><div><b>[^<]+<\/b>)<p class="tiny muted">[^<]*<\/p>/g,'$1');
};

const finalQuietWizard=QSViews.assessment;
QSViews.assessment=function(state){
 return finalQuietWizard(state)
  .replace(/<span class="badge badge-info">Szkic(?: demonstracyjny)?<\/span>/g,'')
  .replace(/<div class="status-line (?:pass|attention)">[^<]*(?:Stan demonstracyjny odpowiedzi|Komplet odpowiedzi)[\s\S]*?<\/div>/g,'')
  .replace(/<div class="status-line info">i Clearing powiązany z testem nadrzędnym:[\s\S]*?<\/div>/g,'');
};

const quietWizard=QSViews.assessment;
QSViews.assessment=function(state){
 return quietWizard(state)
  .replace(/<span class="badge badge-info">Szkic(?: demonstracyjny)?<\/span>/g,'')
  .replace(/<div class="status-line (?:pass|attention)">[^<]*(?:Stan demonstracyjny odpowiedzi|Komplet odpowiedzi)[\s\S]*?<\/div>/g,'')
  .replace(/<div class="status-line info">i Clearing powiązany z testem nadrzędnym:[\s\S]*?<\/div>/g,'');
};

QSViews.clientPanel=function(){const c=QS.client;return QSViews.layout(`<div class="page-head"><div><div class="eyebrow">KB Trener / panel klienta</div><h1>Panel klienta</h1><p>Przegląd jednego profilu, badań, trendu i dokumentacji.</p></div><a class="btn btn-teal" href="#/assessment/demo/1">＋ Nowe badanie</a></div><section class="card profile-hero"><div class="profile-person"><span class="initials">${c.initials}</span><div><h1>${c.name}</h1><p>${c.email} · ${c.discipline} · ${c.club}</p>${QSUI.status('pain','Ból / red flag')}</div></div><div class="score-hero"><div><span class="eyebrow">Ostatni wynik</span><strong>5<small> /15</small></strong></div></div></section><div class="grid-3"><section class="card stat"><span>Kompletne badania</span><strong>3</strong><span>ostatnie 90 dni</span></section><section class="card stat"><span>Asymetrie</span><strong>2</strong><span>do obserwacji</span></section><section class="card stat"><span>Clearing effects</span><strong>2</strong><span>powiązane testy</span></section></div><section class="card"><div class="card-head"><h2>Ostatnie wyniki</h2><a class="btn btn-soft btn-sm" href="#/assessment-details/demo">Szczegóły</a></div><div class="test-matrix">${QS.tests.map((t,i)=>`<div class="matrix-row"><span><b>${i+1}. ${t.name}</b><br><small class="muted">${t.type}</small></span><strong>${t.parent?'Powiązany':i%2?'Pass':'1 /3'}</strong>${QSUI.status(t.parent?'attention':i===4?'pain':'pass')}</div>`).join('')}</div></section>`, 'clients')};
QSViews.trainerPanel=function(){return QSViews.layout(`<div class="page-head"><div><div class="eyebrow">KB Trener / workspace</div><h1>Panel trenera</h1><p>Codzienny przegląd klientów, badań i skrótów pracy.</p></div><a class="btn btn-outline" href="#/trainer">Profil trenera</a></div><div class="grid-3"><section class="card stat"><span>Aktywni klienci</span><strong>24</strong><span>+3 w tym miesiącu</span></section><section class="card stat"><span>Badania w toku</span><strong>2</strong><span>szkice lokalne</span></section><section class="card stat"><span>Raporty</span><strong>12</strong><span>snapshotów</span></section></div><div class="grid-2"><section class="card"><div class="card-head"><h2>Ostatnia aktywność</h2><span class="badge badge-info">Dzisiaj</span></div><div class="list"><div class="list-row"><div><b>Gaweł Kot</b><p class="tiny muted">Shoulder Clearing · szkic</p></div><a class="btn btn-soft btn-sm" href="#/assessment/demo/6">Wznów</a></div><div class="list-row"><div><b>Anna Nowak</b><p class="tiny muted">Badanie kompletne · 13/15</p></div><a class="btn btn-soft btn-sm" href="#/client/anna">Profil</a></div></div></section><section class="card"><div class="card-head"><h2>Szybkie przejścia</h2></div><div class="stack"><a class="btn btn-primary" href="#/clients">Lista klientów</a><a class="btn btn-soft" href="#/client-panel">Panel klienta</a><a class="btn btn-soft" href="#/configuration">Konfiguracja protokołu</a><button class="btn btn-danger" data-action="toast" data-toast="Wylogowanie jest nieaktywne w makiecie.">Wyloguj</button></div></section></div>`, 'clients')};
QSViews.adminPanel=function(){return QSViews.layout(`<div class="page-head"><div><div class="eyebrow">KB Trener / administracja</div><h1>Panel administratora</h1><p>Kontrola zespołu, protokołu i reguł clearingu.</p></div><span class="badge badge-info">Administrator</span></div><div class="grid-3"><section class="card stat"><span>Członkowie zespołu</span><strong>2</strong><span>1 administrator · 1 trener</span></section><section class="card stat"><span>Aktywne reguły</span><strong>${QS.rules.length}</strong><span>QuickScreen</span></section><section class="card stat"><span>Screen tests</span><strong>10</strong><span>aktywnych w konfiguracji</span></section></div><div class="grid-2"><section class="card"><div class="card-head"><h2>Zespół</h2><a class="btn btn-soft btn-sm" href="#/team">Otwórz panel</a></div><div class="list"><div class="list-row"><span><b>Karol Bilecki</b><br><small class="muted">Administrator</small></span>${QSUI.status('pass','Aktywny')}</div><div class="list-row"><span><b>Anna Nowak</b><br><small class="muted">Trener</small></span>${QSUI.status('info','Zaproszenie')}</div></div></section><section class="card"><div class="card-head"><h2>Clearing Rules</h2><a class="btn btn-soft btn-sm" href="#/configuration">Konfiguracja</a></div><div class="list">${QS.rules.map(r=>`<div class="list-row"><span><b>${r.name}</b><br><small class="muted">${r.effect}</small></span>${QSUI.status(r.active?'pass':'neutral',r.active?'Aktywna':'Wyłączona')}</div>`).join('')}</div></section></div>`, 'config')};

const configuredWizard=QSViews.assessment;
QSViews.assessment=function(state){
 const match=state.path.match(/\/(\d+)$/),n=Math.max(1,Math.min(QS.tests.length,Number(match?.[1]||1))),t=QS.tests[n-1];
 if(t.code!=='shoulder_clearing')return configuredWizard(state);
 const choice=(title,items)=>`<div class="selector"><span class="selector-title">${title}</span><div class="options">${items.map((x,i)=>`<button class="option ${i===0?'selected ':''}${x[1]}" data-action="select">${x[0]}</button>`).join('')}</div></div>`;
 const pattern=(title,kind)=>`<section class="clearing-test-card"><div class="clearing-test-head"><div><span class="eyebrow">Osobny test clearingowy</span><h2>${title}</h2></div><span class="badge badge-neutral">2 strony</span></div><div class="clearing-sides"><div class="clearing-side"><h3><span>L</span>Lewa strona</h3>${choice('Ból',[['☺ Brak bólu','pass'],['! Ból','pain']])}${choice('Zakres ruchu',[['✓ Pass','pass'],['× Fail','fail']])}</div><div class="clearing-side"><h3><span>P</span>Prawa strona</h3>${choice('Ból',[['☺ Brak bólu','pass'],['! Ból','pain']])}${choice('Zakres ruchu',[['✓ Pass','pass'],['× Fail','fail']])}</div></div><div class="status-line pass">✓ Komplet odpowiedzi dla ${title}: 4/4 pól</div></section>`;
 const content=`<div class="wizard-shell"><div class="wizard-top"><div class="wizard-client"><span class="initials">GK</span><span class="wizard-title"><strong>Gaweł Kot</strong><br>07.09.2026 · <span class="badge badge-info">Szkic demonstracyjny</span></span></div><button class="btn btn-ghost" data-route="#/client/demo">× Zamknij</button></div><section class="card wizard-progress-card"><div class="card-head"><div><h2>Test ${n} z ${QS.tests.length}</h2><p class="tiny muted">${t.name}</p></div><b class="teal-text">${Math.round(n/QS.tests.length*100)}%</b></div><div class="stepper">${QS.tests.map((x,i)=>`<button class="step ${i+1===n?'active':i+1<n?'done':''}" data-route="#/assessment/demo/${i+1}">${i+1}<small>${x.name}</small></button>`).join('')}</div></section><section class="card wizard-card clearing-group"><div class="wizard-heading"><div><div class="eyebrow">Grupa: Shoulder Clearing</div><h1>Shoulder Clearing</h1><p>${t.instruction}</p></div><button class="btn btn-soft btn-sm" data-action="criteria">▤ Kryteria</button></div><figure class="instruction"><span class="diagram">◌</span><figcaption>Każdy wzorzec jest osobnym testem; odpowiedzi nie są zapisywane.</figcaption></figure>${pattern('Wzorzec górny','upper')}${pattern('Wzorzec dolny','lower')}<div class="field"><label>Notatka do testu · opcjonalnie</label><textarea class="textarea" placeholder="Obserwacje, kompensacje lub uwagi…"></textarea></div></section><div class="action-bar"><button class="btn btn-soft" data-route="#/assessment/demo/${n-1}">← Wstecz</button><button class="btn btn-teal" data-route="#/assessment/demo/${n+1}">Dalej: Rotation →</button></div></div>`;
 return QSViews.layout(content,'assessment');
};
const detailsWithoutTestDescriptions=QSViews.details;
QSViews.details=function(state){
 return detailsWithoutTestDescriptions.call(QSViews,state).replace(/<br><small class="muted">[^<]*<\/small>/g,'');
};

const detailsWithFinalScores=QSViews.details;
QSViews.details=function(state){
 const html=detailsWithFinalScores.call(QSViews,state);
 const summaries={
  'Cervical Rotation and Extension':{label:'Punkt ostateczny',value:'Pass · Brak bólu',kind:'pass'},
  'Neck Extension Clearing':{label:'Wynik clearingu',value:'Lewa: Brak bólu · Prawa: Ból',kind:'pain'},
  'Toe Touch':{label:'Punkt ostateczny',value:'1 /3 · Słabo',kind:'attention'},
  'Shoulder Mobility':{label:'Punkt ostateczny po clearingu',value:'0 /3 · Ból',kind:'pain',note:'Wynik bazowy stron: 1 /3'},
  'Shoulder Clearing':{label:'Efekt clearingu',value:'Ból po prawej stronie → 0 /3',kind:'pain'},
  'Rotation':{label:'Punkt ostateczny',value:'0 /3 · Ból',kind:'pain'},
  'Balance':{label:'Punkt ostateczny',value:'1 /3 · Słabo',kind:'attention'},
  'Squat':{label:'Punkt ostateczny',value:'0 /3 · Ból',kind:'pain'},
  'Spine Extension Clearing':{label:'Wynik clearingu',value:'Brak bólu',kind:'pass'}
 };
 return html.replace(/<div class="assessment-result-row[^>]*>[\s\S]*?(?=<div class="assessment-result-row|<\/section>)/g,row=>{
  const name=(row.match(/<h3>([^<]+)<\/h3>/)||[])[1];
  const item=summaries[name];
  if(!item)return row;
  const summary=`<div class="assessment-final-score ${item.kind}"><span>${item.label}</span><strong>${item.value}</strong>${item.note?`<small>${item.note}</small>`:''}</div>`;
  return row.replace(/<\/div>$/,'')+summary+'</div>';
 });
};

QSViews.details=function(){
 const scoreLabels=['Ból','Słabo','W normie','Super!'];
 const plainSide=(label,value,kind)=>`<div class="assessment-side-card ${kind}"><span>${label}</span><strong>${value}</strong></div>`;
 const scoreLeft=[1,2,0,1,1,1,0,1,0,1];
 const scoreRight=[2,1,1,2,2,0,1,1,0,2];
 const isBilateral=t=>t.side==='bilateral';
 const sideResult=(label,value,kind='neutral')=>`<div class="assessment-side-result ${kind}"><span>${label}</span><strong>${value}</strong></div>`;
 const scoreResult=(i)=>`<div class="assessment-result-grid">${sideResult('Lewa strona',`${scoreLeft[i]} /3 · ${scoreLabels[scoreLeft[i]]}`,scoreLeft[i]===0?'pain':scoreLeft[i]===1?'attention':'pass')}${sideResult('Prawa strona',`${scoreRight[i]} /3 · ${scoreLabels[scoreRight[i]]}`,scoreRight[i]===0?'pain':scoreRight[i]===1?'attention':'pass')}</div>`;
 const bilateralMixed=()=>`<div class="assessment-result-grid">${sideResult('Lewa strona','Pass · Brak bólu','pass')}${sideResult('Prawa strona','Pass · Brak bólu','pass')}</div>`;
 const bilateralPain=()=>`<div class="assessment-result-grid">${sideResult('Lewa strona','Brak bólu','pass')}${sideResult('Prawa strona','Ból','pain')}</div>`;
 const clearingResult=()=>`<div class="assessment-result-grid clearing-result-grid">${sideResult('Lewa strona','Wzorzec górny: Pass<br>Wzorzec dolny: Pass<br>Zakres: Pass<br>Ból: Brak bólu','pass')}${sideResult('Prawa strona','Wzorzec górny: Pass<br>Wzorzec dolny: Ból<br>Zakres: Fail<br>Ból: Ból','pain')}</div>`;
 const result=(t,i)=>t.type==='score-bilateral'?scoreResult(i):t.type==='mixed-bilateral'?bilateralMixed():t.type==='pain-bilateral'?bilateralPain():t.type==='clearing-bilateral'?clearingResult():t.type==='mixed'?`<div class="assessment-result-single">${sideResult('Wynik testu','Pass · Brak bólu','pass')}</div>`:`<div class="assessment-result-single">${sideResult('Wynik testu',`${scoreLeft[i]} /3 · ${scoreLabels[scoreLeft[i]]}`,scoreLeft[i]===0?'pain':scoreLeft[i]===1?'attention':'pass')}</div>`;
 const row=(t,i,child=false)=>`<div class="assessment-result-row ${child?'is-clearing-child':''}"><div class="assessment-result-heading"><span class="assessment-result-number">${i+1}</span><div><h3>${t.name}</h3>${child?'<span class="assessment-child-label">Clearing podrzędny</span>':''}</div></div>${result(t,i)}</div>`;
 const groups=QS.tests.filter(t=>!t.parent).map((t)=>{const i=QS.tests.indexOf(t),children=QS.tests.map((child,index)=>({child,index})).filter(x=>x.child.parent===t.name);return `<section class="assessment-result-group">${row(t,i)}${children.map(x=>row(x.child,x.index,true)).join('')}</section>`}).join('');
 const body=`<div class="page-head"><div><a class="btn btn-ghost btn-sm" href="#/client/demo">← Gaweł Kot</a><div class="eyebrow">Podgląd badania</div><h1>Szczegóły badania</h1><p>07.09.2026 · kompletne badanie QuickScreen</p></div><div>${QSUI.status('pain','Ból / red flag')}</div></div><div class="detail-grid"><div class="stack"><section class="card assessment-results-card"><div class="card-head"><div><h2>Wyniki testów</h2><p class="muted">Każdy wynik pokazany zgodnie z typem odpowiedzi danego testu.</p></div><b class="assessment-total">5 /15</b></div><div class="assessment-results-list">${groups}</div></section><section class="card" id="clearing"><div class="card-head"><h2>Clearing effects</h2>${QSUI.status('attention','2 efekty')}</div><div class="clearing-grid"><div class="clearing-card"><h3>Shoulder Mobility</h3><p class="tiny muted">Powiązany clearing barku</p><div class="status-line pain">! Wynik zzerowany do 0 pkt · przykład</div></div><div class="clearing-card"><h3>Rotacja tułowia</h3><p class="tiny muted">Różnica między stronami</p><div class="status-line attention">! Asymetria · Lewa 1 / Prawa 2</div></div></div></section></div><div class="stack"><section class="card"><div class="card-head"><h2>Notatki</h2></div><p>${QS.client.note}</p><div class="status-line info" style="margin-top:12px">i Notatki są częścią demonstracyjnego rekordu.</div></section><section class="card" id="attachments"><div class="card-head"><h2>Dokumentacja</h2><button class="btn btn-soft btn-sm" data-action="toast" data-toast="Upload jest nieaktywny w makiecie.">＋ Dodaj</button></div><div class="system-state" style="margin:10px auto"><div class="state-icon">□</div><p>Brak załączników do tego badania.</p></div></section></div></div>`;
 return QSViews.layout(body,'clients');
};

const profileWithDirectAssessmentLink=QSViews.profile;
QSViews.profile=function(state,archived=false){
 return profileWithDirectAssessmentLink.call(QSViews,state,archived)
  .replace(/<button class="btn btn-ghost btn-sm" data-route="#\/assessment-details\/demo">Otwórz<\/button>/g,'<a class="btn btn-ghost btn-sm" href="/quick-screen-v2/#/assessment-details/demo">Otwórz</a>');
};

const plainSide=(label,value,kind)=>`<div class="assessment-side-card ${kind}"><span>${label}</span><strong>${value}</strong></div>`;

const configuredDetailsWithFinalScores=QSViews.details;
QSViews.details=function(state){
 const html=configuredDetailsWithFinalScores.call(QSViews,state);
 const summaries={
  'Cervical Rotation and Extension':{label:'Punkt ostateczny',value:'Pass · Brak bólu',kind:'pass'},
  'Neck Extension Clearing':{label:'Wynik clearingu',value:'Lewa: Brak bólu · Prawa: Ból',kind:'pain'},
  'Toe Touch':{label:'Punkt ostateczny',value:'1 /3 · Słabo',kind:'attention'},
  'Shoulder Mobility':{label:'Punkt ostateczny po clearingu',value:'0 /3 · Ból',kind:'pain',note:'Wynik bazowy stron: 1 /3'},
  'Shoulder Clearing':{label:'Efekt clearingu',value:'Ból po prawej stronie → 0 /3',kind:'pain'},
  'Rotation':{label:'Punkt ostateczny',value:'0 /3 · Ból',kind:'pain'},
  'Balance':{label:'Punkt ostateczny',value:'1 /3 · Słabo',kind:'attention'},
  'Squat':{label:'Punkt ostateczny',value:'0 /3 · Ból',kind:'pain'},
  'Spine Extension Clearing':{label:'Wynik clearingu',value:'Brak bólu',kind:'pass'}
 };
 return html.replace(/<div class="assessment-result-row[^>]*>[\s\S]*?(?=<div class="assessment-result-row|<\/section>)/g,row=>{
  const name=(row.match(/<h3>([^<]+)<\/h3>/)||[])[1];
  const item=summaries[name];
  if(!item)return row;
  const summary=`<div class="assessment-final-score ${item.kind}"><span>${item.label}</span><strong>${item.value}</strong>${item.note?`<small>${item.note}</small>`:''}</div>`;
  return row.replace(/<\/div>$/,'')+summary+'</div>';
 });
};

const detailsWithFinalScoreAfterClearing=QSViews.details;
QSViews.details=function(state){
 const html=detailsWithFinalScoreAfterClearing.call(QSViews,state);
 return html.replace(/<section class="assessment-result-group">([\s\S]*?)<\/section>/g,(full,content)=>{
  const summaries=content.match(/<div class="assessment-final-score [^"]+">[\s\S]*?<\/div>/g)||[];
  if(!summaries.length)return full;
  return `<section class="assessment-result-group">${content.replace(/<div class="assessment-final-score [^"]+">[\s\S]*?<\/div>/g,'')}${summaries.join('')}</section>`;
 });
};

const detailsWithCorrectSpineClearing=QSViews.details;
QSViews.details=function(state){
 const html=detailsWithCorrectSpineClearing.call(QSViews,state);
 return html.replace(/(<h3>Spine Extension Clearing<\/h3>[\s\S]*?<div class="assessment-result-single">)[\s\S]*?(<\/div><\/div>)/, '$1<div class="assessment-side-result pass"><span>Wynik testu</span><strong>Brak bólu</strong></div>$2');
};

QSViews.details=function(){
 const scoreLabels=['Ból','Słabo','W normie','Super!'];
 const scores={
  'Cervical Flexion':{base:'Pass · Brak bólu',final:'Pass · Brak bólu',kind:'pass'},
  'Cervical Rotation and Extension':{base:'Pass · Brak bólu',final:'Pass · Brak bólu',kind:'pass'},
  'Toe Touch':{left:1,right:2,base:'1 /3 · Słabo',final:'1 /3 · Słabo',kind:'attention'},
  'Shoulder Mobility':{left:1,right:2,base:'1 /3 · Słabo',final:'0 /3 · Ból',kind:'pain'},
  'Rotation':{left:0,right:1,base:'0 /3 · Ból',final:'0 /3 · Ból',kind:'pain'},
  'Balance':{left:1,right:2,base:'1 /3 · Słabo',final:'1 /3 · Słabo',kind:'attention'},
  'Squat':{single:0,base:'0 /3 · Ból',final:'0 /3 · Ból',kind:'pain'}
 };
 const badge=(text,kind)=>`<span class="assessment-inline-status ${kind}">${text}</span>`;
 const sideScore=(label,value)=>`<div class="assessment-side-card ${value===0?'pain':value===1?'attention':'pass'}"><span>${label}</span><strong>${value} /3</strong><small>${scoreLabels[value]}</small></div>`;
 const bilateralScore=t=>{const s=scores[t.name];return `<div class="assessment-side-grid">${sideScore('Lewa strona',s.left)}${sideScore('Prawa strona',s.right)}</div>`};
 const mixed=()=>`<div class="assessment-side-grid"><div class="assessment-side-card pass"><span>Lewa strona</span><strong>Pass</strong><small>Brak bólu</small></div><div class="assessment-side-card pass"><span>Prawa strona</span><strong>Pass</strong><small>Brak bólu</small></div></div>`;
 const painSides=()=>`<div class="assessment-side-grid"><div class="assessment-side-card pass"><span>Lewa strona</span><strong>Brak bólu</strong></div><div class="assessment-side-card pain"><span>Prawa strona</span><strong>Ból</strong></div></div>`;
 const singleScore=t=>{const s=scores[t.name];return `<div class="assessment-side-grid single"><div class="assessment-side-card ${s.kind}"><span>Wynik testu</span><strong>${s.single} /3</strong><small>${scoreLabels[s.single]}</small></div></div>`};
 const parentResult=(t)=>t.type==='score-bilateral'?bilateralScore(t):t.type==='mixed-bilateral'?mixed():t.type==='mixed'?`<div class="assessment-side-grid single"><div class="assessment-side-card pass"><span>Zakres ruchu</span><strong>Pass</strong><small>Brak bólu</small></div></div>`:singleScore(t);
 const finalScore=(t)=>{const s=scores[t.name];if(!s)return '';const changed=s.base!==s.final;return `<div class="assessment-final-score ${s.kind}"><span>${changed?'Punkt ostateczny po clearingu':'Punkt ostateczny'}</span><strong>${s.final}</strong>${changed?`<small>Wynik bazowy: ${s.base}</small>`:''}</div>`};
 const pattern=(name,left,right)=>`<section class="assessment-pattern-card"><div class="assessment-pattern-head"><h4>${name}</h4><span>osobny wynik</span></div><div class="assessment-pattern-sides"><div><b>Lewa strona</b><span>Ból: ${left.pain}</span><span>Zakres: ${left.range}</span></div><div><b>Prawa strona</b><span>Ból: ${right.pain}</span><span>Zakres: ${right.range}</span></div></div></section>`;
 const clearing=(t)=>t.name==='Shoulder Clearing'?`<div class="assessment-clearing-block"><div class="assessment-clearing-head"><span>Clearing</span><h3>Shoulder Clearing</h3></div>${pattern('Wzorzec górny',{pain:'Brak bólu',range:'Pass'},{pain:'Ból',range:'Fail'})}${pattern('Wzorzec dolny',{pain:'Brak bólu',range:'Pass'},{pain:'Ból',range:'Fail'})}</div>`:t.name==='Neck Extension Clearing'?`<div class="assessment-clearing-block"><div class="assessment-clearing-head"><span>Clearing</span><h3>Neck Extension Clearing</h3></div><div class="assessment-side-grid">${plainSide('Lewa strona','Brak bólu','pass')}${plainSide('Prawa strona','Ból','pain')}</div></div>`:`<div class="assessment-clearing-block"><div class="assessment-clearing-head"><span>Clearing</span><h3>Spine Extension Clearing</h3></div><div class="assessment-side-grid single">${plainSide('Wynik testu','Brak bólu','pass')}</div></div>`;
 const row=(t,i)=>`<div class="assessment-preview-row"><div class="assessment-preview-title"><span class="assessment-result-number">${i+1}</span><h3>${t.name}</h3>${t.parent?badge('Clearing','info'):''}</div>${parentResult(t)}</div>`;
 const group=(t,i)=>{const child=QS.tests.find(x=>x.parent===t.name);return `<section class="assessment-preview-group"><div class="assessment-preview-main">${row(t,i)}${child?clearing(child):''}</div>${finalScore(t)}</section>`};
 const groups=QS.tests.filter(t=>!t.parent).map(t=>group(t,QS.tests.indexOf(t))).join('');
 const body=`<div class="page-head"><div><a class="btn btn-ghost btn-sm" href="#/client/demo">← Gaweł Kot</a><div class="eyebrow">Podgląd badania</div><h1>Szczegóły badania</h1><p>07.09.2026 · kompletne badanie QuickScreen</p></div><div>${QSUI.status('pain','Ból / red flag')}</div></div><div class="detail-grid"><div class="stack"><section class="card assessment-results-card"><div class="card-head"><div><h2>Wyniki badania</h2><p class="muted">Wyniki stron, clearingów i punkty ostateczne.</p></div><b class="assessment-total">5 /15</b></div><div class="assessment-preview-list">${groups}</div></section><section class="card" id="clearing"><div class="card-head"><h2>Clearing effects</h2>${QSUI.status('attention','2 efekty')}</div><div class="clearing-grid"><div class="clearing-card"><h3>Shoulder Mobility</h3><p class="tiny muted">Powiązany clearing barku</p><div class="status-line pain">! Ból po prawej stronie · wynik końcowy 0 /3</div></div><div class="clearing-card"><h3>Rotacja tułowia</h3><p class="tiny muted">Różnica między stronami</p><div class="status-line attention">! Asymetria · Lewa 1 / Prawa 2</div></div></div></section></div><div class="stack"><section class="card"><div class="card-head"><h2>Notatki</h2></div><p>${QS.client.note}</p></section><section class="card" id="attachments"><div class="card-head"><h2>Dokumentacja</h2><button class="btn btn-soft btn-sm" data-action="toast" data-toast="Upload jest nieaktywny w makiecie.">＋ Dodaj</button></div><div class="system-state" style="margin:10px auto"><div class="state-icon">□</div><p>Brak załączników do tego badania.</p></div></section></div></div>`;
 return QSViews.layout(body,'clients');
};

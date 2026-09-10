(function(){
  const scoreLabel=['Ból','Słabo','W normie','Super!'];
  const scoreData={
    'Toe Touch':{left:3,right:3,base:'3 /3 · Super!',final:'3 /3 · Super!',kind:'pass'},
    'Shoulder Mobility':{left:1,right:2,base:'1 /3 · Słabo',final:'0 /3 · Ból',kind:'pain'},
    'Rotation':{left:0,right:1,base:'0 /3 · Ból',final:'0 /3 · Ból',kind:'pain'},
    'Balance':{left:1,right:2,base:'1 /3 · Słabo',final:'1 /3 · Słabo',kind:'attention'},
    'Squat':{single:2,base:'2 /3 · W normie',final:'0 /3 · Ból',kind:'pain'}
  };
  const passData={
    'Cervical Flexion':{range:'Pass',pain:'Brak bólu',kind:'pass'},
    'Cervical Rotation and Extension':{left:'Pass',right:'Pass',painLeft:'Brak bólu',painRight:'Brak bólu',kind:'pass'}
  };
  const clearingData={
    'Neck Extension Clearing':{parent:'Cervical Rotation and Extension',mode:'pain',left:'Brak bólu',right:'Ból',final:'Fail · Ból',kind:'pain'},
    'Shoulder Clearing':{parent:'Shoulder Mobility',mode:'patterns',patterns:[
      {name:'Wzorzec górny',left:['Brak bólu','Pass'],right:['Brak bólu','Pass']},
      {name:'Wzorzec dolny',left:['Brak bólu','Pass'],right:['Ból','Fail']}
    ],final:'0 / 3 · Ból',kind:'pain'},
    'Spine Extension Clearing':{parent:'Squat',mode:'single',result:'Ból',final:'Ból',kind:'pain'}
  };
  const badge=(text,kind)=>`<span class="badge badge-${kind||'info'}">${text}</span>`;
  const scoreCard=(side,value)=>`<div class="assessment-side-result-card ${value===0?'pain':value===1?'attention':'pass'}"><span>${side}</span><strong class="${value===0?'pain':value===1?'attention':'pass'}">${value} /3</strong><em>${scoreLabel[value]}</em></div>`;
  const finalCard=(value,kind)=>`<aside class="assessment-final-card ${kind}"><span>Punkt ostateczny</span><strong>${value}</strong></aside>`;
  const parentHead=(number,name)=>`<div class="assessment-test-head"><span class="assessment-test-number">${number}</span><div><h3>${name}</h3></div></div>`;
  const bilateralScore=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}<div class="assessment-side-results">${scoreCard('Lewa strona',data.left)}${scoreCard('Prawa strona',data.right)}</div></div>${finalCard(data.final,data.kind)}</article>`;
  const singleScore=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}</div>${finalCard(data.final,data.kind)}</article>`;
  const passTest=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}<div class="assessment-side-results"><div class="assessment-side-result-card pass"><span>Zakres</span><strong>${data.range}</strong><em>Spełnia zakres</em></div><div class="assessment-side-result-card pass"><span>Ból</span><strong>${data.pain}</strong><em>Bez bólu</em></div></div></div>${finalCard('Pass','pass')}</article>`;
  const bilateralPassBody=(number,name,data)=>`${parentHead(number,name)}<div class="assessment-side-results"><div class="assessment-side-result-card pass"><span>Lewa strona</span><strong>${data.left}</strong><em>${data.painLeft}</em></div><div class="assessment-side-result-card pass"><span>Prawa strona</span><strong>${data.right}</strong><em>${data.painRight}</em></div></div>`;
  const clearingPainBody=(number,name,data)=>`<div class="assessment-dependent-test" aria-label="Test zależny"><div class="assessment-test-head"><div><h3>${name}</h3></div></div><div class="assessment-side-results"><div class="assessment-side-result-card pass"><span>Lewa strona</span><strong class="pass">${data.left}</strong></div><div class="assessment-side-result-card pain"><span>Prawa strona</span><strong class="pain">${data.right}</strong></div></div></div>`;
  const shoulderClearingBody=(number,name,data)=>`<div class="assessment-dependent-test assessment-shoulder-clearing" aria-label="Test zależny"><div class="assessment-test-head"><div><h3>${name}</h3></div></div><div class="assessment-clearing-sides">${['left','right'].map(side=>`<section class="assessment-clearing-side"><b class="assessment-clearing-side-title">${side==='left'?'Lewa strona':'Prawa strona'}</b>${data.patterns.map(p=>{const result=side==='left'?p.left:p.right;return `<div class="assessment-clearing-pattern"><strong>${p.name}</strong><div class="assessment-clearing-statuses"><span class="${result[0]==='Ból'?'pain':'pass'}">Ból: ${result[0]}</span><em class="${result[1]==='Fail'?'pain':'pass'}">Zakres: ${result[1]}</em></div></div>`}).join('')}</section>`).join('')}</div></div>`;
  const spineClearingBody=(number,name,data)=>`<div class="assessment-dependent-test" aria-label="Test zależny"><div class="assessment-test-head"><div><h3>${name}</h3></div></div><div class="assessment-single-results"><strong class="pain">${data.result}</strong></div></div>`;
  const dependentGroup=(parentBody,childBody,final)=>`<article class="assessment-group-card has-dependent"><div class="assessment-group-main">${parentBody}${childBody}</div>${final}</article>`;
  function cleanDetails(){
    const group1=passTest(1,'Cervical Flexion',passData['Cervical Flexion']);
    const group2=dependentGroup(bilateralPassBody(2,'Cervical Rotation and Extension',passData['Cervical Rotation and Extension']),clearingPainBody(2,'Neck Extension Clearing',clearingData['Neck Extension Clearing']),finalCard(clearingData['Neck Extension Clearing'].final,clearingData['Neck Extension Clearing'].kind));
    const group4=bilateralScore(3,'Toe Touch',scoreData['Toe Touch']);
    const group5=dependentGroup(`${parentHead(4,'Shoulder Mobility')}<div class="assessment-side-results">${scoreCard('Lewa strona',scoreData['Shoulder Mobility'].left)}${scoreCard('Prawa strona',scoreData['Shoulder Mobility'].right)}</div>`,shoulderClearingBody(4,'Shoulder Clearing',clearingData['Shoulder Clearing']),finalCard(scoreData['Shoulder Mobility'].final,scoreData['Shoulder Mobility'].kind));
    const group7=bilateralScore(5,'Rotation',scoreData.Rotation);
    const group8=bilateralScore(6,'Balance',scoreData.Balance);
    const group9=dependentGroup(`${parentHead(7,'Squat')}<div class="assessment-single-results"><strong class="${scoreData.Squat.single===0?'pain':scoreData.Squat.single===1?'attention':'pass'}">${scoreData.Squat.base}</strong></div>`,spineClearingBody(7,'Spine Extension Clearing',clearingData['Spine Extension Clearing']),finalCard(scoreData.Squat.final,scoreData.Squat.kind));
    const body=`<div class="assessment-detail-page"><div class="page-head"><div><a class="btn btn-ghost btn-sm" href="#/client/demo">← Gaweł Kot</a><div class="eyebrow">Podgląd badania</div><h1>Szczegóły badania</h1><p>07.09.2026 · kompletne badanie QuickScreen</p></div><div>${badge('Ból / red flag','pain')}</div></div><div class="assessment-detail-layout"><main class="assessment-detail-stack"><section class="card"><div class="card-head"><div><h2>Wyniki testów</h2><p class="muted">Testy zależne są pokazane bezpośrednio pod testem nadrzędnym.</p></div><strong class="assessment-total">5 /15</strong></div><div class="assessment-detail-stack">${group1}${group2}${group4}${group5}${group7}${group8}${group9}</div></section><section class="assessment-notes-card"><h3>Notatka trenera</h3><p>Widoczna asymetria w obrębie barku. Po stronie prawej pojawił się ból w wzorcu dolnym clearingu.</p></section></main><aside class="assessment-detail-stack"><section class="assessment-notes-card"><h3>Clearing effects</h3><p>Clearing barku zmienia wynik Shoulder Mobility na 0 /3. Pozostałe efekty są pokazane przy właściwym teście.</p></section><section class="assessment-attachments-empty"><h3>Dokumentacja</h3><p>Brak załączników do tego badania.</p></section></aside></div></div>`;
    const noteText='Widoczna asymetria w obrębie barku. Po stronie prawej pojawił się ból w wzorcu dolnym clearingu.';
    const noteCard=`<section class="assessment-notes-card assessment-sidebar-notes"><h3>Notatka trenera</h3><p>${noteText}</p></section>`;
    const sidebarMatch=body.match(/<aside class="assessment-detail-stack">.*?<\/aside>/);
    const sidebar=sidebarMatch?sidebarMatch[0]:'';
    const docs=sidebar.replace(/<section class="assessment-notes-card">.*?<\/section>/,'').replace(/^<aside class="assessment-detail-stack">/,'').replace(/<\/aside>$/,'');
    const withoutInlineNote=body.replace(/<section class="assessment-notes-card"><h3>Notatka trenera<\/h3>.*?<\/section>/,'');
    const cleanBody=withoutInlineNote.replace(sidebar,`<aside class="assessment-detail-stack">${noteCard}${docs}</aside>`)+`<button class="assessment-notes-float" type="button" data-clean-notes>Notatki trenera</button>`;
    return QSViews.layout(cleanBody,'clients');
  }
  QSViews.details=cleanDetails;
  document.addEventListener('click',function(event){
    const trigger=event.target.closest('[data-clean-notes]');
    if(!trigger)return;
    event.preventDefault();
    document.body.insertAdjacentHTML('beforeend',QSUI.modal('Notatki trenera','<p>Widoczna asymetria w obrębie barku. Po stronie prawej pojawił się ból w wzorcu dolnym clearingu.</p>'));
  });
})();

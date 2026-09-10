(function(){
  const scoreLabel=['Ból','Słabo','W normie','Super!'];
  const scoreData={
    'Toe Touch':{left:1,right:2,base:'1 /3 · Słabo',final:'1 /3 · Słabo',kind:'attention'},
    'Shoulder Mobility':{left:1,right:2,base:'1 /3 · Słabo',final:'0 /3 · Ból',kind:'pain'},
    'Rotation':{left:0,right:1,base:'0 /3 · Ból',final:'0 /3 · Ból',kind:'pain'},
    'Balance':{left:1,right:2,base:'1 /3 · Słabo',final:'1 /3 · Słabo',kind:'attention'},
    'Squat':{single:0,base:'0 /3 · Ból',final:'0 /3 · Ból',kind:'pain'}
  };
  const passData={
    'Cervical Flexion':{range:'Pass',pain:'Brak bólu',kind:'pass'},
    'Cervical Rotation and Extension':{left:'Pass',right:'Pass',painLeft:'Brak bólu',painRight:'Brak bólu',kind:'pass'}
  };
  const clearingData={
    'Neck Extension Clearing':{parent:'Cervical Rotation and Extension',mode:'pain',left:'Brak bólu',right:'Ból',final:'0 / 1 · Ból',kind:'pain'},
    'Shoulder Clearing':{parent:'Shoulder Mobility',mode:'patterns',patterns:[
      {name:'Wzorzec górny',left:['Brak bólu','Pass'],right:['Brak bólu','Pass']},
      {name:'Wzorzec dolny',left:['Brak bólu','Pass'],right:['Ból','Fail']}
    ],final:'0 / 3 · Ból',kind:'pain'},
    'Spine Extension Clearing':{parent:'Squat',mode:'single',result:'Ból',final:'Ból',kind:'pain'}
  };
  const badge=(text,kind)=>`<span class="badge badge-${kind||'info'}">${text}</span>`;
  const scoreCard=(side,value)=>`<div class="assessment-side-result-card ${value===0?'pain':value===1?'attention':'pass'}"><span>${side}</span><strong>${value} /3</strong><em>${scoreLabel[value]}</em></div>`;
  const finalCard=(value,kind)=>`<aside class="assessment-final-card ${kind}"><span>Punkt ostateczny</span><strong>${value}</strong><em>${kind==='pain'?'Po uwzględnieniu clearingu': 'Wynik testu'}</em></aside>`;
  const parentHead=(number,name)=>`<div class="assessment-test-head"><span class="assessment-test-number">${number}</span><div><h3>${name}</h3></div></div>`;
  const bilateralScore=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}<div class="assessment-side-results">${scoreCard('Lewa strona',data.left)}${scoreCard('Prawa strona',data.right)}</div><div class="assessment-single-results"><span>Wynik bazowy testu</span><strong class="${data.kind}">${data.base}</strong></div></div>${finalCard(data.final,data.kind)}</article>`;
  const singleScore=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}<div class="assessment-single-results"><span>Wynik testu</span><strong class="${data.kind}">${data.base}</strong></div></div>${finalCard(data.final,data.kind)}</article>`;
  const passTest=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}<div class="assessment-side-results"><div class="assessment-side-result-card pass"><span>Zakres</span><strong>${data.range}</strong><em>Spełnia zakres</em></div><div class="assessment-side-result-card pass"><span>Ból</span><strong>${data.pain}</strong><em>Bez bólu</em></div></div></div>${finalCard('Pass','pass')}</article>`;
  const bilateralPass=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}<div class="assessment-side-results"><div class="assessment-side-result-card pass"><span>Lewa strona</span><strong>${data.left}</strong><em>${data.painLeft}</em></div><div class="assessment-side-result-card pass"><span>Prawa strona</span><strong>${data.right}</strong><em>${data.painRight}</em></div></div></div>${finalCard('Pass','pass')}</article>`;
  const clearingPain=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}<div class="assessment-clearing-block-clean"><div class="assessment-clearing-title"><h4>Wynik clearingu</h4>${badge('Clearing','info')}</div><div class="assessment-side-results"><div class="assessment-side-result-card pass"><span>Lewa strona</span><strong>${data.left}</strong><em>Brak bólu</em></div><div class="assessment-side-result-card pain"><span>Prawa strona</span><strong>${data.right}</strong><em>Ból</em></div></div></div></div>${finalCard(data.final,data.kind)}</article>`;
  const shoulderClearing=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}<div class="assessment-clearing-block-clean"><div class="assessment-clearing-title"><h4>Wyniki clearingu</h4>${badge('Powiązany z Shoulder Mobility','info')}</div>${data.patterns.map(p=>`<div class="assessment-pattern"><strong>${p.name}</strong><div class="assessment-pattern-grid"><div class="assessment-pattern-side"><b>Lewa strona</b><span>Ból: ${p.left[0]}</span><em class="pass">Zakres: ${p.left[1]}</em></div><div class="assessment-pattern-side"><b>Prawa strona</b><span>Ból: ${p.right[0]}</span><em class="${p.right[1]==='Fail'?'pain':'pass'}">Zakres: ${p.right[1]}</em></div></div></div>`).join('')}</div></div>${finalCard(data.final,data.kind)}</article>`;
  const spineClearing=(number,name,data)=>`<article class="assessment-group-card"><div class="assessment-group-main">${parentHead(number,name)}<div class="assessment-clearing-block-clean"><div class="assessment-clearing-title"><h4>Wynik clearingu</h4>${badge('Powiązany z Squat','info')}</div><div class="assessment-single-results"><span>Ból</span><strong class="pain">${data.result}</strong></div></div></div>${finalCard(data.final,data.kind)}</article>`;
  function cleanDetails(){
    const group1=passTest(1,'Cervical Flexion',passData['Cervical Flexion']);
    const group2=bilateralPass(2,'Cervical Rotation and Extension',passData['Cervical Rotation and Extension']);
    const group3=clearingPain(2,'Neck Extension Clearing',clearingData['Neck Extension Clearing']);
    const group4=bilateralScore(3,'Toe Touch',scoreData['Toe Touch']);
    const group5=bilateralScore(4,'Shoulder Mobility',scoreData['Shoulder Mobility']);
    const group6=shoulderClearing(4,'Shoulder Clearing',clearingData['Shoulder Clearing']);
    const group7=bilateralScore(5,'Rotation',scoreData.Rotation);
    const group8=bilateralScore(6,'Balance',scoreData.Balance);
    const group9=singleScore(7,'Squat',scoreData.Squat);
    const group10=spineClearing(7,'Spine Extension Clearing',clearingData['Spine Extension Clearing']);
    const body=`<div class="assessment-detail-page"><div class="page-head"><div><a class="btn btn-ghost btn-sm" href="#/client/demo">← Gaweł Kot</a><div class="eyebrow">Podgląd badania</div><h1>Szczegóły badania</h1><p>07.09.2026 · kompletne badanie QuickScreen</p></div><div>${badge('Ból / red flag','pain')}</div></div><div class="assessment-detail-layout"><main class="assessment-detail-stack"><section class="card"><div class="card-head"><div><h2>Wyniki testów</h2><p class="muted">Każdy test i jego clearing są pokazane razem. Wynik ostateczny jest po prawej stronie.</p></div><strong class="assessment-total">5 /15</strong></div><div class="assessment-detail-stack">${group1}${group2}${group3}${group4}${group5}${group6}${group7}${group8}${group9}${group10}</div></section><section class="assessment-notes-card"><h3>Notatka trenera</h3><p>Widoczna asymetria w obrębie barku. Po stronie prawej pojawił się ból w wzorcu dolnym clearingu.</p></section></main><aside class="assessment-detail-stack"><section class="assessment-notes-card"><h3>Clearing effects</h3><p>Clearing barku zmienia wynik Shoulder Mobility na 0 /3. Pozostałe efekty są pokazane przy właściwym teście.</p></section><section class="assessment-attachments-empty"><h3>Dokumentacja</h3><p>Brak załączników do tego badania.</p></section></aside></div></div>`;
    return QSViews.layout(body,'clients');
  }
  QSViews.details=cleanDetails;
})();

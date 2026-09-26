(function(){
 const app=document.getElementById('app');
 function render(){const s=QSRouter.parse();let html;
  if(s.path==='/login')html=QSViews.auth('login');else if(s.path==='/register')html=QSViews.auth('register');else if(s.path==='/reset-password')html=QSViews.auth('reset');else if(s.path==='/loading')html=QSViews.auth('loading');
  else if(s.path==='/client-panel')html=QSViews.clientPanel();else if(s.path.startsWith('/report/'))html=QSViews.clientResult(s);else if(s.path==='/trainer-panel')html=QSViews.trainerPanel();else if(s.path==='/cheat-sheet')html=QSViews.cheatSheet();else if(s.path==='/trainer-admin-panel')html=QSViews.trainerAdminPanel();else if(s.path==='/admin-panel')html=QSViews.adminPanel();
  else if(s.path.startsWith('/clients'))html=QSViews.clients(s);else if(s.path==='/client/new')html=QSViews.profile(s);else if(s.path==='/client/archived')html=QSViews.profile(s,true);else if(s.path.startsWith('/client/'))html=QSViews.profile(s);else if(s.path==='/assessment')html=QSViews.assessmentStart(s);else if(s.path.startsWith('/assessment/'))html=QSViews.assessment(s);else if(s.path.startsWith('/assessment-details'))html=QSViews.details(s);else if(s.path.startsWith('/report/'))html=QSViews.report(s);else if(s.path==='/trainer')html=QSViews.trainer(s);else if(s.path==='/configuration')html=QSViews.config(s);else if(s.path==='/team'||s.path==='/team/empty')html=QSViews.team(s.path==='/team/empty'||s.hash==='empty');else if(s.path==='/error')html=QSViews.system('error');else if(s.path==='/empty')html=QSViews.system('empty');else if(s.path==='/disabled')html=QSViews.system('disabled');else if(s.path==='/archived')html=QSViews.system('archived');else if(s.path==='/toast-success')html=QSUI.page('<div class="system-state"><div class="state-icon">✓</div><h1>Toast success</h1><p>Przykładowy komunikat pozytywny.</p><button class="btn btn-teal" data-action="toast" data-toast="Operacja demonstracyjna zakończona.">Pokaż toast</button></div>','clients');else if(s.path==='/toast-error')html=QSUI.page('<div class="system-state"><div class="state-icon">!</div><h1>Toast error</h1><p>Przykładowy komunikat błędu.</p><button class="btn btn-danger" data-action="toast" data-toast="Przykładowy błąd demonstracyjny." data-kind="error">Pokaż toast</button></div>','clients');else html=QSViews.clients(s);app.innerHTML=html;applyQueryState(s)}
 function applyQueryState(s){if(!s.query.modal)return;const key=s.query.modal==='new'?'new-client':s.query.modal==='edit'?'edit-client':s.query.modal;const trigger=document.querySelector(`[data-modal="${key}"]`);if(trigger&&s.path!=='/clients')trigger.click()}
 function openNavigator(){return}
 function criteria(){const route=QSRouter.parse(),step=Math.max(1,Math.min(QS.tests.length,Number((route.path.match(/\/(\d+)$/)||[])[1]||1))),test=QS.tests[step-1];document.body.insertAdjacentHTML('beforeend',QSUI.sheet('Standardy: '+QSUI.esc(test.name),`<div class="stack"><p>${QSUI.esc(test.criteria||test.instruction)}</p><button class="btn btn-primary" data-action="close-overlay">Wróć do badania</button></div>`))}
 function toast(text,kind){document.querySelector('.toast')?.remove();document.body.insertAdjacentHTML('beforeend',QSUI.toast(text,kind));setTimeout(()=>document.querySelector('.toast')?.remove(),2800)}
 /* Raport jest samodzielnym dokumentem. Globalny router nie obsługuje żadnego
    kliknięcia w jego obrębie; linki hash raportu działają natywnie przez hashchange. */
 function isReportPageClick(event){return Boolean(event.target.closest('.report-page'))}
 document.addEventListener('click',e=>{if(isReportPageClick(e))return;const action=e.target.closest('[data-action]');if(action){e.preventDefault();e.stopImmediatePropagation();const a=action.dataset.action;if(a==='navigator'){openNavigator();return}if(a==='close-navigator'){document.querySelector('.navigator')?.remove();return}if(a==='criteria'){criteria();return}if(a==='close-overlay'){document.querySelector('.modal-backdrop,.sheet-backdrop')?.remove();return}if(a==='modal'){const type=action.dataset.modal;QSRouter.go(type==='new-client'?'#/clients?modal=new':type==='edit-client'?'#/clients?modal=edit':type==='password'?'#/trainer?modal=password':type==='cert'?'#/trainer?modal=cert':'#/configuration?modal=rule');return}if(a==='select'){action.parentElement.querySelectorAll('.option').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});action.classList.add('selected');action.setAttribute('aria-pressed','true');return}if(a==='toast')toast(action.dataset.toast||'Funkcja nieaktywna w makiecie.',action.dataset.kind||'success');return}const route=e.target.closest('[data-route]');if(route){e.preventDefault();QSRouter.go(route.dataset.route);return}if(e.target.classList.contains('modal-backdrop')||e.target.classList.contains('sheet-backdrop'))document.querySelector('.modal-backdrop,.sheet-backdrop')?.remove()});
 /* Edycja profilu jest ekranem makiety, bez zapisu danych. */
 document.addEventListener('click',e=>{
  const action=e.target.closest('[data-action="modal"]');
  if(action?.dataset.modal==='edit-client'&&QSRouter.parse().path.startsWith('/client/')){e.preventDefault();e.stopImmediatePropagation();QSRouter.go('#/client/demo?modal=edit')}
 },true);
 /* Jedna obsługa przejść w makiecie: linki i przyciski zawsze zmieniają ekran. */
 document.addEventListener('click',e=>{
  if(isReportPageClick(e))return;
  const link=e.target.closest('a[href^="#/"]');
  if(link&&!link.hasAttribute('data-preview-role')){e.preventDefault();QSRouter.go(link.getAttribute('href'));return}
  const route=e.target.closest('[data-route]');
  if(route){e.preventDefault();QSRouter.go(route.dataset.route);return}
  const action=e.target.closest('[data-action="modal"]');
  if(action?.dataset.modal==='edit-client'&&QSRouter.parse().path.startsWith('/client/')){e.preventDefault();QSRouter.go('#/client/demo?modal=edit')}
 });
 QSRouter.init(render);
})();

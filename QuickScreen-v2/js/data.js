window.QS={
 trainer:{name:'Karol Bilecki',email:'karol@kbtrener.pl',role:'Trener prowadzący',certs:['Movement Coach · poziom zaawansowany','QuickScreen Fundamentals · 2025']},
 client:{id:'demo',name:'Gaweł Kot',email:'gawelkot@gmail.com',discipline:'Piłka nożna',club:'KB Performance Lab',initials:'GK',archived:false,note:'Ograniczona stabilizacja po stronie lewej. Warto obserwować kompensację tułowia w kolejnej sesji.'},
 clients:[
  {id:'demo',name:'Gaweł Kot',email:'gawelkot@gmail.com',initials:'GK',score:5,date:'07.09.2026',status:'pain',label:'Ból / red flag',discipline:'Piłka nożna'},
  {id:'anna',name:'Anna Nowak',email:'a.nowak@trening.pl',initials:'AN',score:13,date:'04.09.2026',status:'pass',label:'W normie',discipline:'Biegi'},
  {id:'michal',name:'Michał Drwięga',email:'m.drwiega@gmail.com',initials:'MD',score:11,date:'28.08.2026',status:'pass',label:'W normie',discipline:'Kolarstwo'},
  {id:'kasia',name:'Katarzyna Wiśniewska',email:'k.wisniewska@fit.pl',initials:'KW',score:8,date:'15.08.2026',status:'attention',label:'Uwaga / asymetria',discipline:'Fitness'},
  {id:'tomasz',name:'Tomasz Zieliński',email:'t.zielinski@prosport.pl',initials:'TZ',score:null,date:'Dołączył wczoraj',status:'info',label:'Brak badań',discipline:'Siatkówka'},
  {id:'arch',name:'Piotr Archiwalny',email:'p.archiwalny@example.com',initials:'PA',score:10,date:'12.04.2026',status:'neutral',label:'Archiwalny',discipline:'Tenis',archived:true}
 ],
 tests:[
  {name:'Zgięcie szyjne',type:'score',instruction:'Usiądź stabilnie i wykonaj spokojny ruch w pełnym zakresie.'},
  {name:'Rotacja szyjna',type:'passfail',instruction:'Wykonaj rotację bez kompensacji tułowiem.'},
  {name:'Toe Touch',type:'score',instruction:'Dotknij palców stóp, utrzymując spokojny oddech.',image:true},
  {name:'Mobilność barku',type:'bilateral',instruction:'Porównaj zakres i jakość ruchu po obu stronach.'},
  {name:'Shoulder Clearing',type:'shoulder',instruction:'Sprawdź wzorzec górny i dolny po lewej oraz prawej stronie.'},
  {name:'Rotacja tułowia',type:'bilateral',instruction:'Wykonaj rotację tułowia z kontrolą miednicy.'},
  {name:'Balance',type:'score',instruction:'Utrzymaj równowagę na jednej nodze przez kilka sekund.'},
  {name:'Przysiad',type:'passfail',instruction:'Wykonaj przysiad w wygodnym, kontrolowanym tempie.'},
  {name:'Spine Extension Clearing',type:'pain',instruction:'Wykonaj wyprost kręgosłupa i zgłoś ewentualny ból.'}
 ],
 history:[{date:'07.09.2026',score:5,status:'pain',note:'Ból po stronie prawej w Shoulder Clearing.'},{date:'18.07.2026',score:9,status:'attention',note:'Asymetria w rotacji tułowia.'},{date:'02.06.2026',score:12,status:'pass',note:'Dobry wynik bazowy.'}],
 rules:[{name:'Shoulder Mobility → Shoulder Clearing',when:'Nieudany wzorzec barku',effect:'Wynik powiązanego testu = 0',active:true},{name:'Ból → status Pain',when:'Pain = obecny',effect:'Oznaczenie testu jako ból',active:true},{name:'Asymetria bilateralna',when:'Różnica stron',effect:'Status Attention',active:true}],
 nav:[
  ['Auth',[['Loading','#/loading'],['Logowanie','#/login'],['Rejestracja','#/register'],['Reset hasła','#/reset-password']]],
  ['Clients',[['Lista klientów','#/clients'],['Empty state','#/clients/empty'],['Brak wyników','#/clients/no-results'],['Archiwalni','#/clients/archived'],['Nowy klient · modal','#/clients?modal=new'],['Edycja · modal','#/clients?modal=edit']]],
  ['Client Profile',[['Bez badań','#/client/new'],['Ostatni wynik','#/client/demo'],['Historia i trend','#/client/demo/history'],['Archiwalny profil','#/client/archived']]],
  ['QuickScreen',[['Początek wizarda','#/assessment/demo/1'],['Typowy test','#/assessment/demo/3'],['Bilateralny','#/assessment/demo/4'],['Shoulder Clearing','#/assessment/demo/5'],['Asymetria','#/assessment/demo/6'],['Ból','#/assessment/demo/9'],['Korekta','#/assessment-details/demo?correction=1'],['Ostatni krok','#/assessment/demo/9']]],
  ['Assessment Details',[['Szczegóły badania','#/assessment-details/demo'],['Clearing effects','#/assessment-details/demo#clearing'],['Dokumentacja','#/assessment-details/demo#attachments'],['Empty załączników','#/assessment-details/demo?empty=1']]],
  ['Report',[['Podgląd raportu','#/report/demo'],['Raport podstawowy','#/report/demo/basic'],['Historia snapshotów','#/report/demo/snapshots']]],
  ['Trainer',[['Profil trenera','#/trainer'],['Certyfikacje · modal','#/trainer?modal=cert'],['Zmiana hasła · modal','#/trainer?modal=password']]],
  ['Administration',[['Panel zespołu','#/team'],['Empty state zespołu','#/team/empty'],['Konfiguracja protokołu','#/configuration'],['Clearing Rules','#/configuration#rules'],['Katalog testów','#/configuration#catalog'],['Nowa reguła · modal','#/configuration?modal=rule']]],
  ['System States',[['Loading','#/loading'],['Error / Retry','#/error'],['EmptyState','#/empty'],['Toast success','#/toast-success'],['Toast error','#/toast-error'],['Disabled actions','#/disabled'],['Archived','#/archived']]]
 ]
};

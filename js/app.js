(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const app = $('#app');
  const CONFIG = window.QUICKSCREEN_CONFIG || {};
  const SUPABASE_URL = String(CONFIG.supabaseUrl || '').replace(/\/(?:rest|auth|functions)\/v1\/?$/i, '').replace(/\/+$/, '');
  const AUTH_STORAGE_KEY = 'quickscreen-v2-auth';
  let authSession = null;
  try { authSession = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null'); } catch { localStorage.removeItem(AUTH_STORAGE_KEY); }
  const authStore = value => { authSession = value; if (value) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value)); else localStorage.removeItem(AUTH_STORAGE_KEY); };
  const recoveryParams = new URLSearchParams(location.hash.slice(1));
  let recoverySession = recoveryParams.get('type') === 'recovery' && recoveryParams.get('access_token') ? { access_token: recoveryParams.get('access_token') } : null;
  if (recoverySession) {
    authStore(null);
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  }
  async function authFetch(path, body, options = {}) {
    if (!SUPABASE_URL || !CONFIG.publishableKey) throw new Error('Aplikacja nie ma skonfigurowanego połączenia z Supabase.');
    const headers = { apikey: CONFIG.publishableKey, 'Content-Type': 'application/json' };
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
    const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, { method: options.method || 'POST', headers, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(path.startsWith('token?') && (response.status === 400 || response.status === 401) ? 'Nieprawidłowy e-mail lub hasło.' : payload.msg || payload.message || 'Nie udało się wykonać operacji.');
    return payload;
  }
  async function refreshSession() {
    if (!authSession?.refresh_token) return false;
    try { authStore(await authFetch('token?grant_type=refresh_token', { refresh_token: authSession.refresh_token })); return true; }
    catch { authStore(null); return false; }
  }
  async function apiRequest(path, options = {}) {
    if (!authSession?.access_token) throw new Error('Sesja wygasła. Zaloguj się ponownie.');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/quickscreen-api/v1${path}`, { ...options, headers: { apikey: CONFIG.publishableKey, Authorization: `Bearer ${authSession.access_token}`, 'Content-Type': 'application/json', ...options.headers } });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) { authStore(null); setRoute('login'); render(); throw new Error('Sesja wygasła. Zaloguj się ponownie.'); }
    if (!response.ok) throw new Error(payload.message || payload.error || 'Nie udało się pobrać danych.');
    return payload;
  }
  function uiMode(step) {
    const fields = step.fields || [];
    if (step.test.code === 'shoulder_clearing') return 'shoulder';
    const numeric = fields.some(field => field.answerSet.code === 'score_0_3');
    if (numeric) return fields.some(field => field.sideMode === 'bilateral') ? 'score' : 'single-score';
    const hasPain = fields.some(field => /pain|bol/i.test(field.code));
    const hasRange = fields.some(field => /range|zakres/i.test(field.code));
    if (hasPain && hasRange) return fields.some(field => field.sideMode === 'bilateral') ? 'bilateral-range' : 'single-range';
    return fields.some(field => field.sideMode === 'bilateral') ? 'clearing' : 'clearing';
  }
  async function loadQuickScreenData() {
    const [me, scenarios, clientsData, activity] = await Promise.all([apiRequest('/me'), apiRequest('/scenarios'), apiRequest('/clients'), apiRequest('/dashboard')]);
    trainer = me;
    const scenario = scenarios[0];
    if (!scenario) throw new Error('Brak aktywnego scenariusza badania.');
    currentScenario = await apiRequest(`/scenarios/${encodeURIComponent(scenario.screenTypeId)}/definition?locale=pl`);
    tests = currentScenario.steps.map(step => ({ key: step.test.code, name: step.test.name, en: step.test.originalEnglishName, mode: uiMode(step), criteria: String(step.test.description?.scoring_criteria || '').split(/\r?\n/).map(line => line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/)).filter(Boolean).map(match => [match[1], match[2]]), definition: step }));
    updateClientData(clientsData, activity);
  }
  function updateClientData(clientsData, activity) {
    clients = clientsData.map(client => ({ id: client.clientId, name: `${client.firstName} ${client.lastName}`, email: client.email, sport: client.discipline || '', date: client.latestAssessment?.date || '', score: client.latestAssessment?.score ?? null, maxScore: client.latestAssessment?.maximum ?? null, points: client.latestAssessment?.score ?? null, status: client.latestAssessment?.indicator || 'ok', latestAssessmentId: client.latestAssessment?.id || client.history?.[0]?.assessmentId || null, history: client.history || [], createdAt: client.createdAt }));
    if (activity) latestActivity = activity.map(item => ({ clientId: item.clientId, name: item.name, sport: item.sport || '', date: item.date, points: item.score ?? 0, status: item.indicator || (item.status === 'completed' ? 'ok' : 'warn') }));
  }
  async function refreshClientHistory() {
    const clientsData = await apiRequest('/clients');
    updateClientData(clientsData);
  }
  async function startAssessment() {
    const firstName = $('#client-first')?.value.trim() || '';
    const lastName = $('#client-last')?.value.trim() || '';
    const email = $('#client-email')?.value.trim() || '';
    const discipline = $('#client-sport')?.value.trim() || '';
    if (!selectedClient) {
      const resolved = await apiRequest('/clients/resolve', { method: 'POST', body: JSON.stringify({ firstName, lastName, email, discipline }) });
      selectedClient = { id: resolved.client.clientId, name: `${resolved.client.firstName} ${resolved.client.lastName}`, email: resolved.client.email, sport: discipline };
      if (!clients.some(client => client.id === selectedClient.id)) clients.push(selectedClient);
    }
    const date = new Date();
    const dateValue = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    let savedHandLength = null;
    try { savedHandLength = (await apiRequest(`/clients/${encodeURIComponent(selectedClient.id)}/shoulder-hand-length?screenTypeId=${encodeURIComponent(currentScenario.id)}`)).handLengthCm; } catch {}
    activeAssessment = { assessmentId: crypto.randomUUID(), clientId: selectedClient.id, date: dateValue, manualVersion: currentScenario.manualVersion };
    scores = {}; notes = {}; shoulderAutoScores = {}; shoulderMeasurements = { handLengthCm: savedHandLength ?? '', gaps: { left: '', right: '' } }; wizardIndex = 0;
    saveLocalDraft();
    setRoute('assessment/1');
  }
  const draftKey = () => `quickscreen-v2-draft:${authSession?.user?.id || authSession?.user_id || ''}`;
  function readLocalDraft() {
    try {
      const value = JSON.parse(localStorage.getItem(draftKey()) || 'null');
      if (!value || Date.now() - value.savedAt > 24 * 60 * 60 * 1000) { localStorage.removeItem(draftKey()); return null; }
      return value;
    } catch { localStorage.removeItem(draftKey()); return null; }
  }
  function removeLocalDraft() { localStorage.removeItem(draftKey()); }
  function saveLocalDraft() {
    if (!activeAssessment || !authSession?.access_token) return;
    localStorage.setItem(draftKey(), JSON.stringify({ savedAt: Date.now(), assessment: activeAssessment, client: selectedClient, scores, notes, shoulderMeasurements, wizardIndex }));
  }
  function restoreLocalDraft(draft) {
    activeAssessment = draft.assessment; selectedClient = draft.client; scores = draft.scores || {}; notes = draft.notes || {}; shoulderMeasurements = { handLengthCm: draft.shoulderMeasurements?.handLengthCm ?? '', gaps: { left: draft.shoulderMeasurements?.gaps?.left ?? '', right: draft.shoulderMeasurements?.gaps?.right ?? '' } }; shoulderAutoScores = {}; wizardIndex = Number(draft.wizardIndex) || 0;
    setRoute(`assessment/${wizardIndex + 1}`);
  }
  function offerResumeDraft() {
    if (recoveryPrompted) return;
    recoveryPrompted = true;
    const interrupted = readLocalDraft();
    if (!interrupted) return;
    if (window.confirm('Znaleziono przerwane badanie. Czy chcesz je wznowić? Wybierz Anuluj, aby je odrzucić.')) restoreLocalDraft(interrupted);
    else removeLocalDraft();
  }
  function assessmentPayload() {
    const answers = [];
    for (const test of tests) for (const field of test.definition.fields.filter(item => item.scoring)) {
      for (const side of field.sideMode === 'bilateral' ? ['left','right'] : ['none']) {
        const code = scores[`${field.code}:${side}`];
        const answer = field.answers.find(item => String(field.answerSet.code === 'score_0_3' ? item.value : item.code) === String(code));
        if (answer) answers.push({ fieldId: field.id, side, answerId: answer.id, attemptNumber: 1 });
      }
    }
    const testNotes = Object.fromEntries(Object.entries(notes).map(([index, note]) => [tests[Number(index)-1]?.definition.test.id, note]).filter(([id]) => id));
    const measurements = [];
    const handLength = Number(shoulderMeasurements.handLengthCm);
    if (shoulderMeasurements.handLengthCm !== '' && Number.isFinite(handLength) && handLength > 0) measurements.push({ measurementCode: 'shoulder_hand_length', side: 'none', valueCm: handLength });
    for (const side of ['left', 'right']) {
      const rawGap = shoulderMeasurements.gaps[side];
      const gap = Number(rawGap);
      if (rawGap !== '' && Number.isFinite(gap) && gap >= 0) measurements.push({ measurementCode: 'shoulder_fist_gap', side, valueCm: gap });
    }
    return { assessmentId: activeAssessment.assessmentId, clientId: activeAssessment.clientId, scenarioId: currentScenario.id, date: activeAssessment.date, manualVersion: activeAssessment.manualVersion, answers, notes: testNotes, measurements };
  }
  async function loadResults(assessmentId) {
    selectedAssessment = await apiRequest(`/assessments/${assessmentId}/results`);
    results = selectedAssessment.rows || [];
    return selectedAssessment;
  }
  async function loadReportConfiguration() {
    const [settings, resources] = await Promise.all([apiRequest('/report-settings'), apiRequest('/report-resources')]);
    reportSettings = settings || { blockVisibility: { intro: true, results: true, plan: true, help: true } };
    reportResources = resources || [];
  }
  let tests = [];
  let clients = [];
  let latestActivity = [];
  let results = [];
  let currentScenario = null;
  let trainer = null;
  let authError = '';
  let wizardIndex = 0;
  let selectedClient = null;
  let searchText = '';
  let scores = {};
  let notes = {};
  let shoulderMeasurements = { handLengthCm: '', gaps: { left: '', right: '' } };
  let shoulderAutoScores = {};
  let activeAssessment = null;
  let recoveryPrompted = false;
  let selectedAssessment = null;
  let reportSettings = { blockVisibility: { intro: true, results: true, plan: true, help: true } };
  let reportResources = [];
  let activeReport = null;
  let reportLoadError = '';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (name, size = 20) => {
    const paths = {
      dashboard:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      clients:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6"/>',
      test:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M12 9v7M8.5 12.5h7"/>',
      sheet:'<path d="M6 3.75A1.75 1.75 0 0 1 7.75 2h8.5A1.75 1.75 0 0 1 18 3.75V22l-6-4-6 4V3.75Z"/>',
      profile:'<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
      person:'<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
      search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
      gear:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.5a8 8 0 0 1-1.5.9l-.2 1.5h-2.4l-.2-1.5a8 8 0 0 1-1.6-.9l-1.3.5-1.2-2.1 1.1-.9a7 7 0 0 1 0-1.8l-1.1-.9 1.2-2.1 1.3.5a8 8 0 0 1 1.6-.9l.2-1.5h2.4l.2 1.5a8 8 0 0 1 1.5.9l1.4-.5 1.2 2.1-1.2.9a7 7 0 0 1 0 1.8Z"/>',
      chart:'<path d="M3 3v18h18M7 14l4-4 3 3 6-7"/>',
      print:'<path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/><path d="M17 11h1"/>',
      info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
      plus:'<path d="M12 5v14M5 12h14"/>',
      arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
      left:'<path d="m15 18-6-6 6-6M9 12h11"/>',
      personAdd:'<path d="M15 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6"/>'
    };
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.info}</svg>`;
  };
  const status = type => {
    if (type === 'ok') return `<span class="status-icon ok" role="img" aria-label="Wynik prawidłowy"><svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5"/><path d="m6.5 10 2.2 2.2 4.8-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    if (type === 'warn') return `<span class="status-icon warn" role="img" aria-label="Wynik wymaga uwagi"><svg viewBox="0 0 20 20" fill="none"><path d="M10 2.1 18 16H2L10 2.1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 7v4m0 2.5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>`;
    return `<span class="status-icon problem" role="img" aria-label="Wynik nieprawidłowy"><svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5"/><path d="M10 5.5v5m0 3h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span>`;
  };
  const activityStatus = type => {
    const labels = { ok: 'Bez bólu, asymetrii i ograniczeń', warn: 'Asymetria lub ograniczenie w ostatnim badaniu', problem: 'Ból w ostatnim badaniu' };
    const label = labels[type] || labels.warn;
    return status(type).replace('<span class="status-icon', `<span title="${label}" class="status-icon`).replace(/aria-label="[^"]*"/, `aria-label="${label}"`);
  };
  const navItems = [['#/dashboard','dashboard','Panel'],['#/clients','clients','Klienci'],['#/new-assessment','test','Badanie'],['#/cheat-sheet','sheet','Ściąga']];
  const routePath = () => location.hash.replace(/^#\/?/, '') || 'dashboard';
  const route = () => routePath().startsWith('report/') ? 'report' : routePath();
  const newAssessmentClientId = () => {
    const match = routePath().match(/^new-assessment\/([^/]+)$/);
    if (!match) return null;
    try { return decodeURIComponent(match[1]); } catch { return match[1]; }
  };
  const setRoute = path => { location.hash = `/${path}`; };
  const currentNav = path => path.startsWith('clients')||path.startsWith('client')||path==='results' ? '#/clients' : path.startsWith('new-assessment')||path.startsWith('assessment') ? '#/new-assessment' : path==='cheat-sheet' ? '#/cheat-sheet' : path==='profile' ? '#/profile' : '#/dashboard';
  function shell(content, active, options = {}) {
    const report = options.report;
    const items = options.client ? [['#/client-dashboard','chart','Moje wyniki']] : navItems;
    const top = report ? `<div class="report-mobile-brand"><img src="assets/logo/kb-logo.png" alt="Karol Bilecki"><b>QuickScreen</b><span>RAPORT RUCHOWY</span></div>` : `<header class="topbar ${options.client?'topbar-client':''}"><div class="topbar-inner"><a class="brand" href="${options.client?'#/client-dashboard':'#/dashboard'}" aria-label="KB Trener"><img src="assets/logo/kb-logo.png" alt="Karol Bilecki"></a><nav class="desktop-nav" aria-label="Nawigacja główna">${items.map(([href,ic,label])=>`<a class="nav-link ${active===href?'active':''}" href="${href}">${options.client?label:label==='Panel'?'Panel pracy':label==='Badanie'?'Nowe badanie':label==='Ściąga'?'Ściąga':'Klienci'}</a>`).join('')}</nav><a class="account" href="${options.client?'#/client-profile':'#/profile'}" aria-label="${options.client?'Profil klienta':'Profil trenera'}"><span class="avatar">${options.client?'GK':(trainer?.displayName||'T').split(/\s+/).slice(0,2).map(name=>name[0]).join('').toLocaleUpperCase('pl')}</span><span>${options.client?'Gaweł Kot':(trainer?.displayName||'Trener')}</span></a></div>${options.client?'':`<div class="mobile-subtitle">${options.subtitle||'QuickScreen · Panel Pracy'}</div>`}</header>`;
    const mobileNav = `<nav class="mobile-nav ${report?'report-nav':''}" aria-label="Nawigacja mobilna">${items.map(([href,ic,label])=>`<a class="${active===href?'active':''}" href="${href}">${icon(ic,22)}<span>${label}</span></a>`).join('')}</nav>`;
    return `<div class="statusbar"><span>9:41</span><span class="status-icons"><svg viewBox="0 0 18 14" fill="currentColor"><path d="M1 13h2V9H1zm4 0h2V6H5zm4 0h2V3H9zm4 0h2V1h-2z"/></svg><svg viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1.5 4.5a11 11 0 0 1 15 0M4 7a7.5 7.5 0 0 1 10 0m-7.5 2.5a4 4 0 0 1 5 0M9 12h.01"/></svg><svg viewBox="0 0 24 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1.5" width="19" height="11" rx="2.5"/><path d="M22 5v4"/><rect x="3" y="3.5" width="14" height="7" rx="1.3" fill="currentColor" stroke="none"/></svg></span></div>${top}${content}${mobileNav}<span class="ios-home ${report?'report-home':''}" aria-hidden="true"></span>`;
  }
  const SPEC_VERSION = '2.1';
  function loginPage(message = '', messageType = 'error', email = '') { return `<main class="login-page"><section class="login-card"><img src="assets/logo/kb-logo.png" alt="KB Trener" class="login-logo"><p class="login-kicker">QUICKSCREEN · PANEL PRACY</p><h1>Zaloguj się</h1><p class="login-intro">Wprowadź dane konta, aby otworzyć panel QuickScreen.</p><form id="login-form"><label class="login-field">E-mail<input name="email" type="email" autocomplete="username" value="${esc(email)}" required></label><label class="login-field">Hasło<input name="password" type="password" autocomplete="current-password" required></label>${message ? `<p class="login-message ${messageType === 'success' ? 'success' : ''}" role="${messageType === 'success' ? 'status' : 'alert'}">${esc(message)}</p>` : ''}<button class="btn btn-primary login-submit" type="submit">Zaloguj się</button><button class="login-forgot" type="button" data-action="forgot-password">Zapomniałem hasła</button></form></section><p class="login-caption">KB Trener · QuickScreen</p></main>`; }
  function passwordResetPage(message = '') { return `<main class="login-page"><section class="login-card"><img src="assets/logo/kb-logo.png" alt="KB Trener" class="login-logo"><p class="login-kicker">QUICKSCREEN · PANEL PRACY</p><h1>Ustaw nowe hasło</h1><p class="login-intro">Wybierz nowe hasło do konta QuickScreen.</p><form id="password-reset-form"><label class="login-field">Nowe hasło<input name="password" type="password" autocomplete="new-password" minlength="8" required></label><label class="login-field">Powtórz hasło<input name="password-confirm" type="password" autocomplete="new-password" minlength="8" required></label>${message ? `<p class="login-message" role="alert">${esc(message)}</p>` : ''}<button class="btn btn-primary login-submit" type="submit">Zapisz nowe hasło</button></form></section><p class="login-caption">KB Trener · QuickScreen</p></main>`; }
  function footer() { return `<footer class="site-footer"><span>Wersja specyfikacji: ${SPEC_VERSION}</span></footer>`; }
  function trendChart(history=[]){return window.QuickScreenReportUI.trendChart(history);}
  function dashboard(){const active='#/dashboard';return shell(`<main class="page dashboard-page"><section class="hero-card card"><div><h1>Witaj, ${trainer?.displayName||""}</h1><p>Rozpocznij nowe badanie lub sprawdź ostatnią aktywność. Narzędzie QuickScreen ułatwia szybką identyfikację ograniczeń ruchowych oraz punktów bolesnych.</p></div><a class="btn btn-primary" href="#/new-assessment">${icon('plus',19)} Nowe badanie</a></section><section class="activity-card card"><div class="section-title"><h2>Ostatnia aktywność</h2><a class="btn btn-small" href="#/clients">Lista klientów　›</a></div>${latestActivity.map(c=>`<a class="activity-row" href="#/client/${c.clientId}" aria-label="Otwórz profil: ${c.name}"><span class="activity-dot">${icon('person',19)}</span><span class="activity-meta"><b>${c.name}</b><span>${c.sport}　•　${c.date}</span></span>${activityStatus(c.status)}<span class="score-chip">${c.points} PKT</span></a>`).join('')}</section><section class="quick-links"><a class="quick-link card" href="#/report-settings"><span class="quick-icon">${icon('gear')}</span><span class="quick-arrow">→</span><div><h3>Ustawienia raportu</h3><p>Wybierz dostępne bloki raportu i zarządzaj materiałami dla klientów.</p></div></a></section></main>${footer()}`,active);}
  function lastTestAction(c,small=false){return c.latestAssessmentId?`<a class="btn ${small?'btn-small':''}" href="#/results/${c.latestAssessmentId}">Ostatni test</a>`:`<span class="btn ${small?'btn-small':''}" aria-disabled="true" title="Brak zakończonego badania">Ostatni test</span>`;}
  function clientRow(c){return `<tr data-client-row="#/client/${c.id}" tabindex="0" aria-label="Otwórz profil: ${esc(c.name)}"><td><a class="client-name" href="#/client/${c.id}">${esc(c.name)}</a><span class="client-email">${esc(c.email)}</span></td><td>${esc(c.sport)}</td><td>${esc(c.date)}</td><td><strong>${c.score===null?'—':`${c.score}/${c.maxScore??'—'}`}</strong></td><td>${c.status?activityStatus(c.status):'<span class="muted">—</span>'}</td><td><div class="row-actions"><a class="btn btn-small btn-blue" href="#/new-assessment/${encodeURIComponent(c.id)}">+ Test</a>${lastTestAction(c,true)}</div></td></tr>`;}
  function clientCard(c){return `<article class="client-card" data-client-row="#/client/${c.id}" tabindex="0" aria-label="Otwórz profil: ${esc(c.name)}"><div class="client-card-top"><div><a class="client-name" href="#/client/${c.id}">${esc(c.name)}</a><span class="client-email">${esc(c.email)}</span></div><div class="client-score">${c.status?activityStatus(c.status):''}<span>${c.score===null?'—':`${c.score}/${c.maxScore??'—'}`}</span></div></div><div class="client-card-meta"><span>Dyscyplina<b>${esc(c.sport)}</b></span><span>Ostatni test<b>${esc(c.date)}</b></span></div><div class="client-card-actions"><a class="btn btn-blue" href="#/new-assessment/${encodeURIComponent(c.id)}">+ Test</a>${lastTestAction(c)}</div></article>`;}
  function clientsPage(){const filtered=clients.filter(c=>`${c.name} ${c.email} ${c.sport}`.toLowerCase().includes(searchText.toLowerCase()));return shell(`<main class="page"><div class="page-heading"><div><h1>Klienci</h1><p>Profile osób ocenianych w module QuickScreen.</p></div><button class="btn btn-primary" data-action="add-client">+ Dodaj klienta</button></div><div class="list-tools card"><input class="search" id="client-search" type="search" placeholder="⌕  Szukaj po nazwisku, imieniu lub e-mailu..." value="${esc(searchText)}" aria-label="Szukaj klientów"></div><div class="table-wrap card"><table class="data-table"><thead><tr><th>Imię i nazwisko / email</th><th>Dyscyplina</th><th>Ostatnie badanie</th><th>Wynik</th><th>Status</th><th>Akcje</th></tr></thead><tbody>${filtered.map(clientRow).join('')}</tbody></table></div><div class="mobile-client-list">${filtered.map(clientCard).join('')}</div></main>${footer()}`,'#/clients');}
  function historyTable(client){const history=client.history||[];return `<section class="history-card card"><h2>Historia badań</h2><table class="data-table"><thead><tr><th>Data badania</th><th>Wynik</th><th>Status</th><th>Akcje</th></tr></thead><tbody>${history.map(item=>{const date=new Date(`${item.date}T00:00:00`).toLocaleDateString('pl-PL');const state=item.indicator|| (item.score===0?'problem':item.score===1?'warn':'ok');return `<tr><td><strong>${date}</strong></td><td><strong>${item.score??'—'}/${item.maximum??'—'}</strong></td><td>${activityStatus(state)}</td><td class="history-actions"><a href="#/results/${item.assessmentId}">Wyniki</a><a href="#/report/${item.assessmentId}">Raport</a></td></tr>`;}).join('')}</tbody></table></section>`;}
  function historyMobile(client){const history=client.history||[];return `<section class="history-mobile"><h2>Historia badań</h2>${history.map(item=>{const date=new Date(`${item.date}T00:00:00`).toLocaleDateString('pl-PL');const state=item.indicator|| (item.score===0?'problem':item.score===1?'warn':'ok');return `<article class="history-mobile-card card"><div class="history-mobile-top"><time>${date}<small>Data badania</small></time><strong>${activityStatus(state)}${item.score??'—'}/${item.maximum??'—'}</strong></div><div class="history-mobile-actions"><span>Akcje:</span><a href="#/results/${item.assessmentId}">Wyniki</a><a href="#/report/${item.assessmentId}">Raport</a></div></article>`;}).join('')}</section>`;}
  function profileBanner(client, clientMode=false){const initials=client.name.split(/\s+/).slice(0,2).map(name=>name[0]).join('').toLocaleUpperCase('pl');const created=client.createdAt?new Date(client.createdAt).toLocaleDateString('pl-PL'):'';return `<section class="profile-banner card"><span class="initials">${esc(initials)}</span><div class="profile-main"><h1>${esc(client.name)}</h1><p>${esc(client.email)}　•　<span class="sport">${esc(client.sport)}</span>　•　<span class="muted">Klient od: ${created}</span></p></div><div class="profile-actions ${clientMode?'client-actions':''}">${clientMode?`<a class="btn" href="#/profile">Edytuj profil</a>`:`<a class="btn" href="#/profile">Edytuj profil</a><a class="btn btn-primary" href="#/new-assessment/${encodeURIComponent(client.id)}">+ Nowe badanie</a>`}</div></section>`;}
  function profilePage(clientMode=false,clientId=clients[0].id){const c=clients.find(x=>x.id===clientId)||clients[0];const nav=clientMode?'#/client-dashboard':'#/clients';const history=c.history||[];const best=history.reduce((value,item)=>item.score!=null&&(!value||item.score>value.score)?item:value,null);const latest=history[0];return shell(`<main class="page ${clientMode?'client-dashboard-page':''}">${clientMode?'':`<a class="back-link" href="#/clients">${icon('left',15)} Wróć do listy klientów</a>`}${profileBanner(c,clientMode)}<div class="profile-grid">${historyTable(c)}<section class="trend-card card"><div class="section-title"><h2>${clientMode?'Podsumowanie moich trendów':'Podsumowanie trendów'}</h2><span class="body-copy"><i class="chart-dot"></i><small>${clientMode?'Wynik QS':'Score'}</small></span></div>${trendChart(history)}<div class="trend-stat"><span>${clientMode?'Liczba wykonanych badań':'Liczba badań'}</span><b>${history.length}</b></div><div class="trend-stat"><span>${clientMode?'Najlepszy wynik życiowy':'Najlepszy wynik'}</span><b class="good">${best?`${best.score}/${best.maximum}`:'—'} <small class="muted">${best?`(${new Date(`${best.date}T00:00:00`).toLocaleDateString('pl-PL')})`:''}</small></b></div><div class="trend-stat"><span>${clientMode?'Ostatnio uzyskany wynik':'Ostatnie badanie'}</span><b class="bad">${latest?`${latest.score}/${latest.maximum} <small class="muted">(${new Date(`${latest.date}T00:00:00`).toLocaleDateString('pl-PL')})</small>`:'—'}</b></div></section>${historyMobile(c)}</div></main>${footer()}`,nav,{client:clientMode,subtitle:clientMode?'Wyniki badań':'QuickScreen · Panel Pracy'});}
  function newAssessment(invalidClient=false){const invalidNotice=invalidClient?'<p class="login-message" role="alert">Nie znaleziono wskazanego klienta. Wyszukaj profil lub wpisz dane klienta.</p>':'';return shell(`<main class="page page-narrow"><div class="page-heading"><div><h1>Nowe badanie</h1><p>Krok 1 z ${tests.length+2} — Konfiguracja i dane klienta</p></div></div><section class="new-card card">${invalidNotice}<h2>Wybierz klienta</h2><p>Wyszukaj istniejący profil albo wpisz dane nowego klienta.</p><div class="field"><label for="client-first">Imię *</label><input id="client-first" value="${selectedClient?.name.split(' ')[0]||''}" autocomplete="given-name"><div class="suggestions" id="suggestions-first" aria-live="polite"></div></div><div class="field"><label for="client-last">Nazwisko *</label><input id="client-last" value="${selectedClient?.name.split(' ').slice(1).join(' ')||''}" placeholder="Wpisz nazwisko" autocomplete="family-name"><div class="suggestions" id="suggestions-last" aria-live="polite"></div></div><div class="field"><label for="client-email">E-mail *</label><input id="client-email" type="email" value="${selectedClient?.email||''}" placeholder="email@example.com"><div class="suggestions" id="suggestions-email" aria-live="polite"></div></div><div class="field"><label for="client-sport">Dyscyplina wiodąca</label><input id="client-sport" value="${selectedClient?.sport||''}" placeholder="np. Piłka nożna, Bieganie"></div><div class="new-footer"><button class="btn btn-primary" data-action="start-assessment">Przejdź do badania ${icon('arrow',16)}</button></div></section></main>${footer()}`,'#/new-assessment',{subtitle:`Krok 1 z ${tests.length+2} — Konfiguracja`});}
  function scoreOptions(step,side){const val=scores[`${step}-${side}`];return `<span class="score-label">Wybierz wynik (score)</span><div class="score-options">${[['0','Ból'],['1','Słabo'],['2','W normie'],['3','Super!']].map(([n,label])=>`<button type="button" class="score-option ${String(val)===n?'selected':''}" data-score="${n}" data-key="${step}-${side}"><span class="n">${n}</span><span>${label}</span></button>`).join('')}</div>`;}
  function binaryOptions(step,key,label,kind){const val=scores[`${step}-${key}`];return `<span class="field-label">${label}</span><div class="binary-options">${(kind==='pain'?[['no','Brak bólu'],['yes','Ból']]:[['pass','Pass'],['fail','Fail']]).map(([v,text])=>`<button class="binary-option ${val===v?`selected ${v==='yes'||v==='fail'?'pain':'pass'}`:''}" data-value="${v}" data-key="${step}-${key}">${text}</button>`).join('')}</div>`;}
  function sideScore(step,side){return `<article class="side-card"><h3>${side==='left'?'Lewa strona':'Prawa strona'}</h3>${scoreOptions(step,side)}</article>`;}
  function shoulderFieldCode() { return tests.find(test => test.key === 'shoulder_mobility')?.definition.fields.find(field => field.answerSet.code === 'score_0_3')?.code || ''; }
  function syncShoulderAutoScores(updateControls = true) {
    const fieldCode = shoulderFieldCode();
    if (!fieldCode) return;
    for (const side of ['left', 'right']) {
      const score = window.QuickScreenShoulderMeasurements.score(shoulderMeasurements.handLengthCm, shoulderMeasurements.gaps[side]);
      const key = `${fieldCode}:${side}`;
      if (score === null) {
        if (shoulderAutoScores[side]) delete scores[key];
        delete shoulderAutoScores[side];
      } else {
        scores[key] = score;
        shoulderAutoScores[side] = true;
      }
      if (!updateControls) continue;
      document.querySelectorAll(`[data-key="${key}"]`).forEach(button => {
        const selected = score === null ? String(scores[key]) === button.dataset.score : Number(button.dataset.score) === score;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
        button.disabled = score !== null;
        button.title = score !== null ? 'Wynik wyliczony z pomiarów' : '';
      });
    }
  }
  function testFields(test,index) {
    const fields=test.definition.fields.filter(field=>field.scoring);
    if(test.key==='shoulder_mobility') syncShoulderAutoScores(false);
    const renderField=(field,side)=>{const key=`${field.code}:${side}`;const numeric=field.answerSet.code==='score_0_3';const derived=numeric&&test.key==='shoulder_mobility'&&window.QuickScreenShoulderMeasurements.score(shoulderMeasurements.handLengthCm,shoulderMeasurements.gaps[side])!==null;return `<div class="field-control"><span class="field-label">${esc(field.label)}</span><div class="${numeric?'score-options':'binary-options'}">${field.answers.map(answer=>{const selected=String(scores[key])===String(numeric?answer.value:answer.code);const tone=/positive|pain|yes|fail/i.test(answer.code)?'pain':'pass';return `<button type="button" class="${numeric?'score-option':'binary-option'} ${selected?`selected ${numeric?'':tone}`:''}" data-key="${esc(key)}" data-value="${esc(answer.code)}" ${numeric?`data-score="${answer.value}"`:''} ${derived?'disabled title="Wynik wyliczony z pomiarów"':''} aria-pressed="${selected}">${numeric?`<span class="n">${esc(answer.value)}</span>`:''}<span>${esc(answer.label)}</span></button>`}).join('')}</div></div>`;};
    const groups=fields.some(field=>field.sideMode==='bilateral')?['left','right']:['none'];
    const handLengthInput=test.key==='shoulder_mobility'?`<div class="shoulder-measurement-fields"><label for="shoulder-hand-length">Długość dłoni (cm)<input id="shoulder-hand-length" type="number" min="0.1" max="100" step="0.1" inputmode="decimal" data-shoulder-measurement="handLengthCm" value="${esc(shoulderMeasurements.handLengthCm)}"><small>Od bruzdy nadgarstka do końca środkowego palca.</small></label></div>`:'';
    return `${handLengthInput}<div class="sides ${groups.length===1?'single-field':''}">${groups.map(side=>`<article class="side-card"><h3>${side==='left'?'Lewa strona':side==='right'?'Prawa strona':'Wynik testu'}</h3>${fields.map(field=>field.sideMode==='bilateral'?renderField(field,side):renderField(field,'none')).join('')}${test.key==='shoulder_mobility'&&side!=='none'?`<label class="shoulder-distance-field">Odległość między pięściami — ${side==='left'?'lewa':'prawa'} strona (cm)<input type="number" min="0" max="100" step="0.1" inputmode="decimal" data-shoulder-measurement="gap" data-side="${side}" value="${esc(shoulderMeasurements.gaps[side])}"></label>`:''}</article>`).join('')}</div>`;
  }  function assessment(){const ix=Math.min(tests.length-1,Math.max(0,wizardIndex)),test=tests[ix];const prev=ix===0?'new-assessment':`assessment/${ix}`;const next=ix===tests.length-1?'results':`assessment/${ix+2}`;const following=tests[ix+1];return shell(`<main class="page"><div class="assessment-meta card"><span class="client-ident"><i class="mini-dot"></i>${selectedClient?.name||''}</span><span>Dyscyplina: ${selectedClient?.sport||''}</span><span>Data badania: ${activeAssessment?.date||""}</span><span class="protocol-tag">Protokół QuickScreen</span></div><section class="progress-card card"><div class="progress-label"><b>Postęp badania (Krok ${ix+1} z ${tests.length})</b><span>Test: ${test.en}</span></div><div class="progress-track">${tests.map((_,n)=>`<a class="progress-segment ${n<ix?'done':n===ix?'current':''}" href="#/assessment/${n+1}" aria-label="Przejdź do kroku ${n+1}"></a>`).join('')}</div></section><section class="test-card card"><div class="test-head"><h1>Test ${ix+1} z ${tests.length}: ${test.name}</h1><button class="btn" data-action="criteria">${icon('info',14)} Standardy</button></div><div class="criteria-panel" id="criteria-panel">${criteriaMarkup(test)}</div>${testFields(test,ix)}<div class="notes"><label for="test-note">Notatka / uwagi do testu (opcjonalnie)</label><textarea id="test-note" data-note="${ix+1}" placeholder="Wpisz ewentualne obserwacje dotyczące kompensacji ruchowych...">${esc(notes[ix+1]||'')}</textarea></div><div class="test-actions"><a class="btn" href="#/${prev}">${icon('left',15)} Wstecz</a><a class="btn btn-primary" href="#/${next}">Dalej${following?`: ${following.name}`:''} ${icon('arrow',15)}</a></div></section></main>${footer()}`,'#/new-assessment',{subtitle:`Krok ${ix+1} z ${tests.length} — Test`});}
  function resultDetail(value,kind){if(value===null||value===undefined||value==='')return '';if(kind==='summary'||kind==='score')return esc(value);return esc(value);}
  function resultDetails(items=[]){return items.map(item=>`<span class="result-detail ${esc(item.tone||'')}"><b>${esc(item.label)}:</b> ${esc(item.value)}</span>`).join('');}
  function finalResult(r){if(r.finalScore===undefined)return status(r.status);const tone=r.finalScore===0?'problem':r.finalScore===1?'warn':r.status==='warn'?'warn':'ok';return `<b class="numeric-final ${tone}">${r.finalScore}</b>`;}
  function resultRow(r,i,withFinal=true,extraClass=''){return `<div class="result-row ${r.child?'child':''} ${extraClass}"><span class="muted">${i+1}</span><span>${status(r.status)}</span><span class="test-name">${esc(r.name)}</span>${r.merged?`<span class="result-value merged">${resultDetails(r.valueDetails)||resultDetail(r.detail||r.value,r.kind)}</span>`:`<span class="result-value">${resultDetails(r.lDetails)||resultDetail(r.l,r.kind)}</span><span class="result-value">${resultDetails(r.rDetails)||resultDetail(r.r,r.kind)}</span>`}${withFinal?`<span class="result-value final-status">${finalResult(r)}</span>`:''}</div>`;}
  function resultRows(){let output='';for(let i=0;i<results.length;){const row=results[i];if(row.groupKey){const group=[];while(i<results.length&&results[i].groupKey===row.groupKey)group.push(results[i++]);output+=`<div class="shoulder-result-group">${group.map((item,offset)=>resultRow(item,i-group.length+offset,false,'shoulder-row')).join('')}<span class="result-value final-status shoulder-final">${finalResult(group.find(item=>item.finalScore!==undefined)||group[0])}</span></div>`;}else output+=resultRow(row,i++);}return output;}
  function resultMobileDetail(r){if(r.kind==='summary'){if(r.lDetails||r.rDetails)return `${r.lDetails?.length?`L: ${resultDetails(r.lDetails)}`:''}${r.lDetails?.length&&r.rDetails?.length?'　•　':''}${r.rDetails?.length?`P: ${resultDetails(r.rDetails)}`:''}`;if(r.valueDetails?.length)return resultDetails(r.valueDetails);return esc(r.detail||'');}if(r.kind==='score'){if(r.merged)return `Punkty: ${esc(r.value)}`;return `${r.l?`L: ${esc(r.l)}`:''}${r.l&&r.r?'　•　':''}${r.r?`P: ${esc(r.r)}`:''}`;}return `${r.l?`L: ${resultDetail(r.l,r.kind)}`:''}${r.l&&r.r?'　•　':''}${r.r?`P: ${resultDetail(r.r,r.kind)}`:''}`;}
  function resultCards(){return results.map((r,i)=>`<article class="result-mobile-row card"><span class="index">${i+1}</span><span class="result-mobile-main"><b>${r.name}</b><small>${resultMobileDetail(r)}</small></span><span class="final-status">${r.sharedScore==='shoulder'&&r.child?status(r.status):finalResult(r)}</span></article>`).join('');}
  function resultsPage(){const date=selectedAssessment?.date?new Date(`${selectedAssessment.date}T00:00:00`).toLocaleDateString('pl-PL'):'';const client=selectedAssessment?.client;const name=client?`${client.firstName} ${client.lastName}`:'';const sport=clients.find(item=>item.id===client?.clientId)?.sport||'';const total=selectedAssessment?.totalScore??0;const maximum=selectedAssessment?.maximum??0;const reportHref=selectedAssessment?.assessmentId?`#/report/${encodeURIComponent(selectedAssessment.assessmentId)}`:'#/report';return shell(`<main class="page"><div class="page-heading"><div><h1>Badanie z ${date}</h1><p>Surowe dane badania technicznego dla trenera</p></div><div class="heading-actions"><a class="btn" href="#/dashboard">← Wróć do panelu trenera</a><a class="btn btn-primary" href="${reportHref}">Otwórz raport badania ${icon('arrow',15)}</a></div></div><section class="results-summary card"><div class="total-score"><small>Wynik całkowity (score)</small><strong>${total}</strong> <span>/ ${maximum} punktów</span></div><div class="summary-person"><small>Oceniany</small><b>${esc(name)}</b><span>${esc(sport)} • QuickScreen</span></div></section><div class="result-mobile-actions"><a class="btn" href="#/dashboard">← Panel trenera</a><a class="btn btn-primary" href="${reportHref}">Otwórz raport ${icon('arrow',14)}</a></div><div class="result-list-title">Szczegółowa lista wyników (${results.length} pozycji)</div><section class="result-table card"><div class="result-table-head"><span>#</span><span></span><span>Nazwa testu</span><span>L strona</span><span>P strona</span><span>Wynik końcowy</span></div>${resultRows()}</section><section class="result-table-mobile">${resultCards()}</section></main>${footer()}`,'#/clients',{subtitle:'Wyniki badania'});}
  function cheatSheet(){const order=['Odcinek szyjny (Kark)','Skłon do palców','Mobilność barku','Przysiad','Balans','Rotacje'];const priorities=['Ból / wynik 0 (Protect + specjalista)','Wynik 1 / FAIL / Asymetria','Wynik 2 (akceptowalny)','Wynik 3 (optymalny)'];const steps=[['KROK 1','Protect','Unikaj ruchów prowokujących ból, odciąż dany rejon.','protect'],['KROK 2','Correct','Wdróż celowane ćwiczenia zwiększające ruchomość.','correct'],['KROK 3','Retest','Sprawdź ponownie po skończonym cyklu.','retest'],['KROK 4','Develop','Rozwijaj wzorzec w normalnym, bezpiecznym treningu.','develop']];return shell(`<main class="page"><div class="page-heading"><div><h1>Ściąga trenera — Quick Screen</h1><p>Szybka pomoc przy interpretacji wyników i wyborze priorytetu korekcyjnego</p></div></div><div class="cheat-grid"><section class="cheat-card card"><h2>Krok 1: Jak wybrać priorytet</h2><div class="flow-list priority-list">${priorities.map((x,i)=>`<div class="flow-item"><span class="flow-number">${i+1}</span>${x}</div>${i<priorities.length-1?'<span class="flow-arrow">↓</span>':''}`).join('')}</div><p class="hint"><b>Uwaga:</b> Celem jest wybranie jednego głównego weak link, a nie poprawianie wszystkiego jednocześnie.</p></section><section class="cheat-card card"><h2>Krok 2: Hierarchia wzorców</h2><div class="flow-list">${order.map((x,i)=>`<div class="flow-item"><span class="flow-number">${i+1}</span>${x}</div>${i<order.length-1?'<span class="flow-arrow">↓</span>':''}`).join('')}</div><p class="hint"><b>Uwaga:</b> Mobility jest rozpatrywane przed stability/motor control. Ta kolejność jest hierarchią korekcyjną.</p></section></div><section class="cycle-card card"><h2>Co dalej?</h2><div class="cycle-steps">${steps.map(([n,title,txt,cls])=>`<article class="cycle-step ${cls}"><small>${n}</small><b>${title}</b><p>${txt}</p></article>`).join('')}</div></section></main>${footer()}`,'#/cheat-sheet',{subtitle:'Ściąga trenera'});}
  function report(){
    if(!selectedAssessment)return shell('<main class="page report-loading"><section class="card"><h1>Otwieram badanie…</h1><p>Ładuję wyniki potrzebne do wygenerowania raportu.</p></section></main>','#/clients',{report:true});
    if(reportLoadError)return shell(`<main class="page"><section class="card"><h1>Nie udało się wygenerować raportu</h1><p>${esc(reportLoadError)}</p><a class="btn" href="#/results/${esc(selectedAssessment.assessmentId)}">Wróć do wyników</a></section></main>`,'#/clients',{report:true});
    return shell('<main class="page report-loading"><section class="card"><h1>Generuję raport…</h1><p>Raport będzie zawierał wszystkie bloki dla trenera oraz bloki włączone dla klienta.</p></section></main>','#/clients',{report:true});
  }
  async function generateReport(){
    reportLoadError='';
    try {
      const routeAssessmentId=routePath().match(/^report\/([^/]+)$/)?.[1];
      if(routeAssessmentId&&selectedAssessment?.assessmentId!==decodeURIComponent(routeAssessmentId))await loadResults(decodeURIComponent(routeAssessmentId));
      if(!selectedAssessment){
        const latest=await apiRequest('/assessments/latest');
        if(latest?.assessmentId)await loadResults(latest.assessmentId);
      }
      if(!selectedAssessment)throw new Error('Nie znaleziono ukończonego badania. Otwórz wyniki badania i spróbuj ponownie.');
      const client=selectedAssessment.client||{};
      const sport=clients.find(item=>item.id===client.clientId)?.sport||'';
      const resources=reportResources.filter(item=>item.isActive!==false).map(item=>({id:item.id,title:item.title,type:item.type,url:item.url,description:item.description,testCode:item.testCode,isActive:item.isActive}));
      const clientVisibleBlocks=window.QuickScreenReport.BLOCKS.filter(block=>reportSettings.blockVisibility?.[block.id]!==false).map(block=>block.id);
      const resourceIds=resources.map(resource=>resource.id);
      const snapshot=window.QuickScreenReport.buildReport({...selectedAssessment,tests:selectedAssessment.tests||selectedAssessment.rows||[]},{sport,resources,selectedBlocks:window.QuickScreenReport.BLOCKS.map(block=>block.id)});
      const created=await apiRequest('/reports',{method:'POST',body:JSON.stringify({assessmentId:selectedAssessment.assessmentId,visibleBlocks:clientVisibleBlocks,resourceIds,snapshot})});
      activeReport={reportId:created.reportId,snapshot:created.snapshot};
      setRoute(`client-report/${created.reportId}`);
    } catch(error) {reportLoadError=error.message;render();}
  }
  function reportSettingsPage(){return shell(window.QuickScreenReportUI.settings(reportSettings),'#/dashboard',{subtitle:'Ustawienia raportu'});}
  async function loadSavedReport(reportId){
    const stored=await apiRequest(`/reports/${encodeURIComponent(reportId)}`);
    const source=stored.snapshot;
    if(!source?.assessmentId){activeReport=stored;return;}
    const assessment=await apiRequest(`/assessments/${encodeURIComponent(source.assessmentId)}/results`);
    const refreshed=window.QuickScreenReport.buildReport({...assessment,tests:assessment.tests||assessment.rows||[]},{sport:source.sport||'',resources:source.blocks?.help?.resources||[],selectedBlocks:window.QuickScreenReport.BLOCKS.map(block=>block.id)});
    refreshed.blocks.help=source.blocks?.help||refreshed.blocks.help;
    refreshed.visibleBlocks=source.visibleBlocks||refreshed.visibleBlocks;
    refreshed.clientVisibleBlocks=source.clientVisibleBlocks||source.visibleBlocks||refreshed.visibleBlocks;
    activeReport={...stored,snapshot:refreshed};
  }
  function savedReportPage(){
    const snapshot=activeReport?.snapshot;
    if(!snapshot)return shell('<main class="page"><section class="card"><h1>Nie udało się otworzyć raportu</h1><p>Raport nie istnieje albo nie masz do niego dostępu.</p><a class="btn" href="#/dashboard">Wróć do panelu</a></section></main>','#/dashboard');
    return shell(window.QuickScreenReportUI.render(snapshot,{audience:'trainer'}),'#/clients',{report:true,reportDate:snapshot.assessmentDate||''});
  }  function profileSettings(clientMode=false){return shell(`<main class="page profile-screen"><div class="page-heading"><div><h1>Mój profil</h1><p>Dane ${clientMode?'klienta':'konta trenerskiego'}</p></div></div><section class="profile-banner card"><span class="initials">${clientMode?'GK':'K'}</span><div class="profile-main"><h1>${clientMode?'Gaweł Kot':'Trener Karol'}</h1><p>${clientMode?'Piłka nożna':'KB Trener · QuickScreen'}</p></div><button class="btn">Edytuj profil</button></section><section class="card"><h2>Dane profilu</h2><div class="field"><label>Imię i nazwisko</label><input value="${clientMode?'Gaweł Kot':'Karol Bilecki'}" readonly></div><div class="field"><label>E-mail</label><input value="${clientMode?'gawel.kot@example.com':'trener@kbtrener.pl'}" readonly></div><div class="field"><label>${clientMode?'Dyscyplina':'Organizacja'}</label><input value="${clientMode?'Piłka nożna':'KB Trener'}" readonly></div></section></main>${footer()}`,clientMode?'#/client-profile':'#/profile',{client:clientMode});}
  function render(){const r=route();document.body.classList.toggle('is-report',r==='report'||r.startsWith('client-report/'));if(recoverySession){document.body.classList.remove('is-report');app.innerHTML=passwordResetPage(authError);return;}if(!authSession?.access_token){if(r!=='login')setRoute('login');app.innerHTML=loginPage(authError);return;}if(r==='login')setRoute('dashboard');if(r==='dashboard')app.innerHTML=dashboard();else if(r==='clients')app.innerHTML=clientsPage();else if(r.startsWith('client/'))app.innerHTML=profilePage(false,r.split('/')[1]);else if(r==='client-dashboard'||r==='my-results')app.innerHTML=profilePage(true);else if(r==='client-profile')app.innerHTML=profileSettings(true);else if(r==='new-assessment'||r.startsWith('new-assessment/')){const contextId=newAssessmentClientId();selectedClient=contextId?clients.find(c=>c.id===contextId)||null:null;app.innerHTML=newAssessment(Boolean(contextId&&!selectedClient));}else if(r.startsWith('assessment/')){wizardIndex=Math.max(0,Math.min(tests.length-1,Number(r.split('/')[1])-1||0));app.innerHTML=assessment();}else if(r==='results'||r.startsWith('results/'))app.innerHTML=resultsPage();else if(r==='report')app.innerHTML=report();else if(r==='report-settings')app.innerHTML=reportSettingsPage();else if(r.startsWith('client-report/'))app.innerHTML=savedReportPage();else if(r==='cheat-sheet')app.innerHTML=cheatSheet();else if(r==='profile')app.innerHTML=profileSettings();else app.innerHTML=dashboard();window.scrollTo(0,0);}
  app.addEventListener('submit', async event => {
    if (event.target.id !== 'password-reset-form') return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    if (values.password !== values['password-confirm']) { app.innerHTML = passwordResetPage('Hasła nie są takie same.'); return; }
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Zapisywanie…';
    try {
      await authFetch('user', { password: values.password }, { method: 'PUT', accessToken: recoverySession.access_token });
      recoverySession = null;
      authError = '';
      app.innerHTML = loginPage('Hasło zostało zmienione. Zaloguj się nowym hasłem.', 'success');
    } catch (error) {
      app.innerHTML = passwordResetPage(error.message);
    }
  });
  app.addEventListener('click', async event => {
    const button = event.target.closest('[data-action="forgot-password"]');
    if (!button) return;
    event.preventDefault();
    const emailInput = $('#login-form [name="email"]');
    if (!emailInput?.value.trim()) { emailInput?.reportValidity(); return; }
    button.disabled = true;
    button.textContent = 'Wysyłanie…';
    try {
      const email = emailInput.value.trim().toLocaleLowerCase('en');
      const redirectTo = window.location.origin + window.location.pathname;
      await authFetch('recover?redirect_to=' + encodeURIComponent(redirectTo), { email });
      app.innerHTML = loginPage('Jeśli konto istnieje, wysłaliśmy na ten adres link do ustawienia nowego hasła.', 'success', email);
    } catch (error) {
      app.innerHTML = loginPage(error.message, 'error', emailInput.value.trim());
    }
  });
  app.addEventListener('submit', async event => {
    if (event.target.id !== 'login-form') return;
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    const values = Object.fromEntries(new FormData(event.target));
    button.disabled = true;
    button.textContent = 'Logowanie…';
    try {
      authStore(await authFetch('token?grant_type=password', { email: values.email.trim(), password: values.password }));
      await loadQuickScreenData();
      await loadReportConfiguration();
      setRoute('dashboard');
      offerResumeDraft();
      render();
    } catch (error) {
      authStore(null);
      app.innerHTML = loginPage(error.message, 'error', values.email.trim());
    } finally {
      const currentButton = app.querySelector('#login-form button[type="submit"]');
      if (currentButton) { currentButton.disabled = false; currentButton.textContent = 'Zaloguj się'; }
    }
  });
  app.addEventListener('input',e=>{if(['client-first','client-last','client-email'].includes(e.target.id)){selectedClient=null;const field=e.target.id;const query=e.target.value.trim();const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();const boxes=['first','last','email'].map(name=>$('#suggestions-'+name));boxes.forEach(box=>{if(box)box.classList.remove('show');});const box=$('#suggestions-'+field.replace('client-',''));if(box&&query.length>=3){const matches=clients.filter(c=>[c.name,c.email].some(value=>normalize(value).includes(normalize(query))));box.innerHTML=matches.length?matches.map(c=>`<div class="suggestion" data-client="${c.id}"><span><b>${c.name}</b><small>${c.email} (${c.sport})</small></span><small>Wybierz profil</small></div>`).join(''):'<div class="suggestion-empty">Brak pasujących profili</div>';box.classList.add('show');}return;}if(e.target.id==='client-search'){searchText=e.target.value;const pos=e.target.selectionStart;app.innerHTML=clientsPage();const input=$('#client-search');input.focus();input.setSelectionRange(pos,pos);}if(e.target.id==='test-note'){notes[e.target.dataset.note]=e.target.value;saveLocalDraft();return;}if(e.target.matches('[data-shoulder-measurement]')){if(e.target.dataset.shoulderMeasurement==='handLengthCm')shoulderMeasurements.handLengthCm=e.target.value;else shoulderMeasurements.gaps[e.target.dataset.side]=e.target.value;syncShoulderAutoScores();saveLocalDraft();}});
  app.addEventListener('click',e=>{const clientRow=e.target.closest('[data-client-row]');if(clientRow&&!e.target.closest('a,button,input,select,textarea')){location.hash=clientRow.dataset.clientRow;return;}const option=e.target.closest('[data-value]');if(option){const key=option.dataset.key;const test=tests[wizardIndex];const field=test?.definition.fields.find(item=>key.startsWith(`${item.code}:`));scores[key]=field?.answerSet.code==='score_0_3'?Number(option.dataset.score):option.dataset.value;saveLocalDraft();option.parentElement.querySelectorAll('.score-option,.binary-option').forEach(item=>{const selected=item===option;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));item.classList.remove('pass','pain');if(selected&&item.classList.contains('binary-option'))item.classList.add(/positive|pain|yes|fail/i.test(item.dataset.value)?'pain':'pass');});return;}const suggestion=e.target.closest('[data-client]');if(suggestion){selectedClient=clients.find(c=>c.id===suggestion.dataset.client)||null;document.querySelectorAll('.suggestions').forEach(x=>x.classList.remove('show'));const first=$('#client-first');if(first)first.value=selectedClient.name.split(' ')[0];const last=$('#client-last');if(last)last.value=selectedClient.name.split(' ').slice(1).join(' ');const email=$('#client-email');if(email)email.value=selectedClient.email;const sport=$('#client-sport');if(sport)sport.value=selectedClient.sport;setRoute(`new-assessment/${encodeURIComponent(selectedClient.id)}`);return;}const action=e.target.closest('[data-action]');if(action){if(action.dataset.action==='criteria'){$('#criteria-panel')?.classList.toggle('open');return;}if(action.dataset.action==='start-assessment'){startAssessment().catch(error=>window.alert(error.message));return;}if(action.dataset.action==='add-client'){setRoute('new-assessment');return;}}});
  app.addEventListener('keydown',e=>{const clientRow=e.target.closest('[data-client-row]');if(clientRow&&!e.target.closest('a,button,input,select,textarea')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();location.hash=clientRow.dataset.clientRow;}});
  app.addEventListener('submit', async event => {
    const form = event.target;
    if (form.id === 'report-settings-form') {
      event.preventDefault();
      return;
    }
  });
  app.addEventListener('change', async event => {
    if (event.target.name === 'blockVisibility') {
      const form = $('#report-settings-form');
      const status = $('#report-settings-status');
      const blockVisibility = Object.fromEntries(window.QuickScreenReport.BLOCKS.map(block => [block.id, Boolean(form.querySelector(`[name="blockVisibility"][value="${block.id}"]`)?.checked)]));
      const checkboxes = [...form.querySelectorAll('[name="blockVisibility"]')];
      checkboxes.forEach(input => { input.disabled = true; });
      if (status) status.textContent = 'Zapisywanie…';
      try {
        reportSettings = await apiRequest('/report-settings', { method: 'PATCH', body: JSON.stringify({ blockVisibility }) });
        if (status) status.textContent = 'Zapisano. Ustawienie obowiązuje przy następnym otwarciu raportu.';
      } catch (error) {
        if (status) status.textContent = `Nie udało się zapisać: ${error.message}`;
        checkboxes.forEach(input => { input.checked = reportSettings.blockVisibility?.[input.value] !== false; });
      } finally { checkboxes.forEach(input => { input.disabled = false; }); }
      return;
    }
  });
  window.addEventListener('hashchange', async event => {
    if (route() === 'report') { render(); await generateReport(); return; }
    if (activeAssessment) {
      try {
        if (route() === 'results') {
          await apiRequest('/assessments/complete', { method: 'POST', body: JSON.stringify(assessmentPayload()) });
          await loadResults(activeAssessment.assessmentId);
          removeLocalDraft();
          activeAssessment = null;
          try { await refreshClientHistory(); }
          catch { window.alert('Badanie zostało zapisane, ale nie udało się odświeżyć historii klienta. Odśwież stronę, aby zobaczyć nowy wynik.'); }
        } else if (route().startsWith('assessment/')) {
          wizardIndex = Math.max(0, Math.min(tests.length - 1, Number(route().split('/')[1]) - 1 || 0));
          saveLocalDraft();
        }
      } catch (error) {
        if (route() === 'results') { window.alert(error.message); setRoute(`assessment/${tests.length}`); return; }
      }
    } else if (route().startsWith('results/') && route().split('/')[1] && selectedAssessment?.assessmentId !== route().split('/')[1]) {
      try { await loadResults(route().split('/')[1]); }
      catch (error) { window.alert(error.message); }
    } else if (route() === 'results' && !selectedAssessment) {
      try { const latest = await apiRequest('/assessments/latest'); if (latest?.assessmentId) await loadResults(latest.assessmentId); }
      catch (error) { window.alert(error.message); }
    }
    if (route().startsWith('client-report/')) {
      const reportId = route().split('/')[1];
      if (activeReport?.reportId !== reportId) {
        try { await loadSavedReport(reportId); }
        catch (error) { reportLoadError = error.message; activeReport = null; }
      }
    }
    if (route() === 'report-settings' && !reportResources.length) {
      try { await loadReportConfiguration(); } catch (error) { reportLoadError = error.message; }
    }
    render();
  });
  (async()=>{if(authSession?.expires_at&&authSession.expires_at*1000<Date.now()+60000)await refreshSession();if(authSession?.access_token){try{await loadQuickScreenData();await loadReportConfiguration();if(route().startsWith('results/'))await loadResults(route().split('/')[1]);if(routePath().startsWith('report/'))await loadResults(decodeURIComponent(routePath().split('/')[1]));if(route().startsWith('client-report/'))await loadSavedReport(route().split('/')[1]);}catch(error){authError=error.message;authStore(null);}if(authSession?.access_token)offerResumeDraft();}render();if(authSession?.access_token&&route()==='report')await generateReport();})();
})();

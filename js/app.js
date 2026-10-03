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
    const numeric = fields.some(field => field.answerSet?.code === 'score_0_3');
    if (numeric) return fields.some(field => field.sideMode === 'bilateral') ? 'score' : 'single-score';
    const hasPain = fields.some(field => /pain|bol/i.test(field.code));
    const hasRange = fields.some(field => /range|zakres/i.test(field.code));
    if (hasPain && hasRange) return fields.some(field => field.sideMode === 'bilateral') ? 'bilateral-range' : 'single-range';
    return fields.some(field => field.sideMode === 'bilateral') ? 'clearing' : 'clearing';
  }
  function installScenarioDefinition(definition) {
    currentScenario = definition;
    tests = definition.steps.map(step => ({ key: step.test.code, name: step.test.name, en: step.test.originalEnglishName, mode: uiMode(step), criteria: String(step.test.description?.scoring_criteria || '').split(/\r?\n/).map(line => line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/)).filter(Boolean).map(match => [match[1], match[2]]), definition: step }));
    return definition;
  }
  async function loadScenarioDefinition(screenTypeId) {
    if (!screenTypeId) throw new Error('Wybierz protokół badania.');
    return installScenarioDefinition(await apiRequest(`/scenarios/${encodeURIComponent(screenTypeId)}/definition?locale=pl`));
  }
  async function loadQuickScreenData() {
    const [me, availableScreenTypes, clientsData, activity] = await Promise.all([apiRequest('/me'), apiRequest('/scenarios'), apiRequest('/clients'), apiRequest('/dashboard')]);
    trainer = me;
    screenTypes = availableScreenTypes;
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
  async function chooseAssessmentProtocol() {
    const firstName = $('#client-first')?.value.trim() || '';
    const lastName = $('#client-last')?.value.trim() || '';
    const email = $('#client-email')?.value.trim() || '';
    const discipline = $('#client-sport')?.value.trim() || '';
    if (!selectedClient) {
      const resolved = await apiRequest('/clients/resolve', { method: 'POST', body: JSON.stringify({ firstName, lastName, email, discipline }) });
      selectedClient = { id: resolved.client.clientId, name: `${resolved.client.firstName} ${resolved.client.lastName}`, email: resolved.client.email, sport: discipline };
      if (!clients.some(client => client.id === selectedClient.id)) clients.push(selectedClient);
    }
    selectedScreenTypeId = '';
    setRoute(`new-assessment/select-protocol/${encodeURIComponent(selectedClient.id)}`);
  }
  async function startAssessment() {
    const protocol = screenTypes.find(item => item.screenTypeId === selectedScreenTypeId);
    if (!protocol) throw new Error('Wybierz dostępny protokół badania.');
    if (!selectedClient) throw new Error('Wybierz klienta przed rozpoczęciem badania.');
    const definition = await loadScenarioDefinition(protocol.screenTypeId);
    const date = new Date();
    const dateValue = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    let savedHandLength = null;
    if (tests.some(test => test.key === 'shoulder_mobility')) {
      try { savedHandLength = (await apiRequest(`/clients/${encodeURIComponent(selectedClient.id)}/shoulder-hand-length?screenTypeId=${encodeURIComponent(definition.id)}`)).handLengthCm; } catch {}
    }
    activeAssessment = { assessmentId: crypto.randomUUID(), clientId: selectedClient.id, screenTypeId: protocol.screenTypeId, date: dateValue, manualVersion: definition.manualVersion };
    scores = {}; fieldMeasurements = {}; fieldMeasurementUnits = {}; notes = {}; shoulderAutoScores = {}; shoulderMeasurements = { handLengthCm: savedHandLength ?? '', gaps: { left: '', right: '' } }; wizardIndex = 0;
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
    localStorage.setItem(draftKey(), JSON.stringify({ savedAt: Date.now(), assessment: activeAssessment, client: selectedClient, scores, fieldMeasurements, fieldMeasurementUnits, notes, shoulderMeasurements, wizardIndex }));
  }
  async function restoreLocalDraft(draft) {
    const protocolId = draft.assessment.screenTypeId || screenTypes.find(item => item.code === 'quick_screen')?.screenTypeId;
    if (!protocolId) throw new Error('Nie znaleziono protokołu potrzebnego do wznowienia szkicu.');
    draft.assessment.screenTypeId = protocolId;
    selectedScreenTypeId = protocolId;
    await loadScenarioDefinition(protocolId);
    activeAssessment = draft.assessment; selectedClient = draft.client; scores = draft.scores || {}; fieldMeasurements = draft.fieldMeasurements || {}; fieldMeasurementUnits = draft.fieldMeasurementUnits || {}; notes = draft.notes || {}; shoulderMeasurements = { handLengthCm: draft.shoulderMeasurements?.handLengthCm ?? '', gaps: { left: draft.shoulderMeasurements?.gaps?.left ?? '', right: draft.shoulderMeasurements?.gaps?.right ?? '' } }; shoulderAutoScores = {}; wizardIndex = Number(draft.wizardIndex) || 0;
    setRoute(`assessment/${wizardIndex + 1}`);
  }
  async function offerResumeDraft() {
    if (recoveryPrompted) return;
    recoveryPrompted = true;
    const interrupted = readLocalDraft();
    if (!interrupted) return;
    if (window.confirm('Znaleziono przerwane badanie. Czy chcesz je wznowić? Wybierz Anuluj, aby je odrzucić.')) await restoreLocalDraft(interrupted);
    else removeLocalDraft();
  }
  function assessmentPayload() {
    const answers = [];
    for (const test of tests) for (const field of test.definition.fields.filter(item => (item.scoring || item.wizardInput) && item.fieldType !== 'measurement')) {
      for (const side of field.sideMode === 'bilateral' ? ['left','right'] : ['none']) {
        const code = scores[`${field.code}:${side}`];
        if (field.controlType === 'checkbox' && code !== 'positive') continue;
        const answer = field.answers.find(item => String(field.answerSet.code === 'score_0_3' ? item.value : item.code) === String(code));
        if (answer) answers.push({ fieldId: field.id, side, answerId: answer.id, attemptNumber: 1 });
      }
    }
    const testNotes = Object.fromEntries(Object.entries(notes).map(([index, note]) => [tests[Number(index)-1]?.definition.test.id, note]).filter(([id]) => id));
    const measurementAnswers = [];
    for (const test of tests) for (const field of test.definition.fields.filter(item => item.fieldType === 'measurement')) {
      for (const side of field.sideMode === 'bilateral' ? ['left', 'right'] : ['none']) {
        const value = fieldMeasurements[`${field.code}:${side}`];
        if (value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value))) {
          measurementAnswers.push({ fieldId: field.id, side, attemptNumber: 1, value: Number(value), unit: fieldMeasurementUnits[field.measurementUnitGroup] || field.measurementUnit });
        }
      }
    }
    const measurements = [];
    const handLength = Number(shoulderMeasurements.handLengthCm);
    if (shoulderMeasurements.handLengthCm !== '' && Number.isFinite(handLength) && handLength > 0) measurements.push({ measurementCode: 'shoulder_hand_length', side: 'none', valueCm: handLength });
    for (const side of ['left', 'right']) {
      const rawGap = shoulderMeasurements.gaps[side];
      const gap = Number(rawGap);
      if (rawGap !== '' && Number.isFinite(gap) && gap >= 0) measurements.push({ measurementCode: 'shoulder_fist_gap', side, valueCm: gap });
    }
    return { assessmentId: activeAssessment.assessmentId, clientId: activeAssessment.clientId, scenarioId: activeAssessment.screenTypeId || currentScenario.id, date: activeAssessment.date, manualVersion: activeAssessment.manualVersion || currentScenario.manualVersion, answers, notes: testNotes, measurements, fieldMeasurements: measurementAnswers };
  }
  function validateFmsMcsCompletion(){if(currentScenario?.code!=='fms')return null;const allFields=tests.flatMap(test=>test.definition.fields);const value=code=>{const field=allFields.find(item=>item.code===code);const raw=fieldMeasurements[`${code}:none`];return raw==null||raw===''?null:Number(raw);};const lowerLength=value('fms_lower_body_mcs_foot_length');const upperLength=value('fms_upper_body_mcs_foot_length');const lowerSkipped=scores['fms_lower_body_mcs_skipped:none']==='positive';const upperSkipped=scores['fms_upper_body_mcs_skipped:none']==='positive';return window.FmsProtocol.validateCompletion({lowerSkipped,lowerLength,lowerLeft:value('fms_lower_body_mcs_distance_left'),lowerRight:value('fms_lower_body_mcs_distance_right'),upperSkipped,upperLength,upperLeft:value('fms_upper_body_mcs_distance_left'),upperRight:value('fms_upper_body_mcs_distance_right')});}
  function firstMissingEditAnswer(){const mcsMissing=validateFmsMcsCompletion();if(mcsMissing)return mcsMissing;for(const test of tests)for(const field of test.definition.fields.filter(item=>item.required||item.scoring))for(const side of field.sideMode==='bilateral'?['left','right']:['none']){const value=field.fieldType==='measurement'?fieldMeasurements[`${field.code}:${side}`]:scores[`${field.code}:${side}`];if(value==null||value==='')return field.label;}return null;}
  let editReturnRoute = null;
  async function saveAssessmentEdit() {
    if (!isEditingAssessment || !activeAssessment) return;
    if (!activeAssessment.date) { window.alert("Assessment date is required before saving."); return; }
    const missingAnswer = firstMissingEditAnswer();
    if (missingAnswer) { window.alert(`Brakuje wyniku dla pola: ${missingAnswer}. Uzupe\u0142nij go przed zapisem, aby nie utraci\u0107 danych badania.`); return; }
    try {
      await apiRequest(`/assessments/${encodeURIComponent(activeAssessment.assessmentId)}`, { method: 'PATCH', body: JSON.stringify({ ...assessmentPayload(), correctionNote: 'Korekta danych badania w interfejsie edycji.' }) });
      const assessmentId = activeAssessment.assessmentId;
      isEditingAssessment = false;
      activeAssessment = null;
      removeLocalDraft();
      await loadResults(assessmentId);
      try { await refreshClientHistory(); } catch {}
      setRoute(editReturnRoute || `results/${assessmentId}`);
      editReturnRoute = null;
      render();
    } catch (error) { window.alert(`Nie udało się zapisać zmian: ${error.message}`); }
  }  async function loadResults(assessmentId) {
    resultsLoadError = '';
    selectedAssessment = null;
    results = [];
    try {
      selectedAssessment = await apiRequest(`/assessments/${assessmentId}/results`);
      if (!selectedAssessment || selectedAssessment.assessmentId !== assessmentId) throw new Error('Nie znaleziono wynik\u00f3w tego badania.');
      results = selectedAssessment.rows || [];
      return selectedAssessment;
    } catch (error) {
      resultsLoadError = error.message || 'Nie uda\u0142o si\u0119 pobra\u0107 wynik\u00f3w.';
      throw error;
    }
  }
  async function editAssessment(assessmentId) {
    const record = await apiRequest(`/assessments/${encodeURIComponent(assessmentId)}`);
    await loadScenarioDefinition(record.screen_type_id);
    selectedScreenTypeId = record.screen_type_id;
    selectedClient = { id: record.clients.client_id, name: `${record.clients.first_name} ${record.clients.last_name}`, email: record.clients.email };
    activeAssessment = { assessmentId: record.assessment_id, clientId: record.client_id, screenTypeId: record.screen_type_id, date: record.assessment_date, manualVersion: record.manual_version };
    scores = {};
    fieldMeasurements = {};
    fieldMeasurementUnits = {};
    for (const answer of record.assessment_answers || []) {
      const field = tests.flatMap(test => test.definition.fields).find(item => item.id === answer.test_field_id);
      const option = field?.answers.find(item => item.id === answer.answer_option_id);
      if (field && option) scores[`${field.code}:${answer.side}`] = field.answerSet.code === 'score_0_3' ? option.value : option.code;
    }
    for (const measurement of record.assessment_field_measurements || []) {
      const field = tests.flatMap(test => test.definition.fields).find(item => item.id === measurement.test_field_id);
      if (field) {
        fieldMeasurements[`${field.code}:${measurement.side}`] = String(measurement.numeric_value);
        if (field.measurementUnitGroup) fieldMeasurementUnits[field.measurementUnitGroup] = measurement.unit;
      }
    }
    notes = Object.fromEntries(tests.flatMap((test, index) => (record.assessment_test_notes || []).filter(note => note.test_id === test.definition.test.id).map(note => [String(index + 1), note.note])));
    const measurements = record.assessment_measurements || [];
    shoulderMeasurements = {
      handLengthCm: measurements.find(item => item.measurement_code === 'shoulder_hand_length' && item.side === 'none')?.value_cm ?? '',
      gaps: {
        left: measurements.find(item => item.measurement_code === 'shoulder_fist_gap' && item.side === 'left')?.value_cm ?? '',
        right: measurements.find(item => item.measurement_code === 'shoulder_fist_gap' && item.side === 'right')?.value_cm ?? '',
      },
    };
    shoulderAutoScores = {};
    isEditingAssessment = true;
    wizardIndex = 0;
    render();
  }
  function assessmentEditModal(){if(!isEditingAssessment||!activeAssessment)return '';const date=activeAssessment.date?new Date(`${activeAssessment.date}T00:00:00`).toLocaleDateString('pl-PL'):'';return `<div class="assessment-edit-overlay" data-edit-backdrop><section class="assessment-edit-modal" role="dialog" aria-modal="true" aria-labelledby="assessment-edit-title"><header class="assessment-edit-header"><div><span class="assessment-edit-kicker">KOREKTA BADANIA · ${esc(date)}</span><h1 id="assessment-edit-title">Edytuj badanie</h1><p>${esc(selectedClient?.name||'')} · Zmień tylko wybrane pola; pozostałe dane pozostaną bez zmian.</p></div><button type="button" class="assessment-edit-close" data-action="cancel-assessment-edit" aria-label="Zamknij edycję">×</button></header><div class="assessment-edit-content"><label class="assessment-date-control">Data badania<input type="date" required data-assessment-date value="${esc(activeAssessment.date||'')}"></label>${tests.map((test,index)=>`<section class="assessment-edit-test card"><div class="assessment-edit-test-head"><span class="assessment-edit-index">${String(index+1).padStart(2,'0')}</span><h2>${esc(test.name)}</h2><button type="button" class="btn btn-small" data-action="criteria" data-test-index="${index}">${icon('info',14)} Standardy</button></div><div class="criteria-panel" id="criteria-panel-${index}">${criteriaMarkup(test)}</div>${testFields(test,index)}<div class="notes"><label for="edit-test-note-${index}">Notatka / uwagi do testu (opcjonalnie)</label><textarea id="edit-test-note-${index}" data-note="${index+1}" placeholder="Wpisz ewentualne obserwacje dotyczące kompensacji ruchowych...">${esc(notes[index+1]||'')}</textarea></div></section>`).join('')}</div><footer class="assessment-edit-footer"><button type="button" class="btn" data-action="cancel-assessment-edit">Anuluj</button><button type="button" class="btn btn-primary" data-action="save-assessment-edit">Zapisz zmiany</button></footer></section></div>`;}
  async function loadReportConfiguration() {
    const [settings, resources] = await Promise.all([apiRequest('/report-settings'), apiRequest('/report-resources')]);
    reportSettings = settings || { blockVisibility: { intro: true, results: true, plan: true, help: true } };
    reportResources = resources || [];
  }
  let tests = [];
  let screenTypes = [];
  let selectedScreenTypeId = '';
  let clients = [];
  let latestActivity = [];
  let results = [];
  let resultsLoadError = '';
  let currentScenario = null;
  let trainer = null;
  let authError = '';
  let wizardIndex = 0;
  let selectedClient = null;
  let searchText = '';
  let scores = {};
  let fieldMeasurements = {};
  let fieldMeasurementUnits = {};
  let notes = {};
  let shoulderMeasurements = { handLengthCm: '', gaps: { left: '', right: '' } };
  let shoulderAutoScores = {};
  let activeAssessment = null;
  let isEditingAssessment = false;
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
    const match = routePath().match(/^new-assessment\/(?:select-protocol\/)?([^/]+)$/);
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
  function historyTable(client){const history=client.history||[];return `<section class="history-card card"><h2>Historia bada\u0144</h2><table class="data-table"><thead><tr><th>Data badania</th><th>Wynik</th><th>Status</th><th>Akcje</th></tr></thead><tbody>${history.map(item=>{const date=new Date(`${item.date}T00:00:00`).toLocaleDateString('pl-PL');const state=item.indicator|| (item.score===0?'problem':item.score===1?'warn':'ok');return `<tr><td><strong>${date}</strong></td><td><strong>${item.score??'\u2014'}/${item.maximum??'\u2014'}</strong></td><td>${activityStatus(state)}</td><td class="history-actions"><a aria-label="Otw\u00f3rz z ${date}" href="#/results/${item.assessmentId}">Otw\u00f3rz</a><button class="history-edit-action" data-action="edit-assessment" data-assessment="${esc(item.assessmentId)}">Edytuj</button><a aria-label="Zobacz raport z ${date}" href="#/report/${item.assessmentId}">Raport</a></td></tr>`;}).join('')}</tbody></table></section>`;}
  function historyMobile(client){const history=client.history||[];return `<section class="history-mobile"><h2>Historia bada\u0144</h2>${history.map(item=>{const date=new Date(`${item.date}T00:00:00`).toLocaleDateString('pl-PL');const state=item.indicator|| (item.score===0?'problem':item.score===1?'warn':'ok');return `<article class="history-mobile-card card"><div class="history-mobile-top"><time>${date}<small>Data badania</small></time><strong>${activityStatus(state)}${item.score??'\u2014'}/${item.maximum??'\u2014'}</strong></div><div class="history-mobile-actions"><a href="#/results/${item.assessmentId}">Otw\u00f3rz</a><button class="history-edit-action" data-action="edit-assessment" data-assessment="${esc(item.assessmentId)}">Edytuj</button><a href="#/report/${item.assessmentId}">Raport</a></div></article>`;}).join('')}</section>`;}
  function profileBanner(client, clientMode=false){const initials=client.name.split(/\s+/).slice(0,2).map(name=>name[0]).join('').toLocaleUpperCase('pl');const created=client.createdAt?new Date(client.createdAt).toLocaleDateString('pl-PL'):'';return `<section class="profile-banner card"><span class="initials">${esc(initials)}</span><div class="profile-main"><h1>${esc(client.name)}</h1><p>${esc(client.email)}　•　<span class="sport">${esc(client.sport)}</span>　•　<span class="muted">Klient od: ${created}</span></p></div><div class="profile-actions ${clientMode?'client-actions':''}">${clientMode?`<a class="btn" href="#/client-profile">Edytuj profil</a>`:`<a class="btn" href="#/client-edit/${encodeURIComponent(client.id)}">Edytuj profil</a><a class="btn btn-primary" href="#/new-assessment/${encodeURIComponent(client.id)}">+ Nowe badanie</a>`}</div></section>`;}
  function profilePage(clientMode=false,clientId=clients[0].id){const c=clients.find(x=>x.id===clientId)||clients[0];const nav=clientMode?'#/client-dashboard':'#/clients';const history=c.history||[];const best=history.reduce((value,item)=>item.score!=null&&(!value||item.score>value.score)?item:value,null);const latest=history[0];return shell(`<main class="page ${clientMode?'client-dashboard-page':''}">${clientMode?'':`<a class="back-link" href="#/clients">${icon('left',15)} Wróć do listy klientów</a>`}${profileBanner(c,clientMode)}<div class="profile-grid">${historyTable(c)}<section class="trend-card card"><div class="section-title"><h2>${clientMode?'Podsumowanie moich trendów':'Podsumowanie trendów'}</h2><span class="body-copy"><i class="chart-dot"></i><small>${clientMode?'Wynik QS':'Score'}</small></span></div>${trendChart(history)}<div class="trend-stat"><span>${clientMode?'Liczba wykonanych badań':'Liczba badań'}</span><b>${history.length}</b></div><div class="trend-stat"><span>${clientMode?'Najlepszy wynik życiowy':'Najlepszy wynik'}</span><b class="good">${best?`${best.score}/${best.maximum}`:'—'} <small class="muted">${best?`(${new Date(`${best.date}T00:00:00`).toLocaleDateString('pl-PL')})`:''}</small></b></div><div class="trend-stat"><span>${clientMode?'Ostatnio uzyskany wynik':'Ostatnie badanie'}</span><b class="bad">${latest?`${latest.score}/${latest.maximum} <small class="muted">(${new Date(`${latest.date}T00:00:00`).toLocaleDateString('pl-PL')})</small>`:'—'}</b></div></section>${historyMobile(c)}</div></main>${footer()}`,nav,{client:clientMode,subtitle:clientMode?'Wyniki badań':'QuickScreen · Panel Pracy'});}
  function newAssessment(invalidClient=false,selectProtocol=false){
    const invalidNotice=invalidClient?'<p class="login-message" role="alert">Nie znaleziono wskazanego klienta. Wyszukaj profil lub wpisz dane klienta.</p>':'';
    const protocolLabel=item=>item.code==='quick_screen'?'Quick Screen':item.name;
    const clientFields=`<h2>Wybierz klienta</h2><p>Wyszukaj istniejący profil albo wpisz dane nowego klienta.</p><div class="field"><label for="client-first">Imię *</label><input id="client-first" value="${selectedClient?.name.split(' ')[0]||''}" autocomplete="given-name"><div class="suggestions" id="suggestions-first" aria-live="polite"></div></div><div class="field"><label for="client-last">Nazwisko *</label><input id="client-last" value="${selectedClient?.name.split(' ').slice(1).join(' ')||''}" placeholder="Wpisz nazwisko" autocomplete="family-name"><div class="suggestions" id="suggestions-last" aria-live="polite"></div></div><div class="field"><label for="client-email">E-mail *</label><input id="client-email" type="email" value="${selectedClient?.email||''}" placeholder="email@example.com"><div class="suggestions" id="suggestions-email" aria-live="polite"></div></div><div class="field"><label for="client-sport">Dyscyplina wiodąca</label><input id="client-sport" value="${selectedClient?.sport||''}" placeholder="np. Piłka nożna, Bieganie"></div><div class="new-footer"><button class="btn btn-primary" data-action="choose-protocol">Wybierz test ${icon('arrow',16)}</button></div>`;
    const protocolChoices=screenTypes.length?`<fieldset class="protocol-choice-list"><legend>Dostępne protokoły</legend>${screenTypes.map(item=>`<label class="protocol-choice"><input type="radio" name="screenTypeId" value="${esc(item.screenTypeId)}" ${selectedScreenTypeId===item.screenTypeId?'checked':''}><span><strong>${esc(protocolLabel(item))}</strong></span></label>`).join('')}</fieldset><div class="new-footer"><a class="btn" href="#/new-assessment/${encodeURIComponent(selectedClient?.id||'')}">Wstecz</a><button class="btn btn-primary" id="start-selected-protocol" data-action="start-assessment" ${selectedScreenTypeId?'':'hidden'}>Przejdź do badania ${icon('arrow',16)}</button></div>`:'<p class="login-message" role="status">Brak dostępnych protokołów badania.</p>';
    const content=selectProtocol?`<h2>Wybierz test</h2><p>Wybierz protokół badania dla klienta: <strong>${esc(selectedClient?.name||'')}</strong>.</p>${protocolChoices}`:`${invalidNotice}${clientFields}`;
    return shell(`<main class="page page-narrow"><div class="page-heading"><div><h1>Nowe badanie</h1><p>${selectProtocol?'Wybierz protokół':'Dane klienta'}</p></div></div><section class="new-card card">${content}</section></main>${footer()}`,selectProtocol?'#/new-assessment':`#/new-assessment${selectedClient?`/${encodeURIComponent(selectedClient.id)}`:''}`,{subtitle:selectProtocol?'Krok 2 — Wybór protokołu':'Krok 1 — Dane klienta'});
  }
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
    const fields=test.definition.fields.filter(field=>(field.scoring||field.wizardInput)&&field.fieldType!=='measurement');
    const measurementFields=test.definition.fields.filter(field=>field.fieldType==='measurement');
    if(test.key==='shoulder_mobility') syncShoulderAutoScores(false);
    const renderField=(field,side)=>{const key=`${field.code}:${side}`;const numeric=field.answerSet.code==='score_0_3';const derived=numeric&&test.key==='shoulder_mobility'&&window.QuickScreenShoulderMeasurements.score(shoulderMeasurements.handLengthCm,shoulderMeasurements.gaps[side])!==null;const disabledBy=field.disabledByFieldCode&&scores[`${field.disabledByFieldCode}:${side}`]==='positive';if(field.controlType==='checkbox'){const checked=scores[key]==='positive';return `<label class="field-control dynamic-checkbox"><input type="checkbox" data-checkbox-field="${esc(field.code)}" data-side="${side}" ${checked?'checked':''}><span class="field-label">${esc(field.label)}</span></label>`;}return `<div class="field-control"><span class="field-label">${esc(field.label)}</span><div class="${numeric?'score-options':'binary-options'}">${field.answers.map(answer=>{const selected=String(scores[key])===String(numeric?answer.value:answer.code);const tone=/positive|pain|yes|fail/i.test(answer.code)?'pain':'pass';return `<button type="button" class="${numeric?'score-option':'binary-option'} ${selected?`selected ${numeric?'':tone}`:''}" data-key="${esc(key)}" data-value="${esc(answer.code)}" ${numeric?`data-score="${answer.value}"`:''} ${derived||disabledBy?'disabled':''} ${derived?'title="Wynik wyliczony z pomiarów"':''} aria-pressed="${selected}">${numeric?`<span class="n">${esc(answer.value)}</span>`:''}<span>${esc(answer.label)}</span></button>`}).join('')}</div></div>`;};
    const groups=fields.some(field=>field.sideMode==='bilateral')||measurementFields.some(field=>field.sideMode==='bilateral')?['left','right']:['none'];
    if (measurementFields.length) {
      const renderMeasurement=(field,side)=>{const key=`${field.code}:${side}`;const value=fieldMeasurements[key]??'';const unit=fieldMeasurementUnits[field.measurementUnitGroup]||field.measurementUnit;const skipped=field.disabledByFieldCode&&scores[`${field.disabledByFieldCode}:none`]==='positive';const id=`measurement-${field.id}-${side}`;const bounds=`${field.measurementMin!=null?` min="${esc(field.measurementMin)}"`:''}${field.measurementMax!=null?` max="${esc(field.measurementMax)}"`:''}${field.measurementStep!=null?` step="${esc(field.measurementStep)}"`:' step="any"'}`;const unitOptions=field.measurementUnitOptions||[];return `<label class="field-control" for="${esc(id)}"><span class="field-label">${esc(field.label)}${field.required?' *':''}</span>${unitOptions.length>1?`<span class="measurement-unit-options">${unitOptions.map(option=>`<button type="button" class="btn btn-small ${unit===option?'selected':''}" data-measurement-unit="${esc(field.measurementUnitGroup)}" data-unit="${esc(option)}" ${skipped?'disabled':''}>${esc(option)}</button>`).join('')}</span>`:''}<span class="measurement-input-wrap"><input id="${esc(id)}" type="number" inputmode="decimal"${bounds} data-measurement-field="${esc(field.code)}" data-side="${side}" value="${esc(value)}" ${skipped?'disabled':''}><span class="measurement-unit">${esc(unit)}</span></span>${field.helpText?`<small>${esc(field.helpText)}</small>`:''}</label>`;};
      const sides=measurementFields.concat(fields).some(field=>field.sideMode==='bilateral')?['left','right']:['none'];
      return `<div class="sides ${sides.length===1?'single-field':''}">${sides.map((side,index)=>`<article class="side-card"><h3>${side==='left'?'Lewa strona':side==='right'?'Prawa strona':'Wynik testu'}</h3>${fields.map(field=>field.sideMode==='bilateral'?renderField(field,side):!sides.includes('left')||index===0?renderField(field,'none'):'').join('')}${measurementFields.map(field=>field.sideMode==='bilateral'?renderMeasurement(field,side):!sides.includes('left')||index===0?renderMeasurement(field,'none'):'').join('')}</article>`).join('')}</div>`;
    }
    const handLengthInput=test.key==='shoulder_mobility'?`<div class="shoulder-measurement-fields"><label for="shoulder-hand-length">Długość dłoni (cm)<input id="shoulder-hand-length" type="number" min="0.1" max="100" step="0.1" inputmode="decimal" data-shoulder-measurement="handLengthCm" value="${esc(shoulderMeasurements.handLengthCm)}"><small>Od bruzdy nadgarstka do końca środkowego palca.</small></label></div>`:'';
    return `${handLengthInput}<div class="sides ${groups.length===1?'single-field':''}">${groups.map(side=>`<article class="side-card"><h3>${side==='left'?'Lewa strona':side==='right'?'Prawa strona':'Wynik testu'}</h3>${fields.map(field=>field.sideMode==='bilateral'?renderField(field,side):renderField(field,'none')).join('')}${test.key==='shoulder_mobility'&&side!=='none'?`<label class="shoulder-distance-field">Odległość między pięściami — ${side==='left'?'lewa':'prawa'} strona (cm)<input type="number" min="0" max="100" step="0.1" inputmode="decimal" data-shoulder-measurement="gap" data-side="${side}" value="${esc(shoulderMeasurements.gaps[side])}"></label>`:''}</article>`).join('')}</div>`;
  }  function criteriaMarkup(test){const items=test.criteria||[];if(items.length)return `<div class="criteria-list">${items.map(([label,detail])=>`<div class="criteria-point"><b>${esc(label)}</b><span>${esc(detail)}</span></div>`).join('')}</div>`;const summary=test.definition.test.criteriaSummary||'';return summary?`<p>${esc(summary)}</p>`:'<p>Kryteria nie s\u0105 dost\u0119pne dla tego testu.</p>'; }
  function assessment(){const ix=Math.min(tests.length-1,Math.max(0,wizardIndex)),test=tests[ix];const selectedProtocol=screenTypes.find(item=>item.screenTypeId===activeAssessment?.screenTypeId);const protocolLabel=selectedProtocol?.code==='quick_screen'?'QuickScreen':selectedProtocol?.name||'QuickScreen';const prev=ix===0?(isEditingAssessment?`results/${activeAssessment.assessmentId}`:`new-assessment/select-protocol/${encodeURIComponent(activeAssessment?.clientId||selectedClient?.id||'')}`):`assessment/${ix}`;const next=ix===tests.length-1?'results':`assessment/${ix+2}`;const following=tests[ix+1];return shell(`<main class="page"><div class="assessment-meta card"><span class="client-ident"><i class="mini-dot"></i>${selectedClient?.name||''}</span><span>Dyscyplina: ${selectedClient?.sport||''}</span><label class="assessment-date-control">Data badania<input type="date" required data-assessment-date value="${esc(activeAssessment?.date||'')}"></label><span class="protocol-tag">Protokół ${esc(protocolLabel)}</span></div><section class="progress-card card"><div class="progress-label"><b>Postęp badania (Krok ${ix+1} z ${tests.length})</b><span>Test: ${test.en}</span></div><div class="progress-track">${tests.map((_,n)=>`<a class="progress-segment ${n<ix?'done':n===ix?'current':''}" href="#/assessment/${n+1}" aria-label="Przejdź do kroku ${n+1}"></a>`).join('')}</div></section><section class="test-card card"><div class="test-head"><h1>${isEditingAssessment?`Edytuj badanie — ${test.name}`:`Test ${ix+1} z ${tests.length}: ${test.name}`}</h1><button class="btn" data-action="criteria">${icon('info',14)} Standardy</button></div><div class="criteria-panel" id="criteria-panel">${criteriaMarkup(test)}</div>${testFields(test,ix)}<div class="notes"><label for="test-note">Notatka / uwagi do testu (opcjonalnie)</label><textarea id="test-note" data-note="${ix+1}" placeholder="Wpisz ewentualne obserwacje dotyczące kompensacji ruchowych...">${esc(notes[ix+1]||'')}</textarea></div><div class="test-actions"><a class="btn" href="#/${prev}">${icon('left',15)} Wstecz</a>${isEditingAssessment&&ix===tests.length-1?`<button class="btn btn-primary" data-action="save-assessment-edit">Zapisz zmiany</button>`:`<a class="btn btn-primary" href="#/${next}">Dalej${following?`: ${following.name}`:''} ${icon('arrow',15)}</a>`}</div></section></main>${footer()}`,'#/new-assessment',{subtitle:`Krok ${ix+1} z ${tests.length} — Test`});}
  function resultDetail(value,kind){if(value===null||value===undefined||value==='')return '';if(kind==='summary'||kind==='score')return esc(value);return esc(value);}
  function resultDetails(items=[]){return items.map(item=>`<span class="result-detail ${esc(item.tone||'')}"><b>${esc(item.label)}:</b> ${esc(item.value)}</span>`).join('');}
  function finalResult(r){if(r.finalScore===undefined)return status(r.status);const asymmetric=r.leftScore!==null&&r.leftScore!==undefined&&r.rightScore!==null&&r.rightScore!==undefined&&Number.isFinite(Number(r.leftScore))&&Number.isFinite(Number(r.rightScore))&&Number(r.leftScore)!==Number(r.rightScore);const tone=asymmetric?'asymmetric':r.finalScore===0?'problem':r.finalScore===1?'warn':r.status==='warn'?'warn':'ok';return `<b class="numeric-final ${tone}">${r.finalScore}</b>`;}
  function resultRow(r,i,withFinal=true,extraClass=''){return `<div class="result-row ${r.child?'child':''} ${extraClass}"><span class="muted">${i+1}</span><span>${status(r.status)}</span><span class="test-name">${esc(r.name)}</span>${r.merged?`<span class="result-value merged">${resultDetails(r.valueDetails)||resultDetail(r.detail||r.value,r.kind)}</span>`:`<span class="result-value">${resultDetails(r.lDetails)||resultDetail(r.l,r.kind)}</span><span class="result-value">${resultDetails(r.rDetails)||resultDetail(r.r,r.kind)}</span>`}${withFinal?`<span class="result-value final-status">${finalResult(r)}</span>`:''}</div>`;}
  function resultRows(){let output='';for(let i=0;i<results.length;){const row=results[i];if(row.groupKey){const group=[];while(i<results.length&&results[i].groupKey===row.groupKey)group.push(results[i++]);output+=`<div class="shoulder-result-group">${group.map((item,offset)=>resultRow(item,i-group.length+offset,false,'shoulder-row')).join('')}<span class="result-value final-status shoulder-final">${finalResult(group.find(item=>item.finalScore!==undefined)||group[0])}</span></div>`;}else output+=resultRow(row,i++);}return output;}
  function resultMobileDetail(r){if(r.kind==='summary'){if(r.lDetails||r.rDetails)return `${r.lDetails?.length?`L: ${resultDetails(r.lDetails)}`:''}${r.lDetails?.length&&r.rDetails?.length?'　•　':''}${r.rDetails?.length?`P: ${resultDetails(r.rDetails)}`:''}`;if(r.valueDetails?.length)return resultDetails(r.valueDetails);return esc(r.detail||'');}if(r.kind==='score'){if(r.merged)return `Punkty: ${esc(r.value)}`;return `${r.l?`L: ${esc(r.l)}`:''}${r.l&&r.r?'　•　':''}${r.r?`P: ${esc(r.r)}`:''}`;}return `${r.l?`L: ${resultDetail(r.l,r.kind)}`:''}${r.l&&r.r?'　•　':''}${r.r?`P: ${resultDetail(r.r,r.kind)}`:''}`;}
  function resultCards(){return results.map((r,i)=>`<article class="result-mobile-row card"><span class="index">${i+1}</span><span class="result-mobile-main"><b>${r.name}</b><small>${resultMobileDetail(r)}</small></span><span class="final-status">${r.sharedScore==='shoulder'&&r.child?status(r.status):finalResult(r)}</span></article>`).join('');}
  function assessmentNotesMarkup() {
    const items = selectedAssessment?.notes || [];
    return `<section class="assessment-notes card"><h2>Notatki do testów</h2>${items.length ? items.map(item => `<article><b>${esc(item.testName)}</b><p>${esc(item.note)}</p></article>`).join('') : '<p>W tym badaniu nie zapisano notatek.</p>'}</section>`;
  }  function resultsPage(){const requestedId=route().match(/^results\/([^/]+)$/)?.[1];if(resultsLoadError||!selectedAssessment||(requestedId&&selectedAssessment.assessmentId!==requestedId))return shell(`<main class="page"><section class="card results-load-error"><h1>Nie uda\u0142o si\u0119 wczyta\u0107 wynik\u00f3w</h1><p>${esc(resultsLoadError||'Trwa wczytywanie wynik\u00f3w badania.')}</p><a class="btn" href="#/clients">Wr\u00f3\u0107 do listy klient\u00f3w</a></section></main>`,"#/clients",{subtitle:'Wyniki badania'});const date=selectedAssessment?.date?new Date(`${selectedAssessment.date}T00:00:00`).toLocaleDateString('pl-PL'):'';const client=selectedAssessment?.client;const name=client?`${client.firstName} ${client.lastName}`:'';const sport=clients.find(item=>item.id===client?.clientId)?.sport||'';const total=selectedAssessment?.totalScore??0;const maximum=selectedAssessment?.maximum??0;const reportHref=selectedAssessment?.assessmentId?`#/report/${encodeURIComponent(selectedAssessment.assessmentId)}`:'#/report';const reportAction=selectedAssessment?.protocolCode==='quick_screen'?`<a class="btn btn-primary" href="${reportHref}">Otwórz raport badania ${icon('arrow',15)}</a>`:'';const mobileReportAction=selectedAssessment?.protocolCode==='quick_screen'?`<a class="btn btn-primary" href="${reportHref}">Otwórz raport ${icon('arrow',14)}</a>`:'';return shell(`<main class="page"><div class="page-heading"><div><h1>Badanie z ${date}</h1><p>Surowe dane badania technicznego dla trenera</p></div><div class="heading-actions"><a class="btn" href="#/dashboard">← Wróć do panelu trenera</a><button class="btn" data-action="edit-assessment" data-assessment="${esc(selectedAssessment?.assessmentId)}">Edytuj badanie</button>${reportAction}</div></div><section class="results-summary card"><div class="total-score"><small>Wynik całkowity (score)</small><strong>${total}</strong> <span>/ ${maximum} punktów</span></div><div class="summary-person"><small>Oceniany</small><b>${esc(name)}</b><span>${esc(sport)} • ${esc(selectedAssessment?.scenarioName||'Badanie')}</span></div></section><div class="result-mobile-actions"><a class="btn" href="#/dashboard">← Panel trenera</a><button class="btn" data-action="edit-assessment" data-assessment="${esc(selectedAssessment?.assessmentId)}">Edytuj</button>${mobileReportAction}</div><div class="result-list-title">Szczegółowa lista wyników (${results.length} pozycji)</div><section class="result-table card"><div class="result-table-head"><span>#</span><span></span><span>Nazwa testu</span><span>L strona</span><span>P strona</span><span>Wynik końcowy</span></div>${resultRows()}</section><section class="result-table-mobile">${resultCards()}</section>${assessmentNotesMarkup()}</main>${footer()}`,'#/clients',{subtitle:'Wyniki badania'});}
  function cheatSheet(){const order=['Odcinek szyjny (Kark)','Skłon do palców','Mobilność barku','Przysiad','Balans','Rotacje'];const priorities=['Ból / wynik 0 (Protect + specjalista)','Wynik 1 / FAIL / Asymetria','Wynik 2 (akceptowalny)','Wynik 3 (optymalny)'];const steps=[['KROK 1','Protect','Unikaj ruchów prowokujących ból, odciąż dany rejon.','protect'],['KROK 2','Correct','Wdróż celowane ćwiczenia zwiększające ruchomość.','correct'],['KROK 3','Retest','Sprawdź ponownie po skończonym cyklu.','retest'],['KROK 4','Develop','Rozwijaj wzorzec w normalnym, bezpiecznym treningu.','develop']];return shell(`<main class="page"><div class="page-heading"><div><h1>Ściąga trenera — Quick Screen</h1><p>Szybka pomoc przy interpretacji wyników i wyborze priorytetu korekcyjnego</p></div></div><div class="cheat-grid"><section class="cheat-card card"><h2>Krok 1: Jak wybrać priorytet</h2><div class="flow-list priority-list">${priorities.map((x,i)=>`<div class="flow-item"><span class="flow-number">${i+1}</span>${x}</div>${i<priorities.length-1?'<span class="flow-arrow">↓</span>':''}`).join('')}</div><p class="hint"><b>Uwaga:</b> Celem jest wybranie jednego głównego weak link, a nie poprawianie wszystkiego jednocześnie.</p></section><section class="cheat-card card"><h2>Krok 2: Hierarchia wzorców</h2><div class="flow-list">${order.map((x,i)=>`<div class="flow-item"><span class="flow-number">${i+1}</span>${x}</div>${i<order.length-1?'<span class="flow-arrow">↓</span>':''}`).join('')}</div><p class="hint"><b>Uwaga:</b> Mobility jest rozpatrywane przed stability/motor control. Ta kolejność jest hierarchią korekcyjną.</p></section></div><section class="cycle-card card"><h2>Co dalej?</h2><div class="cycle-steps">${steps.map(([n,title,txt,cls])=>`<article class="cycle-step ${cls}"><small>${n}</small><b>${title}</b><p>${txt}</p></article>`).join('')}</div></section></main>${footer()}`,'#/cheat-sheet',{subtitle:'Ściąga trenera'});}
  function report(){
    if(selectedAssessment&&selectedAssessment.protocolCode!=='quick_screen')return shell('<main class="page"><section class="card"><h1>Raport niedostępny dla tego protokołu</h1><p>Raport Quick Screen nie może interpretować wyników tego badania.</p><a class="btn" href="#/results/'+encodeURIComponent(selectedAssessment.assessmentId)+'">Wróć do wyników</a></section></main>','#/clients',{report:true});
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
      if(selectedAssessment.protocolCode!=='quick_screen')throw new Error('Raport jest obecnie dostępny tylko dla protokołu Quick Screen.');
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
  }  function clientEditPage(clientId){const client=clients.find(item=>item.id===clientId);if(!client)return shell(`<main class="page"><section class="card"><h1>Nie znaleziono klienta</h1><a class="btn" href="#/clients">Wr&oacute;&#263; do listy klient&oacute;w</a></section></main>`,`#/clients`);const parts=client.name.trim().split(/\s+/);return shell(`<main class="page profile-screen"><a class="back-link" href="#/client/${encodeURIComponent(client.id)}">&larr; Wr&oacute;&#263; do profilu</a><div class="page-heading"><div><h1>Edytuj profil klienta</h1><p>Zmie&#324; dane kontaktowe i dyscyplin&#281;.</p></div></div><form id="client-profile-form" class="card"><div class="field"><label for="client-edit-first">Imi&#281;</label><input id="client-edit-first" name="firstName" value="${esc(parts[0]||'')}" required maxlength="100"></div><div class="field"><label for="client-edit-last">Nazwisko</label><input id="client-edit-last" name="lastName" value="${esc(parts.slice(1).join(' '))}" required maxlength="100"></div><div class="field"><label for="client-edit-email">E-mail</label><input id="client-edit-email" name="email" type="email" value="${esc(client.email)}" required maxlength="254"></div><div class="field"><label for="client-edit-sport">Dyscyplina</label><input id="client-edit-sport" name="discipline" value="${esc(client.sport)}" maxlength="120"></div><p id="client-profile-error" role="alert" hidden></p><div class="new-footer"><a class="btn" href="#/client/${encodeURIComponent(client.id)}">Anuluj</a><button class="btn btn-primary" type="submit">Zapisz zmiany</button></div></form></main>${footer()}`,`#/client/${encodeURIComponent(client.id)}`);}  function profileSettings(clientMode=false){return shell(`<main class="page profile-screen"><div class="page-heading"><div><h1>Mój profil</h1><p>Dane ${clientMode?'klienta':'konta trenerskiego'}</p></div></div><section class="profile-banner card"><span class="initials">${clientMode?'GK':'K'}</span><div class="profile-main"><h1>${clientMode?'Gaweł Kot':'Trener Karol'}</h1><p>${clientMode?'Piłka nożna':'KB Trener · QuickScreen'}</p></div><button class="btn">Edytuj profil</button></section><section class="card"><h2>Dane profilu</h2><div class="field"><label>Imię i nazwisko</label><input value="${clientMode?'Gaweł Kot':'Karol Bilecki'}" readonly></div><div class="field"><label>E-mail</label><input value="${clientMode?'gawel.kot@example.com':'trener@kbtrener.pl'}" readonly></div><div class="field"><label>${clientMode?'Dyscyplina':'Organizacja'}</label><input value="${clientMode?'Piłka nożna':'KB Trener'}" readonly></div></section></main>${footer()}`,clientMode?'#/client-profile':'#/profile',{client:clientMode});}
  function render(){const r=route();document.body.classList.toggle('is-report',r==='report'||r.startsWith('client-report/'));if(recoverySession){document.body.classList.remove('is-report');app.innerHTML=passwordResetPage(authError);return;}if(!authSession?.access_token){if(r!=='login')setRoute('login');app.innerHTML=loginPage(authError);return;}if(r==='login')setRoute('dashboard');if(r==='dashboard')app.innerHTML=dashboard();else if(r==='clients')app.innerHTML=clientsPage();else if(r.startsWith('client-edit/'))app.innerHTML=clientEditPage(decodeURIComponent(r.split('/')[1]||''));else if(r.startsWith('client/'))app.innerHTML=profilePage(false,r.split('/')[1]);else if(r==='client-dashboard'||r==='my-results')app.innerHTML=profilePage(true);else if(r==='client-profile')app.innerHTML=profileSettings(true);else if(r==='new-assessment'||r.startsWith('new-assessment/')){const contextId=newAssessmentClientId();selectedClient=contextId?clients.find(c=>c.id===contextId)||null:null;const selectProtocol=r.startsWith('new-assessment/select-protocol/');app.innerHTML=newAssessment(Boolean(contextId&&!selectedClient),selectProtocol);}else if(r.startsWith('assessment/')){wizardIndex=Math.max(0,Math.min(tests.length-1,Number(r.split('/')[1])-1||0));app.innerHTML=assessment();}else if(r==='results'||r.startsWith('results/'))app.innerHTML=resultsPage();else if(r==='report')app.innerHTML=report();else if(r==='report-settings')app.innerHTML=reportSettingsPage();else if(r.startsWith('client-report/'))app.innerHTML=savedReportPage();else if(r==='cheat-sheet')app.innerHTML=cheatSheet();else if(r==='profile')app.innerHTML=profileSettings();else app.innerHTML=dashboard();if(isEditingAssessment){app.innerHTML+=assessmentEditModal();document.body.classList.add('has-assessment-modal');}else document.body.classList.remove('has-assessment-modal');if(!isEditingAssessment)window.scrollTo(0,0);}
  app.addEventListener('change',e=>{if(e.target.matches('[data-checkbox-field]')){const key=`${e.target.dataset.checkboxField}:${e.target.dataset.side}`;scores[key]=e.target.checked?'positive':null;const field=tests.flatMap(test=>test.definition.fields).find(item=>item.code===e.target.dataset.checkboxField);if(field){for(const dependent of tests.flatMap(test=>test.definition.fields).filter(item=>item.disabledByFieldCode===field.code)){document.querySelectorAll(`[data-measurement-field="${dependent.code}"]`).forEach(input=>input.disabled=e.target.checked);document.querySelectorAll(`[data-measurement-unit="${dependent.measurementUnitGroup}"]`).forEach(button=>button.disabled=e.target.checked);}}saveLocalDraft();}});
  app.addEventListener('click',e=>{const unitButton=e.target.closest('[data-measurement-unit]');if(!unitButton)return;const group=unitButton.dataset.measurementUnit;const nextUnit=unitButton.dataset.unit;const groupedFields=tests.flatMap(test=>test.definition.fields).filter(item=>item.fieldType==='measurement'&&item.measurementUnitGroup===group);const currentUnit=fieldMeasurementUnits[group]||groupedFields[0]?.measurementUnit;if(currentUnit&&currentUnit!==nextUnit){for(const field of groupedFields)for(const side of field.sideMode==='bilateral'?['left','right']:['none'])delete fieldMeasurements[`${field.code}:${side}`];}fieldMeasurementUnits[group]=nextUnit;saveLocalDraft();render();});
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
      await offerResumeDraft();
      render();
    } catch (error) {
      authStore(null);
      app.innerHTML = loginPage(error.message, 'error', values.email.trim());
    } finally {
      const currentButton = app.querySelector('#login-form button[type="submit"]');
      if (currentButton) { currentButton.disabled = false; currentButton.textContent = 'Zaloguj się'; }
    }
  });
  app.addEventListener('input',e=>{if(['client-first','client-last','client-email'].includes(e.target.id)){selectedClient=null;const field=e.target.id;const query=e.target.value.trim();const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();const boxes=['first','last','email'].map(name=>$('#suggestions-'+name));boxes.forEach(box=>{if(box)box.classList.remove('show');});const box=$('#suggestions-'+field.replace('client-',''));if(box&&query.length>=3){const matches=clients.filter(c=>[c.name,c.email].some(value=>normalize(value).includes(normalize(query))));box.innerHTML=matches.length?matches.map(c=>`<div class="suggestion" data-client="${c.id}"><span><b>${c.name}</b><small>${c.email} (${c.sport})</small></span><small>Wybierz profil</small></div>`).join(''):'<div class="suggestion-empty">Brak pasujących profili</div>';box.classList.add('show');}return;}if(e.target.id==='client-search'){searchText=e.target.value;const pos=e.target.selectionStart;app.innerHTML=clientsPage();const input=$('#client-search');input.focus();input.setSelectionRange(pos,pos);}if(e.target.matches('[data-note]')){notes[e.target.dataset.note]=e.target.value;saveLocalDraft();return;}if(e.target.matches('[data-measurement-field]')){fieldMeasurements[`${e.target.dataset.measurementField}:${e.target.dataset.side}`]=e.target.value;saveLocalDraft();return;}if(e.target.matches('[data-shoulder-measurement]')){if(e.target.dataset.shoulderMeasurement==='handLengthCm')shoulderMeasurements.handLengthCm=e.target.value;else shoulderMeasurements.gaps[e.target.dataset.side]=e.target.value;syncShoulderAutoScores();saveLocalDraft();}});
  app.addEventListener('click',e=>{if(isEditingAssessment&&e.target.matches('[data-edit-backdrop]')){isEditingAssessment=false;activeAssessment=null;editReturnRoute=null;removeLocalDraft();render();return;}const clientRow=e.target.closest('[data-client-row]');if(clientRow&&!e.target.closest('a,button,input,select,textarea')){location.hash=clientRow.dataset.clientRow;return;}const option=e.target.closest('[data-value]');if(option){const key=option.dataset.key;const field=tests.flatMap(test=>test.definition.fields).find(item=>key.startsWith(`${item.code}:`));scores[key]=field?.answerSet.code==='score_0_3'?Number(option.dataset.score):option.dataset.value;saveLocalDraft();option.parentElement.querySelectorAll('.score-option,.binary-option').forEach(item=>{const selected=item===option;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));item.classList.remove('pass','pain');if(selected&&item.classList.contains('binary-option'))item.classList.add(/positive|pain|yes|fail/i.test(item.dataset.value)?'pain':'pass');});return;}const suggestion=e.target.closest('[data-client]');if(suggestion){selectedClient=clients.find(c=>c.id===suggestion.dataset.client)||null;document.querySelectorAll('.suggestions').forEach(x=>x.classList.remove('show'));const first=$('#client-first');if(first)first.value=selectedClient.name.split(' ')[0];const last=$('#client-last');if(last)last.value=selectedClient.name.split(' ').slice(1).join(' ');const email=$('#client-email');if(email)email.value=selectedClient.email;const sport=$('#client-sport');if(sport)sport.value=selectedClient.sport;setRoute(`new-assessment/${encodeURIComponent(selectedClient.id)}`);return;}const action=e.target.closest('[data-action]');if(action){if(action.dataset.action==='edit-assessment'){const returnRoute=route();editReturnRoute=returnRoute;action.disabled=true;action.textContent='Wczytywanie...';editAssessment(action.dataset.assessment).catch(error=>{isEditingAssessment=false;activeAssessment=null;editReturnRoute=null;removeLocalDraft();setRoute(returnRoute);render();window.alert(`Nie uda\u0142o si\u0119 otworzy\u0107 edycji: ${error.message}`);});return;}if(action.dataset.action==='save-assessment-edit'){saveAssessmentEdit();return;}if(action.dataset.action==='cancel-assessment-edit'){isEditingAssessment=false;activeAssessment=null;editReturnRoute=null;removeLocalDraft();render();return;}if(action.dataset.action==='criteria'){const index=action.dataset.testIndex;const panel=index===undefined?$('#criteria-panel'):document.getElementById(`criteria-panel-${index}`);panel?.classList.toggle('open');return;}if(action.dataset.action==='choose-protocol'){chooseAssessmentProtocol().catch(error=>window.alert(error.message));return;}if(action.dataset.action==='start-assessment'){startAssessment().catch(error=>window.alert(error.message));return;}if(action.dataset.action==='add-client'){setRoute('new-assessment');return;}}});
  app.addEventListener('click',e=>{const option=e.target.closest('[data-value]');if(!option)return;const key=option.dataset.key;const field=tests.flatMap(test=>test.definition.fields).find(item=>key.startsWith(`${item.code}:`));if(!field)return;const side=key.slice(key.lastIndexOf(':')+1);for(const dependent of tests.flatMap(test=>test.definition.fields).filter(item=>item.disabledByFieldCode===field.code)){const dependentSide=dependent.sideMode==='bilateral'?side:'none';const disabled=option.dataset.value==='positive';app.querySelectorAll('[data-key]').forEach(control=>{if(control.dataset.key===`${dependent.code}:${dependentSide}`)control.disabled=disabled;});}});
  app.addEventListener('keydown',e=>{if(isEditingAssessment&&e.key==='Escape'){isEditingAssessment=false;activeAssessment=null;editReturnRoute=null;removeLocalDraft();render();return;}const clientRow=e.target.closest('[data-client-row]');if(clientRow&&!e.target.closest('a,button,input,select,textarea')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();location.hash=clientRow.dataset.clientRow;}});
  app.addEventListener('submit', async event => {
    const form = event.target;
    if (form.id === 'client-profile-form') {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const error = $('#client-profile-error');
      const clientId = route().split('/')[1];
      const values = Object.fromEntries(new FormData(form));
      button.disabled = true;
      if (error) error.hidden = true;
      try {
        const updated = await apiRequest(`/clients/${encodeURIComponent(clientId)}`, { method: 'PATCH', body: JSON.stringify(values) });
        const client = clients.find(item => item.id === clientId);
        if (client) Object.assign(client, { name: `${updated.firstName} ${updated.lastName}`, email: updated.email, sport: updated.discipline || '' });
        setRoute(`client/${encodeURIComponent(clientId)}`);
        render();
      } catch (failure) {
        if (error) { error.textContent = failure.message; error.hidden = false; }
      } finally { if (button.isConnected) button.disabled = false; }
      return;
    }
    if (form.id === 'report-settings-form') {
      event.preventDefault();
      return;
    }
  });
  app.addEventListener('change', async event => {
    if (event.target.name === 'screenTypeId') { selectedScreenTypeId = event.target.value; const button = $('#start-selected-protocol'); if (button) button.hidden = !selectedScreenTypeId; return; }
    if (event.target.matches('[data-assessment-date]')) {
      if (activeAssessment) { activeAssessment.date = event.target.value; if (!isEditingAssessment) saveLocalDraft(); }
      return;
    }
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
  const quickScreenResultsPage=resultsPage;
  resultsPage=function(){if(selectedAssessment?.protocolCode==='fms')return shell(window.FmsReportUI.results(selectedAssessment,`results/${encodeURIComponent(selectedAssessment.assessmentId)}`),'#/clients',{subtitle:'Wyniki badania FMS'});return quickScreenResultsPage();};
  const standardRender=render;
  render=function(){if(route().startsWith('fms-report/')){document.body.classList.add('is-report');const id=decodeURIComponent(route().split('/')[1]||'');if(!selectedAssessment||selectedAssessment.assessmentId!==id||selectedAssessment.protocolCode!=='fms')app.innerHTML=shell('<main class="page"><section class="card"><h1>Otwieram raport FMS…</h1><p>Ładuję zapisane wyniki badania.</p></section></main>','#/clients',{report:true});else app.innerHTML=shell(window.FmsReportUI.report(selectedAssessment),'#/clients',{report:true});return;}if(route().startsWith('fms-report/')===false)document.body.classList.remove('is-report');standardRender();};
  window.addEventListener('hashchange', async event => {
    if (route() === 'report') { render(); await generateReport(); return; }
    if (isEditingAssessment && route() !== editReturnRoute) { isEditingAssessment = false; activeAssessment = null; editReturnRoute = null; removeLocalDraft(); document.body.classList.remove('has-assessment-modal'); }
    if (activeAssessment) {
      try {
        if (route() === 'results') {
          if (!activeAssessment.date) { window.alert("Assessment date is required before finishing."); setRoute("assessment/" + tests.length); return; }
          const protocolMissing=validateFmsMcsCompletion();if(protocolMissing){window.alert(protocolMissing);setRoute(`assessment/${tests.length}`);return;}
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
    } else if (route().startsWith('results/') && route().split('/')[1]) {
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
  window.addEventListener('hashchange',async()=>{const current=route();if(current.startsWith('report/')){const id=decodeURIComponent(current.split('/')[1]||'');try{const record=await loadResults(id);if(record.protocolCode==='fms'){setRoute(`fms-report/${encodeURIComponent(id)}`);return;}}catch{} }if(current.startsWith('fms-report/')){const id=decodeURIComponent(current.split('/')[1]||'');try{if(selectedAssessment?.assessmentId!==id)await loadResults(id);}catch(error){resultsLoadError=error.message;}render();}});
  app.addEventListener('click',e=>{if(e.target.closest('[data-action="print-fms"]'))window.print();});
  if(route().startsWith('fms-report/')){const reportId=decodeURIComponent(route().split('/')[1]||'');loadResults(reportId).then(()=>render()).catch(error=>{resultsLoadError=error.message;render();});}
  (async()=>{if(authSession?.expires_at&&authSession.expires_at*1000<Date.now()+60000)await refreshSession();if(authSession?.access_token){try{await loadQuickScreenData();await loadReportConfiguration();if(route().startsWith('results/'))await loadResults(route().split('/')[1]);if(routePath().startsWith('report/')){const record=await loadResults(decodeURIComponent(routePath().split('/')[1]));if(record.protocolCode==='fms')setRoute(`fms-report/${encodeURIComponent(record.assessmentId)}`);}if(route().startsWith('client-report/'))await loadSavedReport(route().split('/')[1]);}catch(error){authError=error.message;authStore(null);}if(authSession?.access_token)await offerResumeDraft();}render();if(authSession?.access_token&&route()==='report')await generateReport();})();
})();

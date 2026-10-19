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
  async function ensureAdditionalCatalog() {
    if(additionalCatalog.length)return;
    additionalCatalog=[];
    for(const item of screenTypes.filter(item=>['quick_screen','fms'].includes(item.code))){const source=await apiRequest(`/scenarios/${encodeURIComponent(item.screenTypeId)}/definition?locale=pl`);for(const step of source.steps||[])additionalCatalog.push({protocolCode:item.code,sourceVersion:source.manualVersion||'',testCode:step.test.code,name:step.test.name,fields:step.fields||[]});}
    for(const test of window.SfmaProtocol.topTier)additionalCatalog.push({protocolCode:'sfma',sourceVersion:window.SfmaProtocol.version,testCode:`sfma_${test.id}`,name:test.name,fields:[{id:`sfma_${test.id}`,code:`sfma_${test.id}`,label:test.name,fieldType:'choice',sideMode:test.sides==='bilateral'?'bilateral':'none',required:true,scoring:true,answerSet:{code:'sfma_classification'},answers:['FN','FP','DN','DP'].map(value=>({code:value,label:value}))}]});
    const sfmaType=screenTypes.find(item=>item.code==='sfma');const sfmaDefinition=sfmaType?await apiRequest(`/scenarios/${encodeURIComponent(sfmaType.screenTypeId)}/definition?locale=pl`):null;additionalSfmaRules=sfmaDefinition?.measurementRules||{};
    for(const pattern of window.SfmaProtocol.breakouts)for(const section of pattern.sections)section.steps.forEach((step,index)=>{const bilateral=window.SfmaProtocol.isBilateralStep(step,section);const code=`sfma_breakout_${pattern.topTierId}_${section.id}_${index}`;const measurements=window.SfmaProtocol.measurementFields(step);const fields=[{id:`${code}_classification`,code:'classification',label:'Klasyfikacja',fieldType:'choice',sideMode:bilateral?'bilateral':'none',required:true,scoring:true,answerSet:{code:'sfma_classification'},answers:['FN','FP','DN','DP'].map(value=>({code:value,label:value}))},...measurements.map(field=>({id:`${code}_${field.id}`,code:field.id,label:`${field.label} · standard ${field.standard}°`,fieldType:'measurement',sideMode:bilateral?'bilateral':'none',required:false,measurementUnit:'deg',standard:field.standard}))];additionalCatalog.push({protocolCode:'sfma',sourceVersion:window.SfmaProtocol.version,testCode:code,name:step.title,fields,sfmaContext:{pattern:pattern.topTierId,section:section.id,index,bilateral,measurementFields:measurements}});});
  }
  async function loadQuickScreenData() {
    const [me, availableScreenTypes, clientsData, activity] = await Promise.all([apiRequest('/me'), apiRequest('/scenarios'), apiRequest('/clients'), apiRequest('/dashboard')]);
    trainer = me;
    screenTypes = availableScreenTypes;
    updateClientData(clientsData, activity);
  }
  function updateClientData(clientsData, activity) {
    clients = clientsData.map(client => ({ id: client.clientId, name: `${client.firstName} ${client.lastName}`, email: client.email, sport: client.discipline || '', date: client.latestAssessment?.date || '', score: client.latestAssessment?.score ?? null, maxScore: client.latestAssessment?.maximum ?? null, points: client.latestAssessment?.score ?? null, status: client.latestAssessment?.indicator || 'ok', latestAssessmentId: client.latestAssessment?.id || client.history?.[0]?.assessmentId || null, history: client.history || [], anthropometry: client.anthropometry || [], createdAt: client.createdAt }));
    if (activity) latestActivity = activity.map(item => ({ clientId: item.clientId, name: item.name, sport: item.sport || '', date: item.date, protocolCode: item.protocolCode || 'quick_screen', points: item.score ?? null, status: item.indicator || (item.status === 'completed' ? 'ok' : 'warn') }));
  }
  async function refreshClientHistory() {
    const clientsData = await apiRequest('/clients');
    updateClientData(clientsData);
  }
  async function deleteAssessment(assessmentId) {
    const client = clients.find(item => item.history?.some(entry => entry.assessmentId === assessmentId));
    if (!window.confirm('Czy na pewno usunąć to badanie? Tej operacji nie można cofnąć.')) return;
    await apiRequest(`/assessments/${encodeURIComponent(assessmentId)}`, { method: 'DELETE' });
    await loadQuickScreenData();
    if (selectedAssessment?.assessmentId === assessmentId) selectedAssessment = null;
    if (client) setRoute(`client/${encodeURIComponent(client.id)}`);
    render();
    return true;
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
    if ($('#pair-mode')?.checked && !pairClientId) throw new Error('Wybierz drugiego klienta lub wyłącz tryb dwóch klientów.');
    if (pairClientId && protocol.code !== 'quick_screen') throw new Error('Badanie dwóch klientów jest dostępne tylko w QuickScreen.');
    if (pairClientId === selectedClient?.id) throw new Error('Drugi klient musi być inną osobą.');
    if (pairClientId && !clients.some(client => client.id === pairClientId)) throw new Error('Wybierz istniejącego drugiego klienta.');
    if (!selectedClient) throw new Error('Wybierz klienta przed rozpoczęciem badania.');
    const definition = await loadScenarioDefinition(protocol.screenTypeId);
    additionalCatalog = [];
    for (const item of screenTypes.filter(item => ['quick_screen','fms'].includes(item.code))) {
      const source = item.screenTypeId === protocol.screenTypeId ? definition : await apiRequest(`/scenarios/${encodeURIComponent(item.screenTypeId)}/definition?locale=pl`);
      for (const step of source.steps || []) additionalCatalog.push({ protocolCode: item.code, sourceVersion: source.manualVersion || '', testCode: step.test.code, name: step.test.name, fields: step.fields || [] });
    }
    for (const test of window.SfmaProtocol.topTier) additionalCatalog.push({ protocolCode: 'sfma', sourceVersion: window.SfmaProtocol.version, testCode: `sfma_${test.id}`, name: test.name, fields: [{ id: `sfma_${test.id}`, code: `sfma_${test.id}`, label: test.name, fieldType: 'choice', sideMode: test.sides === 'bilateral' ? 'bilateral' : 'none', required: true, scoring: true, measurementUnit: null, answerSet: { code: 'sfma_classification' }, answers: ['FN','FP','DN','DP'].map(value => ({ code: value, label: value })) }] });
    const sfmaType=screenTypes.find(item=>item.code==='sfma');
    const sfmaDefinition=sfmaType?(sfmaType.screenTypeId===protocol.screenTypeId?definition:await apiRequest(`/scenarios/${encodeURIComponent(sfmaType.screenTypeId)}/definition?locale=pl`)):null;
    additionalSfmaRules=sfmaDefinition?.measurementRules||{};
    for(const pattern of window.SfmaProtocol.breakouts)for(const section of pattern.sections)section.steps.forEach((step,index)=>{const bilateral=window.SfmaProtocol.isBilateralStep(step,section);const code=`sfma_breakout_${pattern.topTierId}_${section.id}_${index}`;const measurements=window.SfmaProtocol.measurementFields(step);const fields=[{id:`${code}_classification`,code:'classification',label:'Klasyfikacja',fieldType:'choice',sideMode:bilateral?'bilateral':'none',required:true,scoring:true,answerSet:{code:'sfma_classification'},answers:['FN','FP','DN','DP'].map(value=>({code:value,label:value}))},...measurements.map(field=>({id:`${code}_${field.id}`,code:field.id,label:`${field.label} · standard ${field.standard}°`,fieldType:'measurement',sideMode:bilateral?'bilateral':'none',required:false,measurementUnit:'deg',standard:field.standard}))];additionalCatalog.push({protocolCode:'sfma',sourceVersion:window.SfmaProtocol.version,testCode:code,name:step.title,fields,sfmaContext:{pattern:pattern.topTierId,section:section.id,index,bilateral,measurementFields:measurements}});});
    const date = new Date();
    const dateValue = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    let anthropometry = { latest: {} };
    try { anthropometry = await apiRequest(`/clients/${encodeURIComponent(selectedClient.id)}/anthropometry`); } catch {}
    activeAssessment = { assessmentId: crypto.randomUUID(), clientId: selectedClient.id, screenTypeId: protocol.screenTypeId, date: dateValue, manualVersion: definition.manualVersion };
    protocolData = { version: definition.manualVersion, topTier: {}, breakouts: {} };
    if (protocol.code === 'bunkie') protocolData = { version: definition.manualVersion, targets: Object.fromEntries((definition.steps||[]).map(step=>[step.test.code,{left:Number(step.test.bunkie.goalSeconds),right:Number(step.test.bunkie.goalSeconds)}])), pain: {} };
    scores = {}; fieldMeasurements = {}; fieldMeasurementUnits = {}; fieldMeasurementConditions = {}; assessmentAnthropometryByCondition = anthropometry.latestByCondition || {}; notes = {}; additionalTests = []; selectedAdditionalCode = ''; shoulderAutoScores = {}; shoulderMeasurements = { handLengthCm: '', gaps: { left: '', right: '' } }; wizardIndex = 0;
    const secondClient=clients.find(client=>client.id===pairClientId);
    pairedDraft=protocol.code==='quick_screen'&&secondClient&&secondClient.id!==selectedClient.id?{assessment:{assessmentId:crypto.randomUUID(),clientId:secondClient.id,screenTypeId:protocol.screenTypeId,date:dateValue,manualVersion:definition.manualVersion},client:secondClient,scores:{},fieldMeasurements:{},fieldMeasurementUnits:{},fieldMeasurementConditions:{},notes:{},shoulderMeasurements:{handLengthCm:'',gaps:{left:'',right:''}},protocolData:{version:definition.manualVersion,topTier:{},breakouts:{}},additionalTests:[],wizardIndex:0}:null;
    const latestAnthropometry = anthropometry.latest || {};
    for (const [code, fieldCode, group, sharedKey] of [['tibia_length','fms_hurdle_step_tibia_length','fms-tibia','fms_tibia_length'],['foot_length','fms_lower_body_mcs_foot_length','fms-foot','fms_foot_length']]) {
      const saved = latestAnthropometry[code];
      if (saved) { fieldMeasurements[`${fieldCode}:none`] = String(saved.value); fieldMeasurements[`shared:${sharedKey}:none`] = String(saved.value); fieldMeasurementUnits[group] = saved.unit; fieldMeasurementConditions[sharedKey] = saved.wearCondition || 'unspecified'; }
    }
    const savedHand = latestAnthropometry.hand_length;
    if (savedHand) {
      const handField = definition.steps.flatMap(step => step.fields || []).find(field => field.code === 'fms_shoulder_mobility_hand_length');
      if (handField) { fieldMeasurements[`${handField.code}:none`] = String(savedHand.value); fieldMeasurementUnits[handField.measurementUnitGroup || 'fms-hand'] = savedHand.unit; }
      shoulderMeasurements.handLengthCm = String(savedHand.unit === 'in' ? savedHand.value * 2.54 : savedHand.value);
    }
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
    localStorage.setItem(draftKey(), JSON.stringify({ savedAt: Date.now(), assessment: activeAssessment, client: selectedClient, scores, fieldMeasurements, fieldMeasurementUnits, fieldMeasurementConditions, notes, shoulderMeasurements, protocolData, additionalTests, wizardIndex, pairClientId, pairedDraft }));
  }
  async function restoreLocalDraft(draft) {
    const protocolId = draft.assessment.screenTypeId || screenTypes.find(item => item.code === 'quick_screen')?.screenTypeId;
    if (!protocolId) throw new Error('Nie znaleziono protokołu potrzebnego do wznowienia szkicu.');
    draft.assessment.screenTypeId = protocolId;
    selectedScreenTypeId = protocolId;
    await loadScenarioDefinition(protocolId);
    await ensureAdditionalCatalog();
    activeAssessment = draft.assessment; selectedClient = draft.client; scores = draft.scores || {}; fieldMeasurements = draft.fieldMeasurements || {}; fieldMeasurementUnits = draft.fieldMeasurementUnits || {}; fieldMeasurementConditions = draft.fieldMeasurementConditions || {}; notes = draft.notes || {}; additionalTests = draft.additionalTests || []; protocolData = draft.protocolData || { version: currentScenario.manualVersion, topTier: {}, breakouts: {} }; shoulderMeasurements = { handLengthCm: draft.shoulderMeasurements?.handLengthCm ?? '', gaps: { left: draft.shoulderMeasurements?.gaps?.left ?? '', right: draft.shoulderMeasurements?.gaps?.right ?? '' } }; shoulderAutoScores = {}; wizardIndex = Number(draft.wizardIndex) || 0;
    pairClientId=draft.pairClientId||'';pairedDraft=draft.pairedDraft||null;if(pairedDraft){pairedDraft.client=clients.find(client=>client.id===pairedDraft.assessment.clientId)||pairedDraft.client;pairedDraft.fieldMeasurements||={};pairedDraft.fieldMeasurementUnits||={};pairedDraft.fieldMeasurementConditions||={};pairedDraft.notes||={};pairedDraft.shoulderMeasurements||={handLengthCm:'',gaps:{left:'',right:''}};pairedDraft.scores||={};pairedDraft.additionalTests||=[];}
    if(currentScenario?.code==='sfma'){protocolData.breakouts ||= {};protocolData.measurements ||= {};for(const test of window.SfmaProtocol.topTier)if(window.SfmaProtocol.breakoutActive(test,sfmaPayload().topTier))pruneSfmaBreakout(test.id);else{delete protocolData.breakouts[test.id];delete protocolData.measurements[test.id];}}
    setRoute(`assessment/${wizardIndex + 1}`);
  }
  async function offerResumeDraft() {
    if (recoveryPrompted) return;
    recoveryPrompted = true;
    const interrupted = readLocalDraft();
    if (!interrupted) return;
    if (window.confirm('Znaleziono przerwane badanie. Czy chcesz je wznowić? Wybierz Anuluj, aby je odrzucić.')) await restoreLocalDraft(interrupted);
    else render();
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
    const emittedSharedMeasurements = new Set();
    for (const test of tests) for (const field of test.definition.fields.filter(item => item.fieldType === 'measurement')) {
      for (const side of field.sideMode === 'bilateral' ? ['left', 'right'] : ['none']) {
        if (field.measurementSharedKey) {
          if (emittedSharedMeasurements.has(field.measurementSharedKey)) continue;
          emittedSharedMeasurements.add(field.measurementSharedKey);
        }
        const value = field.measurementSharedKey ? fieldMeasurements[`shared:${field.measurementSharedKey}:none`] ?? fieldMeasurements[`${field.code}:${side}`] : fieldMeasurements[`${field.code}:${side}`];
        const numericValue=Number(String(value??'').trim().replace(',','.'));
        if (value !== '' && value !== null && value !== undefined && Number.isFinite(numericValue)) {
          const sharedKey = field.measurementSharedKey;
          const measurementCondition = sharedKey === 'fms_tibia_length' || sharedKey === 'fms_foot_length' ? fieldMeasurementConditions[sharedKey] || 'unspecified' : null;
          measurementAnswers.push({ fieldId: field.id, side, attemptNumber: 1, value: numericValue, unit: fieldMeasurementUnits[field.measurementUnitGroup] || field.measurementUnit, ...(measurementCondition ? { measurementCondition } : {}) });
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
    return { assessmentId: activeAssessment.assessmentId, clientId: activeAssessment.clientId, scenarioId: activeAssessment.screenTypeId || currentScenario.id, date: activeAssessment.date, manualVersion: activeAssessment.manualVersion || currentScenario.manualVersion, answers: ['sfma','bunkie'].includes(currentScenario?.code) ? [] : answers, notes: ['sfma','bunkie'].includes(currentScenario?.code) ? testNotes : testNotes, measurements, fieldMeasurements: measurementAnswers, additionalTests, ...(['sfma','bunkie'].includes(currentScenario?.code) ? { protocolData: currentScenario.code === 'sfma' ? sfmaPayload() : protocolData } : {}) };
  }
  function pairedAssessmentPayload(){if(!pairedDraft)return null;const primary=getCurrentPairState();setCurrentPairState(pairedDraft);const payload=assessmentPayload();Object.assign(pairedDraft,getCurrentPairState());setCurrentPairState(primary);return payload;}
  function pairedAssessmentMissing(){if(!pairedDraft)return null;const primary=getCurrentPairState();setCurrentPairState(pairedDraft);let missing=null;for(const test of tests)for(const field of test.definition.fields.filter(item=>item.required||item.scoring))for(const side of field.sideMode==='bilateral'?['left','right']:['none']){const value=field.fieldType==='measurement'?fieldMeasurements[`${field.code}:${side}`]:scores[`${field.code}:${side}`];if(value==null||value===''){missing=`${pairedDraft.client?.name||'Drugi klient'}: ${field.label}${side==='left'?' — lewa strona':side==='right'?' — prawa strona':''}`;break;} }Object.assign(pairedDraft,getCurrentPairState());setCurrentPairState(primary);return missing;}
  function sfmaPayload() {
    const topTier = {};
    for (const test of window.SfmaProtocol.topTier) topTier[test.id] = test.sides === 'bilateral' ? { left: scores[`sfma_${test.id}:left`] || null, right: scores[`sfma_${test.id}:right`] || null } : { score: scores[`sfma_${test.id}:none`] || null };
    const breakouts = structuredClone(protocolData?.breakouts || {});
    for (const [id, rule] of Object.entries(currentScenario?.measurementRules || {})) {
      const [pattern, section, indexText, fieldId, side] = id.split('|');
      const raw = protocolData?.measurements?.[pattern]?.[`${section}:${indexText}`]?.[side || 'single']?.[fieldId];
      const measured = raw == null || raw === '' ? null : Number(raw);
      const calculated = window.SfmaProtocol.deriveMeasurementResult(rule, measured);
      const key = `${section}:${indexText}${side ? `:${side}` : ''}`;
      breakouts[pattern] ||= {};
      if (calculated) breakouts[pattern][key] = calculated;
    }
    for (const test of window.SfmaProtocol.topTier) if (!window.SfmaProtocol.breakoutActive(test, topTier)) delete breakouts[test.id];
    return { version: currentScenario.manualVersion, topTier, breakouts, measurements: protocolData?.measurements || {}, notes: Object.fromEntries(window.SfmaProtocol.topTier.map((test,index)=>[test.id,notes[String(index+1)]||'']).filter(([,note])=>note)) };
  }
  function pruneSfmaBreakout(pattern) {
    const spec=window.SfmaProtocol.breakouts.find(item=>item.topTierId===pattern);if(!spec)return;
    for(const section of spec.sections){
      let changed=true;let pass=0;
      while(changed&&pass++<=section.steps.length){changed=false;const answers=sfmaPayload().breakouts[pattern]||{};const states=window.SfmaProtocol.stepVisibility(section,answers);
        states.forEach(state=>{const targets=state.bilateral?['left','right']:['single'];for(const side of targets){if(state.visibility[side])continue;const key=`${state.key}${side==='single'?'':`:${side}`}`;const stored=protocolData.breakouts?.[pattern]||{};if(Object.hasOwn(stored,key)){delete stored[key];changed=true;}const values=protocolData.measurements?.[pattern]?.[state.key]?.[side];if(values&&Object.keys(values).length){delete protocolData.measurements[pattern][state.key][side];changed=true;}}});
      }
    }
  }
  function validateFmsMcsCompletion(){if(currentScenario?.code!=='fms')return null;const allFields=tests.flatMap(test=>test.definition.fields);const value=code=>{const field=allFields.find(item=>item.code===code);const raw=fieldMeasurements[`${code}:none`];return raw==null||raw===''?null:Number(raw);};const lowerLength=value('fms_lower_body_mcs_foot_length');const upperLength=value('fms_upper_body_mcs_foot_length');const lowerSkipped=scores['fms_lower_body_mcs_skipped:none']==='positive';const upperSkipped=scores['fms_upper_body_mcs_skipped:none']==='positive';return window.FmsProtocol.validateCompletion({lowerSkipped,lowerLength,lowerLeft:value('fms_lower_body_mcs_distance_left'),lowerRight:value('fms_lower_body_mcs_distance_right'),upperSkipped,upperLength,upperLeft:value('fms_upper_body_mcs_distance_left'),upperRight:value('fms_upper_body_mcs_distance_right')});}
  function firstMissingEditAnswer(){const mcsMissing=validateFmsMcsCompletion();if(mcsMissing)return mcsMissing;for(const test of tests)for(const field of test.definition.fields.filter(item=>item.required||item.scoring))for(const side of field.sideMode==='bilateral'?['left','right']:['none']){const value=field.fieldType==='measurement'?fieldMeasurements[`${field.code}:${side}`]:scores[`${field.code}:${side}`];if(value==null||value==='')return field.label;}return null;}
  function invalidMeasurementMessage(){const input=document.querySelector('[data-measurement-field].is-invalid');if(!input)return null;const test=tests.find(item=>item.definition.fields.some(field=>field.code===input.dataset.measurementField));const field=test?.definition.fields.find(item=>item.code===input.dataset.measurementField);return `${test?.name||'Badanie'} – niepoprawny pomiar: ${field?.label||'wartość'}${input.dataset.side==='left'?' (lewa strona)':input.dataset.side==='right'?' (prawa strona)':''}.`;}
  let editReturnRoute = null;
  async function saveAssessmentEdit() {
    if (!isEditingAssessment || !activeAssessment) return;
    const invalid=invalidMeasurementMessage();if(invalid){window.alert(invalid);return;}
    if (!activeAssessment.date) { window.alert("Assessment date is required before saving."); return; }
    const missingAnswer = firstMissingEditAnswer();
    if (missingAnswer) { window.alert(`Brakuje wyniku dla pola: ${missingAnswer}. Uzupe\u0142nij go przed zapisem, aby nie utraci\u0107 danych badania.`); return; }
    try {
      const targetClientId=$('[data-edit-client]')?.value||activeAssessment.clientId;
      await apiRequest(`/assessments/${encodeURIComponent(activeAssessment.assessmentId)}`, { method: 'PATCH', body: JSON.stringify({ ...assessmentPayload(), clientId: targetClientId, correctionNote: 'Korekta danych badania w interfejsie edycji.' }) });
      activeAssessment.clientId=targetClientId;
      const assessmentId = activeAssessment.assessmentId;
      isEditingAssessment = false;
      activeAssessment = null;
      removeLocalDraft();
      await loadResults(assessmentId);
      try { await refreshClientHistory(); } catch {}
      if(targetClientId!==selectedClient?.id){selectedClient=clients.find(client=>client.id===targetClientId)||selectedClient;setRoute(`client/${targetClientId}`);}else setRoute(editReturnRoute || `results/${assessmentId}`);
      editReturnRoute = null;
      render();
    } catch (error) { window.alert(`Nie udało się zapisać zmian: ${error.message}`); }
  }  async function loadResults(assessmentId) {
    resultsLoadError = '';
    resultsLoading = true;
    selectedAssessment = null;
    results = [];
    try {
      selectedAssessment = await apiRequest(`/assessments/${assessmentId}/results`);
      if (!selectedAssessment || selectedAssessment.assessmentId !== assessmentId) throw new Error('Nie znaleziono wynik\u00f3w tego badania.');
      const clientId = selectedAssessment.client?.clientId;
      if (clientId && selectedAssessment.additionalTests?.length) {
        const codes = [...new Set(selectedAssessment.additionalTests.map(item => item.test_code))];
        const histories = await Promise.all(codes.map(async code => [code, await apiRequest(`/clients/${encodeURIComponent(clientId)}/additional-tests/history?testCode=${encodeURIComponent(code)}`).catch(() => [])]));
        const byCode = new Map(histories);
        selectedAssessment.additionalTests = selectedAssessment.additionalTests.map(item => ({ ...item, history: (byCode.get(item.test_code) || []).filter(entry => entry.side === item.side) }));
      }
      results = (selectedAssessment.rows || []).filter(row => !row.additional);
      return selectedAssessment;
    } catch (error) {
      resultsLoadError = error.message || 'Nie uda\u0142o si\u0119 pobra\u0107 wynik\u00f3w.';
      throw error;
    } finally {
      resultsLoading = false;
    }
  }
  async function editAssessment(assessmentId) {
    const record = await apiRequest(`/assessments/${encodeURIComponent(assessmentId)}`);
    await loadScenarioDefinition(record.screen_type_id);
    additionalCatalog = [];
    for (const item of screenTypes.filter(item => ['quick_screen','fms'].includes(item.code))) {
      const source = item.screenTypeId === record.screen_type_id ? currentScenario : await apiRequest(`/scenarios/${encodeURIComponent(item.screenTypeId)}/definition?locale=pl`);
      for (const step of source.steps || []) additionalCatalog.push({ protocolCode: item.code, sourceVersion: source.manualVersion || '', testCode: step.test.code, name: step.test.name, fields: step.fields || [] });
    }
    for (const test of window.SfmaProtocol.topTier) additionalCatalog.push({ protocolCode: 'sfma', sourceVersion: window.SfmaProtocol.version, testCode: `sfma_${test.id}`, name: test.name, fields: [{ id: `sfma_${test.id}`, code: `sfma_${test.id}`, label: test.name, fieldType: 'choice', sideMode: test.sides === 'bilateral' ? 'bilateral' : 'none', required: true, scoring: true, answerSet: { code: 'sfma_classification' }, answers: ['FN','FP','DN','DP'].map(value => ({ code: value, label: value })) }] });
    const sfmaType=screenTypes.find(item=>item.code==='sfma');
    const sfmaDefinition=sfmaType?(sfmaType.screenTypeId===record.screen_type_id?currentScenario:await apiRequest(`/scenarios/${encodeURIComponent(sfmaType.screenTypeId)}/definition?locale=pl`)):null;
    additionalSfmaRules=sfmaDefinition?.measurementRules||{};
    for(const pattern of window.SfmaProtocol.breakouts)for(const section of pattern.sections)section.steps.forEach((step,index)=>{const bilateral=window.SfmaProtocol.isBilateralStep(step,section);const code=`sfma_breakout_${pattern.topTierId}_${section.id}_${index}`;const measurements=window.SfmaProtocol.measurementFields(step);const fields=[{id:`${code}_classification`,code:'classification',label:'Klasyfikacja',fieldType:'choice',sideMode:bilateral?'bilateral':'none',required:true,scoring:true,answerSet:{code:'sfma_classification'},answers:['FN','FP','DN','DP'].map(value=>({code:value,label:value}))},...measurements.map(field=>({id:`${code}_${field.id}`,code:field.id,label:`${field.label} · standard ${field.standard}°`,fieldType:'measurement',sideMode:bilateral?'bilateral':'none',required:false,measurementUnit:'deg',standard:field.standard}))];additionalCatalog.push({protocolCode:'sfma',sourceVersion:window.SfmaProtocol.version,testCode:code,name:step.title,fields,sfmaContext:{pattern:pattern.topTierId,section:section.id,index,bilateral,measurementFields:measurements}});});
    selectedScreenTypeId = record.screen_type_id;
    selectedClient = { id: record.clients.client_id, name: `${record.clients.first_name} ${record.clients.last_name}`, email: record.clients.email };
    assessmentAnthropometryByCondition = {};
    try { assessmentAnthropometryByCondition = (await apiRequest(`/clients/${encodeURIComponent(selectedClient.id)}/anthropometry`)).latestByCondition || {}; } catch {}
    activeAssessment = { assessmentId: record.assessment_id, clientId: record.client_id, screenTypeId: record.screen_type_id, date: record.assessment_date, manualVersion: record.manual_version };
    additionalTests = (record.additional_tests || []).map(item => ({ protocolCode: item.protocol_code, testCode: item.test_code, sourceVersion: item.source_version, result: item.result, side: item.side, measurements: item.measurements || [], note: item.note || '' }));
    protocolData = record.protocol_data || { version: record.manual_version, topTier: {}, breakouts: {} };
    scores = {};
    fieldMeasurements = {};
    fieldMeasurementUnits = {};
    fieldMeasurementConditions = {};
    for (const answer of record.assessment_answers || []) {
      const field = tests.flatMap(test => test.definition.fields).find(item => item.id === answer.test_field_id);
      const option = field?.answers.find(item => item.id === answer.answer_option_id);
      if (field && option) scores[`${field.code}:${answer.side}`] = field.answerSet.code === 'score_0_3' ? option.value : option.code;
    }
    if (currentScenario?.code === 'sfma') { protocolData.breakouts ||= {};protocolData.measurements ||= {};for (const test of window.SfmaProtocol.topTier) { const value = protocolData.topTier?.[test.id] || {}; if (test.sides === 'bilateral') { scores[`sfma_${test.id}:left`] = value.left || ''; scores[`sfma_${test.id}:right`] = value.right || ''; } else scores[`sfma_${test.id}:none`] = value.score || ''; }for(const test of window.SfmaProtocol.topTier)if(window.SfmaProtocol.breakoutActive(test,sfmaPayload().topTier))pruneSfmaBreakout(test.id);else{delete protocolData.breakouts[test.id];delete protocolData.measurements[test.id];} }
    for (const measurement of record.assessment_field_measurements || []) {
      const field = tests.flatMap(test => test.definition.fields).find(item => item.id === measurement.test_field_id);
      if (field) {
        fieldMeasurements[`${field.code}:${measurement.side}`] = String(measurement.numeric_value);
        if (field.measurementUnitGroup) fieldMeasurementUnits[field.measurementUnitGroup] = measurement.unit;
        if (field.measurementSharedKey && measurement.measurement_condition) fieldMeasurementConditions[field.measurementSharedKey] = measurement.measurement_condition;
      }
    }
    notes = Object.fromEntries(tests.flatMap((test, index) => (record.assessment_test_notes || []).filter(note => note.test_id === test.definition.test.id).map(note => [String(index + 1), note.note])));
    if(currentScenario?.code==='sfma')for(const [id,note] of Object.entries(protocolData.notes||{})){const ix=window.SfmaProtocol.topTier.findIndex(test=>test.id===id);if(ix>=0)notes[String(ix+1)]=note;}
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
  function assessmentEditModal(){if(!isEditingAssessment||!activeAssessment)return '';const date=activeAssessment.date?new Date(`${activeAssessment.date}T00:00:00`).toLocaleDateString('pl-PL'):'';return `<div class="assessment-edit-overlay" data-edit-backdrop><section class="assessment-edit-modal" role="dialog" aria-modal="true" aria-labelledby="assessment-edit-title"><header class="assessment-edit-header"><div><span class="assessment-edit-kicker">KOREKTA BADANIA · ${esc(date)}</span><h1 id="assessment-edit-title">Edytuj badanie</h1><p>${esc(selectedClient?.name||'')} · Zmień wybrane odpowiedzi i zapisz je razem.</p></div><button type="button" class="assessment-edit-close" data-action="cancel-assessment-edit" aria-label="Zamknij edycję">×</button></header><div class="assessment-edit-content"><label class="assessment-date-control">Data badania<input type="date" required data-assessment-date value="${esc(activeAssessment.date||'')}"></label>${tests.map((test,index)=>`<section class="assessment-edit-test card"><div class="assessment-edit-test-head"><span class="assessment-edit-index">${String(index+1).padStart(2,'0')}</span><h2>${esc(test.name)}</h2><button type="button" class="btn btn-small" data-action="criteria" data-test-index="${index}">${icon('info',14)} Standardy</button></div><div class="criteria-panel" id="criteria-panel-${index}">${criteriaMarkup(test)}</div>${testFields(test,index)}<div class="notes"><label for="edit-test-note-${index}">Notatka / uwagi do testu (opcjonalnie)</label><textarea id="edit-test-note-${index}" data-note="${index+1}" placeholder="Wpisz ewentualne obserwacje dotyczące kompensacji ruchowych...">${esc(notes[index+1]||'')}</textarea></div></section>`).join('')}${additionalTestsEditorMarkup()}</div><footer class="assessment-edit-footer"><button type="button" class="btn" data-action="cancel-assessment-edit">Anuluj</button><button type="button" class="btn btn-primary" data-action="save-assessment-edit">Zapisz zmiany</button></footer></section></div>`;}
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
  let resultsLoading = false;
  let currentScenario = null;
  let trendProtocol = 'quick_screen';
  let trainer = null;
  let authError = '';
  let wizardIndex = 0;
  let selectedClient = null;
  let pairClientId = '';
  let pairedDraft = null;
  let searchText = '';
  let scores = {};
  let fieldMeasurements = {};
  let fieldMeasurementUnits = {};
  let fieldMeasurementConditions = {};
  let assessmentAnthropometryByCondition = {};
  let notes = {};
  let additionalTests = [];
  let additionalCatalog = [];
  let additionalSfmaRules = {};
  let selectedAdditionalCode = '';
  let protocolData = {};
  let shoulderMeasurements = { handLengthCm: '', gaps: { left: '', right: '' } };
  let shoulderAutoScores = {};
  let activeAssessment = null;
  let isEditingAssessment = false;
  let recoveryPrompted = false;
  let selectedAssessment = null;
  let reportSettings = { blockVisibility: { intro: true, results: true, plan: true, help: true } };
  let reportResources = [];
  let activeReport = null;
  let anthropometryModalClientId = '';
  let anthropometryEditingId = '';
  let reportLoadError = '';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (name, size = 20) => {
    const paths = {
      dashboard:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      clients:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6"/>',
      test:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M12 9v7M8.5 12.5h7"/>',
      trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
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
  let routeTrail = [];
  let skipRouteTrailUpdate = false;
  const routeFallback = current => {
    if (current.startsWith('sfma-report/')) return `results/${current.split('/')[1] || ''}`;
    if (current.startsWith('client-edit/')) return `client/${current.split('/')[1] || ''}`;
    if (current.startsWith('client/')) return 'clients';
    if (current.startsWith('results/')) { const id=current.split('/')[1]; const record=clients.find(c=>c.history?.some(item=>item.assessmentId===id)); return record?`client/${encodeURIComponent(record.id)}`:'clients'; }
    if (current.startsWith('fms-report/') || current.startsWith('report/')) return `results/${current.split('/')[1] || ''}`;
    if (current.startsWith('client-report/')) return 'results';
    return 'dashboard';
  };
  const backRoute = current => {
    while (routeTrail.length && (routeTrail[routeTrail.length-1] === current || routeTrail[routeTrail.length-1].startsWith('report/'))) routeTrail.pop();
    return routeTrail.pop() || routeFallback(current);
  };
  const backAction = (current, label='Wróć') => `<button type="button" class="btn nav-button nav-button-secondary" data-action="route-back" data-fallback="${esc(routeFallback(current))}">← ${label}</button>`;
  const newAssessmentClientId = () => {
    const match = routePath().match(/^new-assessment\/(?:select-protocol\/)?([^/]+)$/);
    if (!match) return null;
    try { return decodeURIComponent(match[1]); } catch { return match[1]; }
  };
  const setRoute = path => { location.hash = `/${path}`; };
  const actionTile = content => `<section class="action-tile card" aria-label="Akcje"><div class="action-tile-actions">${content}</div></section>`;
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
  function dashboard(){const active='#/dashboard';return shell(`<main class="page dashboard-page"><section class="hero-card card"><div><h1>Witaj, ${trainer?.displayName||""}</h1><p>Rozpocznij nowe badanie lub sprawdź ostatnią aktywność. Narzędzie QuickScreen ułatwia szybką identyfikację ograniczeń ruchowych oraz punktów bolesnych.</p></div><a class="btn btn-primary" href="#/new-assessment">${icon('plus',19)} Nowe badanie</a>${readLocalDraft()?'<button class="btn" data-action="open-last-draft">Otwórz ostatni szkic</button>':''}</section><section class="activity-card card"><div class="section-title"><h2>Ostatnia aktywność</h2><a class="btn btn-small" href="#/clients">Lista klientów　›</a></div>${latestActivity.map(c=>`<a class="activity-row" href="#/client/${c.clientId}" aria-label="Otwórz profil: ${c.name}"><span class="activity-dot">${icon('person',19)}</span><span class="activity-meta"><b>${c.name}</b><span>${c.sport}　•　${c.date}</span></span>${activityStatus(c.status)}<span class="score-chip">${c.protocolCode==='sfma'?'Wyniki opisowe':c.points===null?'— PKT':c.points+' PKT'}</span></a>`).join('')}</section><section class="quick-links"><a class="quick-link card" href="#/report-settings"><span class="quick-icon">${icon('gear')}</span><span class="quick-arrow">→</span><div><h3>Ustawienia raportu</h3><p>Wybierz dostępne bloki raportu i zarządzaj materiałami dla klientów.</p></div></a></section></main>${footer()}`,active);}
  function lastTestAction(c,small=false){return c.latestAssessmentId?`<a class="btn ${small?'btn-small':''}" href="#/results/${c.latestAssessmentId}">Ostatni test</a>`:`<span class="btn ${small?'btn-small':''}" aria-disabled="true" title="Brak zakończonego badania">Ostatni test</span>`;}
  function clientRow(c){return `<tr data-client-row="#/client/${c.id}" tabindex="0" aria-label="Otwórz profil: ${esc(c.name)}"><td><a class="client-name" href="#/client/${c.id}">${esc(c.name)}</a><span class="client-email">${esc(c.email)}</span></td><td>${esc(c.sport)}</td><td>${esc(c.date)}</td><td><strong>${c.score===null?'—':`${c.score}/${c.maxScore??'—'}`}</strong></td><td>${c.status?activityStatus(c.status):'<span class="muted">—</span>'}</td><td><div class="row-actions"><a class="btn btn-small btn-blue" href="#/new-assessment/${encodeURIComponent(c.id)}">+ Test</a>${lastTestAction(c,true)}</div></td></tr>`;}
  function clientCard(c){return `<article class="client-card" data-client-row="#/client/${c.id}" tabindex="0" aria-label="Otwórz profil: ${esc(c.name)}"><div class="client-card-top"><div><a class="client-name" href="#/client/${c.id}">${esc(c.name)}</a><span class="client-email">${esc(c.email)}</span></div><div class="client-score">${c.status?activityStatus(c.status):''}<span>${c.score===null?'—':`${c.score}/${c.maxScore??'—'}`}</span></div></div><div class="client-card-meta"><span>Dyscyplina<b>${esc(c.sport)}</b></span><span>Ostatni test<b>${esc(c.date)}</b></span></div><div class="client-card-actions"><a class="btn btn-blue" href="#/new-assessment/${encodeURIComponent(c.id)}">+ Test</a>${lastTestAction(c)}</div></article>`;}
  function clientsPage(){const filtered=clients.filter(c=>`${c.name} ${c.email} ${c.sport}`.toLowerCase().includes(searchText.toLowerCase()));return shell(`<main class="page"><div class="page-heading"><div><h1>Klienci</h1><p>Profile osób ocenianych w module QuickScreen.</p></div></div>${actionTile('<button class="btn nav-button nav-button-primary" data-action="add-client">+ Dodaj klienta</button>')}<div class="list-tools card"><input class="search" id="client-search" type="search" placeholder="⌕  Szukaj po nazwisku, imieniu lub e-mailu..." value="${esc(searchText)}" aria-label="Szukaj klientów"></div><div class="table-wrap card"><table class="data-table"><thead><tr><th>Imię i nazwisko / email</th><th>Dyscyplina</th><th>Ostatnie badanie</th><th>Wynik</th><th>Status</th><th>Akcje</th></tr></thead><tbody>${filtered.map(clientRow).join('')}</tbody></table></div><div class="mobile-client-list">${filtered.map(clientCard).join('')}</div></main>${footer()}`,'#/clients');}
  function historyTable(client){const history=client.history||[];return `<section class="history-card card"><h2>Historia bada\u0144</h2><table class="data-table"><thead><tr><th>Data badania</th><th>Typ</th><th>Wynik</th><th>Status</th><th>Akcje</th></tr></thead><tbody>${history.map(item=>{const date=new Date(`${item.date}T00:00:00`).toLocaleDateString('pl-PL');const state=item.indicator|| (item.score===0?'problem':item.score===1?'warn':'ok');return `<tr><td><strong>${date}</strong></td><td><span class="protocol-chip">${item.protocolCode==='sfma'?'SFMA':item.protocolCode==='fms'?'FMS':'QS'}</span></td><td><strong>${item.protocolCode==='sfma'?'Wyniki opisowe':`${item.score??'\u2014'}/${item.maximum??'\u2014'}`}</strong></td><td>${activityStatus(state)}</td><td class="history-actions"><a aria-label="Otw\u00f3rz z ${date}" href="#/results/${item.assessmentId}">Otw\u00f3rz</a><button class="history-edit-action" data-action="edit-assessment" data-assessment="${esc(item.assessmentId)}">Edytuj</button><a aria-label="Zobacz raport z ${date}" href="#/report/${item.assessmentId}">Raport</a><button type="button" class="history-delete-action" data-action="delete-assessment" data-assessment="${esc(item.assessmentId)}" aria-label="Usu\u0144 badanie z ${date}" title="Usu\u0144 badanie">${icon('trash',16)}</button></td></tr>`;}).join('')}</tbody></table></section>`;}
  function historyMobile(client){const history=client.history||[];return `<section class="history-mobile"><h2>Historia bada\u0144</h2>${history.map(item=>{const date=new Date(`${item.date}T00:00:00`).toLocaleDateString('pl-PL');const state=item.indicator|| (item.score===0?'problem':item.score===1?'warn':'ok');return `<article class="history-mobile-card card"><div class="history-mobile-top"><time>${date}<small>${item.protocolCode==='sfma'?'SFMA':item.protocolCode==='fms'?'FMS':'QS'} · Data badania</small></time><strong>${activityStatus(state)}${item.protocolCode==='sfma'?'Wyniki opisowe':`${item.score??'\u2014'}/${item.maximum??'\u2014'}`}</strong></div><div class="history-mobile-actions"><a href="#/results/${item.assessmentId}">Otw\u00f3rz</a><button class="history-edit-action" data-action="edit-assessment" data-assessment="${esc(item.assessmentId)}">Edytuj</button><a href="#/report/${item.assessmentId}">Raport</a><button type="button" class="history-delete-action" data-action="delete-assessment" data-assessment="${esc(item.assessmentId)}" aria-label="Usu\u0144 badanie z ${date}" title="Usu\u0144 badanie">${icon('trash',16)}</button></div></article>`;}).join('')}</section>`;}
  function profileBanner(client, clientMode=false){const initials=client.name.split(/\s+/).slice(0,2).map(name=>name[0]).join('').toLocaleUpperCase('pl');const created=client.createdAt?new Date(client.createdAt).toLocaleDateString('pl-PL'):'';return `<section class="profile-banner card"><span class="initials">${esc(initials)}</span><div class="profile-main"><h1>${esc(client.name)}</h1><p>${esc(client.email)}　•　<span class="sport">${esc(client.sport)}</span>　•　<span class="muted">Klient od: ${created}</span></p></div></section>`;}
  function profilePage(clientMode=false,clientId=clients[0].id){const c=clients.find(x=>x.id===clientId)||clients[0];const editingAnthropometry=(c?.anthropometry||[]).find(item=>item.measurementId===anthropometryEditingId);const nav=clientMode?'#/client-dashboard':'#/clients';const history=c.history||[];const best=history.reduce((value,item)=>item.score!=null&&(!value||item.score>value.score)?item:value,null);const latest=history[0];return shell(`<main class="page ${clientMode?'client-dashboard-page':''}">${clientMode?'':`<a class="back-link nav-button nav-button-secondary" href="#/clients">${icon('left',15)} Wróć do listy klientów</a>`}${profileBanner(c,clientMode)}<div class="profile-grid">${historyTable(c)}<section class="trend-card card"><div class="section-title"><h2>${clientMode?'Podsumowanie moich trendów':'Podsumowanie trendów'}</h2><span class="body-copy"><i class="chart-dot"></i><small>${clientMode?'Wynik QS':'Score'}</small></span></div>${trendChart(history)}<div class="trend-stat"><span>${clientMode?'Liczba wykonanych badań':'Liczba badań'}</span><b>${history.length}</b></div><div class="trend-stat"><span>${clientMode?'Najlepszy wynik życiowy':'Najlepszy wynik'}</span><b class="good">${best?`${best.score}/${best.maximum}`:'—'} <small class="muted">${best?`(${new Date(`${best.date}T00:00:00`).toLocaleDateString('pl-PL')})`:''}</small></b></div><div class="trend-stat"><span>${clientMode?'Ostatnio uzyskany wynik':'Ostatnie badanie'}</span><b class="bad">${latest?.protocolCode==='sfma'?'Wyniki opisowe':latest?`${latest.score}/${latest.maximum} <small class="muted">(${new Date(`${latest.date}T00:00:00`).toLocaleDateString('pl-PL')})</small>`:'—'}</b></div></section>${historyMobile(c)}</div></main>${footer()}`,nav,{client:clientMode,subtitle:clientMode?'Wyniki badań':'QuickScreen · Panel Pracy'});}
  function newAssessment(invalidClient=false,selectProtocol=false){
    const invalidNotice=invalidClient?'<p class="login-message" role="alert">Nie znaleziono wskazanego klienta. Wyszukaj profil lub wpisz dane klienta.</p>':'';
    const protocolLabel=item=>item.code==='quick_screen'?'Quick Screen':item.name;
    const clientFields=`<h2>Wybierz klienta</h2><p>Wyszukaj istniejący profil albo wpisz dane nowego klienta.</p><div class="field"><label for="client-first">Imię *</label><input id="client-first" value="${selectedClient?.name.split(' ')[0]||''}" autocomplete="given-name"><div class="suggestions" id="suggestions-first" aria-live="polite"></div></div><div class="field"><label for="client-last">Nazwisko *</label><input id="client-last" value="${selectedClient?.name.split(' ').slice(1).join(' ')||''}" placeholder="Wpisz nazwisko" autocomplete="family-name"><div class="suggestions" id="suggestions-last" aria-live="polite"></div></div><div class="field"><label for="client-email">E-mail *</label><input id="client-email" type="email" value="${selectedClient?.email||''}" placeholder="email@example.com"><div class="suggestions" id="suggestions-email" aria-live="polite"></div></div><div class="field"><label for="client-sport">Dyscyplina wiodąca</label><input id="client-sport" value="${selectedClient?.sport||''}" placeholder="np. Piłka nożna, Bieganie"></div><div class="new-footer"><button class="btn btn-primary" data-action="choose-protocol">Wybierz test ${icon('arrow',16)}</button></div>`;
    const protocolChoices=screenTypes.length?`<fieldset class="protocol-choice-list"><legend>Dostępne protokoły</legend>${screenTypes.map(item=>`<label class="protocol-choice"><input type="radio" name="screenTypeId" value="${esc(item.screenTypeId)}" ${selectedScreenTypeId===item.screenTypeId?'checked':''}><span><strong>${esc(protocolLabel(item))}</strong></span></label>`).join('')}</fieldset><div class="new-footer"><a class="btn" href="#/new-assessment/${encodeURIComponent(selectedClient?.id||'')}">Wstecz</a><button class="btn btn-primary" id="start-selected-protocol" data-action="start-assessment" ${selectedScreenTypeId?'':'hidden'}>Przejdź do badania ${icon('arrow',16)}</button></div>`:'<p class="login-message" role="status">Brak dostępnych protokołów badania.</p>';
    const pairControl=selectProtocol&&screenTypes.find(item=>item.screenTypeId===selectedScreenTypeId)?.code==='quick_screen'?`<fieldset class="pair-assessment-choice"><legend>Badanie</legend><label><input type="checkbox" id="pair-mode" data-pair-mode ${pairClientId?'checked':''}> Test dwóch klientów</label><label class="pair-client-control" ${pairClientId?'':'hidden'}>Drugi klient<select data-pair-client><option value="">Wybierz klienta</option>${clients.filter(client=>client.id!==selectedClient?.id).map(client=>`<option value="${esc(client.id)}" ${client.id===pairClientId?'selected':''}>${esc(client.name)}</option>`).join('')}</select></label></fieldset>`:'';
    const content=selectProtocol?`<h2>Wybierz test</h2><p>Wybierz protokół badania dla klienta: <strong>${esc(selectedClient?.name||'')}</strong>.</p>${protocolChoices}${pairControl}`:`${invalidNotice}${clientFields}`;
    return shell(`<main class="page page-narrow"><div class="page-heading"><div><h1>Nowe badanie</h1><p>${selectProtocol?'Wybierz protokół':'Dane klienta'}</p></div></div><section class="new-card card">${content}</section></main>${footer()}`,selectProtocol?'#/new-assessment':`#/new-assessment${selectedClient?`/${encodeURIComponent(selectedClient.id)}`:''}`,{subtitle:selectProtocol?'Krok 2 — Wybór protokołu':'Krok 1 — Dane klienta'});
  }
  function addClientPage(){return shell(`<main class="page page-narrow"><div class="page-heading"><div><h1>Dodaj klienta</h1><p>Utwórz profil klienta. Badanie możesz rozpocząć później z jego profilu.</p></div></div><section class="new-card card"><div class="field"><label for="client-first">Imię *</label><input id="client-first" autocomplete="given-name"></div><div class="field"><label for="client-last">Nazwisko *</label><input id="client-last" autocomplete="family-name"></div><div class="field"><label for="client-email">E-mail *</label><input id="client-email" type="email" placeholder="email@example.com"></div><div class="field"><label for="client-sport">Dyscyplina wiodąca</label><input id="client-sport" placeholder="np. Piłka nożna, Bieganie"></div><div class="new-footer"><a class="btn" href="#/clients">Anuluj</a><button class="btn btn-primary" data-action="save-client">Zapisz klienta</button></div></section></main>${footer()}`,'#/clients',{subtitle:'Nowy profil klienta'});}
  async function saveClient(){const firstName=$('#client-first')?.value.trim()||'';const lastName=$('#client-last')?.value.trim()||'';const email=$('#client-email')?.value.trim()||'';const discipline=$('#client-sport')?.value.trim()||'';const resolved=await apiRequest('/clients/resolve',{method:'POST',body:JSON.stringify({firstName,lastName,email,discipline})});await loadQuickScreenData();setRoute(`client/${encodeURIComponent(resolved.client.clientId)}`);render();}
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
  function syncFmsDerivedScores() {
    if(currentScenario?.code!=='fms') return;
    const fields=tests.flatMap(test=>test.definition.fields);
    for(const field of fields.filter(item=>item.controlType==='derived_score'&&item.derivedScoreRule)) for(const side of field.sideMode==='bilateral'?['left','right']:['none']) {
      const measured=fields.find(item=>item.id===field.derivedMeasurementFieldId);
      const reference=fields.find(item=>item.id===field.derivedReferenceFieldId);
      const gap=fieldMeasurements[`${measured?.code}:${side}`];
      const length=fieldMeasurements[`${reference?.code}:none`];
      const value=window.FmsProtocol.shoulderMobilityScore(gap,length);
      if(value!==null) {
        const key=`${field.code}:${side}`; scores[key]=value;
        document.querySelectorAll(`[data-key="${key}"]`).forEach(button=>{const selected=Number(button.dataset.score)===value;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));button.disabled=true;button.title='Wynik wyliczony z pomiaru';});
      }
    }
  }
  app.addEventListener('click',e=>{const top=e.target.closest('[data-sfma-top]');if(top){e.stopImmediatePropagation();const key=`sfma_${top.dataset.sfmaTop}:${top.dataset.side}`;scores[key]=top.dataset.value;const spec=window.SfmaProtocol.topTier.find(item=>item.id===top.dataset.sfmaTop);if(!window.SfmaProtocol.breakoutActive(spec,sfmaPayload().topTier)){delete protocolData.breakouts[top.dataset.sfmaTop];delete protocolData.measurements?.[top.dataset.sfmaTop];}else pruneSfmaBreakout(top.dataset.sfmaTop);saveLocalDraft();render();return;}});
  app.addEventListener('change',e=>{if(e.target.matches('[data-sfma-breakout]')){const {sfmaBreakout:id,breakoutKey:key}=e.target.dataset,value=e.target.value;protocolData.breakouts[id] ||= {};if(value)protocolData.breakouts[id][key]=value;else delete protocolData.breakouts[id][key];pruneSfmaBreakout(id);saveLocalDraft();render();return;}if(e.target.matches('[data-sfma-measurement]')){const {sfmaPattern,measurementStep,measurementSide,measurementField}=e.target.dataset;protocolData.measurements ||= {};protocolData.measurements[sfmaPattern] ||= {};protocolData.measurements[sfmaPattern][measurementStep] ||= {};protocolData.measurements[sfmaPattern][measurementStep][measurementSide] ||= {};const raw=e.target.value.trim().replace(',','.');if(raw==='')delete protocolData.measurements[sfmaPattern][measurementStep][measurementSide][measurementField];else protocolData.measurements[sfmaPattern][measurementStep][measurementSide][measurementField]=raw;pruneSfmaBreakout(sfmaPattern);saveLocalDraft();render();}});
  function testFields(test,index) {
    if(currentScenario?.code==='sfma') return sfmaTestFieldsV2(test,index);
    const fields=test.definition.fields.filter(field=>(field.scoring||field.wizardInput)&&field.fieldType!=='measurement');
    const allMeasurementFields=test.definition.fields.filter(field=>field.fieldType==='measurement');
    const referenceFields=allMeasurementFields.filter(field=>field.measurementRole==='reference');
    const measurementFields=allMeasurementFields.filter(field=>field.measurementRole!=='reference');
    if(test.key==='shoulder_mobility') syncShoulderAutoScores(false);
    const renderField=(field,side)=>{const key=`${field.code}:${side}`;const numeric=field.answerSet.code==='score_0_3';const derived=field.controlType==='derived_score'&&scores[key]!=null||numeric&&test.key==='shoulder_mobility'&&window.QuickScreenShoulderMeasurements.score(shoulderMeasurements.handLengthCm,shoulderMeasurements.gaps[side])!==null;const disabledBy=field.disabledByFieldCode&&scores[`${field.disabledByFieldCode}:${side}`]==='positive';if(field.controlType==='checkbox'){const checked=scores[key]==='positive';return `<label class="field-control dynamic-checkbox"><input type="checkbox" data-checkbox-field="${esc(field.code)}" data-side="${side}" ${checked?'checked':''}><span class="field-label">${esc(field.label)}</span></label>`;}return `<div class="field-control"><span class="field-label">${esc(field.label)}</span><div class="${numeric?'score-options':'binary-options'}">${field.answers.map(answer=>{const selected=String(scores[key])===String(numeric?answer.value:answer.code);const tone=field.answerSet?.code==='fms_stoplight'?answer.code:(/positive|pain|yes|fail/i.test(answer.code)?'pain':'pass');return `<button type="button" class="${numeric?'score-option':'binary-option'} ${selected?`selected ${numeric?'':tone}`:''}" data-key="${esc(key)}" data-value="${esc(answer.code)}" ${numeric?`data-score="${answer.value}"`:''} ${derived||disabledBy?'disabled':''} ${derived?'title="Wynik wyliczony z pomiarów"':''} aria-pressed="${selected}">${numeric?`<span class="n">${esc(answer.value)}</span>`:''}<span>${esc(answer.label)}</span></button>`}).join('')}</div></div>`;};
    const groups=fields.some(field=>field.sideMode==='bilateral')||measurementFields.some(field=>field.sideMode==='bilateral'||field.measurementSide)?['left','right']:['none'];
    if (measurementFields.length||referenceFields.length) {
      const renderMeasurement=(field,side)=>{const sharedKey=field.measurementSharedKey;const sharedValue=sharedKey?fieldMeasurements[`shared:${sharedKey}:none`]??fieldMeasurements[`${field.code}:${side}`]:null;const value=sharedKey?sharedValue??'':fieldMeasurements[`${field.code}:${side}`]??'';const unit=fieldMeasurementUnits[field.measurementUnitGroup]||field.measurementUnit;const skipped=field.disabledByFieldCode&&scores[`${field.disabledByFieldCode}:none`]==='positive';if(test.key==='fms_inline_lunge'&&field.measurementRole==='reference'&&sharedKey)return `<div class="measurement-reference-value"><b>${esc(field.label.replace(/\s*\([^)]*\)/,''))}:</b> ${value!==''?`${esc(value)} ${esc(unit)}`:'Nie podano w Hurdle Step'}</div>`;const id=`measurement-${field.id}-${side}`;const bounds=`${field.measurementMin!=null?` min="${esc(field.measurementMin)}"`:''}${field.measurementMax!=null?` max="${esc(field.measurementMax)}"`:''}${field.measurementStep!=null?` step="${esc(field.measurementStep)}"`:' step="any"'}`;const unitOptions=field.measurementUnitOptions||[];const wearCode=field.code==='fms_hurdle_step_tibia_length'?'tibia_length':field.code==='fms_lower_body_mcs_foot_length'||field.code==='fms_upper_body_mcs_foot_length'?'foot_length':null;const wearKey=field.measurementSharedKey;const wearConditionMarkup=wearCode&&field.measurementRole==='reference'?`<div class="measurement-condition-controls"><span>Wymiar zmierzony:</span>${[['with_shoes','Z butem'],['without_shoes','Bez buta']].map(([condition,label])=>`<button type="button" class="btn btn-small ${fieldMeasurementConditions[wearKey]===condition?'selected':''}" data-measurement-condition="${esc(wearKey)}" data-wear-code="${wearCode}" data-source-field="${esc(wearCode==='tibia_length'?'fms_hurdle_step_tibia_length':'fms_lower_body_mcs_foot_length')}" data-unit-group="${esc(field.measurementUnitGroup||'')}" data-condition="${condition}">${label}</button>`).join('')}<small>${wearCode==='tibia_length'?'Ustaw wysokość poprzeczki w Hurdle Step na podstawie tej długości i wybranego warunku.':'Wybierz warunek odpowiadający długości stopy.'}</small></div>`:' ';return `<label class="field-control" for="${esc(id)}"><span class="field-label">${esc(field.label)}${field.required?' *':''}</span>${unitOptions.length>1?`<span class="measurement-unit-options">${unitOptions.map(option=>`<button type="button" class="btn btn-small ${unit===option?'selected':''}" data-measurement-unit="${esc(field.measurementUnitGroup)}" data-unit="${esc(option)}" ${skipped?'disabled':''}>${esc(option)}</button>`).join('')}</span>`:''}<span class="measurement-input-wrap"><input id="${esc(id)}" type="text" inputmode="decimal"${bounds} data-min="${field.measurementMin??''}" data-max="${field.measurementMax??''}" data-measurement-field="${esc(field.code)}" data-side="${side}" value="${esc(value)}" ${skipped?'disabled':''}><span class="measurement-unit">${esc(unit)}</span></span>${wearConditionMarkup}${field.helpText?`<small>${esc(field.helpText)}</small>`:''}</label>`;};
      const sides=measurementFields.concat(fields).some(field=>field.sideMode==='bilateral'||field.measurementSide)?['left','right']:['none'];
      const skippedFields=fields.filter(field=>field.controlType==='checkbox'&&/skipped|niewykonan/i.test(`${field.code} ${field.label}`));
      const referenceMarkup=referenceFields.length||skippedFields.length?`<section class="measurement-reference-panel"><h3>Parametry referencyjne / pomocnicze</h3>${referenceFields.map(field=>renderMeasurement(field,'none')).join('')}${skippedFields.map(field=>renderField(field,'none')).join('')}</section>`:'';
      return `${referenceMarkup}<div class="sides ${sides.length===1?'single-field':''}">${sides.map((side,index)=>`<article class="side-card"><h3>${side==='left'?'Lewa strona':side==='right'?'Prawa strona':'Wynik testu'}</h3>${fields.filter(field=>!skippedFields.includes(field)).map(field=>field.sideMode==='bilateral'?renderField(field,side):!sides.includes('left')||index===0?renderField(field,'none'):'').join('')}${measurementFields.map(field=>field.sideMode==='bilateral'?renderMeasurement(field,side):field.measurementSide?(field.measurementSide===side?renderMeasurement(field,'none'):''):!sides.includes('left')||index===0?renderMeasurement(field,'none'):'').join('')}</article>`).join('')}</div>`;
    }
    const handLengthInput=test.key==='shoulder_mobility'?`<div class="shoulder-measurement-fields"><label for="shoulder-hand-length">Długość dłoni (cm)<input id="shoulder-hand-length" type="number" min="0.1" max="100" step="0.1" inputmode="decimal" data-shoulder-measurement="handLengthCm" value="${esc(shoulderMeasurements.handLengthCm)}"><small>Od bruzdy nadgarstka do końca środkowego palca.</small></label></div>`:'';
    return `${handLengthInput}<div class="sides ${groups.length===1?'single-field':''}">${groups.map(side=>`<article class="side-card"><h3>${side==='left'?'Lewa strona':side==='right'?'Prawa strona':'Wynik testu'}</h3>${fields.map(field=>field.sideMode==='bilateral'?renderField(field,side):renderField(field,'none')).join('')}${test.key==='shoulder_mobility'&&side!=='none'?`<label class="shoulder-distance-field">Odległość między pięściami — ${side==='left'?'lewa':'prawa'} strona (cm)<input type="number" min="0" max="100" step="0.1" inputmode="decimal" data-shoulder-measurement="gap" data-side="${side}" value="${esc(shoulderMeasurements.gaps[side])}"></label>`:''}</article>`).join('')}</div>`;
  }  function criteriaMarkup(test){const items=test.criteria||[];if(items.length)return `<div class="criteria-list">${items.map(([label,detail])=>`<div class="criteria-point"><b>${esc(label)}</b><span>${esc(detail)}</span></div>`).join('')}</div>`;const summary=test.definition.test.criteriaSummary||'';if(!summary)return '<p>Kryteria nie są dostępne dla tego testu.</p>';const points=summary.split(/\s+(?=(?:Strona(?:\s+L)?\s+oznacza|Strona oceniana:|[0-3]:))/i).map(point=>point.trim()).filter(Boolean);return `<ul class="criteria-summary-list">${points.map(point=>`<li>${esc(point)}</li>`).join('')}</ul>`; }
  const baseTestFields=testFields;
  testFields=function(test,index){if(test.key==='neck_extension_clearing')return '';const base=baseTestFields(test,index);if(test.key!=='cervical_rotation_extension')return base;const clearing=tests.find(item=>item.key==='neck_extension_clearing');const field=clearing?.definition.fields.find(item=>item.code==='neck_extension_pain');if(!field)return base;const renderRow=side=>`<div class="field-control neck-extension-field"><span class="field-label">${esc(field.label)}</span><div class="binary-options">${field.answers.map(answer=>{const key=`${field.code}:${side}`;const selected=scores[key]===answer.code;return `<button type="button" class="binary-option ${selected?`selected ${/positive|pain|yes|fail/i.test(answer.code)?'pain':'pass'}`:''}" data-key="${esc(key)}" data-value="${esc(answer.code)}" aria-pressed="${selected}">${esc(answer.label)}</button>`;}).join('')}</div></div>`;const withLeft=base.replace('</article>',`${renderRow('left')}</article>`);const withBoth=withLeft.replace('</article>',`${renderRow('right')}</article>`);return `${withBoth}<div class="notes"><label for="neck-extension-note">Notatka / uwagi do wyprostu szyi (opcjonalnie)</label><textarea id="neck-extension-note" data-note="${tests.indexOf(clearing)+1}">${esc(notes[String(tests.indexOf(clearing)+1)]||'')}</textarea></div>`;};
  const pairStateKeys=['assessment','client','scores','fieldMeasurements','fieldMeasurementUnits','fieldMeasurementConditions','notes','shoulderMeasurements','shoulderAutoScores','protocolData','additionalTests','wizardIndex'];
  function getCurrentPairState(){return Object.fromEntries(pairStateKeys.map(key=>[key,({assessment:activeAssessment,client:selectedClient,scores,fieldMeasurements,fieldMeasurementUnits,fieldMeasurementConditions,notes,shoulderMeasurements,shoulderAutoScores,protocolData,additionalTests,wizardIndex})[key]]));}
  function setCurrentPairState(state){activeAssessment=state.assessment;selectedClient=state.client;scores=state.scores||{};fieldMeasurements=state.fieldMeasurements||{};fieldMeasurementUnits=state.fieldMeasurementUnits||{};fieldMeasurementConditions=state.fieldMeasurementConditions||{};notes=state.notes||{};shoulderMeasurements=state.shoulderMeasurements||{handLengthCm:'',gaps:{left:'',right:''}};shoulderAutoScores=state.shoulderAutoScores||{};protocolData=state.protocolData||{};additionalTests=state.additionalTests||[];wizardIndex=state.wizardIndex||0;}
  function pairedPanelMarkup(test,index){if(!pairedDraft)return '';const primary=getCurrentPairState();setCurrentPairState(pairedDraft);const controls=testFields(test,index).replaceAll('id="','id="pair-').replaceAll('for="','for="pair-');const noteIndex=String(index+1);const note=`<div class="notes"><label for="pair-test-note">Notatka / uwagi do testu (opcjonalnie)</label><textarea id="pair-test-note" data-note="${noteIndex}">${esc(notes[noteIndex]||'')}</textarea></div>`;const partnerState=getCurrentPairState();Object.assign(pairedDraft,partnerState);setCurrentPairState(primary);return `<section class="pair-client-panel" data-pair-member="second"><h2>${esc(pairedDraft.client?.name||'Drugi klient')}</h2>${controls}${note}</section>`;}
  function updatePairedDraft(update){if(!pairedDraft)return;const primary=getCurrentPairState();setCurrentPairState(pairedDraft);update();Object.assign(pairedDraft,getCurrentPairState());setCurrentPairState(primary);saveLocalDraft();}
  function assessment(){const ix=Math.min(tests.length-1,Math.max(0,wizardIndex)),test=tests[ix];const selectedProtocol=screenTypes.find(item=>item.screenTypeId===activeAssessment?.screenTypeId);const protocolLabel=selectedProtocol?.code==='quick_screen'?'QuickScreen':selectedProtocol?.name||'QuickScreen';const prev=ix===0?(isEditingAssessment?`results/${activeAssessment.assessmentId}`:`new-assessment/select-protocol/${encodeURIComponent(activeAssessment?.clientId||selectedClient?.id||'')}`):`assessment/${ix}`;const next=ix===tests.length-1?(isEditingAssessment?'results':'additional-tests'):`assessment/${ix+2}`;const following=tests[ix+1];return shell(`<main class="page"><div class="assessment-meta card"><span class="client-ident"><i class="mini-dot"></i>${selectedClient?.name||''}</span><span>Dyscyplina: ${selectedClient?.sport||''}</span><label class="assessment-date-control">Data badania<input type="date" required data-assessment-date value="${esc(activeAssessment?.date||'')}"></label><span class="protocol-tag">Protokół ${esc(protocolLabel)}</span></div><section class="progress-card card"><div class="progress-label"><b>Postęp badania (Krok ${ix+1} z ${tests.length})</b><span>Test: ${test.en}</span></div><div class="progress-track">${tests.map((_,n)=>`<a class="progress-segment ${n<ix?'done':n===ix?'current':''}" href="#/assessment/${n+1}" aria-label="Przejdź do kroku ${n+1}"></a>`).join('')}</div></section><section class="test-card card"><div class="test-head"><h1>${isEditingAssessment?`Edytuj badanie — ${test.name}`:`Test ${ix+1} z ${tests.length}: ${test.name}`}</h1><button class="btn" data-action="criteria">${icon('info',14)} Standardy</button></div><div class="criteria-panel" id="criteria-panel">${criteriaMarkup(test)}</div>${testFields(test,ix)}<div class="notes"><label for="test-note">Notatka / uwagi do testu (opcjonalnie)</label><textarea id="test-note" data-note="${ix+1}" placeholder="Wpisz ewentualne obserwacje dotyczące kompensacji ruchowych...">${esc(notes[ix+1]||'')}</textarea></div><div class="test-actions"><a class="btn" href="#/${prev}">${icon('left',15)} Wstecz</a>${isEditingAssessment&&ix===tests.length-1?`<button class="btn btn-primary" data-action="save-assessment-edit">Zapisz zmiany</button>`:`<a class="btn btn-primary" href="#/${next}">Dalej${following?`: ${following.name}`:''} ${icon('arrow',15)}</a>`}</div></section></main>${footer()}`,'#/new-assessment',{subtitle:`Krok ${ix+1} z ${tests.length} — Test`});}
  function additionalValue(definition,field,side){return additionalTests.find(item=>item.testCode===definition.testCode&&item.side===side)?.result?.fields?.[field.code]||{};}
  function additionalFieldControl(field,side,saved){
    if(field.controlType==='checkbox'){
      const positive=field.answers?.find(answer=>/positive|yes|true/i.test(answer.code))||field.answers?.[0];
      return `<label class="field-control dynamic-checkbox addon-checkbox"><input type="checkbox" data-addon-checkbox data-addon-field="${esc(field.code)}" data-addon-side="${side}" data-value-code="${esc(positive?.code||'positive')}" data-value-label="${esc(positive?.label||field.label)}" ${saved.valueCode===positive?.code?'checked':''}><span class="field-label">${esc(field.label)}</span></label>`;
    }
    if(field.fieldType==='measurement')return `<label class="addon-measurement"><input type="number" inputmode="decimal" step="any" value="${esc(saved.value??'')}" data-addon-field="${esc(field.code)}" data-addon-side="${side}" data-addon-type="measurement" data-addon-unit="${esc(field.measurementUnit||'')}"><span>${esc(field.measurementUnit||'')}</span></label>`;
    return `<div class="binary-options addon-options">${(field.answers||[]).map(answer=>`<button type="button" class="binary-option addon-choice ${saved.valueCode===answer.code?'selected pass':''}" data-addon-choice data-addon-field="${esc(field.code)}" data-addon-side="${side}" data-code="${esc(answer.code)}" data-label="${esc(answer.label)}" data-numeric="${esc(answer.value??'')}">${esc(answer.label)}</button>`).join('')}</div>`;
  }
  function additionalTestsEditorMarkup(){
    const groups=new Map();
    for(const item of additionalCatalog){let group=item.protocolCode.toUpperCase();if(item.protocolCode==='sfma'){const context=item.sfmaContext;if(!context)group='SFMA · Top Tier';else{const pattern=window.SfmaProtocol.breakouts.find(entry=>entry.topTierId===context.pattern);const section=pattern?.sections.find(entry=>entry.id===context.section);group=`SFMA · ${pattern?.title||context.pattern} · ${section?.title||context.section}`;}}if(!groups.has(group))groups.set(group,[]);groups.get(group).push(item);}
    const chosen=additionalCatalog.find(item=>item.testCode===selectedAdditionalCode);
    const controls=chosen?chosen.fields.filter(field=>field.scoring||field.wizardInput||field.fieldType==='measurement').map(field=>{const sides=field.sideMode==='bilateral'?['left','right']:['none'];return `<div class="addon-field"><div class="field-label">${esc(field.label)}${field.required?' *':''}</div>${sides.map(side=>{const saved=additionalValue(chosen,field,field.sideMode==='bilateral'?side:'none');const label=side==='left'?'Lewa strona':side==='right'?'Prawa strona':'Wynik';return `<div class="addon-answer"><span class="addon-side-label">${label}</span>${additionalFieldControl(field,side,saved)}</div>`;}).join('')}</div>`;}).join(''):'<p class="muted">Wybierz test z katalogu, aby zobaczyć jego pola.</p>';
    const existing=additionalTests.map((item,index)=>`<article class="addon-saved-row"><div><span class="protocol-chip">${esc(item.protocolCode.toUpperCase())}</span><b>${esc(item.result.name)}</b><small>${item.side==='left'?'Lewa strona':item.side==='right'?'Prawa strona':'Wynik'}</small></div><button type="button" class="btn btn-small" data-action="remove-additional-test" data-index="${index}">Usuń</button></article>`).join('');
    return `<section class="assessment-edit-additional card"><div class="assessment-edit-test-head"><span class="assessment-edit-index">+</span><h2>Testy dodatkowe</h2></div><p class="muted">Dodaj, popraw lub usuń testy. Zmiany zapiszą się razem z korektą badania.</p><label class="addon-menu-label" for="additional-test-code">Katalog testów</label><select class="addon-menu" id="additional-test-code"><option value="">Wybierz test…</option>${[...groups].map(([name,items])=>`<optgroup label="${esc(name)}">${items.map(item=>`<option value="${esc(item.testCode)}" ${item.testCode===selectedAdditionalCode?'selected':''}>${esc(item.name)} · ${esc(item.testCode)}</option>`).join('')}</optgroup>`).join('')}</select>${chosen?`<div class="addon-controls">${controls}</div><label class="field addon-note">Notatka (opcjonalnie)<textarea id="additional-test-note" maxlength="2000">${esc(additionalTests.find(item=>item.testCode===selectedAdditionalCode)?.note||'')}</textarea></label><button class="btn btn-primary" type="button" data-action="add-additional-test">Zapisz test dodatkowy</button>`:''}<div class="addon-saved"><h3>Dodane wyniki <span>(${additionalTests.length})</span></h3>${existing||'<p class="muted">W tym badaniu nie ma testów dodatkowych.</p>'}</div></section>`;
  }
  function additionalTestsPage(){
    const catalog=additionalCatalog;
    const chosen=catalog.find(item=>item.testCode===selectedAdditionalCode);
    const groups=new Map();
    for(const item of catalog){
      let group=item.protocolCode.toUpperCase();
      if(item.protocolCode==='sfma'){
        const context=item.sfmaContext;
        if(!context)group='SFMA · Top Tier';
        else{const pattern=window.SfmaProtocol.breakouts.find(entry=>entry.topTierId===context.pattern);const section=pattern?.sections.find(entry=>entry.id===context.section);group=`SFMA · ${pattern?.title||context.pattern} · ${section?.title||context.section}`;}
      }
      if(!groups.has(group))groups.set(group,[]);
      groups.get(group).push(item);
    }
    const controls=chosen?chosen.fields.filter(field=>field.scoring||field.wizardInput||field.fieldType==='measurement').map(field=>{
      const sides=field.sideMode==='bilateral'?['left','right']:['none'];
      return `<div class="addon-field"><div class="field-label">${esc(field.label)}${field.required?' *':''}</div>${sides.map(side=>{const saved=additionalValue(chosen,field,field.sideMode==='bilateral'?side:'none');const label=side==='left'?'Lewa strona':side==='right'?'Prawa strona':'Wynik';return `<div class="addon-answer"><span class="addon-side-label">${label}</span>${additionalFieldControl(field,side,saved)}</div>`;}).join('')}</div>`;
    }).join(''):'<p class="muted">Wybierz test z katalogu, aby wprowadzić odpowiedzi.</p>';
    const existing=additionalTests.map((item,index)=>`<article class="addon-saved-row"><div><span class="protocol-chip">${esc(item.protocolCode.toUpperCase())}</span><b>${esc(item.result.name)}</b><small>${item.side==='left'?'Lewa strona':item.side==='right'?'Prawa strona':'Wynik'}</small></div><button type="button" class="btn btn-small" data-action="remove-additional-test" data-index="${index}">Usuń</button></article>`).join('');
    return shell(`<main class="page additional-tests-page"><div class="page-heading"><div><h1>Testy dodatkowe</h1><p>Dodaj kilka pojedynczych testów do badania. Nie wpływają na wynik protokołu.</p></div></div><section class="card addon-picker"><h2>Wybierz test</h2><label class="addon-menu-label" for="additional-test-code">Katalog testów</label><select class="addon-menu" id="additional-test-code"><option value="">Wybierz test…</option>${[...groups].map(([name,items])=>`<optgroup label="${esc(name)}">${items.map(item=>`<option value="${esc(item.testCode)}" ${selectedAdditionalCode===item.testCode?'selected':''}>${esc(item.name)} · ${esc(item.testCode)}</option>`).join('')}</optgroup>`).join('')}</select>${!catalog.length?'<p class="muted">Ładowanie katalogu testów…</p>':''}</section><section class="card addon-entry"><h2>${chosen?esc(chosen.name):'Wynik testu'}</h2>${chosen?`<span class="protocol-chip">${esc(chosen.protocolCode.toUpperCase())}</span>`:''}<div class="addon-controls">${controls}</div><label class="field addon-note">Notatka (opcjonalnie)<textarea id="additional-test-note" maxlength="2000">${esc(additionalTests.find(item=>item.testCode===selectedAdditionalCode)?.note||'')}</textarea></label><button class="btn btn-primary" type="button" data-action="add-additional-test" ${chosen?'':'disabled'}>Zapisz wynik${additionalTests.length?' i dodaj następny':''}</button></section><section class="card addon-saved"><h2>Dodane wyniki <span>(${additionalTests.length})</span></h2>${existing||'<p class="muted">Możesz zakończyć badanie bez dodatków.</p>'}</section><section class="addon-navigation"><button type="button" class="btn" data-action="back-to-last-assessment">Wróć do ostatniego testu</button><button type="button" class="btn btn-primary" data-action="finish-assessment">Zakończ badanie</button></section></main>${footer()}`,'#/new-assessment',{subtitle:'Testy dodatkowe'});
  }
  function additionalResultsMarkup(){const items=selectedAssessment?.additionalTests||[];if(!items.length)return '';return `<section class="additional-results card"><h2>Testy dodatkowe</h2>${items.map(item=>`<article class="result-row"><span>${esc(item.protocol_code.toUpperCase())}</span><span class="test-name">${esc(item.result?.name||item.test_code)}</span><span>${item.side==='left'?'Lewa strona':item.side==='right'?'Prawa strona':'Wynik'}</span><span>${Object.entries(item.result?.fields||{}).map(([code,value])=>`${esc(code)}: ${esc(value.numericValue??value.label??value.value??'—')}${value.unit?` ${esc(value.unit)}`:''}`).join(' · ')||'—'}</span>${item.history?.length?`<small>Historia w skali źródłowej: ${item.history.map(entry=>`${new Date(`${entry.date}T00:00:00`).toLocaleDateString('pl-PL')} · ${Object.values(entry.result?.fields||{}).map(value=>esc(value.numericValue??value.label??value.value??'—')).join(' / ')}`).join(' → ')}</small>`:''}${item.note?`<span>${esc(item.note)}</span>`:''}</article>`).join('')}</section>`;}
  function resultDetail(value,kind){if(value===null||value===undefined||value==='')return '';if(kind==='summary'||kind==='score')return esc(value);return esc(value);}
  function resultDetails(items=[]){return items.map(item=>`<span class="result-detail ${esc(item.tone||'')}"><b>${esc(item.label)}:</b> ${esc(item.value)}</span>`).join('');}
  function finalResult(r){if(r.finalScore===undefined)return status(r.status);const asymmetric=r.leftScore!==null&&r.leftScore!==undefined&&r.rightScore!==null&&r.rightScore!==undefined&&Number.isFinite(Number(r.leftScore))&&Number.isFinite(Number(r.rightScore))&&Number(r.leftScore)!==Number(r.rightScore);const tone=asymmetric?'asymmetric':r.finalScore===0?'problem':r.finalScore===1?'warn':r.status==='warn'?'warn':'ok';return `<b class="numeric-final ${tone}">${r.finalScore}</b>`;}
  function resultRow(r,i,withFinal=true,extraClass=''){return `<div class="result-row ${r.child?'child':''} ${extraClass}"><span class="muted">${i+1}</span><span>${status(r.status)}</span><span class="test-name">${esc(r.name)}</span>${r.merged?`<span class="result-value merged">${resultDetails(r.valueDetails)||resultDetail(r.detail||r.value,r.kind)}</span>`:`<span class="result-value">${resultDetails(r.lDetails)||resultDetail(r.l,r.kind)}</span><span class="result-value">${resultDetails(r.rDetails)||resultDetail(r.r,r.kind)}</span>`}${withFinal?`<span class="result-value final-status">${finalResult(r)}</span>`:''}</div>`;}
  function resultRows(){let output='';for(let i=0;i<results.length;){const row=results[i];if(row.groupKey){const group=[];while(i<results.length&&results[i].groupKey===row.groupKey)group.push(results[i++]);output+=`<div class="shoulder-result-group">${group.map((item,offset)=>resultRow(item,i-group.length+offset,false,'shoulder-row')).join('')}<span class="result-value final-status shoulder-final">${finalResult(group.find(item=>item.finalScore!==undefined)||group[0])}</span></div>`;}else output+=resultRow(row,i++);}return output;}
  function resultMobileDetail(r){if(r.kind==='summary'){if(r.lDetails||r.rDetails)return `${r.lDetails?.length?`L: ${resultDetails(r.lDetails)}`:''}${r.lDetails?.length&&r.rDetails?.length?'　•　':''}${r.rDetails?.length?`P: ${resultDetails(r.rDetails)}`:''}`;if(r.valueDetails?.length)return resultDetails(r.valueDetails);return esc(r.detail||'');}if(r.kind==='score'){if(r.merged)return `Punkty: ${r.value ?? '—'}`;return `${r.l!=null&&r.l!==''?`L: ${esc(r.l)}`:''}${r.l!=null&&r.l!==''&&r.r!=null&&r.r!==''?'　•　':''}${r.r!=null&&r.r!==''?`P: ${esc(r.r)}`:''}`;}return `${r.l?`L: ${resultDetail(r.l,r.kind)}`:''}${r.l!=null&&r.l!==''&&r.r!=null&&r.r!==''?'　•　':''}${r.r?`P: ${resultDetail(r.r,r.kind)}`:''}`;}
  function resultCards(){return results.map((r,i)=>`<article class="result-mobile-row card"><span class="index">${i+1}</span><span class="result-mobile-main"><b>${r.name}</b><small>${resultMobileDetail(r)}</small></span><span class="final-status">${r.sharedScore==='shoulder'&&r.child?status(r.status):finalResult(r)}</span></article>`).join('');}
  function assessmentNotesMarkup() {
    const items = selectedAssessment?.notes || [];
    return `<section class="assessment-notes card"><h2>Notatki do testów</h2>${items.length ? items.map(item => `<article><b>${esc(item.testName)}</b><p>${esc(item.note)}</p></article>`).join('') : '<p>W tym badaniu nie zapisano notatek.</p>'}</section>`;
  }  function resultsPage(){const requestedId=route().match(/^results\/([^/]+)$/)?.[1];if(resultsLoadError||!selectedAssessment||(requestedId&&selectedAssessment.assessmentId!==requestedId))return shell(`<main class="page"><section class="card results-load-error"><h1>Nie uda\u0142o si\u0119 wczyta\u0107 wynik\u00f3w</h1><p>${esc(resultsLoadError||'Trwa wczytywanie wynik\u00f3w badania.')}</p><a class="btn" href="#/clients">Wr\u00f3\u0107 do listy klient\u00f3w</a></section></main>`,"#/clients",{subtitle:'Wyniki badania'});const date=selectedAssessment?.date?new Date(`${selectedAssessment.date}T00:00:00`).toLocaleDateString('pl-PL'):'';const client=selectedAssessment?.client;const name=client?`${client.firstName} ${client.lastName}`:'';const sport=clients.find(item=>item.id===client?.clientId)?.sport||'';const total=selectedAssessment?.totalScore??0;const maximum=selectedAssessment?.maximum??0;const reportHref=selectedAssessment?.assessmentId?`#/report/${encodeURIComponent(selectedAssessment.assessmentId)}`:'#/report';const reportAction=selectedAssessment?.protocolCode==='quick_screen'?`<a class="btn nav-button nav-button-primary" href="${reportHref}">Otwórz raport badania ${icon('arrow',15)}</a>`:'';return shell(`<main class="page">${actionTile(`${backAction(route())}<button class="btn nav-button nav-button-secondary" data-action="edit-assessment" data-assessment="${esc(selectedAssessment?.assessmentId)}">Edytuj badanie</button>${reportAction}`)}<div class="page-heading"><div><h1>Badanie z ${date}</h1><p>Surowe dane badania technicznego dla trenera</p></div></div><section class="results-summary card"><div class="total-score"><small>Wynik całkowity (score)</small><strong>${total}</strong> <span>/ ${maximum} punktów</span></div><div class="summary-person"><small>Oceniany</small><b>${esc(name)}</b><span>${esc(sport)} • ${esc(selectedAssessment?.scenarioName||'Badanie')}</span></div></section><div class="results-detail-layout"><div class="results-detail-main"><div class="result-list-title">Szczegółowa lista wyników (${results.length} pozycji)</div><section class="result-table card"><div class="result-table-head"><span>#</span><span></span><span>Nazwa testu</span><span>L strona</span><span>P strona</span><span>Wynik końcowy</span></div>${resultRows()}</section><section class="result-table-mobile">${resultCards()}</section></div><aside class="results-detail-notes">${assessmentNotesMarkup()}</aside></div>${additionalResultsMarkup()}</main>${footer()}`,'#/clients',{subtitle:'Wyniki badania'});}
  function cheatSheet(){const order=['Odcinek szyjny (Kark)','Skłon do palców','Mobilność barku','Przysiad','Balans','Rotacje'];const priorities=['Ból / wynik 0 (Protect + specjalista)','Wynik 1 / FAIL / Asymetria','Wynik 2 (akceptowalny)','Wynik 3 (optymalny)'];const steps=[['KROK 1','Protect','Unikaj ruchów prowokujących ból, odciąż dany rejon.','protect'],['KROK 2','Correct','Wdróż celowane ćwiczenia zwiększające ruchomość.','correct'],['KROK 3','Retest','Sprawdź ponownie po skończonym cyklu.','retest'],['KROK 4','Develop','Rozwijaj wzorzec w normalnym, bezpiecznym treningu.','develop']];return shell(`<main class="page"><div class="page-heading"><div><h1>Ściąga trenera — Quick Screen</h1><p>Szybka pomoc przy interpretacji wyników i wyborze priorytetu korekcyjnego</p></div></div><div class="cheat-grid"><section class="cheat-card card"><h2>Krok 1: Jak wybrać priorytet</h2><div class="flow-list priority-list">${priorities.map((x,i)=>`<div class="flow-item"><span class="flow-number">${i+1}</span>${x}</div>${i<priorities.length-1?'<span class="flow-arrow">↓</span>':''}`).join('')}</div><p class="hint"><b>Uwaga:</b> Celem jest wybranie jednego głównego weak link, a nie poprawianie wszystkiego jednocześnie.</p></section><section class="cheat-card card"><h2>Krok 2: Hierarchia wzorców</h2><div class="flow-list">${order.map((x,i)=>`<div class="flow-item"><span class="flow-number">${i+1}</span>${x}</div>${i<order.length-1?'<span class="flow-arrow">↓</span>':''}`).join('')}</div><p class="hint"><b>Uwaga:</b> Mobility jest rozpatrywane przed stability/motor control. Ta kolejność jest hierarchią korekcyjną.</p></section></div><section class="cycle-card card"><h2>Co dalej?</h2><div class="cycle-steps">${steps.map(([n,title,txt,cls])=>`<article class="cycle-step ${cls}"><small>${n}</small><b>${title}</b><p>${txt}</p></article>`).join('')}</div></section></main>${footer()}`,'#/cheat-sheet',{subtitle:'Ściąga trenera'});}
  function report(){
    if(selectedAssessment&&selectedAssessment.protocolCode!=='quick_screen')return shell('<main class="page"><section class="card"><h1>Raport niedostępny dla tego protokołu</h1><p>Raport Quick Screen nie może interpretować wyników tego badania.</p><a class="btn" href="#/results/'+encodeURIComponent(selectedAssessment.assessmentId)+'">Wróć do wyników</a></section></main>','#/clients',{report:true});
    if(!selectedAssessment)return shell('<main class="page report-loading"><section class="card"><h1>Otwieram badanie…</h1><p>Ładuję wyniki potrzebne do wygenerowania raportu.</p></section></main>','#/clients',{report:true});
    if(reportLoadError)return shell(`<main class="page"><section class="card"><h1>Nie udało się wygenerować raportu</h1><p>${esc(reportLoadError)}</p><a class="btn" href="#/results/${esc(selectedAssessment.assessmentId)}">Wróć do wyników</a></section></main>`,'#/clients',{report:true});
    return shell('<main class="page report-loading"><section class="card"><h1>Generuję raport…</h1><p>Raport będzie zawierał wszystkie bloki dla trenera oraz bloki włączone dla klienta.</p></section></main>','#/clients',{report:true});
  }
  function sfmaTestFieldsV2(test,index){
    const catalog=window.SfmaProtocol.topTier[index];
    const choice=(id,side,current)=>`<div class="sfma-choice-grid" role="group" aria-label="Klasyfikacja ${side==='left'?'lewej strony':side==='right'?'prawej strony':'wzorca'}">${['FN','FP','DN','DP'].map(code=>`<button type="button" class="binary-option ${current===code?'selected '+(code==='FN'?'pass':code==='DP'?'pain':'warn'):''}" data-sfma-top="${id}" data-side="${side}" data-value="${code}" aria-pressed="${current===code}">${code}</button>`).join('')}</div>`;
    const top=catalog.sides==='bilateral'?`<div class="sides"><article class="side-card"><h3>Lewa strona</h3>${choice(catalog.id,'left',scores[`sfma_${catalog.id}:left`])}</article><article class="side-card"><h3>Prawa strona</h3>${choice(catalog.id,'right',scores[`sfma_${catalog.id}:right`])}</article></div>`:`<article class="side-card"><h3>Klasyfikacja wzorca</h3>${choice(catalog.id,'none',scores[`sfma_${catalog.id}:none`])}</article>`;
    const allComplete=window.SfmaProtocol.isComplete(sfmaPayload().topTier);const active=allComplete&&window.SfmaProtocol.breakoutActive(catalog,sfmaPayload().topTier);const spec=window.SfmaProtocol.breakouts.find(item=>item.topTierId===catalog.id);let sections='';
    if(active&&spec)sections=`<section class="sfma-breakout-card card"><h2>${esc(spec.title)}</h2><p>${esc(spec.description||'Opcjonalne testy szczegółowe dla wzorca.')}</p>${spec.sections.map(section=>{const answers=sfmaPayload().breakouts[catalog.id]||{};const states=window.SfmaProtocol.stepVisibility(section,answers);return `<section class="sfma-breakout-section"><h3>${esc(section.title)}</h3>${section.steps.map((step,stepIndex)=>{const state=states[stepIndex];if(!state.visible)return '';const key=state.key;const sides=state.bilateral?['left','right']:['single'];const controls=sides.filter(side=>state.visibility[side]).map(side=>{const answerKey=`${key}${side==='single'?'':`:${side}`}`;const measurementValues=protocolData.measurements?.[catalog.id]?.[key]?.[side]||{};const fields=state.measurements.map(field=>{const ruleId=`${catalog.id}|${section.id}|${stepIndex}|${field.id}|${side==='single'?'':side}`;const raw=measurementValues[field.id]??'';const result=window.SfmaProtocol.deriveMeasurementResult(currentScenario?.measurementRules?.[ruleId],raw===''?null:Number(String(raw).replace(',','.')));return `<label class="sfma-breakout-response sfma-measurement-field"><span>${esc(field.label)} · standard ${esc(field.standard)}°</span><input type="number" min="0" max="360" step="0.1" inputmode="decimal" aria-label="${esc(step.title)} ${esc(side)} ${esc(field.label)} w stopniach" data-sfma-measurement data-sfma-pattern="${catalog.id}" data-measurement-step="${key}" data-measurement-side="${side}" data-measurement-field="${field.id}" value="${esc(raw)}"><small>${result?`Wynik wyliczony z pomiaru: ${esc(result)}.`:'Pomiar zostanie zapisany do porównania.'}</small></label>`;}).join('');const applicable=state.measurements.map(field=>({field,rule:currentScenario?.measurementRules?.[`${catalog.id}|${section.id}|${stepIndex}|${field.id}|${side==='single'?'':side}`],raw:measurementValues[field.id]})).find(item=>item.raw!==''&&item.raw!=null&&window.SfmaProtocol.deriveMeasurementResult(item.rule,Number(String(item.raw).replace(',','.'))));const derived=applicable?window.SfmaProtocol.deriveMeasurementResult(applicable.rule,Number(String(applicable.raw).replace(',','.'))):null;return `<div class="sfma-breakout-side"><label class="sfma-breakout-response"><span>${side==='left'?'Lewa strona':side==='right'?'Prawa strona':'Wykonanie'}</span><select data-sfma-breakout="${catalog.id}" data-breakout-key="${answerKey}" ${derived?'disabled title="Wynik wyliczony z pomiaru"':''}><option value="">Niewykonane</option>${['FN','FP','DN','DP'].map(code=>`<option value="${code}" ${(derived||answers[answerKey])===code?'selected':''}>${code}</option>`).join('')}</select></label>${fields}</div>`;}).join('');return `<article class="sfma-breakout-step"><b>${esc(step.title)}</b>${step.standards?.length?`<p><b>Standardy:</b> ${esc(step.standards.join(' · '))}</p>`:''}${step.logic?.length?`<p class="sfma-source-note">Wskazówka źródłowa: ${esc(step.logic.join(' '))}</p>`:''}<div class="sfma-breakout-answers">${controls}</div></article>`;}).join('')}${section.notes?.length?`<p class="sfma-source-note">Uwagi źródłowe: ${esc(section.notes.join(' '))}</p>`:''}</section>`;}).join('')}</section>`;
    return `<div class="sfma-top-tier"><p>${esc(catalog.description)}</p>${catalog.standards?.length?`<p><b>Standardy:</b> ${esc(catalog.standards.join(' · '))}</p>`:''}${top}</div>${!allComplete?'<p class="sfma-source-note">Uzupełnij cały Top Tier, aby odblokować breakouty.</p>':''}${sections}`;
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
    activeReport=stored;
  }
  function profilePage(clientMode=false,clientId=clients[0].id){const c=clients.find(x=>x.id===clientId)||clients[0];const editingAnthropometry=(c?.anthropometry||[]).find(item=>item.measurementId===anthropometryEditingId);const nav=clientMode?'#/client-dashboard':'#/clients';if(!c)return shell('<main class="page"><section class="card"><h1>Nie znaleziono klienta</h1></section></main>','#/clients');const history=c.history||[];const filtered=history.filter(item=>(item.protocolCode||'quick_screen')===trendProtocol);const best=filtered.reduce((value,item)=>item.score!=null&&(!value||item.score>value.score)?item:value,null);const latest=filtered[0];const anthroLabels={hand_length:'Długość dłoni',tibia_length:'Długość piszczeli',foot_length:'Długość stopy'};const wearConditionLabel=(condition,code)=>code==='hand_length'?'':condition==='with_shoes'?'W bucie':'Bez buta';const anthroLatest=(c.anthropometry||[]).reduce((latest,item)=>{latest[item.measurementCode]||=item;return latest;},{});const anthropometryMarkup=`<details class="anthropometry-history card"><summary class="anthropometry-toggle"><span>Pomiary</span><span class="anthropometry-count">${(c.anthropometry||[]).length}</span></summary><div class="anthropometry-content"><p>Aktualne wartości używane przy nowych badaniach.</p><div class="anthropometry-current">${['hand_length','tibia_length','foot_length'].map(code=>{const item=anthroLatest[code];return `<article class="anthropometry-value"><span>${anthroLabels[code]}</span><strong>${item?`${esc(item.value)} <small>${esc(item.unit)}</small>`:'—'}</strong><time>${item?`${wearConditionLabel(item.wearCondition,code)?`${wearConditionLabel(item.wearCondition,code)} · `:''}${esc(item.measuredAt)}`:'Brak pomiaru'}</time></article>`;}).join('')}</div><ul class="anthropometry-history-list">${(c.anthropometry||[]).map(item=>`<li><b>${anthroLabels[item.measurementCode]||item.measurementCode}</b><span>${esc(item.value)} ${esc(item.unit)}${wearConditionLabel(item.wearCondition,item.measurementCode)?` · ${wearConditionLabel(item.wearCondition,item.measurementCode)}`:''}</span><time>${esc(item.measuredAt)}</time>${clientMode?'':`<div class="anthropometry-row-actions"><button type="button" data-action="edit-anthropometry" data-measurement-id="${esc(item.measurementId)}">Edytuj</button><button type="button" class="anthropometry-delete" data-action="delete-anthropometry" data-measurement-id="${esc(item.measurementId)}" aria-label="Usu\u0144 pomiar" title="Usu\u0144 pomiar">${icon('trash',14)}</button></div>`}</li>`).join('')||'<li>Brak zapisanych pomiarów.</li>'}</ul>${clientMode?'':`<button type="button" class="btn nav-button nav-button-primary" data-action="open-anthropometry-modal" data-client-id="${esc(c.id)}"><span aria-hidden="true">+</span> Dodaj pomiar</button>`}</div></details>`;const actions=clientMode?'<a class="btn nav-button nav-button-secondary" href="#/client-profile">Edytuj profil</a>':`<a class="btn nav-button nav-button-secondary" href="#/client-edit/${encodeURIComponent(c.id)}">Edytuj profil</a><a class="btn nav-button nav-button-primary" href="#/new-assessment/${encodeURIComponent(c.id)}">+ Nowe badanie</a>`;return shell(`<main class="page ${clientMode?'client-dashboard-page':''}">${actionTile(`${clientMode?'':backAction(route(), 'Wróć do listy klientów')}${actions}`)}${profileBanner(c,clientMode)}${anthropometryMarkup}<div class="profile-grid">${historyTable(c)}<section class="trend-card card"><div class="section-title"><h2>Podsumowanie trendow</h2><label>Protokol <select data-trend-protocol><option value="quick_screen" ${trendProtocol==='quick_screen'?'selected':''}>Quick Screen</option><option value="fms" ${trendProtocol==='fms'?'selected':''}>FMS</option><option value="sfma" ${trendProtocol==='sfma'?'selected':''}>SFMA</option></select></label></div>${trendProtocol==='sfma'?'<p>Wyniki opisowe; wykres punktowy nie dotyczy SFMA.</p>':trendChart(filtered)}<div class="trend-stat"><span>Liczba badan</span><b>${filtered.length}</b></div><div class="trend-stat"><span>Najlepszy wynik</span><b class="good">${best?`${best.score}/${best.maximum}`:'—'}</b></div><div class="trend-stat"><span>Ostatnie badanie</span><b class="bad">${latest?.protocolCode==='sfma'?'Wyniki opisowe':latest?`${latest.score}/${latest.maximum}`:'—'}</b></div></section>${historyMobile(c)}</div>${anthropometryModalClientId===c.id?`<div class="anthropometry-modal-overlay" data-anthropometry-backdrop><section class="anthropometry-modal card" role="dialog" aria-modal="true" aria-labelledby="anthropometry-modal-title"><header><div><h2 id="anthropometry-modal-title">${editingAnthropometry?'Edytuj pomiar':'Dodaj pomiar'}</h2><p>${esc(c.name)}</p></div><button type="button" class="anthropometry-modal-close" data-action="close-anthropometry-modal" aria-label="Zamknij">×</button></header><form id="anthropometry-form" data-client-id="${esc(c.id)}"><label class="field">Rodzaj pomiaru<select name="measurementCode" data-current-measurement="${esc(editingAnthropometry?.measurementCode||'')}"><option value="hand_length" ${editingAnthropometry?.measurementCode==='hand_length'?'selected':''}>Długość dłoni</option><option value="tibia_length">Długość piszczeli</option><option value="foot_length">Długość stopy</option></select></label><label class="field anthropometry-wear-checkbox" data-wear-condition-control ${editingAnthropometry?.measurementCode==='hand_length'||!editingAnthropometry?'hidden':''}><input type="checkbox" name="withShoes" value="yes" ${editingAnthropometry?.wearCondition==='with_shoes'?'checked':''}><span>W bucie</span></label><label class="field">Wartość<input name="value" type="number" min="0.1" max="100" step="0.1" inputmode="decimal" value="${esc(editingAnthropometry?.value??'')}" required></label><label class="field">Jednostka<select name="unit"><option value="cm" ${editingAnthropometry?.unit==='cm'?'selected':''}>cm</option><option value="in" ${editingAnthropometry?.unit==='in'?'selected':''}>in</option></select></label><label class="field">Data pomiaru<input name="measuredAt" type="date" value="${esc(editingAnthropometry?.measuredAt||`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`)}" required></label><p id="anthropometry-error" role="alert" hidden></p><footer><button type="button" class="btn nav-button nav-button-secondary" data-action="close-anthropometry-modal">Anuluj</button><button type="submit" class="btn nav-button nav-button-primary">${editingAnthropometry?'Zapisz zmiany':'Zapisz pomiar'}</button></footer></form></section></div>`:''}</main>${footer()}`,nav,{client:clientMode,subtitle:'Wyniki badan'});}
  function savedReportPage(){
    const snapshot=activeReport?.snapshot;
    if(!snapshot)return shell('<main class="page"><section class="card"><h1>Nie udało się otworzyć raportu</h1><p>Raport nie istnieje albo nie masz do niego dostępu.</p><a class="btn" href="#/dashboard">Wróć do panelu</a></section></main>','#/dashboard');
    return shell(window.QuickScreenReportUI.render(snapshot,{audience:'trainer',backMarkup:backAction(route())}),'#/clients',{report:true,reportDate:snapshot.assessmentDate||''});
  }  function clientEditPage(clientId){const client=clients.find(item=>item.id===clientId);if(!client)return shell(`<main class="page"><section class="card"><h1>Nie znaleziono klienta</h1><a class="btn" href="#/clients">Wr&oacute;&#263; do listy klient&oacute;w</a></section></main>`,`#/clients`);const parts=client.name.trim().split(/\s+/);return shell(`<main class="page profile-screen">${actionTile(backAction(route(), 'Wróć do profilu'))}<div class="page-heading"><div><h1>Edytuj profil klienta</h1><p>Zmie&#324; dane kontaktowe i dyscyplin&#281;.</p></div></div><form id="client-profile-form" class="card"><div class="field"><label for="client-edit-first">Imi&#281;</label><input id="client-edit-first" name="firstName" value="${esc(parts[0]||'')}" required maxlength="100"></div><div class="field"><label for="client-edit-last">Nazwisko</label><input id="client-edit-last" name="lastName" value="${esc(parts.slice(1).join(' '))}" required maxlength="100"></div><div class="field"><label for="client-edit-email">E-mail</label><input id="client-edit-email" name="email" type="email" value="${esc(client.email)}" required maxlength="254"></div><div class="field"><label for="client-edit-sport">Dyscyplina</label><input id="client-edit-sport" name="discipline" value="${esc(client.sport)}" maxlength="120"></div><p id="client-profile-error" role="alert" hidden></p><div class="new-footer"><a class="btn" href="#/client/${encodeURIComponent(client.id)}">Anuluj</a><button class="btn btn-primary" type="submit">Zapisz zmiany</button></div></form></main>${footer()}`,`#/client/${encodeURIComponent(client.id)}`);}  function profileSettings(clientMode=false){return shell(`<main class="page profile-screen"><div class="page-heading"><div><h1>Mój profil</h1><p>Dane ${clientMode?'klienta':'konta trenerskiego'}</p></div></div><section class="profile-banner card"><span class="initials">${clientMode?'GK':'K'}</span><div class="profile-main"><h1>${clientMode?'Gaweł Kot':'Trener Karol'}</h1><p>${clientMode?'Piłka nożna':'KB Trener · QuickScreen'}</p></div><button class="btn">Edytuj profil</button></section><section class="card"><h2>Dane profilu</h2><div class="field"><label>Imię i nazwisko</label><input value="${clientMode?'Gaweł Kot':'Karol Bilecki'}" readonly></div><div class="field"><label>E-mail</label><input value="${clientMode?'gawel.kot@example.com':'trener@kbtrener.pl'}" readonly></div><div class="field"><label>${clientMode?'Dyscyplina':'Organizacja'}</label><input value="${clientMode?'Piłka nożna':'KB Trener'}" readonly></div></section></main>${footer()}`,clientMode?'#/client-profile':'#/profile',{client:clientMode});}
  function render(){const r=route();document.body.classList.toggle('is-report',r==='report'||r.startsWith('client-report/'));if(recoverySession){document.body.classList.remove('is-report');app.innerHTML=passwordResetPage(authError);return;}if(!authSession?.access_token){if(r!=='login')setRoute('login');app.innerHTML=loginPage(authError);return;}if(r==='login')setRoute('dashboard');if(r==='dashboard')app.innerHTML=dashboard();else if(r==='clients')app.innerHTML=clientsPage();else if(r.startsWith('client-edit/'))app.innerHTML=clientEditPage(decodeURIComponent(r.split('/')[1]||''));else if(r.startsWith('client/'))app.innerHTML=profilePage(false,r.split('/')[1]);else if(r==='client-dashboard'||r==='my-results')app.innerHTML=profilePage(true);else if(r==='client-profile')app.innerHTML=profileSettings(true);else if(r==='new-assessment'||r.startsWith('new-assessment/')){const contextId=newAssessmentClientId();selectedClient=contextId?clients.find(c=>c.id===contextId)||null:null;const selectProtocol=r.startsWith('new-assessment/select-protocol/');app.innerHTML=newAssessment(Boolean(contextId&&!selectedClient),selectProtocol);}else if(r==='additional-tests')app.innerHTML=additionalTestsPage();else if(r.startsWith('assessment/')){wizardIndex=Math.max(0,Math.min(tests.length-1,Number(r.split('/')[1])-1||0));app.innerHTML=assessment();}else if(r==='results'||r.startsWith('results/'))app.innerHTML=resultsPage();else if(r==='report')app.innerHTML=report();else if(r==='report-settings')app.innerHTML=reportSettingsPage();else if(r.startsWith('client-report/'))app.innerHTML=savedReportPage();else if(r==='cheat-sheet')app.innerHTML=cheatSheet();else if(r==='profile')app.innerHTML=profileSettings();else app.innerHTML=dashboard();if(r.startsWith('client/')){const client=clients.find(item=>item.id===decodeURIComponent(r.split('/')[1]||''));const measurements=(client?.history||[]).filter(item=>item.toeTouch?.length);if(measurements.length){const rows=measurements.map(item=>`<tr><td>${new Date(`${item.date}T00:00:00`).toLocaleDateString('pl-PL')}</td>${['left','right'].map(side=>`<td>${item.toeTouch.find(value=>value.side===side)?.value??'—'} cm</td>`).join('')}</tr>`).join('');app.querySelector('.profile-grid')?.insertAdjacentHTML('beforebegin',`<section class="card toe-touch-history"><h2>Pomiary Toe Touch</h2><p>Odległość od podłoża według nogi ustawionej z tyłu. Pomiary nie wpływają na ocenę.</p><div class="history-table-wrap"><table><thead><tr><th>Data</th><th>Lewa z tyłu</th><th>Prawa z tyłu</th></tr></thead><tbody>${rows}</tbody></table></div></section>`);}}if(isEditingAssessment&&r!=='additional-tests'){app.innerHTML+=assessmentEditModal();const editContent=$('.assessment-edit-content');if(editContent)editContent.insertAdjacentHTML('afterbegin',`<label class="assessment-date-control">Klient badania<select data-edit-client>${clients.map(client=>`<option value="${esc(client.id)}" ${client.id===activeAssessment.clientId?'selected':''}>${esc(client.name)}</option>`).join('')}</select></label>`);document.body.classList.add('has-assessment-modal');}else document.body.classList.remove('has-assessment-modal');if(!isEditingAssessment)window.scrollTo(0,0);}
  app.addEventListener('change',event=>{if(event.target.id==='additional-test-code'){selectedAdditionalCode=event.target.value;render();}});
  app.addEventListener('click',event=>{const choice=event.target.closest('[data-addon-choice]');if(choice){const group=choice.closest('.addon-options');group.querySelectorAll('[data-addon-choice]').forEach(button=>{button.classList.remove('selected','pass','pain');button.setAttribute('aria-pressed','false');});choice.classList.add('selected','pass');choice.setAttribute('aria-pressed','true');return;}const action=event.target.closest('[data-action]');if(!action)return;if(action.dataset.action==='add-additional-test'){const definition=additionalCatalog.find(item=>item.testCode===selectedAdditionalCode);if(!definition)return;const sides=definition.fields.some(field=>field.sideMode==='bilateral')?['left','right']:['none'];const rows=[];for(const side of sides){const values={};const measurements=[];let missing=false;for(const field of definition.fields.filter(item=>item.scoring||item.wizardInput||item.fieldType==='measurement')){if(field.sideMode==='bilateral'&&side==='none')continue;const fieldSide=field.sideMode==='bilateral'?side:'none';const input=[...app.querySelectorAll('[data-addon-field]')].find(item=>item.dataset.addonField===field.code&&item.dataset.addonSide===fieldSide);const checkbox=field.controlType==='checkbox'?app.querySelector(`[data-addon-checkbox][data-addon-field="${CSS.escape(field.code)}"][data-addon-side="${fieldSide}"]`):null;const choice=checkbox||input?.matches('[data-addon-type="measurement"]')?null:app.querySelector(`[data-addon-choice][data-addon-field="${CSS.escape(field.code)}"][data-addon-side="${fieldSide}"].selected`);const raw=checkbox?(checkbox.checked?checkbox.dataset.valueCode:''):input?.dataset.addonType==='measurement'?input.value.trim():choice?.dataset.code||'';if(field.required&&!raw){missing=true;continue;}if(!raw)continue;if(field.fieldType==='measurement'){const value=Number(raw);if(!Number.isFinite(value)||value<0){missing=true;continue;}values[field.code]={value,unit:field.measurementUnit||''};measurements.push({fieldCode:field.code,value,unit:field.measurementUnit||''});}else{values[field.code]={valueCode:raw,label:checkbox?.dataset.valueLabel||choice?.dataset.label||raw,numericValue:choice?.dataset.numeric?Number(choice.dataset.numeric):null};}}if(missing){window.alert('Uzupełnij wymagane pola i sprawdź wartości pomiarów.');return;}if(definition.protocolCode==='sfma'&&definition.sfmaContext){const ctx=definition.sfmaContext;for(const field of ctx.measurementFields){const raw=values[field.id]?.value;const sideKey=ctx.bilateral?side:'';const rule=additionalSfmaRules[`${ctx.pattern}|${ctx.section}|${ctx.index}|${field.id}|${sideKey}`];const derived=raw==null?null:window.SfmaProtocol.deriveMeasurementResult(rule,Number(raw));if(derived)values.classification={valueCode:derived,label:window.SfmaProtocol.classifications[derived]};}}rows.push({protocolCode:definition.protocolCode,testCode:definition.testCode,sourceVersion:definition.sourceVersion,result:{name:definition.name,fields:values},side,measurements,note:$('#additional-test-note')?.value||''});}additionalTests=additionalTests.filter(item=>!rows.some(row=>row.testCode===item.testCode&&row.side===item.side));additionalTests.push(...rows);saveLocalDraft();render();return;}if(action.dataset.action==='remove-additional-test'){additionalTests.splice(Number(action.dataset.index),1);saveLocalDraft();render();return;}if(action.dataset.action==='finish-assessment'){if(isEditingAssessment){saveAssessmentEdit();return;}setRoute('results');return;}if(action.dataset.action==='edit-additional-tests'){setRoute('additional-tests');return;}if(action.dataset.action==='back-to-last-assessment'){setRoute(isEditingAssessment?editReturnRoute:`assessment/${tests.length}`);return;}});
  app.addEventListener('change',e=>{if(e.target.matches('[data-checkbox-field]')){const key=`${e.target.dataset.checkboxField}:${e.target.dataset.side}`;scores[key]=e.target.checked?'positive':null;const field=tests.flatMap(test=>test.definition.fields).find(item=>item.code===e.target.dataset.checkboxField);if(field){for(const dependent of tests.flatMap(test=>test.definition.fields).filter(item=>item.disabledByFieldCode===field.code)){document.querySelectorAll(`[data-measurement-field="${dependent.code}"]`).forEach(input=>input.disabled=e.target.checked);document.querySelectorAll(`[data-measurement-unit="${dependent.measurementUnitGroup}"]`).forEach(button=>button.disabled=e.target.checked);}}saveLocalDraft();}});
  app.addEventListener('click', event => {
    const button = event.target.closest('[data-measurement-condition]');
    if (!button) return;
    const { measurementCondition:key, wearCode, sourceField, unitGroup, condition } = button.dataset;
    fieldMeasurementConditions[key] = condition;
    const saved = assessmentAnthropometryByCondition[wearCode]?.[condition];
    const value = saved ? String(saved.value) : '';
    fieldMeasurements[`shared:${key}:none`] = value;
    for (const field of tests.flatMap(test => test.definition.fields).filter(item => item.measurementSharedKey === key)) fieldMeasurements[`${field.code}:none`] = value;
    fieldMeasurements[`${sourceField}:none`] = value;
    if (saved && unitGroup) fieldMeasurementUnits[unitGroup] = saved.unit;
    saveLocalDraft(); render();
  });
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
  app.addEventListener('input',e=>{if(['client-first','client-last','client-email'].includes(e.target.id)){selectedClient=null;const field=e.target.id;const query=e.target.value.trim();const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();const boxes=['first','last','email'].map(name=>$('#suggestions-'+name));boxes.forEach(box=>{if(box)box.classList.remove('show');});const box=$('#suggestions-'+field.replace('client-',''));if(box&&query.length>=3){const matches=clients.filter(c=>[c.name,c.email].some(value=>normalize(value).includes(normalize(query))));box.innerHTML=matches.length?matches.map(c=>`<div class="suggestion" data-client="${c.id}"><span><b>${c.name}</b><small>${c.email} (${c.sport})</small></span><small>Wybierz profil</small></div>`).join(''):'<div class="suggestion-empty">Brak pasujących profili</div>';box.classList.add('show');}return;}if(e.target.id==='client-search'){searchText=e.target.value;const pos=e.target.selectionStart;app.innerHTML=clientsPage();const input=$('#client-search');input.focus();input.setSelectionRange(pos,pos);}if(e.target.matches('[data-note]')){notes[e.target.dataset.note]=e.target.value;saveLocalDraft();return;}if(e.target.matches('[data-measurement-field]')){fieldMeasurements[`${e.target.dataset.measurementField}:${e.target.dataset.side}`]=e.target.value;const raw=e.target.value.trim().replace(',','.');const n=raw===''?null:Number(raw);const min=e.target.dataset.min===''?null:Number(e.target.dataset.min),max=e.target.dataset.max===''?null:Number(e.target.dataset.max);const valid=raw===''||Number.isFinite(n)&&n>=0&&(min===null||n>=min)&&(max===null||n<=max);e.target.classList.toggle('is-invalid',!valid);e.target.setAttribute('aria-invalid',String(!valid));e.target.title=!valid?(n<0?'Wartość nie może być ujemna.':'Wartość poza dozwolonym zakresem.'):'';const error=document.querySelector(`[data-measurement-error="${e.target.dataset.measurementField}:${e.target.dataset.side}"]`);if(error){error.hidden=valid;error.textContent=!valid?(n<0?'Wartość nie może być ujemna.':'Wartość poza dozwolonym zakresem.'): '';}const activeField=tests.flatMap(test=>test.definition.fields).find(field=>field.code===e.target.dataset.measurementField);if(activeField?.measurementSharedKey){fieldMeasurements[`shared:${activeField.measurementSharedKey}:none`]=raw;for(const peer of tests.flatMap(test=>test.definition.fields).filter(field=>field.measurementSharedKey===activeField.measurementSharedKey))fieldMeasurements[`${peer.code}:none`]=raw;}else fieldMeasurements[`${e.target.dataset.measurementField}:${e.target.dataset.side}`]=raw;syncFmsDerivedScores();saveLocalDraft();return;}if(e.target.matches('[data-shoulder-measurement]')){if(e.target.dataset.shoulderMeasurement==='handLengthCm')shoulderMeasurements.handLengthCm=e.target.value;else shoulderMeasurements.gaps[e.target.dataset.side]=e.target.value;syncShoulderAutoScores();saveLocalDraft();}});
  app.addEventListener('click',e=>{if(isEditingAssessment&&e.target.matches('[data-edit-backdrop]')){isEditingAssessment=false;activeAssessment=null;editReturnRoute=null;removeLocalDraft();render();return;}const clientRow=e.target.closest('[data-client-row]');if(clientRow&&!e.target.closest('a,button,input,select,textarea')){location.hash=clientRow.dataset.clientRow;return;}const option=e.target.closest('[data-value]');if(option){const key=option.dataset.key;const field=tests.flatMap(test=>test.definition.fields).find(item=>key.startsWith(`${item.code}:`));scores[key]=field?.answerSet.code==='score_0_3'?Number(option.dataset.score):option.dataset.value;saveLocalDraft();option.parentElement.querySelectorAll('.score-option,.binary-option').forEach(item=>{const selected=item===option;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));item.classList.remove('pass','pain');if(selected&&item.classList.contains('binary-option'))item.classList.add(field?.answerSet?.code==='fms_stoplight'?item.dataset.value:(/positive|pain|yes|fail/i.test(item.dataset.value)?'pain':'pass'));});return;}const suggestion=e.target.closest('[data-client]');if(suggestion){selectedClient=clients.find(c=>c.id===suggestion.dataset.client)||null;document.querySelectorAll('.suggestions').forEach(x=>x.classList.remove('show'));const first=$('#client-first');if(first)first.value=selectedClient.name.split(' ')[0];const last=$('#client-last');if(last)last.value=selectedClient.name.split(' ').slice(1).join(' ');const email=$('#client-email');if(email)email.value=selectedClient.email;const sport=$('#client-sport');if(sport)sport.value=selectedClient.sport;setRoute(`new-assessment/${encodeURIComponent(selectedClient.id)}`);return;}const action=e.target.closest('[data-action]');if(action){if(action.dataset.action==='route-back'){const current=routePath();const destination=backRoute(current)||action.dataset.fallback;skipRouteTrailUpdate=true;setRoute(destination||action.dataset.fallback);return;}if(action.dataset.action==='delete-assessment'){action.disabled=true;deleteAssessment(action.dataset.assessment).then(deleted=>{if(!deleted)action.disabled=false;}).catch(error=>{action.disabled=false;window.alert(`Nie uda\u0142o si\u0119 usun\u0105\u0107 badania: ${error.message}`);});return;}if(action.dataset.action==='edit-assessment'){const returnRoute=route();editReturnRoute=returnRoute;action.disabled=true;action.textContent='Wczytywanie...';editAssessment(action.dataset.assessment).catch(error=>{isEditingAssessment=false;activeAssessment=null;editReturnRoute=null;removeLocalDraft();setRoute(returnRoute);render();window.alert(`Nie uda\u0142o si\u0119 otworzy\u0107 edycji: ${error.message}`);});return;}if(action.dataset.action==='save-assessment-edit'){saveAssessmentEdit();return;}if(action.dataset.action==='cancel-assessment-edit'){isEditingAssessment=false;activeAssessment=null;editReturnRoute=null;removeLocalDraft();render();return;}if(action.dataset.action==='criteria'){const index=action.dataset.testIndex;const panel=index===undefined?$('#criteria-panel'):document.getElementById(`criteria-panel-${index}`);panel?.classList.toggle('open');return;}if(action.dataset.action==='open-last-draft'){const draft=readLocalDraft();if(draft)restoreLocalDraft(draft).catch(error=>window.alert(error.message));return;}if(action.dataset.action==='choose-protocol'){chooseAssessmentProtocol().catch(error=>window.alert(error.message));return;}if(action.dataset.action==='start-assessment'){startAssessment().catch(error=>window.alert(error.message));return;}if(action.dataset.action==='add-client'){setRoute('new-assessment');return;}}});
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
        skipRouteTrailUpdate=true;skipRouteTrailUpdate=true;setRoute(`client/${encodeURIComponent(clientId)}`);
        render();
      } catch (failure) {
        if (error) { error.textContent = failure.message; error.hidden = false; }
      } finally { if (button.isConnected) button.disabled = false; }
      return;
    }
    if (form.id === 'anthropometry-form') {
      event.preventDefault();
      const clientId = form.dataset.clientId || decodeURIComponent(route().split('/')[1] || '');
      const error = form.querySelector('#anthropometry-error');
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true; if (error) error.hidden = true;
      try {
        const values = Object.fromEntries(new FormData(form));
        values.wearCondition = values.measurementCode === 'hand_length' ? 'unspecified' : form.querySelector('[name=withShoes]')?.checked ? 'with_shoes' : 'without_shoes';
        const itemPath = '/clients/' + encodeURIComponent(clientId) + '/anthropometry';
        const saved = await apiRequest(itemPath + (anthropometryEditingId ? '/' + encodeURIComponent(anthropometryEditingId) : ''), { method: anthropometryEditingId ? 'PATCH' : 'POST', body: JSON.stringify(values) });
        const client = clients.find(item => item.id === clientId);
        if (client) client.anthropometry = anthropometryEditingId ? client.anthropometry.map(item => item.measurementId === anthropometryEditingId ? saved : item).sort((a,b)=>b.measuredAt.localeCompare(a.measuredAt)) : [saved, ...(client.anthropometry || [])];
        anthropometryEditingId = '';
        anthropometryModalClientId = '';
        document.body.classList.remove('has-anthropometry-modal');
        render();
      } catch (failure) { if (error) { error.textContent = failure.message; error.hidden = false; } }
      finally { if (button.isConnected) button.disabled = false; }
      return;
    }
    if (form.id === 'report-settings-form') {
      event.preventDefault();
      return;
    }
  });
  app.addEventListener('change', event => {
    if (event.target.matches('#anthropometry-form [name="measurementCode"]')) {
      const isHand = event.target.value === 'hand_length';
      const conditionField = app.querySelector('[data-wear-condition-control]');
      const conditionCheckbox = conditionField?.querySelector('input[type=checkbox]');
      if (conditionField && conditionCheckbox) { conditionField.hidden = isHand; conditionCheckbox.disabled = isHand; if (isHand) conditionCheckbox.checked = false; }
    }
  });
  app.addEventListener('click', async event => {
    const edit = event.target.closest('[data-action="edit-anthropometry"]');
    if (edit) { anthropometryEditingId = edit.dataset.measurementId; anthropometryModalClientId = route().split('/')[1] ? decodeURIComponent(route().split('/')[1]) : ''; document.body.classList.add('has-anthropometry-modal'); render(); const select = app.querySelector('.anthropometry-modal [name="measurementCode"]'); if (select?.dataset.currentMeasurement) select.value = select.dataset.currentMeasurement; select?.focus(); return; }
    const remove = event.target.closest('[data-action="delete-anthropometry"]');
    if (remove) {
      if (!window.confirm('Czy na pewno usun\u0105\u0107 ten pomiar?')) return;
      remove.disabled = true;
      const clientId = route().split('/')[1] ? decodeURIComponent(route().split('/')[1]) : '';
      try { await apiRequest('/clients/' + encodeURIComponent(clientId) + '/anthropometry/' + encodeURIComponent(remove.dataset.measurementId), { method: 'DELETE' }); const client = clients.find(item => item.id === clientId); if (client) client.anthropometry = client.anthropometry.filter(item => item.measurementId !== remove.dataset.measurementId); render(); }
      catch (error) { remove.disabled = false; window.alert(`Nie uda\u0142o si\u0119 usun\u0105\u0107 pomiaru: ${error.message}`); }
      return;
    }
    const open = event.target.closest('[data-action="open-anthropometry-modal"]');
    if (open) { anthropometryEditingId = ''; anthropometryModalClientId = open.dataset.clientId; document.body.classList.add('has-anthropometry-modal'); render(); app.querySelector('.anthropometry-modal [name="measurementCode"]')?.focus(); return; }
    if (event.target.closest('[data-action="close-anthropometry-modal"]') || event.target.matches('[data-anthropometry-backdrop]')) { anthropometryEditingId = ''; anthropometryModalClientId = ''; document.body.classList.remove('has-anthropometry-modal'); render(); }
  });
  document.addEventListener('click', event => { if (event.target.closest('.suggestions') || event.target.matches('#client-first,#client-last,#client-email')) return; document.querySelectorAll('.suggestions.show').forEach(box => box.classList.remove('show')); });
  app.addEventListener('focusin', event => { if (!['client-first','client-last','client-email'].includes(event.target.id)) return; const box = $('#suggestions-' + event.target.id.replace('client-','')); if (box && event.target.value.trim().length >= 3) box.classList.add('show'); });
  app.addEventListener('keydown', event => { if (['client-first','client-last','client-email'].includes(event.target.id) && event.key === 'Escape') { document.querySelectorAll('.suggestions.show').forEach(box => box.classList.remove('show')); event.preventDefault(); return; } if (event.key === 'Escape' && anthropometryModalClientId) { anthropometryEditingId = ''; anthropometryModalClientId = ''; document.body.classList.remove('has-anthropometry-modal'); render(); } });
  app.addEventListener('change',e=>{if(e.target.matches('[data-trend-protocol]')){trendProtocol=e.target.value;render();}});
  app.addEventListener('change', async event => {
    if (event.target.name === 'screenTypeId') { selectedScreenTypeId = event.target.value; if(screenTypes.find(item=>item.screenTypeId===selectedScreenTypeId)?.code!=='quick_screen')pairClientId=''; render(); return; }
    if(event.target.matches('[data-pair-mode]')){if(!event.target.checked){pairClientId='';const select=app.querySelector('[data-pair-client]');if(select)select.value='';}const control=app.querySelector('.pair-client-control');if(control)control.hidden=!event.target.checked;return;}
    if(event.target.matches('[data-pair-client]')){pairClientId=event.target.value;return;}
    if (event.target.matches('[data-assessment-date]')) {
      if (activeAssessment) { activeAssessment.date = event.target.value; if(pairedDraft)pairedDraft.assessment.date=event.target.value; if (!isEditingAssessment) saveLocalDraft(); }
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
  resultsPage=function(){if(selectedAssessment?.protocolCode==='bunkie')return shell(window.BunkieReportUI.results(selectedAssessment,backAction(route())),'#/clients',{subtitle:'Wyniki badania Bunkie Test'});if(selectedAssessment?.protocolCode==='sfma')return shell(window.SfmaReportUI.results(selectedAssessment,backAction(route())),'#/clients',{subtitle:'Wyniki badania SFMA'});if(selectedAssessment?.protocolCode==='fms')return shell(window.FmsReportUI.results(selectedAssessment,`results/${encodeURIComponent(selectedAssessment.assessmentId)}`,backAction(route())),'#/clients',{subtitle:'Wyniki badania FMS'});return quickScreenResultsPage();};
  const baseAssessmentView=assessment;
  assessment=function(){let markup=baseAssessmentView();if(currentScenario?.code!=='bunkie')return markup;const index=Math.min(tests.length-1,Math.max(0,wizardIndex)),test=tests[index],fieldsMarkup=testFields(test,index);const goals=`<section class="bunkie-standard-goals"><b>Cele praktyczne · na każdą stronę</b><ul>${tests.map(item=>{const target=protocolData?.targets?.[item.key]||{},fallback=item.definition.test.bunkie?.goalSeconds,left=Number(target.left??fallback),right=Number(target.right??fallback);return `<li><b>${esc(item.key.replace('bunkie_','').toUpperCase())}</b> · ${esc(item.name)}: L ${esc(left)} s / P ${esc(right)} s</li>`;}).join('')}</ul><small>Cele praktyczne aplikacji, nie zwalidowane progi diagnostyczne.</small></section>`;const panelAndFields=`</div>${fieldsMarkup}`;if(!markup.includes(panelAndFields))throw new Error('Nie znaleziono panelu standardów Bunkie.');markup=markup.replace(panelAndFields,`${goals}</div>${window.BunkieReportUI.photoMarkup(test)}${fieldsMarkup}`);for(const side of ['left','right']){const label=side==='left'?'Lewa':'Prawa';const heading=`<article class="side-card"><h3>${label} strona</h3>`;const pain=`<label class="bunkie-pain side-pain"><input type="checkbox" data-bunkie-pain="${side}" ${protocolData?.pain?.[test.key]?.[side]?'checked':''}> Ból</label>`;markup=markup.replace(heading,`${heading}${window.BunkieReportUI.timerMarkup(test,side)}${pain}`);}return markup.replace('Notatka / uwagi do testu (opcjonalnie)','Indywidualne notatki trenera');};
  document.addEventListener('bunkie:record',event=>{const side=event.detail.side||'left';const test=tests[Math.min(tests.length-1,Math.max(0,wizardIndex))];const fieldCode=test?.definition.fields.find(field=>field.fieldType==='measurement')?.code;const input=fieldCode?app.querySelector(`[data-measurement-field="${fieldCode}"][data-side="${side}"]`):null;if(!input)return;input.value=String(event.detail.seconds);input.dispatchEvent(new Event('input',{bubbles:true}));});
  app.addEventListener('change',event=>{const input=event.target.closest('[data-bunkie-pain]');if(!input||currentScenario?.code!=='bunkie')return;const test=tests[Math.min(tests.length-1,Math.max(0,wizardIndex))];protocolData.pain||={};protocolData.pain[test.key]||={};protocolData.pain[test.key][input.dataset.bunkiePain]=input.checked;saveLocalDraft();});
  const originalGenerateReport=generateReport;
  generateReport=async function(){if(selectedAssessment?.protocolCode!=='bunkie')return originalGenerateReport();try{reportLoadError='';const snapshot={...selectedAssessment,bunkie:{...selectedAssessment.bunkie,description:selectedAssessment.bunkie?.description||currentScenario?.description}};const created=await apiRequest('/reports',{method:'POST',body:JSON.stringify({assessmentId:selectedAssessment.assessmentId,visibleBlocks:['intro','results','plan','help'],resourceIds:[],snapshot})});activeReport={reportId:created.reportId,snapshot:created.snapshot};setRoute(`bunkie-report/${encodeURIComponent(created.reportId)}`);}catch(error){reportLoadError=error.message;render();}};
  let loadingBunkieReport='';
  async function restoreBunkieReport(){if(!route().startsWith('bunkie-report/'))return;const reportId=decodeURIComponent(route().split('/')[1]||'');if(!reportId||activeReport?.reportId===reportId||loadingBunkieReport===reportId)return;loadingBunkieReport=reportId;try{activeReport=await apiRequest(`/reports/${encodeURIComponent(reportId)}`);}catch(error){reportLoadError=error.message;}finally{loadingBunkieReport='';render();}}
  window.addEventListener('hashchange',()=>restoreBunkieReport());
  const standardRender=render;
  render=function(){if(route().startsWith('bunkie-report/')){document.body.classList.add('is-report');const reportId=decodeURIComponent(route().split('/')[1]||'');const reportData=activeReport?.reportId===reportId?activeReport.snapshot:selectedAssessment?.protocolCode==='bunkie'?selectedAssessment:null;if(!reportData){app.innerHTML=shell('<main class="page"><section class="card"><h1>Otwieram raport Bunkie Test…</h1><p>Ładuję zapisane wyniki.</p></section></main>','#/clients',{report:true});restoreBunkieReport();}else app.innerHTML=shell(window.BunkieReportUI.report(reportData,backAction(route())),'#/clients',{report:true});return;}if(route().startsWith('sfma-report/')){document.body.classList.add('is-report');const id=decodeURIComponent(route().split('/')[1]||'');if(!selectedAssessment||selectedAssessment.assessmentId!==id||selectedAssessment.protocolCode!=='sfma')app.innerHTML=shell('<main class="page"><section class="card"><h1>Otwieram raport SFMA…</h1><p>Ładuję zapisane klasyfikacje.</p></section></main>','#/clients',{report:true});else app.innerHTML=shell(window.SfmaReportUI.report(selectedAssessment,backAction(route())),'#/clients',{report:true});return;}if(route().startsWith('fms-report/')){document.body.classList.add('is-report');const id=decodeURIComponent(route().split('/')[1]||'');if(!selectedAssessment||selectedAssessment.assessmentId!==id||selectedAssessment.protocolCode!=='fms')app.innerHTML=shell('<main class="page"><section class="card"><h1>Otwieram raport FMS…</h1><p>Ładuję zapisane wyniki badania.</p></section></main>','#/clients',{report:true});else app.innerHTML=shell(window.FmsReportUI.report(selectedAssessment,backAction(route())),'#/clients',{report:true});return;}if(!route().startsWith('fms-report/')&&!route().startsWith('sfma-report/')&&!route().startsWith('bunkie-report/'))document.body.classList.remove('is-report');standardRender();};
  const renderWithPair=render;
  app.addEventListener('click',event=>{const action=event.target.closest('[data-action="add-client"],[data-action="save-client"]');if(!action)return;event.preventDefault();event.stopImmediatePropagation();if(action.dataset.action==='add-client'){setRoute('add-client');render();return;}action.disabled=true;saveClient().catch(error=>{action.disabled=false;window.alert(`Nie udało się dodać klienta: ${error.message}`);});},true);
  render=function(){if(route()==='add-client')app.innerHTML=addClientPage();else renderWithPair();if(resultsLoading){const pending=app.querySelector('.results-load-error');if(pending){pending.querySelector('h1').textContent='Wczytywanie wyników';pending.querySelector('p').textContent='Pobieram zapisane wyniki badania…';}}if(!pairedDraft||!route().startsWith('assessment/')||currentScenario?.code!=='quick_screen')return;const card=$('.test-card');const test=tests[wizardIndex];if(!card||!test)return;const grid=document.createElement('div');grid.className='pair-assessment-panels';const primary=document.createElement('section');primary.className='pair-client-panel';primary.innerHTML=`<h2>${esc(selectedClient?.name||'Pierwszy klient')}</h2>`;const movable=[...card.children].filter(node=>node.matches('.shoulder-measurement-fields,.sides,.neck-extension-inline,.notes'));if(!movable.length)return;movable[0].before(grid);for(const node of movable)primary.append(node);grid.append(primary);grid.insertAdjacentHTML('beforeend',pairedPanelMarkup(test,wizardIndex));const actions=card.querySelector('.test-actions');if(actions)grid.after(actions);};
  window.addEventListener('hashchange', async event => {
    if (route() === 'report') { const id=routePath().match(/^report\/([^/]+)$/)?.[1];if(id){try{const record=await loadResults(decodeURIComponent(id));if(record.protocolCode==='sfma'){skipRouteTrailUpdate=true;setRoute(`sfma-report/${encodeURIComponent(id)}`);render();return;}}catch{}}render(); await generateReport(); return; }
    if (isEditingAssessment && route() !== editReturnRoute && route() !== 'additional-tests') { isEditingAssessment = false; activeAssessment = null; editReturnRoute = null; removeLocalDraft(); document.body.classList.remove('has-assessment-modal'); }
    if (activeAssessment && (route() === 'results' || route().startsWith('assessment/'))) {
      try {
        if (route() === 'results') {
          if(currentScenario?.code==='bunkie'){const painIndex=tests.findIndex((test,index)=>Object.values(protocolData?.pain?.[test.key]||{}).some(Boolean)&&!String(notes[index+1]||'').trim());if(painIndex>=0){window.alert('Zapisz w notatce trenera przyczynę przerwania próby z powodu bólu.');setRoute(`assessment/${painIndex+1}`);return;}}
          const invalidMeasurement=invalidMeasurementMessage();if(invalidMeasurement){window.alert(invalidMeasurement);setRoute(`assessment/${tests.length}`);return;}
          if (!activeAssessment.date) { window.alert("Assessment date is required before finishing."); setRoute("assessment/" + tests.length); return; }
          const protocolMissing=validateFmsMcsCompletion();if(protocolMissing){window.alert(protocolMissing);setRoute(`assessment/${tests.length}`);return;}
          const secondMissing=pairedAssessmentMissing();if(secondMissing){window.alert(`Uzupełnij wyniki. ${secondMissing}.`);setRoute(`assessment/${tests.length}`);return;}
          const secondPayload=pairedAssessmentPayload();
          await apiRequest('/assessments/complete', { method: 'POST', body: JSON.stringify(assessmentPayload()) });
          if(secondPayload)await apiRequest('/assessments/complete', { method: 'POST', body: JSON.stringify(secondPayload) });
          await loadResults(activeAssessment.assessmentId);
          pairedDraft=null;pairClientId='';
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
      const pendingResults=loadResults(decodeURIComponent(route().split('/')[1]));
      render();
      try { await pendingResults; }
      catch {}
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
  let trackedRoute=routePath();window.addEventListener('hashchange',async()=>{const current=routePath();if(skipRouteTrailUpdate)skipRouteTrailUpdate=false;else if(trackedRoute!==routePath())routeTrail.push(trackedRoute);trackedRoute=routePath();if(current.startsWith('report/')){const id=decodeURIComponent(current.split('/')[1]||'');try{const record=await loadResults(id);if(record.protocolCode==='fms'){skipRouteTrailUpdate=true;setRoute(`fms-report/${encodeURIComponent(id)}`);return;}}catch{} }if(current.startsWith('fms-report/')){const id=decodeURIComponent(current.split('/')[1]||'');try{if(selectedAssessment?.assessmentId!==id)await loadResults(id);}catch(error){resultsLoadError=error.message;}render();}});
  app.addEventListener('click',e=>{if(e.target.closest('[data-action="print-fms"]'))window.print();});
  function validateWizardStep(){const test=tests[wizardIndex];if(!test)return true;app.querySelectorAll('.step-field-error').forEach(node=>node.remove());app.querySelectorAll('[aria-invalid="true"][data-step-invalid]').forEach(node=>{node.removeAttribute('aria-invalid');node.removeAttribute('data-step-invalid');});const missing=[];for(const field of test.definition.fields.filter(item=>item.required||item.scoring)){if(field.fieldType==='measurement'){for(const side of field.sideMode==='bilateral'?['left','right']:['none']){const raw=fieldMeasurements[`${field.code}:${side}`];if(raw==null||String(raw).trim()==='')missing.push({field,side});}}else for(const side of field.sideMode==='bilateral'?['left','right']:['none']){const raw=scores[`${field.code}:${side}`];if(raw==null||raw==='')missing.push({field,side});}}if(test.key==='fms_lower_body_mcs'||test.key==='fms_upper_body_mcs'){const suffix=test.key;const skipped=scores[`${suffix}_skipped:none`]==='positive';if(!skipped){for(const field of test.definition.fields.filter(item=>item.fieldType==='measurement'))for(const side of field.sideMode==='bilateral'?['left','right']:['none']){const value=field.measurementSharedKey?fieldMeasurements[`shared:${field.measurementSharedKey}:none`]:fieldMeasurements[`${field.code}:${side}`];if(value==null||String(value).trim()==='')missing.push({field,side});}}}if(!missing.length)return true;for(const {field,side} of missing){const selector=field.fieldType==='measurement'?'[data-measurement-field]':'[data-key], [data-checkbox-field]';const target=[...app.querySelectorAll(selector)].find(node=>field.fieldType==='measurement'?node.dataset.measurementField===field.code&&node.dataset.side===side:node.dataset.key===`${field.code}:${side}`||node.dataset.checkboxField===field.code);const holder=target?.closest('.field-control')||target?.closest('.measurement-reference-panel')||target?.parentElement;if(holder&&!holder.querySelector('.step-field-error')){const error=document.createElement('small');error.className='step-field-error';error.setAttribute('role','alert');error.textContent=`Uzupełnij: ${field.label}${side==='left'?' — lewa strona':side==='right'?' — prawa strona':''}.`;holder.append(error);}if(target){target.setAttribute('aria-invalid','true');target.setAttribute('data-step-invalid','');}}const first=app.querySelector('[data-step-invalid]');first?.scrollIntoView({behavior:'smooth',block:'center'});first?.focus?.({preventScroll:true});return false;}
  app.addEventListener('click',e=>{const forward=e.target.closest('a[href^="#/assessment/"],a[href="#/results"]');if(forward&&!isEditingAssessment&&!validateWizardStep()){e.preventDefault();e.stopImmediatePropagation();}});
  if(route().startsWith('fms-report/')){const reportId=decodeURIComponent(route().split('/')[1]||'');loadResults(reportId).then(()=>render()).catch(error=>{resultsLoadError=error.message;render();});}
  window.addEventListener('hashchange',async()=>{if(!route().startsWith('sfma-report/'))return;const id=decodeURIComponent(route().split('/')[1]||'');try{if(selectedAssessment?.assessmentId!==id)await loadResults(id);}catch(error){resultsLoadError=error.message;}render();});
  app.addEventListener('click',event=>{const panel=event.target.closest('.pair-client-panel[data-pair-member="second"]');if(!panel)return;const choice=event.target.closest('[data-value]');if(!choice)return;event.preventDefault();event.stopImmediatePropagation();const key=choice.dataset.key;const field=tests.flatMap(item=>item.definition.fields).find(item=>key.startsWith(`${item.code}:`));updatePairedDraft(()=>{scores[key]=field?.answerSet.code==='score_0_3'?Number(choice.dataset.score):choice.dataset.value;});choice.parentElement.querySelectorAll('.score-option,.binary-option').forEach(item=>{const selected=item===choice;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));item.classList.remove('pass','pain');if(selected&&item.classList.contains('binary-option'))item.classList.add(/positive|pain|yes|fail/i.test(item.dataset.value)?'pain':'pass');});if(field){for(const dependent of tests.flatMap(item=>item.definition.fields).filter(item=>item.disabledByFieldCode===field.code)){const side=dependent.sideMode==='bilateral'?key.slice(key.lastIndexOf(':')+1):'none';panel.querySelectorAll('[data-key]').forEach(button=>{if(button.dataset.key===`${dependent.code}:${side}`)button.disabled=choice.dataset.value==='positive';});}}},true);
  app.addEventListener('input',event=>{if(!event.target.closest('.pair-client-panel[data-pair-member="second"]')||!event.target.matches('[data-measurement-field]'))return;const raw=event.target.value.trim().replace(',','.');const value=raw===''?null:Number(raw);const min=event.target.dataset.min===''?null:Number(event.target.dataset.min);const max=event.target.dataset.max===''?null:Number(event.target.dataset.max);const valid=raw===''||Number.isFinite(value)&&value>=0&&(min===null||value>=min)&&(max===null||value<=max);event.target.classList.toggle('is-invalid',!valid);event.target.setAttribute('aria-invalid',String(!valid));},true);
  app.addEventListener('input',event=>{const panel=event.target.closest('.pair-client-panel[data-pair-member="second"]');if(!panel)return;if(event.target.matches('[data-note]')){event.stopImmediatePropagation();updatePairedDraft(()=>{notes[event.target.dataset.note]=event.target.value;});return;}if(event.target.matches('[data-measurement-field]')){event.stopImmediatePropagation();updatePairedDraft(()=>{fieldMeasurements[`${event.target.dataset.measurementField}:${event.target.dataset.side}`]=event.target.value;const field=tests.flatMap(item=>item.definition.fields).find(item=>item.code===event.target.dataset.measurementField);if(field?.measurementSharedKey){const raw=event.target.value.trim().replace(',','.');fieldMeasurements[`shared:${field.measurementSharedKey}:none`]=raw;for(const peer of tests.flatMap(item=>item.definition.fields).filter(item=>item.measurementSharedKey===field.measurementSharedKey))fieldMeasurements[`${peer.code}:none`]=raw;}syncShoulderAutoScores();});}} ,true);
  app.addEventListener('change',event=>{const panel=event.target.closest('.pair-client-panel[data-pair-member="second"]');if(!panel)return;if(event.target.matches('[data-checkbox-field]')){event.stopImmediatePropagation();updatePairedDraft(()=>{scores[`${event.target.dataset.checkboxField}:${event.target.dataset.side}`]=event.target.checked?'positive':null;});}},true);
  app.addEventListener('click',event=>{const link=event.target.closest('a[href="#/assessment/3"]');if(!link||currentScenario?.code!=='quick_screen')return;event.preventDefault();event.stopImmediatePropagation();setRoute(`assessment/${wizardIndex===3?2:4}`);},true);
  (async()=>{if(authSession?.expires_at&&authSession.expires_at*1000<Date.now()+60000)await refreshSession();if(authSession?.access_token){try{await loadQuickScreenData();await loadReportConfiguration();if(route().startsWith('results/'))await loadResults(route().split('/')[1]);if(routePath().startsWith('report/')){const record=await loadResults(decodeURIComponent(routePath().split('/')[1]));if(record.protocolCode==='fms'){skipRouteTrailUpdate=true;setRoute(`fms-report/${encodeURIComponent(record.assessmentId)}`);}else if(record.protocolCode==='sfma'){skipRouteTrailUpdate=true;setRoute(`sfma-report/${encodeURIComponent(record.assessmentId)}`);}}if(route().startsWith('sfma-report/'))await loadResults(decodeURIComponent(route().split('/')[1]));if(route().startsWith('client-report/'))await loadSavedReport(route().split('/')[1]);}catch(error){authError=error.message;authStore(null);}if(authSession?.access_token)await offerResumeDraft();}render();if(authSession?.access_token&&route()==='report')await generateReport();})();
})();

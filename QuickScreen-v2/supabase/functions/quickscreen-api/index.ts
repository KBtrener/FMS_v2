import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const allowedEmail = 'info@kbtrener.pl';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

function assessmentIndicator(answers: any[] = []) {
  let hasPain = false;
  let needsAttention = false;
  const bilateralFields = new Map<string, { answerSetCode: string; sides: Record<string, Array<{ attempt: number; value: number | string | null }>> }>();
  for (const answer of answers) {
    const answerSetCode = answer.test_fields?.answer_sets?.code || '';
    const answerCode = answer.answer_options?.code || '';
    if ((answerSetCode === 'pain_status' && answerCode === 'positive') || (answerSetCode === 'score_0_3' && answer.numeric_value === 0)) hasPain = true;
    else if ((answerSetCode === 'pass_fail' && answerCode === 'fail') || (answerSetCode === 'score_0_3' && answer.numeric_value === 1)) needsAttention = true;
    if (answer.test_fields?.side_mode === 'bilateral' && (answer.side === 'left' || answer.side === 'right')) {
      let field = bilateralFields.get(answer.test_field_id);
      if (!field) {
        field = { answerSetCode, sides: { left: [], right: [] } };
        bilateralFields.set(answer.test_field_id, field);
      }
      field.sides[answer.side].push({ attempt: answer.attempt_number, value: answerSetCode === 'score_0_3' ? answer.numeric_value : answerCode });
    }
  }
  for (const field of bilateralFields.values()) {
    const bestSideValue = (side: Array<{ attempt: number; value: number | string | null }>) => field.answerSetCode === 'score_0_3'
      ? Math.max(...side.map(attempt => Number(attempt.value)))
      : [...side].sort((a, b) => b.attempt - a.attempt)[0]?.value;
    if (field.sides.left.length && field.sides.right.length && bestSideValue(field.sides.left) !== bestSideValue(field.sides.right)) needsAttention = true;
  }
  return hasPain ? 'problem' : needsAttention ? 'warn' : 'ok';
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return response({ error: 'unauthorized' }, 401);

  const db = createClient(url, anonKey, {
    db: { schema: 'quickscreen_v2' },
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identity, error: identityError } = await db.auth.getUser(token);
  if (identityError || !identity.user) return response({ error: 'unauthorized' }, 401);
  if (identity.user.email?.toLocaleLowerCase('en') !== allowedEmail) return response({ error: 'forbidden' }, 403);

  const path = new URL(request.url).pathname.replace(/\/$/, '');
  const parts = path.split('/').filter(Boolean);
  const apiIndex = parts.indexOf('quickscreen-api');
  const route = `/${parts.slice(apiIndex + 2).join('/')}`;
  const ownerId = identity.user.id;

  try {
    if (request.method === 'GET' && route === '/report-settings') {
      const { data, error } = await db.from('report_settings').select('block_visibility').eq('trainer_id', ownerId).maybeSingle();
      if (error) throw error;
      return response({ blockVisibility: data?.block_visibility || { intro: true, results: true, plan: true, help: true } });
    }

    if (request.method === 'PATCH' && route === '/report-settings') {
      const input = await request.json();
      const keys = ['intro', 'results', 'plan', 'help'];
      if (!input.blockVisibility || keys.some(key => typeof input.blockVisibility[key] !== 'boolean')) return response({ error: 'invalid_block_visibility' }, 400);
      const { data, error } = await db.from('report_settings').upsert({ trainer_id: ownerId, block_visibility: Object.fromEntries(keys.map(key => [key, input.blockVisibility[key]])) }, { onConflict: 'trainer_id' }).select('block_visibility').single();
      if (error) throw error;
      return response({ blockVisibility: data.block_visibility });
    }

    if (request.method === 'GET' && route === '/report-resources') {
      const { data, error } = await db.from('report_resources').select('resource_id,test_code,resource_type,title,url,description,sort_order,is_active').eq('trainer_id', ownerId).order('sort_order').order('created_at');
      if (error) throw error;
      return response((data || []).map(item => ({ id: item.resource_id, testCode: item.test_code, type: item.resource_type, title: item.title, url: item.url, description: item.description, sortOrder: item.sort_order, isActive: item.is_active })));
    }

    if (request.method === 'POST' && route === '/report-resources') {
      const input = await request.json();
      if (!String(input.title || '').trim() || !/^https:\/\//i.test(String(input.url || '')) || !['youtube', 'trainerize', 'other'].includes(input.type)) return response({ error: 'invalid_report_resource' }, 400);
      const { data, error } = await db.from('report_resources').insert({ trainer_id: ownerId, test_code: input.testCode || null, resource_type: input.type, title: String(input.title).trim(), url: String(input.url).trim(), description: String(input.description || ''), sort_order: Number(input.sortOrder) || 100 }).select('resource_id,test_code,resource_type,title,url,description,sort_order,is_active').single();
      if (error) throw error;
      return response({ id: data.resource_id, testCode: data.test_code, type: data.resource_type, title: data.title, url: data.url, description: data.description, sortOrder: data.sort_order, isActive: data.is_active }, 201);
    }

    const resourceRoute = route.match(/^\/report-resources\/([^/]+)$/);
    if (request.method === 'PATCH' && resourceRoute) {
      const input = await request.json();
      const updates: Record<string, unknown> = {};
      if (typeof input.isActive === 'boolean') updates.is_active = input.isActive;
      if ('title' in input && String(input.title || '').trim()) updates.title = String(input.title).trim();
      if ('description' in input) updates.description = String(input.description || '');
      if ('testCode' in input) updates.test_code = input.testCode || null;
      if ('url' in input && /^https:\/\//i.test(String(input.url))) updates.url = String(input.url).trim();
      if ('type' in input && ['youtube', 'trainerize', 'other'].includes(input.type)) updates.resource_type = input.type;
      const { error } = await db.from('report_resources').update(updates).eq('resource_id', resourceRoute[1]).eq('trainer_id', ownerId);
      if (error) throw error;
      return response({ id: resourceRoute[1], updated: true });
    }

    if (request.method === 'POST' && route === '/reports') {
      const input = await request.json();
      const blockIds = ['intro', 'results', 'plan', 'help'];
      if (!Array.isArray(input.visibleBlocks)) return response({ error: 'invalid_report_selection' }, 400);
      const selected = [...new Set((input.visibleBlocks || []).filter((id: string) => blockIds.includes(id)))];
      if (!input.assessmentId || !selected.length || selected.length !== (input.visibleBlocks || []).length) return response({ error: 'invalid_report_selection' }, 400);
      const { data: settings, error: settingsError } = await db.from('report_settings').select('block_visibility').eq('trainer_id', ownerId).maybeSingle();
      if (settingsError) throw settingsError;
      const visibility = settings?.block_visibility || { intro: true, results: true, plan: true, help: true };
      if (selected.some((id: string) => visibility[id] !== true)) return response({ error: 'report_block_not_available' }, 403);
      const { data: assessment, error: assessmentError } = await db.from('assessments').select('assessment_id,client_id,manual_version,status').eq('assessment_id', input.assessmentId).eq('owner_id', ownerId).single();
      if (assessmentError) throw assessmentError;
      if (assessment.status !== 'completed') return response({ error: 'assessment_not_complete' }, 409);
      if (input.resourceIds !== undefined && !Array.isArray(input.resourceIds)) return response({ error: 'invalid_report_resources' }, 400);
      const resources = [...new Set(input.resourceIds || [])];
      if (resources.length) {
        const { data: owned, error: resourcesError } = await db.from('report_resources').select('resource_id').eq('trainer_id', ownerId).eq('is_active', true).in('resource_id', resources);
        if (resourcesError) throw resourcesError;
        if ((owned || []).length !== resources.length) return response({ error: 'invalid_report_resources' }, 403);
      }
      const snapshot = { ...input.snapshot, visibleBlocks: selected, manualVersion: assessment.manual_version, generatorVersion: '5.0.0', snapshotVersion: 1 };
      const { data: report, error: reportError } = await db.from('report_instances').insert({ client_id: assessment.client_id, assessment_id: assessment.assessment_id, trainer_id: ownerId, report_profile_code: 'full_coaching_report', manual_version: assessment.manual_version, generator_version: '5.0.0', snapshot, document_status: 'generating' }).select('report_instance_id').single();
      if (reportError) throw reportError;
      const { error: sectionsError } = await db.from('report_instance_sections').insert(selected.map((section_code: string, index: number) => ({ report_instance_id: report.report_instance_id, section_code, sort_order: index + 1 })));
      if (sectionsError) throw sectionsError;
      const { error: finalizeError } = await db.from('report_instances').update({ document_status: 'ready' }).eq('report_instance_id', report.report_instance_id).eq('trainer_id', ownerId);
      if (finalizeError) throw finalizeError;
      return response({ reportId: report.report_instance_id, snapshot }, 201);
    }

    const reportRoute = route.match(/^\/reports\/([^/]+)$/);
    if (request.method === 'GET' && reportRoute) {
      const { data, error } = await db.from('report_instances').select('report_instance_id,snapshot,document_status,generated_at').eq('report_instance_id', reportRoute[1]).eq('trainer_id', ownerId).single();
      if (error) throw error;
      return response({ reportId: data.report_instance_id, snapshot: data.snapshot, status: data.document_status, generatedAt: data.generated_at });
    }

    if (request.method === 'GET' && route === '/me') {
      const { data, error } = await db.from('profiles').select('id,display_name,role').eq('id', ownerId).single();
      if (error) throw error;
      return response({ id: data.id, displayName: data.display_name, role: data.role, email: identity.user.email });
    }

    if (request.method === 'GET' && route === '/scenarios') {
      const { data, error } = await db.from('screen_types').select('screen_type_id,code,name_pl,name_en').eq('is_active', true).order('name_pl');
      if (error) throw error;
      return response((data || []).map(item => ({ screenTypeId: item.screen_type_id, code: item.code, name: item.name_pl })));
    }

    const definition = route.match(/^\/scenarios\/([^/]+)\/definition$/);
    if (request.method === 'GET' && definition) {
      const locale = new URL(request.url).searchParams.get('locale') === 'en' ? 'en' : 'pl';
      const { data: scenario, error: scenarioError } = await db.from('screen_types').select('*').eq('screen_type_id', definition[1]).eq('is_active', true).single();
      if (scenarioError) throw scenarioError;
      const { data: steps, error: stepsError } = await db.from('screen_tests').select('*,tests(*),test_fields(*,answer_sets(*,answer_options(*)))').eq('screen_type_id', definition[1]).eq('is_active', true).order('sort_order');
      if (stepsError) throw stepsError;
      const testIds = (steps || []).map(step => step.tests?.test_id).filter(Boolean);
      const { data: descriptions, error: descriptionsError } = await db.from('test_descriptions').select('*').in('test_id', testIds).eq('locale', locale).eq('is_active', true);
      if (descriptionsError) throw descriptionsError;
      const descriptionByTest = new Map((descriptions || []).map(item => [item.test_id, item]));
      const result = (steps || []).map(step => {
        const test = step.tests;
        const fields = (step.test_fields || []).sort((a, b) => a.sort_order - b.sort_order).map(field => ({
          id: field.test_field_id,
          code: field.code,
          label: locale === 'en' ? field.label_en : field.label_pl,
          sideMode: field.side_mode,
          attemptMode: field.attempt_mode,
          scoring: field.is_scoring_input,
          answerSet: { id: field.answer_sets.answer_set_id, code: field.answer_sets.code, valueKind: field.answer_sets.value_kind },
          answers: (field.answer_sets?.answer_options || []).filter(answer => answer.is_active).sort((a, b) => a.sort_order - b.sort_order).map(answer => ({ id: answer.answer_option_id, code: answer.code, label: locale === 'en' ? answer.label_en : answer.label_pl, value: answer.numeric_value })),
        }));
        return { id: step.screen_test_id, order: step.sort_order, calculation: step.calculation_type, parentId: step.parent_screen_test_id, test: { id: test.test_id, code: test.code, name: locale === 'en' ? test.name_en : test.name_pl, originalEnglishName: test.name_en, criteriaSummary: test.criteria_summary, description: descriptionByTest.get(test.test_id) || null }, fields };
      });
      return response({ id: scenario.screen_type_id, code: scenario.code, name: locale === 'en' ? scenario.name_en : scenario.name_pl, manualVersion: descriptions?.[0]?.manual_version || null, steps: result });
    }

    if (request.method === 'GET' && route === '/clients') {
      const { data, error } = await db.from('clients').select('client_id,first_name,last_name,email,is_archived,created_at,client_disciplines(discipline,is_primary),assessments(assessment_id,assessment_date,status,total_score,max_score)').eq('owner_id', ownerId).order('last_name').order('first_name');
      if (error) throw error;
      const assessmentIds = (data || []).flatMap(client => (client.assessments || []).filter(item => item.status === 'completed').map(item => item.assessment_id));
      const indicators = new Map<string, string>();
      if (assessmentIds.length) {
        const { data: answers, error: answersError } = await db.from('assessment_answers').select('assessment_id,side,test_field_id,attempt_number,numeric_value,test_fields(side_mode,answer_sets(code)),answer_options(code)').in('assessment_id', assessmentIds);
        if (answersError) throw answersError;
        const answersByAssessment = new Map<string, any[]>();
        for (const answer of answers || []) answersByAssessment.set(answer.assessment_id, [...(answersByAssessment.get(answer.assessment_id) || []), answer]);
        for (const assessmentId of assessmentIds) indicators.set(assessmentId, assessmentIndicator(answersByAssessment.get(assessmentId) || []));
      }
      const term = new URL(request.url).searchParams.get('q')?.trim().toLocaleLowerCase('pl');
      return response((data || []).filter(client => !client.is_archived && (!term || `${client.first_name} ${client.last_name} ${client.email}`.toLocaleLowerCase('pl').includes(term))).map(client => {
        const latest = [...(client.assessments || [])].filter(item => item.status === 'completed').sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))[0];
        return { clientId: client.client_id, firstName: client.first_name, lastName: client.last_name, email: client.email, isArchived: client.is_archived, createdAt: client.created_at, discipline: [...(client.client_disciplines || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0]?.discipline || '', latestAssessment: latest ? { id: latest.assessment_id, date: latest.assessment_date, status: latest.status, indicator: indicators.get(latest.assessment_id) || 'ok', score: latest.total_score, maximum: latest.max_score } : null, history: [...(client.assessments || [])].filter(item => item.status === 'completed').sort((a, b) => b.assessment_date.localeCompare(a.assessment_date)).map(item => ({ assessmentId: item.assessment_id, date: item.assessment_date, status: item.status, indicator: indicators.get(item.assessment_id) || 'ok', score: item.total_score, maximum: item.max_score })) };
      }));
    }

    if (request.method === 'GET' && route === '/dashboard') {
      const { data, error } = await db.from('assessments').select('assessment_id,assessment_date,status,total_score,max_score,clients!inner(client_id,first_name,last_name,client_disciplines(discipline,is_primary)),assessment_answers(side,test_field_id,attempt_number,numeric_value,test_fields(side_mode,answer_sets(code)),answer_options(code))').eq('owner_id', ownerId).eq('status', 'completed').order('assessment_date', { ascending: false }).limit(8);
      if (error) throw error;
      return response((data || []).map(item => {
        const indicator = assessmentIndicator(item.assessment_answers || []);
        return { assessmentId: item.assessment_id, clientId: item.clients.client_id, name: `${item.clients.first_name} ${item.clients.last_name}`, sport: [...(item.clients.client_disciplines || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0]?.discipline || '', date: item.assessment_date, status: item.status, indicator, score: item.total_score, maximum: item.max_score };
      }));
    }

    if (request.method === 'POST' && route === '/clients/resolve') {
      const input = await request.json();
      const firstName = String(input.firstName || '').trim();
      const lastName = String(input.lastName || '').trim();
      const email = String(input.email || '').trim().toLocaleLowerCase('en');
      if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response({ error: 'invalid_client' }, 422);
      const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pl');
      const { data: clients, error } = await db.from('clients').select('client_id,first_name,last_name,email,is_archived').eq('owner_id', ownerId).eq('is_archived', false);
      if (error) throw error;
      const matches = (clients || []).filter(client => normalize(client.first_name) === normalize(firstName) && normalize(client.last_name) === normalize(lastName) && normalize(client.email) === normalize(email));
      if (matches.length > 1) return response({ error: 'ambiguous_client', matches }, 409);
      if (matches.length === 1) return response({ client: { clientId: matches[0].client_id, firstName: matches[0].first_name, lastName: matches[0].last_name, email: matches[0].email }, created: false });
      const { data: created, error: createError } = await db.from('clients').insert({ owner_id: ownerId, first_name: firstName, last_name: lastName, email }).select('client_id,first_name,last_name,email,is_archived').single();
      if (createError) throw createError;
      const discipline = String(input.discipline || '').trim();
      if (discipline) {
        const { error: disciplineError } = await db.from('client_disciplines').upsert({ client_id: created.client_id, discipline, is_primary: true }, { onConflict: 'client_id,discipline' });
        if (disciplineError) throw disciplineError;
      }
      return response({ client: { clientId: created.client_id, firstName: created.first_name, lastName: created.last_name, email: created.email }, created: true }, 201);
    }

    const clientRoute = route.match(/^\/clients\/([^/]+)$/);
    if (request.method === 'GET' && clientRoute) {
      const { data, error } = await db.from('clients').select('client_id,first_name,last_name,email,is_archived,created_at').eq('client_id', clientRoute[1]).eq('owner_id', ownerId).single();
      if (error) throw error;
      return response({ clientId: data.client_id, firstName: data.first_name, lastName: data.last_name, email: data.email, isArchived: data.is_archived, createdAt: data.created_at });
    }

    if (request.method === 'GET' && route === '/assessments/latest') {
      const { data, error } = await db.from('assessments').select('assessment_id').eq('owner_id', ownerId).eq('status', 'completed').order('assessment_date', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return response(data ? { assessmentId: data.assessment_id } : null);
    }

    const assessmentRoute = route.match(/^\/assessments\/([^/]+)$/);
    const resultsRoute = route.match(/^\/assessments\/([^/]+)\/results$/);
    if (request.method === 'GET' && resultsRoute) {
      const { data: assessment, error: assessmentError } = await db.from('assessments').select('assessment_id,assessment_date,manual_version,client_id,screen_type_id,total_score,max_score,clients!inner(client_id,first_name,last_name,email)').eq('assessment_id', resultsRoute[1]).eq('owner_id', ownerId).eq('status', 'completed').single();
      if (assessmentError) throw assessmentError;
      const { data: answers, error: answersError } = await db.from('assessment_answers').select('answer_id,test_field_id,side,attempt_number,answer_option_id,numeric_value').eq('assessment_id', assessment.assessment_id);
      if (answersError) throw answersError;
      const { data: effects, error: effectsError } = await db.from('applied_effects').select('target_screen_test_id,after_score,reason_pl').eq('assessment_id', assessment.assessment_id);
      if (effectsError) throw effectsError;
      const { data: steps, error: stepsError } = await db.from('screen_tests').select('*,tests(*),test_fields(*,answer_sets(*,answer_options(*)))').eq('screen_type_id', assessment.screen_type_id).eq('is_active', true).order('sort_order');
      if (stepsError) throw stepsError;
      const finalScores: Record<string, number> = {};
      const rows: Record<string, unknown>[] = [];
      const reportTests: Record<string, unknown>[] = [];
      const detailsFor = (fields: any[], side: string) => fields.flatMap(field => (answers || [])
        .filter(answer => answer.test_field_id === field.test_field_id && answer.side === side)
        .map(answer => {
          const option = field.answer_sets?.answer_options?.find(item => item.answer_option_id === answer.answer_option_id);
          const code = option?.code || '';
          const setCode = field.answer_sets?.code || '';
          const label = setCode === 'pass_fail' ? 'Zakres' : setCode === 'pain_status' ? 'Ból' : field.label_pl;
          const value = setCode === 'pass_fail' ? code === 'pass' ? 'Dobry' : code === 'fail' ? 'Zły' : option?.label_pl || '' : option?.label_pl || '';
          const tone = setCode === 'pain_status' ? code === 'positive' ? 'pain' : 'good' : setCode === 'pass_fail' ? code === 'fail' ? 'bad' : 'good' : '';
          return { label, value, tone };
        }));
      for (const step of steps || []) {
        const fields = (step.test_fields || []).filter(field => field.is_scoring_input);
        const reportFields = fields.flatMap(field => (answers || []).filter(answer => answer.test_field_id === field.test_field_id).map(answer => {
          const option = field.answer_sets?.answer_options?.find(item => item.answer_option_id === answer.answer_option_id);
          return { code: field.code, label: field.label_pl, answerSetCode: field.answer_sets?.code || '', side: answer.side, valueCode: option?.code || '', valueLabel: option?.label_pl || '', numericValue: answer.numeric_value };
        }));
        const numericFields = fields.filter(field => field.answer_sets?.code === 'score_0_3');
        if (numericFields.length) {
          const field = numericFields[0];
          const values = (answers || []).filter(answer => answer.test_field_id === field.test_field_id);
          const sideBest = (side: string) => {
            const sideValues = values.filter(answer => answer.side === side).map(answer => Number(answer.numeric_value)).filter(Number.isFinite);
            return sideValues.length ? Math.max(...sideValues) : null;
          };
          const sideValues = { left: sideBest('left'), right: sideBest('right'), none: sideBest('none') };
          const assessableScores = [sideValues.left, sideValues.right, sideValues.none].filter((value): value is number => value !== null);
          const baseScore = assessableScores.length ? (step.calculation_type === 'best_attempt_single' ? Math.max(...assessableScores) : Math.min(...assessableScores)) : null;
          const scoreEffects = (effects || []).filter(effect => effect.target_screen_test_id === step.screen_test_id);
          const finalScore = baseScore === null ? null : scoreEffects.reduce((value, effect) => Math.min(value, effect.after_score), baseScore);
          if (finalScore !== null) finalScores[step.screen_test_id] = finalScore;
          const scoreStatus = finalScore === null ? 'unknown' : finalScore === 0 ? 'problem' : finalScore === 1 ? 'warn' : 'ok';
          rows.push({ code: step.tests.code, order: step.sort_order, name: step.tests.name_pl, kind: 'score', l: sideValues.left, r: sideValues.right, value: sideValues.none, leftScore: sideValues.left, rightScore: sideValues.right, merged: sideValues.none != null, finalScore, status: scoreStatus, groupKey: step.tests.code === 'shoulder_mobility' ? 'shoulder' : null, sharedScore: step.tests.code === 'shoulder_mobility' ? 'shoulder' : null });
          reportTests.push({ code: step.tests.code, order: step.sort_order, name: step.tests.name_pl, description: step.tests.description_short || '', leftScore: sideValues.left, rightScore: sideValues.right, finalScore, fields: reportFields });
          continue;
        }
        if (step.tests.code === 'shoulder_clearing') {
          reportTests.push({ code: step.tests.code, order: step.sort_order, name: step.tests.name_pl, description: step.tests.description_short || '', finalScore: null, fields: reportFields });
          for (const pattern of ['upper', 'lower']) {
            const patternFields = fields.filter(item => item.code.startsWith(`shoulder_clearing_${pattern}_`) && (item.code.endsWith('_pain') || item.code.endsWith('_range')));
            if (!patternFields.length) continue;
            const orderedFields = patternFields.sort((a, b) => (a.answer_sets?.code === 'pass_fail' ? 0 : 1) - (b.answer_sets?.code === 'pass_fail' ? 0 : 1));
            const lDetails = detailsFor(orderedFields, 'left');
            const rDetails = detailsFor(orderedFields, 'right');
            const patternDetails = [...lDetails, ...rDetails];
            const hasPain = patternDetails.some(item => item.tone === 'pain');
            const hasBadRange = patternDetails.some(item => item.tone === 'bad');
            rows.push({ name: pattern === 'upper' ? 'Wzorzec górny' : 'Wzorzec dolny', kind: 'summary', merged: false, lDetails, rDetails, status: hasPain ? 'problem' : hasBadRange ? 'warn' : 'ok', child: true, groupKey: 'shoulder', sharedScore: 'shoulder' });
          }
          continue;
        }
        const sides: Record<string, string[]> = { left: [], right: [], none: [] };
        const details = fields.flatMap(field => {
          const fieldAnswers = (answers || []).filter(answer => answer.test_field_id === field.test_field_id);
          return fieldAnswers.map(answer => {
            const option = field.answer_sets?.answer_options?.find(item => item.answer_option_id === answer.answer_option_id);
            const detail = `${field.label_pl}: ${option?.label_pl || ''}`;
            (sides[answer.side] || sides.none).push(detail);
            return `${answer.side === 'left' ? 'L' : answer.side === 'right' ? 'P' : ''}${answer.side === 'none' ? '' : ': '}${detail}`;
          });
        });
        const codes = fields.flatMap(field => (answers || []).filter(answer => answer.test_field_id === field.test_field_id).map(answer => field.answer_sets?.answer_options?.find(option => option.answer_option_id === answer.answer_option_id)?.code || ''));
        const state = codes.some(code => /positive|pain|yes/i.test(code)) ? 'problem' : codes.some(code => /fail/i.test(code)) ? 'warn' : 'ok';
        const bilateral = sides.left.length > 0 || sides.right.length > 0;
        rows.push({ code: step.tests.code, order: step.sort_order, name: step.tests.name_pl, kind: 'summary', merged: !bilateral, l: sides.left.join(' · '), r: sides.right.join(' · '), value: sides.none.join(' · '), detail: details.join(' · '), lDetails: detailsFor(fields, 'left'), rDetails: detailsFor(fields, 'right'), valueDetails: detailsFor(fields, 'none'), status: state });
        reportTests.push({ code: step.tests.code, order: step.sort_order, name: step.tests.name_pl, description: step.tests.description_short || '', finalScore: null, fields: reportFields });
      }
      let totalScore = 0;
      for (const value of Object.values(finalScores)) totalScore += value;
      const history: Record<string, unknown>[] = [];
      if (assessment.manual_version) {
        const { data: previous, error: previousError } = await db.from('assessments').select('assessment_id,assessment_date,manual_version').eq('client_id', assessment.client_id).eq('status', 'completed').eq('manual_version', assessment.manual_version).lt('assessment_date', assessment.assessment_date).order('assessment_date', { ascending: false }).limit(3);
        if (previousError) throw previousError;
        const currentByCode = new Map<string, any>(reportTests.map(test => [String(test.code), test] as [string, any]));
        const currentTestByField = new Map<string, any>();
        for (const step of steps || []) for (const field of step.test_fields || []) currentTestByField.set(field.code, { code: step.tests.code, name: step.tests.name_pl, screenTestId: step.screen_test_id });
        for (const old of previous || []) {
          const [{ data: oldAnswers, error: oldAnswersError }, { data: oldEffects, error: oldEffectsError }] = await Promise.all([
            db.from('assessment_answers').select('side,numeric_value,attempt_number,test_fields!inner(code,answer_sets(code)),answer_options(code)').eq('assessment_id', old.assessment_id),
            db.from('applied_effects').select('target_screen_test_id,after_score').eq('assessment_id', old.assessment_id),
          ]);
          if (oldAnswersError) throw oldAnswersError;
          if (oldEffectsError) throw oldEffectsError;
          const grouped = new Map<string, any[]>();
          for (const answer of oldAnswers || []) {
            const current = currentTestByField.get(answer.test_fields?.code);
            if (current) grouped.set(current.code, [...(grouped.get(current.code) || []), answer]);
          }
          const changes: Record<string, unknown>[] = [];
          for (const [code, current] of currentByCode) {
            const oldRows = grouped.get(code) || [];
            if (!oldRows.length) continue;
            const numeric = oldRows.filter(answer => answer.test_fields?.answer_sets?.code === 'score_0_3' && answer.numeric_value !== null && answer.numeric_value !== undefined && Number.isFinite(Number(answer.numeric_value)));
            const oldPain = oldRows.some(answer => answer.answer_options?.code === 'positive' || (answer.numeric_value !== null && answer.numeric_value !== undefined && Number(answer.numeric_value) === 0));
            const oldSides = { left: null as number | null, right: null as number | null, none: null as number | null };
            for (const side of ['left', 'right', 'none'] as const) {
              const values = numeric.filter(answer => answer.side === side).map(answer => Number(answer.numeric_value));
              if (values.length) oldSides[side] = Math.max(...values);
            }
            const oldScored = [oldSides.left, oldSides.right, oldSides.none].filter((value): value is number => value !== null);
            const step = (steps || []).find(item => item.tests.code === code);
            let oldFinal: number | null = oldScored.length ? (step?.calculation_type === 'best_attempt_single' ? Math.max(...oldScored) : Math.min(...oldScored)) : null;
            const applied = (oldEffects || []).filter(effect => effect.target_screen_test_id === step?.screen_test_id);
            if (applied.length && oldFinal !== null) oldFinal = Math.min(oldFinal, ...applied.map(effect => Number(effect.after_score)));
            const currentPain = (current.fields as any[] || []).some(field => field.valueCode === 'positive' || (field.numericValue !== null && field.numericValue !== undefined && Number(field.numericValue) === 0));
            const currentFinal = Number.isFinite(current.finalScore) ? Number(current.finalScore) : null;
            const oldAsymmetry = oldSides.left !== null && oldSides.right !== null && oldSides.left !== oldSides.right;
            const currentAsymmetry = current.leftScore !== null && current.leftScore !== undefined && current.rightScore !== null && current.rightScore !== undefined && current.leftScore !== current.rightScore;
            let change = 'not_comparable';
            if (oldPain !== currentPain) change = currentPain ? 'new_pain' : 'pain_resolved';
            else if (oldAsymmetry !== currentAsymmetry) change = currentAsymmetry ? 'new_asymmetry' : 'resolved_asymmetry';
            else if (oldFinal !== null && currentFinal !== null) change = currentFinal > oldFinal ? 'improved' : currentFinal < oldFinal ? 'worsened' : 'unchanged';
            else if (oldPain === currentPain) change = 'unchanged';
            changes.push({ code, name: String(current.name || code), previousScore: oldFinal, currentScore: currentFinal, previousPain: oldPain, currentPain, change });
          }
          if (changes.length) history.push({ assessmentId: old.assessment_id, date: old.assessment_date, changes });
        }
      }
      return response({ assessmentId: assessment.assessment_id, date: assessment.assessment_date, manualVersion: assessment.manual_version, scenarioName: 'Bazowy Test Funkcjonalny', client: { clientId: assessment.clients.client_id, firstName: assessment.clients.first_name, lastName: assessment.clients.last_name, email: assessment.clients.email }, totalScore: assessment.total_score ?? totalScore, maximum: assessment.max_score ?? Object.keys(finalScores).length * 3, rows, tests: reportTests, history });
    }

    if (request.method === 'GET' && assessmentRoute) {
      const { data, error } = await db.from('assessments').select('*,clients!inner(client_id,first_name,last_name,email),assessment_answers(*),applied_effects(*),assessment_test_notes(*)').eq('assessment_id', assessmentRoute[1]).eq('owner_id', ownerId).single();
      if (error) throw error;
      return response(data);
    }

    if (request.method === 'POST' && route === '/assessments') {
      const input = await request.json();
      const { data, error } = await db.from('assessments').insert({ owner_id: ownerId, client_id: input.clientId, screen_type_id: input.scenarioId, assessment_date: input.date, manual_version: input.manualVersion, note: input.note || '', status: 'in_progress' }).select('assessment_id,client_id,screen_type_id,assessment_date,manual_version,status').single();
      if (error) throw error;
      return response({ assessmentId: data.assessment_id, clientId: data.client_id, scenarioId: data.screen_type_id, date: data.assessment_date, manualVersion: data.manual_version, status: data.status }, 201);
    }

    if (request.method === 'PATCH' && assessmentRoute) {
      const input = await request.json();
      const answers = (input.answers || []).map((answer: Record<string, unknown>) => ({ fieldId: answer.fieldId, side: answer.side || 'none', attemptNumber: answer.attemptNumber || 1, answerId: answer.answerId }));
      const notes = Object.entries(input.notes || {}).map(([testId, note]) => ({ testId, note: String(note || '') }));
      const { error } = await db.rpc('save_assessment_draft', { p_assessment_id: assessmentRoute[1], p_note: String(input.note || ''), p_answers: answers, p_notes: notes });
      if (error) throw error;
      return response({ assessmentId: assessmentRoute[1], saved: true });
    }

    const completeRoute = route.match(/^\/assessments\/([^/]+)\/complete$/);
    if (request.method === 'POST' && completeRoute) {
      const { data, error } = await db.rpc('complete_assessment_v2', { p_assessment_id: completeRoute[1] });
      if (error) throw error;
      return response(data);
    }

    return response({ error: 'not_found' }, 404);
  } catch (error) {
    console.error('quickscreen-api request failed', { route, code: error?.code, message: error?.message });
    const status = error?.code === 'PGRST116' ? 404 : 400;
    return response({ error: status === 404 ? 'not_found' : 'request_failed', message: error?.message || 'Bad request' }, status);
  }
});

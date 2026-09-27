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
      const term = new URL(request.url).searchParams.get('q')?.trim().toLocaleLowerCase('pl');
      return response((data || []).filter(client => !client.is_archived && (!term || `${client.first_name} ${client.last_name} ${client.email}`.toLocaleLowerCase('pl').includes(term))).map(client => {
        const latest = [...(client.assessments || [])].filter(item => item.status === 'completed').sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))[0];
        return { clientId: client.client_id, firstName: client.first_name, lastName: client.last_name, email: client.email, isArchived: client.is_archived, createdAt: client.created_at, discipline: [...(client.client_disciplines || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0]?.discipline || '', latestAssessment: latest ? { id: latest.assessment_id, date: latest.assessment_date, status: latest.status, score: latest.total_score, maximum: latest.max_score } : null, history: [...(client.assessments || [])].filter(item => item.status === 'completed').sort((a, b) => b.assessment_date.localeCompare(a.assessment_date)).map(item => ({ assessmentId: item.assessment_id, date: item.assessment_date, status: item.status, score: item.total_score, maximum: item.max_score })) };
      }));
    }

    if (request.method === 'GET' && route === '/dashboard') {
      const { data, error } = await db.from('assessments').select('assessment_id,assessment_date,status,total_score,max_score,clients!inner(client_id,first_name,last_name,client_disciplines(discipline,is_primary)),assessment_answers(side,test_field_id,attempt_number,numeric_value,test_fields(side_mode,answer_sets(code)),answer_options(code))').eq('owner_id', ownerId).eq('status', 'completed').order('assessment_date', { ascending: false }).limit(8);
      if (error) throw error;
      return response((data || []).map(item => {
        let hasPain = false;
        let needsAttention = false;
        const bilateralFields = new Map<string, { answerSetCode: string; sides: Record<string, Array<{ attempt: number; value: number | string | null }>> }>();
        for (const answer of item.assessment_answers || []) {
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
            : side.sort((a, b) => b.attempt - a.attempt)[0]?.value;
          if (field.sides.left.length && field.sides.right.length && bestSideValue(field.sides.left) !== bestSideValue(field.sides.right)) needsAttention = true;
        }
        const indicator = hasPain ? 'problem' : needsAttention ? 'warn' : 'ok';
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
      for (const step of steps || []) {
        const fields = (step.test_fields || []).filter(field => field.is_scoring_input);
        const numericFields = fields.filter(field => field.answer_sets?.code === 'score_0_3');
        if (numericFields.length) {
          const field = numericFields[0];
          const values = (answers || []).filter(answer => answer.test_field_id === field.test_field_id);
          const sideValues = Object.fromEntries(values.map(answer => [answer.side, answer.numeric_value]));
          const baseScore = step.calculation_type === 'best_attempt_single' ? Math.max(...values.map(answer => answer.numeric_value)) : Math.min(...values.map(answer => answer.numeric_value));
          const finalScore = (effects || []).filter(effect => effect.target_screen_test_id === step.screen_test_id).reduce((value, effect) => Math.min(value, effect.after_score), baseScore);
          finalScores[step.screen_test_id] = finalScore;
          rows.push({ name: step.tests.name_pl, kind: 'score', l: sideValues.left ?? null, r: sideValues.right ?? null, value: sideValues.none ?? null, merged: sideValues.none != null, finalScore, status: finalScore === 0 ? 'problem' : finalScore === 1 ? 'warn' : 'ok', groupKey: step.tests.code === 'shoulder_mobility' ? 'shoulder' : null, sharedScore: step.tests.code === 'shoulder_mobility' ? 'shoulder' : null });
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
        rows.push({ name: step.tests.name_pl, kind: 'summary', merged: !bilateral, l: sides.left.join(' · '), r: sides.right.join(' · '), value: sides.none.join(' · '), detail: details.join(' · '), status: state, child: step.tests.code === 'shoulder_clearing', groupKey: step.tests.code === 'shoulder_clearing' ? 'shoulder' : null, sharedScore: step.tests.code === 'shoulder_clearing' ? 'shoulder' : null });
      }
      let totalScore = 0;
      for (const value of Object.values(finalScores)) totalScore += value;
      return response({ assessmentId: assessment.assessment_id, date: assessment.assessment_date, client: { clientId: assessment.clients.client_id, firstName: assessment.clients.first_name, lastName: assessment.clients.last_name, email: assessment.clients.email }, totalScore: assessment.total_score ?? totalScore, maximum: assessment.max_score ?? Object.keys(finalScores).length * 3, rows });
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

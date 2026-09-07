import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((x, i, a) => x.startsWith('--') ? [x.slice(2), a[i + 1]] : []).filter(x => x.length));
const root = resolve(args.input || 'google-export');
const env = {};
try { for (const line of (await readFile('.env.local', 'utf8')).split(/\r?\n/)) { const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, ''); } } catch {}
const url = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_API_URL || env.SUPABASE_PROJECT_URL || env.SUPABASE_API_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const ownerId = args['owner-id'] || process.env.SUPABASE_OWNER_ID;
if (!url || !key || !ownerId) throw new Error('Wymagane: SUPABASE_PROJECT_URL, SUPABASE_SERVICE_ROLE_KEY i --owner-id. Wartości pozostają wyłącznie w środowisku.');
const sb = createClient(url.replace(/\/(?:rest|auth|storage)\/v1\/?$/, '').replace(/\/+$/, ''), key, { auth: { autoRefreshToken: false, persistSession: false } });
const parseCsv = text => { const rows = []; let row = [], cell = '', quote = false; for (const c of text) { if (c === '"') quote = !quote; else if (c === ',' && !quote) { row.push(cell); cell = ''; } else if ((c === '\n' || c === '\r') && !quote) { if (c === '\n' && (cell || row.length)) { rows.push([...row, cell]); row = []; cell = ''; } } else cell += c; } if (cell || row.length) rows.push([...row, cell]); const [head, ...body] = rows; return (body || []).map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()]))); };
const readRows = async name => { try { const text = await readFile(join(root, name + '.json'), 'utf8'); return JSON.parse(text); } catch { try { return parseCsv(await readFile(join(root, name + '.csv'), 'utf8')); } catch { return []; } } };
const result = (response, label) => { if (response.error) throw new Error(`${label}: ${response.error.message}`); return response.data; };
const clients = await readRows('clients');
const clientRows = clients.map(x => ({ owner_id: ownerId, legacy_client_id: x.client_id || x.legacy_client_id, first_name: x.first_name || x.firstName, last_name: x.last_name || x.lastName, email: String(x.email || '').toLowerCase(), is_archived: x.is_archived === true || x.is_archived === 'true', created_at: x.created_at || undefined, updated_at: x.updated_at || undefined })).map(x => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined)));
if (clientRows.length) result(await sb.from('clients').upsert(clientRows, { onConflict: 'owner_id,legacy_client_id' }), 'clients');
const storedClients = result(await sb.from('clients').select('client_id,legacy_client_id').eq('owner_id', ownerId), 'clients lookup');
const clientMap = Object.fromEntries(storedClients.map(x => [x.legacy_client_id, x.client_id]));
const assessments = await readRows('assessments');
const assessmentRows = assessments.map(x => ({ owner_id: ownerId, legacy_assessment_id: x.assessment_id || x.legacy_assessment_id, client_id: clientMap[x.client_id || x.legacy_client_id], screen_type_id: x.screen_type_id || 'screen_quick_screen', assessment_date: x.assessment_date, completed_at: x.completed_at || undefined, note: x.note || '', status: x.status === 'archived' ? 'archived' : 'completed', correction_note: x.correction_note || '', created_at: x.created_at || undefined, updated_at: x.updated_at || undefined })).filter(x => x.client_id && x.assessment_date).map(x => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined)));
if (assessmentRows.length) result(await sb.from('assessments').upsert(assessmentRows, { onConflict: 'owner_id,legacy_assessment_id' }), 'assessments');
const storedAssessments = result(await sb.from('assessments').select('assessment_id,legacy_assessment_id').eq('owner_id', ownerId), 'assessment lookup');
const assessmentMap = Object.fromEntries(storedAssessments.map(x => [x.legacy_assessment_id, x.assessment_id]));
const answers = (await readRows('assessment_answers')).map(x => ({ assessment_id: assessmentMap[x.assessment_id || x.legacy_assessment_id], test_field_id: x.test_field_id, side: x.side || 'none', attempt_number: Number(x.attempt_number || 1), answer_option_id: x.answer_option_id, numeric_value: x.numeric_value === '' ? null : (x.numeric_value == null ? null : Number(x.numeric_value)), unit: x.unit || null })).filter(x => x.assessment_id && x.test_field_id && x.answer_option_id);
if (answers.length) { result(await sb.from('assessment_answers').upsert(answers, { onConflict: 'assessment_id,test_field_id,side,attempt_number' }), 'assessment_answers'); }
const effectsSource = await readRows('applied_effects');
const effects = effectsSource.map(x => ({ assessment_id: assessmentMap[x.assessment_id || x.legacy_assessment_id], effect_rule_id: x.effect_rule_id, target_screen_test_id: x.target_screen_test_id, before_score: Number(x.before_score), after_score: Number(x.after_score), reason_pl: x.reason_pl || '' })).filter(x => x.assessment_id && x.effect_rule_id && x.target_screen_test_id && Number.isInteger(x.before_score) && Number.isInteger(x.after_score));
if (effects.length) { const ids = [...new Set(effects.map(x => x.assessment_id))]; result(await sb.from('applied_effects').delete().in('assessment_id', ids), 'clear applied_effects'); result(await sb.from('applied_effects').insert(effects), 'applied_effects'); }
let uploaded = 0;
const fileDir = join(root, 'files');
try { for (const name of await readdir(fileDir)) { const path = join(fileDir, name), match = name.match(/^([^_]+)_(.+)$/); if (!match) continue; const assessmentId = assessmentMap[match[1]], storagePath = `${ownerId}/${assessmentId || 'unlinked'}/${match[2]}`; const bytes = await readFile(path); result(await sb.storage.from('assessment-files').upload(storagePath, bytes, { upsert: true, contentType: 'application/octet-stream' }), `file ${name}`); result(await sb.from('attachments').upsert({ owner_id: ownerId, assessment_id: assessmentId || null, client_id: null, bucket_id: 'assessment-files', storage_path: storagePath, file_name: match[2], mime_type: 'application/octet-stream', byte_size: bytes.length }, { onConflict: 'storage_path' }), `attachment ${name}`); uploaded++; } } catch (e) { if (e.code !== 'ENOENT') throw e; }
const clientCountResponse = await sb.from('clients').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId); if (clientCountResponse.error) throw clientCountResponse.error;
const assessmentCountResponse = await sb.from('assessments').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId); if (assessmentCountResponse.error) throw assessmentCountResponse.error;
const counts = { clients: clientCountResponse.count, assessments: assessmentCountResponse.count };
const orphanAssessments = assessmentRows.filter(x => !x.client_id).length;
const orphanAnswers = (await readRows('assessment_answers')).length - answers.length;
console.log(JSON.stringify({ source: root, imported: { clients: clientRows.length, assessments: assessmentRows.length, answers: answers.length, effects: effects.length, files: uploaded }, skipped: { clients: clients.length - clientRows.length, assessments: assessments.length - assessmentRows.length, effects: effectsSource.length - effects.length }, validation: { orphanAssessments, orphanAnswers, remoteCounts: counts } }));

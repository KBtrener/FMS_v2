import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { resolve } from 'node:path';

async function readEnv() { const values={}; for(const line of (await readFile('.env.local','utf8')).split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)values[m[1]]=m[2].replace(/^['"]|['"]$/g,'')} return values; }
const env=await readEnv(),url=(env.SUPABASE_API_URL||env.SUPABASE_PROJECT_URL||'').replace(/\/(?:rest|auth|storage)\/v1\/?$/,'').replace(/\/+$/,''),key=env.SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw new Error('Brak publicznej konfiguracji Supabase.');
const stamp=Date.now(),emailA=`quickscreen-a-${stamp}@kbtrener.pl`,emailB=`quickscreen-b-${stamp}@kbtrener.pl`,userIdA=crypto.randomUUID(),userIdB=crypto.randomUUID(),password=`Q!${crypto.randomBytes(18).toString('base64url')}`;
const adminSql=sql=>{mkdirSync(resolve('tmp'),{recursive:true});const fileName=`tmp/quickscreen-e2e-${stamp}.sql`;const file=resolve(fileName);writeFileSync(file,sql,'utf8');const cli=process.platform==='win32'?'npx.cmd':'npx';const args=['supabase','db','query','--linked','--output-format','json','--file',fileName];const result=spawnSync(cli,args,{encoding:'utf8',shell:process.platform==='win32',stdio:['ignore','pipe','pipe']});try{unlinkSync(file)}catch{}if(result.status!==0){const detail=((result.stderr||'')+' '+(result.stdout||'')).replaceAll(password,'[redacted]').replaceAll(emailA,'[email-a]').replaceAll(emailB,'[email-b]').slice(0,800);throw new Error(`Polecenie administracyjne testu nie powiodło się (${result.status||'unknown'}): ${detail}`);}};
const anonymous=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const a=anonymous(),b=anonymous();
const ensure=async(promise,label)=>{const{data,error}=await promise;if(error)throw new Error(`${label}: ${error.message}`);return data};
let clientId,assessmentId,path;
try{
  adminSql(`insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at,raw_app_meta_data,raw_user_meta_data) values ('${userIdA}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','${emailA}',crypt('${password}',gen_salt('bf')),now(),'','','','',now(),now(),'{}','{}'),('${userIdB}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','${emailB}',crypt('${password}',gen_salt('bf')),now(),'','','','',now(),now(),'{}','{}'); insert into auth.identities (provider_id,user_id,identity_data,provider,created_at,updated_at) values ('${userIdA}','${userIdA}',jsonb_build_object('sub','${userIdA}','email','${emailA}'),'email',now(),now()),('${userIdB}','${userIdB}',jsonb_build_object('sub','${userIdB}','email','${emailB}'),'email',now(),now());`);
  const sessionA=await ensure(a.auth.signInWithPassword({email:emailA,password}),'login A');
  const sessionB=await ensure(b.auth.signInWithPassword({email:emailB,password}),'login B');
  if(!sessionA.session||!sessionB.session)throw new Error('Brak sesji testowych.');
  const created=await ensure(a.from('clients').insert({owner_id:sessionA.user.id,first_name:'Test',last_name:'RLS A',email:'client-a@example.invalid'}).select('client_id').single(),'create client A');clientId=created.client_id;
  const bClients=await ensure(b.from('clients').select('client_id').eq('client_id',clientId),'B reads A client');if(bClients.length)throw new Error('RLS leak: B read A client');
  const fields=await ensure(a.from('test_fields').select('*').eq('is_scoring_input',true),'fields');const options=await ensure(a.from('answer_options').select('*'),'options');const toeTest=await ensure(a.from('tests').select('test_id').eq('code','toe_touch').single(),'toe touch test');
  const payload=fields.flatMap(field=>(field.side_mode==='bilateral'?['left','right']:['none']).map(side=>{const candidates=options.filter(option=>option.answer_set_id===field.answer_set_id),option=candidates.find(x=>x.code==='score_3')||candidates.find(x=>x.code==='pass')||candidates.find(x=>x.code==='negative');return{testFieldId:field.test_field_id,side,attemptNumber:1,answerOptionId:option.answer_option_id,numericValue:option.numeric_value}}));
  assessmentId=await ensure(a.rpc('save_assessment',{p_client_id:clientId,p_screen_type_id:'screen_quick_screen',p_assessment_date:new Date().toISOString().slice(0,10),p_note:'E2E',p_answers:payload,p_effects:[]}),'save assessment');
  const aAssessment=await ensure(a.from('assessments').select('assessment_id,assessment_answers(answer_id)').eq('assessment_id',assessmentId).single(),'A reads assessment');if(!aAssessment.assessment_answers.length)throw new Error('Assessment answers missing');
  const bAssessment=await ensure(b.from('assessments').select('assessment_id').eq('assessment_id',assessmentId),'B reads A assessment');if(bAssessment.length)throw new Error('RLS leak: B read A assessment');
  const bAnswers=await ensure(b.from('assessment_answers').select('answer_id').eq('assessment_id',assessmentId),'B reads A answers');if(bAnswers.length)throw new Error('RLS leak: B read A answers');
  await ensure(a.from('assessment_test_notes').insert({assessment_id:assessmentId,test_id:toeTest.test_id,author_id:sessionA.user.id,note:'Notatka E2E'}),'insert test note');
  const ownNotes=await ensure(a.from('assessment_test_notes').select('note').eq('assessment_id',assessmentId),'A reads test note');if(ownNotes.length!==1)throw new Error('Per-test note missing');
  const foreignNotes=await ensure(b.from('assessment_test_notes').select('note').eq('assessment_id',assessmentId),'B reads A test note');if(foreignNotes.length)throw new Error('RLS leak: B read A test note');
  const blocked=await b.rpc('update_assessment',{p_assessment_id:assessmentId,p_assessment_date:new Date().toISOString().slice(0,10),p_note:'blocked',p_correction_note:'blocked',p_answers:payload,p_effects:[]});if(!blocked.error)throw new Error('RLS leak: B updated A assessment');
  await ensure(a.rpc('update_assessment',{p_assessment_id:assessmentId,p_assessment_date:new Date().toISOString().slice(0,10),p_note:'E2E corrected',p_correction_note:'E2E correction',p_answers:payload,p_effects:[]}),'update assessment A');
  path=`${sessionA.user.id}/${assessmentId}/e2e.png`;await ensure(a.storage.from('assessment-files').upload(path,new Blob(['QuickScreen E2E'],{type:'image/png'}),{upsert:true}),'upload A file');
  await ensure(a.from('attachments').insert({owner_id:sessionA.user.id,client_id:clientId,assessment_id:assessmentId,test_id:toeTest.test_id,attachment_role:'test_photo',storage_path:path,file_name:'e2e.png',mime_type:'image/png',byte_size:15}),'insert mapped photo');
  const bSigned=await b.storage.from('assessment-files').createSignedUrl(path,60);if(!bSigned.error)throw new Error('RLS leak: B signed A file');
  const downloaded=await ensure(a.storage.from('assessment-files').download(path),'download A file');if(await downloaded.text()!=='QuickScreen E2E')throw new Error('Downloaded file mismatch');
  await ensure(a.storage.from('assessment-files').remove([path]),'delete A file');path=null;
  await ensure(a.from('assessments').update({status:'archived'}).eq('assessment_id',assessmentId).select('assessment_id').single(),'archive assessment');
  await ensure(a.from('clients').update({first_name:'Test Edited'}).eq('client_id',clientId).select('client_id').single(),'edit client');
  console.log(JSON.stringify({auth:true,clients:true,assessments:true,answers:true,testNotes:true,testPhotoMapping:true,updateRpc:true,rlsTwoUsers:true,storageUploadDownloadDelete:true,archive:true}));
}finally{
  if(path)await a.storage.from('assessment-files').remove([path]);
  try{adminSql(`delete from public.assessments where owner_id in (select id from auth.users where email in ('${emailA}','${emailB}')); delete from public.clients where owner_id in (select id from auth.users where email in ('${emailA}','${emailB}')); delete from auth.users where email in ('${emailA}','${emailB}');`)}catch{}
}

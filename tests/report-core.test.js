const test = require('node:test');
const assert = require('node:assert/strict');

let reports;
test.before(async () => { reports = await import('../web/report-core.js'); });

const assessment = count => ({ assessmentId:`a${count}`, assessmentDate:`2026-0${count}-01`, status:'completed', statuses:[], rawScores:{toe_touch:{left:1,right:2}}, finalScores:{toe_touch:1}, appliedEffects:[] });

test('free profile excludes paid sections and keeps mandatory methodology', () => {
  const model = reports.createReportModel({ reportProfile:'free_current_result', client:{}, trainer:{}, latestAssessment:assessment(1), historicalAssessments:[assessment(1)], enabledSections:['history'] });
  assert.ok(model.enabledSections.includes('methodology'));
  assert.ok(!model.enabledSections.includes('history'), 'history stays hidden with only one assessment');
  assert.ok(!model.enabledSections.includes('recommendations'));
});

test('full report renders history only from two complete assessments', () => {
  const model = reports.createReportModel({ reportProfile:'full_coaching_report', client:{}, trainer:{}, latestAssessment:assessment(2), historicalAssessments:[assessment(2),assessment(1)], recommendations:[] });
  assert.ok(model.enabledSections.includes('history'));
  assert.ok(!model.enabledSections.includes('recommendations'));
});

test('priority findings sort pain before asymmetry and score one', () => {
  const cfg={fieldsById:{pain:{labelPl:'Ból',code:'pain'}},optionsById:{yes:{labelPl:'Ból'}}};
  const current={...assessment(1),statuses:[{testFieldId:'pain',answerOptionId:'yes',answerCode:'positive',side:'none'}]};
  const findings=reports.buildPriorityFindings(current,cfg);
  assert.equal(findings[0].type,'pain');
  assert.ok(findings.some(item=>item.type==='asymmetry'));
});

test('snapshot is a detached immutable input copy', () => {
  const model={client:{firstName:'Anna'},enabledSections:['report_header'],logoData:'data:image/png;base64,large',testItems:[{photos:[{storage_path:'p.jpg',dataUrl:'data:image/jpeg;base64,large'}]}]};
  const snapshot=reports.reportSnapshot(model);
  model.client.firstName='Ewa';
  assert.equal(snapshot.client.firstName,'Anna');
  assert.equal(snapshot.snapshotVersion,2);
  assert.equal(snapshot.logoData,undefined);
  assert.equal(snapshot.testItems[0].photos[0].dataUrl,undefined);
  assert.equal(snapshot.testItems[0].photos[0].storage_path,'p.jpg');
});

test('report test items map notes and real photos without placeholders', () => {
  const items=reports.buildTestItems({
    assessment:{answers:[],rawScores:{toe_touch:{left:1,right:2}},baseScores:{toe_touch:1},finalScores:{toe_touch:1}},
    tests:[{testId:'t1',code:'toe_touch',name:'Toe Touch'}],
    screenTests:[{screenTestId:'s1',testId:'t1',sortOrder:1,isActive:true}],
    notes:[{test_id:'t1',note:'Kompensacja po lewej'}],
    photos:[{test_id:'t1',dataUrl:'data:image/jpeg;base64,abc'}],
  });
  assert.equal(items[0].note,'Kompensacja po lewej');
  assert.equal(items[0].photos.length,1);
  assert.equal(items[0].asymmetry,true);
});

test('one-time extension is resolved and retained in snapshot', () => {
  const model=reports.createReportModel({reportProfile:'free_current_result',client:{},trainer:{},latestAssessment:assessment(2),historicalAssessments:[assessment(1),assessment(2)],enabledSections:['history']});
  assert.ok(model.enabledSections.includes('history'));
  assert.deepEqual(reports.reportSnapshot(model).requestedSections,['history']);
});

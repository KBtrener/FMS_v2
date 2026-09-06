const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const seed = JSON.parse(readFileSync(resolve(__dirname,"../FMS_Quick_Screen_Codex_Package/config/quick_screen_seed.json"),"utf8"));
const fixtures = JSON.parse(readFileSync(resolve(__dirname,"../FMS_Quick_Screen_Codex_Package/fixtures/assessment_fixtures.json"),"utf8"));
const core = require("../apps-script/02_Core.js");

function createHarness() {
  let counter = 0;
  const tables = {
    clients: fixtures.clients.map((client,index) => ({
      _row:index+2, client_id:client.clientId, first_name:client.firstName,
      last_name:client.lastName, email:client.email, is_archived:false,
      created_at:"2026-01-01T00:00:00.000Z",updated_at:"2026-01-01T00:00:00.000Z",
    })),
    assessments:[], assessment_answers:[], applied_effects:[], effect_rules:[],
  };
  const reindex = name => tables[name].forEach((row,index) => row._row=index+2);
  global.FMS_SEED = seed;
  global.FmsCore = core;
  global.FMS_SETTINGS = { timeZone:"Europe/Warsaw", ownerEmail:"info@kbtrener.pl" };
  global.Utilities = {
    getUuid:()=>String(++counter).padStart(12,"0"),
    formatDate:value=>value.toISOString().slice(0,10),
  };
  global.LockService = { getScriptLock:()=>({waitLock(){},releaseLock(){}}) };
  global.FmsDriveGuard = { assertOwner(){} };
  global.PropertiesService = { getScriptProperties:()=>({getProperty:()=>"sheet"}) };
  global.FMS_PROPERTIES = { spreadsheetId:"sheet" };
  global.FmsRepository = {
    nowIso:()=>"2026-09-06T12:00:00.000Z",
    bool:value=>value===true||String(value).toLowerCase()==="true",
    makeId:prefix=>`${prefix}-${String(++counter).padStart(12,"0")}`,
    currentSeed:()=>structuredClone(seed),
    rows:name=>tables[name].map(row=>({...row})),
    append(name,objects){objects.forEach(object=>tables[name].push({...object}));reindex(name);return null},
    updateRow(name,rowNumber,patch){Object.assign(tables[name][rowNumber-2],patch)},
    removeWhere(name,key,value){const removed=tables[name].filter(row=>String(row[key])===String(value));tables[name]=tables[name].filter(row=>String(row[key])!==String(value));reindex(name);return removed},
    initialize:()=>({spreadsheetId:"sheet"}),
  };
  delete require.cache[require.resolve("../apps-script/05_Services.js")];
  const services = require("../apps-script/05_Services.js");
  return { services, tables };
}

const answers = fixture => fixture.answers.map(([fieldCode,side,answerCode])=>({fieldCode,side,answerCode}));

test("AT-02 duplikat e-maila ostrzega, ale zapisuje klienta", () => {
  const {services,tables}=createHarness();
  const result=services.createClient({firstName:"Maria",lastName:"Test",email:"MARTA.NOWAK@example.test"});
  assert.match(result.duplicateWarning,/Istnieje/);
  assert.equal(tables.clients.length,4);
});

test("AT-03–05 zapis trzech badań buduje historię 9, 11, 11", () => {
  const {services}=createHarness();
  for(const fixture of fixtures.assessments.slice(0,3)) services.saveAssessment({clientId:"CL-0001",assessmentDate:fixture.assessmentDate,note:fixture.note,answers:answers(fixture)});
  const profile=services.getClientProfile("CL-0001",false);
  assert.deepEqual(profile.history.map(item=>item.total),[9,11,11]);
  assert.equal(profile.latestAssessment.totalScreenScore,11);
});

test("AT-12 korekta przelicza wynik i zapisuje notatkę", () => {
  const {services}=createHarness();
  const fixture=fixtures.assessments[0];
  let profile=services.saveAssessment({clientId:"CL-0001",assessmentDate:fixture.assessmentDate,note:fixture.note,answers:answers(fixture)});
  const saved=profile.latestAssessment;
  const corrected=saved.answers.map(answer=>answer.fieldCode==="rotation_score"&&answer.side==="right"?{...answer,answerCode:"score_2"}:answer);
  profile=services.updateAssessment(saved.assessmentId,{assessmentDate:saved.assessmentDate,note:saved.note,correctionNote:"Poprawiono zapis prawej rotacji.",answers:corrected});
  assert.equal(profile.latestAssessment.totalScreenScore,10);
  assert.equal(profile.latestAssessment.correctionNote,"Poprawiono zapis prawej rotacji.");
  assert.equal(profile.latestAssessment.updatedAt,"2026-09-06T12:00:00.000Z");
});

test("AT-13 archiwizacja usuwa badanie z historii i pozwala je przywrócić", () => {
  const {services}=createHarness();
  const saved=fixtures.assessments.slice(0,2).map(fixture=>services.saveAssessment({clientId:"CL-0001",assessmentDate:fixture.assessmentDate,note:fixture.note,answers:answers(fixture)}).latestAssessment.assessmentId);
  services.archiveAssessment(saved[1]);
  assert.deepEqual(services.getClientProfile("CL-0001",false).history.map(item=>item.total),[9]);
  services.restoreAssessment(saved[1]);
  assert.deepEqual(services.getClientProfile("CL-0001",false).history.map(item=>item.total),[9,11]);
});

test("AT-14 raport zawiera pełne statusy i neutralne zmiany", () => {
  const {services}=createHarness();
  for(const fixture of fixtures.assessments.slice(0,3)) services.saveAssessment({clientId:"CL-0001",assessmentDate:fixture.assessmentDate,note:fixture.note,answers:answers(fixture)});
  global.FmsServices=services;
  delete require.cache[require.resolve("../apps-script/06_Report.js")];
  const report=require("../apps-script/06_Report.js").generateReportData("CL-0001");
  assert.deepEqual(report.history.map(item=>item.total),[9,11,11]);
  assert(report.statusTests.some(item=>item.values.every(value=>/Pass|Fail|Brak bólu|Ból/.test(value))));
  assert(report.changes.every(change=>Number.isInteger(change.from)&&Number.isInteger(change.to)));
});

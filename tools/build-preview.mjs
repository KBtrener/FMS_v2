import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const core = require("../apps-script/02_Core.js");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "apps-script");
const seed = JSON.parse(readFileSync(resolve(root, "FMS_Quick_Screen_Codex_Package/config/quick_screen_seed.json"), "utf8"));
const fixtures = JSON.parse(readFileSync(resolve(root, "FMS_Quick_Screen_Codex_Package/fixtures/assessment_fixtures.json"), "utf8"));
const index = core.indexSeed(seed);
const assessments = fixtures.assessments.slice(0, 3).map(fixture => {
  const answers = fixture.answers.map(([fieldCode, side, answerCode]) => ({ fieldCode, side, answerCode }));
  const result = core.calculateAssessment(answers, seed);
  return {
    assessmentId: fixture.assessmentId, clientId: fixture.clientId,
    assessmentDate: fixture.assessmentDate, note: fixture.note, status: "completed",
    correctionNote: "", answers, rawScores: result.rawScores, baseScores: result.baseScores,
    finalScores: result.finalScores, totalScreenScore: result.totalScreenScore,
    statuses: result.statuses, appliedEffects: result.appliedEffects,
  };
});
const client = { clientId:"CL-0001", firstName:"Marta", lastName:"Nowak", email:"marta.nowak@example.test", isArchived:false };
const history = core.buildHistory(assessments);
const profile = { client, latestAssessment:assessments[2], assessments:assessments.slice().reverse(), history };
const clients = [{...client,lastAssessmentDate:"2026-06-10",lastTotalScreenScore:11},
  {clientId:"CL-0002",firstName:"Jan",lastName:"Kowalski",email:"jan.kowalski@example.test",isArchived:false,lastAssessmentDate:"2026-06-11",lastTotalScreenScore:15},
  {clientId:"CL-0003",firstName:"Piotr",lastName:"Zieliński",email:"piotr.zielinski@example.test",isArchived:false,lastAssessmentDate:"2026-06-12",lastTotalScreenScore:9}];

const mock = `<script>
const MOCK_SEED=${JSON.stringify(seed)};
const MOCK_CLIENTS=${JSON.stringify(clients)};
const MOCK_PROFILE=${JSON.stringify(profile)};
const MOCK_API={
  getInitialConfiguration:()=>({appName:"FMS Quick Screen",ownerEmail:"info@kbtrener.pl",initialized:true,seed:MOCK_SEED}),
  searchClients:(query)=>MOCK_CLIENTS.filter(c=>!query||JSON.stringify(c).toLowerCase().includes(String(query).toLowerCase())),
  getClientProfile:()=>MOCK_PROFILE,
  startAssessment:()=>({clientId:"CL-0001",assessmentDate:"2026-09-06",seed:MOCK_SEED}),
  getAdminConfiguration:()=>({tests:MOCK_SEED.tests,effectRules:[...MOCK_SEED.effectRules,...MOCK_SEED.demoOnlyEffectRules]}),
  generateReportData:()=>({client:MOCK_PROFILE.client,latest:MOCK_PROFILE.latestAssessment,assessments:[...MOCK_PROFILE.assessments].reverse(),history:MOCK_PROFILE.history,changes:[],numericTests:[['toe_touch','Toe Touch'],['shoulder_mobility','Shoulder Mobility'],['rotation','Rotation'],['balance','Balance'],['squat','Squat']].map(x=>({code:x[0],name:x[1]})),statusTests:[]})
};
function mockRunner(success,failure){return new Proxy({}, {get(_,key){if(key==='withSuccessHandler')return fn=>mockRunner(fn,failure);if(key==='withFailureHandler')return fn=>mockRunner(success,fn);return(...args)=>Promise.resolve().then(()=>{if(!MOCK_API[key])throw new Error('Podgląd: brak '+key);return MOCK_API[key](...args)}).then(success,failure)}})}
window.google={script:{run:mockRunner(()=>{},console.error)}};
</script>`;

let html = readFileSync(resolve(source, "Index.html"), "utf8");
html = html.replace("<?!= include('Styles'); ?>", readFileSync(resolve(source, "Styles.html"), "utf8"));
html = html.replace("<?!= include('App'); ?>", mock + readFileSync(resolve(source, "App.html"), "utf8"));
mkdirSync(resolve(root, "preview"), { recursive:true });
writeFileSync(resolve(root, "preview/index.html"), html, "utf8");
console.log("Generated preview/index.html");

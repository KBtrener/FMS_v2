import { readFile, mkdir, writeFile } from 'node:fs/promises';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { createFmsPdfDefinition } from '../web/pdf-report.js';

const dataUrl=async(path,mime)=>`data:${mime};base64,${(await readFile(path)).toString('base64')}`;
pdfMake.addVirtualFileSystem(pdfFonts.pdfMake?.vfs||pdfFonts);
pdfMake.addVirtualFileSystem(Object.fromEntries(await Promise.all(['Inter-Regular.ttf','Inter-Bold.ttf','Outfit-Regular.ttf','Outfit-Bold.ttf'].map(async name=>[name,(await readFile(`web/assets/${name}`)).toString('base64')]))));
pdfMake.addFonts({Inter:{normal:'Inter-Regular.ttf',bold:'Inter-Bold.ttf',italics:'Inter-Regular.ttf',bolditalics:'Inter-Bold.ttf'},Outfit:{normal:'Outfit-Regular.ttf',bold:'Outfit-Bold.ttf',italics:'Outfit-Regular.ttf',bolditalics:'Outfit-Bold.ttf'}});

const names=['Cervical Flexion','Cervical Rotation + Extension','Toe Touch','Shoulder Mobility','Shoulder Clearing','Active Straight Leg Raise','Rotary Stability','Spine Extension Clearing','Deep Squat'];
const toePhoto=await dataUrl('web/assets/toe-touch-instruction.jpg','image/jpeg');
const items=names.map((name,index)=>({index:index+1,testId:`t${index+1}`,code:`test_${index+1}`,name,description:'Ocena jakości podstawowego wzorca ruchowego, zakresu, symetrii i obecności kompensacji podczas standaryzowanej procedury.',criteria:'Kryteria zgodne z aktualną wersją manuala.',finalScore:index===4?0:index===2?1:2,baseScore:index===4?2:index===2?1:2,rawScores:index%2?{left:2,right:index===3?1:2}:{},answers:index===4?[{field:'Objawy bólowe',side:'right',value:'Jest'}]:[],status:index===4?{level:'pain',label:'Ból / red flag',icon:'!'}:index===2?{level:'attention',label:'Uwaga',icon:'!'}:{level:'pass',label:'W normie',icon:'✓'},asymmetry:index===3,note:index===2?'Widoczna kompensacja w końcowej fazie ruchu.':index===4?'Ból po stronie prawej - przerwano próbę.':'',photos:index===2?[{dataUrl:toePhoto}]:[]}));
const assessment=date=>({assessmentDate:date,rawScores:Object.fromEntries(items.map(x=>[x.code,x.rawScores])),finalScores:Object.fromEntries(items.map(x=>[x.code,x.finalScore]))});
const report={logoData:await dataUrl('web/assets/kb-logo.png','image/png'),enabledSections:['report_header','executive_summary','latest_assessment','priority_findings','test_descriptions','history','recommendations','methodology','trainer_signature'],reportProfile:'full_coaching_report',generatorVersion:'3.0.0',manualVersion:'FMS Quick Screen V2',client:{firstName:'Gaweł',lastName:'Kot',email:'gawel.kot@example.com'},trainer:{name:'Karol Bilecki'},clientDisciplines:[{discipline:'Piłka nożna'}],trainerCertifications:[{name:'FMS Level 2'}],latest:{assessmentDate:'2026-09-08',totalScreenScore:10},testItems:items,priorityFindings:[{severity:'pain',type:'pain',title:'Shoulder Clearing',detail:'Ból po prawej stronie'},{severity:'attention',type:'asymmetry',title:'Asymetria',detail:'Shoulder Mobility'},{severity:'attention',type:'score_1',title:'Wynik 1',detail:'Toe Touch'}],assessments:[assessment('2026-06-08'),assessment('2026-09-08')],numericTests:items.slice(0,5).map(x=>({code:x.code,name:x.name})),recommendations:[{category:'Mobilność',content:'Praca nad kontrolą wzorca bez prowokowania bólu.',frequency:'3 razy w tygodniu',duration:'4 tygodnie'}]};
const buffer=await pdfMake.createPdf(createFmsPdfDefinition(report)).getBuffer();
await mkdir('output/pdf',{recursive:true});
await writeFile('output/pdf/fms-report-visual-check.pdf',Buffer.from(buffer));
console.log('output/pdf/fms-report-visual-check.pdf');

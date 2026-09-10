import { loadManualDescriptions, DESCRIPTION_VERSION } from './manual-descriptions.mjs';

const descriptions = loadManualDescriptions();
const expectedCodes = ['cervical_flexion', 'cervical_rotation_extension', 'neck_extension_clearing', 'toe_touch', 'shoulder_mobility', 'shoulder_clearing', 'rotation', 'balance', 'squat', 'spine_extension_clearing'];
const actual = new Set(descriptions.map(item => item.testCode));
if (descriptions.length !== expectedCodes.length * 2 || expectedCodes.some(code => !actual.has(code))) {
  throw new Error(`Niepełny katalog opisów testów: znaleziono ${descriptions.length} rekordów.`);
}
for (const item of descriptions) {
  for (const field of ['purpose', 'procedure', 'scoringCriteria', 'reportDescription', 'sourceReference']) {
    if (!item[field]?.trim()) throw new Error(`Brak pola ${field} dla ${item.testCode}/${item.locale}.`);
  }
}
console.log(`Descriptions valid: ${descriptions.length} records, manual ${DESCRIPTION_VERSION}`);

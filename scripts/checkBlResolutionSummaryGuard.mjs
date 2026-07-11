import { getBlResolutionSummaryErrors } from './blResolutionSummaryGuard.mjs';

const validSummary = [
  'BL resolution readiness audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'package.json resolution: 6.1.6',
  'Installed bl version: 6.1.6',
  "require('bl') type: function",
  'Latest bl version: 7.0.6',
  'Latest bl node engine: >=20',
  'Latest bl package type: module',
  'Latest bl CommonJS require export: no',
  'Latest bl package.json subpath export: no',
  'Latest bl package.json subpath error: ERR_PACKAGE_PATH_NOT_EXPORTED',
  'Latest bl bare CJS require: failed',
  'Latest bl bare CJS require type: none',
  'Latest bl bare CJS require keys: none',
  'Latest bl bare CJS require default type: none',
  'Latest bl bare CJS require error: ERR_PACKAGE_PATH_NOT_EXPORTED',
  'Latest bl bare ESM import: ok',
  'Latest bl bare ESM import default type: function',
  'Latest bl bare ESM import keys: BufferList,BufferListStream,default,isBufferList',
  'Latest bl bare ESM import error: none',
  'Latest bl target blocked: yes',
  'CommonJS/transitive consumers: 2',
  '- levelup: require ok',
  '- ora: require ok',
  'Compatibility errors: 0',
  'Required action: keep bl on the CommonJS-compatible 6.1.6 resolution until levelup/ora and other transitive consumers are proven compatible with the bl 7 ESM/import-only export map and missing bare CJS/package.json exports.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getBlResolutionSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getBlResolutionSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid BL resolution readiness fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('BL resolution readiness audit', 'Bad header'), 'summary header');
assertRejected('Wrong resolution fixture', validSummary.replace('package.json resolution: 6.1.6', 'package.json resolution: 7.0.6'), '6.1.6');
assertRejected('Wrong require type fixture', validSummary.replace("require('bl') type: function", "require('bl') type: object"), 'must return a function');
assertRejected('Wrong latest package type fixture', validSummary.replace('Latest bl package type: module', 'Latest bl package type: commonjs'), 'ESM-only line');
assertRejected('Require export fixture', validSummary.replace('Latest bl CommonJS require export: no', 'Latest bl CommonJS require export: yes'), 'CommonJS require export');
assertRejected('Package JSON export fixture', validSummary.replace('Latest bl package.json subpath export: no', 'Latest bl package.json subpath export: yes'), 'package.json subpath export');
assertRejected('CJS require success fixture', validSummary.replace('Latest bl bare CJS require: failed', 'Latest bl bare CJS require: ok'), 'bare CJS require');
assertRejected('ESM import failure fixture', validSummary.replace('Latest bl bare ESM import: ok', 'Latest bl bare ESM import: failed'), 'bare ESM import');
assertRejected('ESM import default fixture', validSummary.replace('Latest bl bare ESM import default type: function', 'Latest bl bare ESM import default type: object'), 'default type');
assertRejected('Missing consumer fixture', validSummary.replace('- levelup: require ok\n', ''), 'levelup');
assertRejected('Unblocked latest fixture', validSummary.replace('Latest bl target blocked: yes', 'Latest bl target blocked: no'), 'must stay blocked');

console.log('BL resolution readiness summary guard checks are valid.');

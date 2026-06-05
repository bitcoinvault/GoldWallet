import { getBlResolutionSummaryErrors } from './blResolutionSummaryGuard.mjs';

const validSummary = [
  'BL resolution readiness audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'package.json resolution: 6.1.6',
  'Installed bl version: 6.1.6',
  "require('bl') type: function",
  'Latest bl version: 7.0.3',
  'Latest bl node engine: >=20',
  'Latest bl package type: module',
  'Latest bl CommonJS require export: no',
  'Latest bl target blocked: yes',
  'CommonJS/transitive consumers: 2',
  '- levelup: require ok',
  '- ora: require ok',
  'Compatibility errors: 0',
  'Required action: keep bl on the CommonJS-compatible 6.1.6 resolution until levelup/ora and other transitive consumers are proven compatible with the bl 7 ESM/import-only export map.',
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
assertRejected('Wrong resolution fixture', validSummary.replace('package.json resolution: 6.1.6', 'package.json resolution: 7.0.3'), '6.1.6');
assertRejected('Wrong require type fixture', validSummary.replace("require('bl') type: function", "require('bl') type: object"), 'must return a function');
assertRejected('Wrong latest package type fixture', validSummary.replace('Latest bl package type: module', 'Latest bl package type: commonjs'), 'ESM-only line');
assertRejected('Require export fixture', validSummary.replace('Latest bl CommonJS require export: no', 'Latest bl CommonJS require export: yes'), 'CommonJS require export');
assertRejected('Missing consumer fixture', validSummary.replace('- levelup: require ok\n', ''), 'levelup');
assertRejected('Unblocked latest fixture', validSummary.replace('Latest bl target blocked: yes', 'Latest bl target blocked: no'), 'must stay blocked');

console.log('BL resolution readiness summary guard checks are valid.');

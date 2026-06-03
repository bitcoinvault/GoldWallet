import { getNodeFetchResolutionSummaryErrors } from './nodeFetchResolutionSummaryGuard.mjs';

const validSummary = [
  'Node fetch resolution audit',
  'Generated at: 2026-06-03T00:00:00.000Z',
  'package.json resolution: 2.7.0',
  'Installed node-fetch version: 2.7.0',
  "require('node-fetch') type: function",
  'Default export present: yes',
  'Latest node-fetch version: 3.3.2',
  'Latest node-fetch package type: module',
  'Latest node-fetch target blocked: yes',
  'CommonJS/transitive consumers: 2',
  '- gaxios: require ok',
  '- isomorphic-fetch: require ok',
  'Compatibility errors: 0',
  'Secret values printed: no',
  'Required action: keep node-fetch on the CommonJS 2.7.0 resolution until all transitive consumers are proven compatible with ESM-only node-fetch v3.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getNodeFetchResolutionSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getNodeFetchResolutionSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid node-fetch resolution fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('Node fetch resolution audit', 'Bad header'), 'summary header');
assertRejected('Wrong resolution fixture', validSummary.replace('package.json resolution: 2.7.0', 'package.json resolution: 3.3.2'), '2.7.0');
assertRejected('Wrong require type fixture', validSummary.replace("require('node-fetch') type: function", "require('node-fetch') type: object"), 'must return a function');
assertRejected('Missing consumer fixture', validSummary.replace('- gaxios: require ok\n', ''), 'gaxios');
assertRejected('Unblocked latest fixture', validSummary.replace('Latest node-fetch target blocked: yes', 'Latest node-fetch target blocked: no'), 'must stay blocked');
assertRejected('Secret fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');

console.log('Node fetch resolution summary guard checks are valid.');

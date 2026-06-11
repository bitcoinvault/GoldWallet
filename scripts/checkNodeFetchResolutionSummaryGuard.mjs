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
  'Latest node-fetch main: ./src/index.js',
  'Latest node-fetch CommonJS require export: no',
  'Latest node-fetch target blocked: yes',
  'CommonJS/transitive consumers: 2',
  '- gaxios: require ok',
  '- isomorphic-fetch: require ok',
  'Consumer file evidence: 2',
  '- gaxios: dynamic import compatible (node_modules/gaxios/build/cjs/src/gaxios.js)',
  '- isomorphic-fetch: CommonJS require blocker (node_modules/isomorphic-fetch/fetch-npm-node.js)',
  'Transitive blocker chain: 5',
  '- react-native-snap-carousel: 3.9.1 (expected 3.9.1)',
  '- react-addons-shallow-compare: 15.6.2 (expected 15.6.2)',
  '- fbjs: 0.8.17 (expected 0.8.17)',
  '- isomorphic-fetch: 2.2.1 (expected 2.2.1)',
  '- node-fetch: 2.7.0 (expected 2.7.0)',
  'Compatibility errors: 0',
  'Secret values printed: no',
  'Required action: keep node-fetch on the CommonJS 2.7.0 resolution until all transitive consumers are proven compatible with the ESM-only node-fetch v3 package entry.',
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
assertRejected('Wrong latest main fixture', validSummary.replace('Latest node-fetch main: ./src/index.js', 'Latest node-fetch main: ./index.cjs'), 'ESM package entry');
assertRejected('Require export fixture', validSummary.replace('Latest node-fetch CommonJS require export: no', 'Latest node-fetch CommonJS require export: yes'), 'CommonJS require export');
assertRejected('Missing consumer fixture', validSummary.replace('- gaxios: require ok\n', ''), 'gaxios');
assertRejected(
  'Missing consumer evidence fixture',
  validSummary.replace('- isomorphic-fetch: CommonJS require blocker (node_modules/isomorphic-fetch/fetch-npm-node.js)\n', ''),
  'isomorphic-fetch',
);
assertRejected(
  'Missing transitive blocker fixture',
  validSummary.replace('- react-native-snap-carousel: 3.9.1 (expected 3.9.1)\n', ''),
  'react-native-snap-carousel',
);
assertRejected('Unblocked latest fixture', validSummary.replace('Latest node-fetch target blocked: yes', 'Latest node-fetch target blocked: no'), 'must stay blocked');
assertRejected('Secret fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');

console.log('Node fetch resolution summary guard checks are valid.');

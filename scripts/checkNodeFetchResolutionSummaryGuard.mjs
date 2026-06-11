import { getNodeFetchResolutionSummaryErrors } from './nodeFetchResolutionSummaryGuard.mjs';

const validSummary = [
  'Node fetch resolution audit',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'package.json resolution: <missing>',
  'Installed node-fetch version: 3.3.2',
  "require('node-fetch') type: object",
  "require('node-fetch').default type: function",
  "import('node-fetch').default type: function",
  'Latest node-fetch version: 3.3.2',
  'Latest node-fetch package type: module',
  'Latest node-fetch main: ./src/index.js',
  'Latest node-fetch CommonJS require export: no',
  'Latest node-fetch target blocked: no',
  'CommonJS/transitive consumers: 1',
  '- gaxios: require ok',
  'Consumer file evidence: 1',
  '- gaxios: dynamic import compatible (node_modules/gaxios/build/cjs/src/gaxios.js)',
  'Removed transitive blocker chain: 4',
  '- react-native-snap-carousel: <missing>',
  '- react-addons-shallow-compare: <missing>',
  '- fbjs: <missing>',
  '- isomorphic-fetch: <missing>',
  'Compatibility errors: 0',
  'Secret values printed: no',
  'Required action: keep node-fetch on the latest ESM v3 package entry and keep the old snap-carousel/isomorphic-fetch chain removed.',
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

assertAccepted('Valid node-fetch v3 resolution fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('Node fetch resolution audit', 'Bad header'), 'summary header');
assertRejected('Wrong resolution fixture', validSummary.replace('package.json resolution: <missing>', 'package.json resolution: 2.7.0'), 'removed');
assertRejected('Wrong installed version fixture', validSummary.replace('Installed node-fetch version: 3.3.2', 'Installed node-fetch version: 2.7.0'), '3.3.2');
assertRejected('Wrong require type fixture', validSummary.replace("require('node-fetch') type: object", "require('node-fetch') type: function"), 'module namespace');
assertRejected('Wrong require default fixture', validSummary.replace("require('node-fetch').default type: function", "require('node-fetch').default type: object"), 'default');
assertRejected('Wrong import default fixture', validSummary.replace("import('node-fetch').default type: function", "import('node-fetch').default type: object"), 'default');
assertRejected('Require export fixture', validSummary.replace('Latest node-fetch CommonJS require export: no', 'Latest node-fetch CommonJS require export: yes'), 'CommonJS require export');
assertRejected('Blocked latest fixture', validSummary.replace('Latest node-fetch target blocked: no', 'Latest node-fetch target blocked: yes'), 'unblocked');
assertRejected('Missing gaxios fixture', validSummary.replace('- gaxios: require ok\n', ''), 'gaxios');
assertRejected(
  'isomorphic-fetch consumer fixture',
  validSummary.replace('CommonJS/transitive consumers: 1\n- gaxios: require ok', 'CommonJS/transitive consumers: 2\n- gaxios: require ok\n- isomorphic-fetch: require ok'),
  'isomorphic-fetch',
);
assertRejected(
  'Missing removed blocker fixture',
  validSummary.replace('- react-native-snap-carousel: <missing>\n', ''),
  'react-native-snap-carousel',
);
assertRejected('Secret fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');

console.log('Node fetch resolution summary guard checks are valid.');

import { getNodeRuntimeVersionErrors } from './nodeRuntimeVersion.mjs';

const assertAccepted = (label, fixture) => {
  const errors = getNodeRuntimeVersionErrors(fixture);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, got:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, fixture, expectedSnippet) => {
  const errors = getNodeRuntimeVersionErrors(fixture);

  if (!errors.some(error => error.includes(expectedSnippet))) {
    console.error(`${label} should be rejected with "${expectedSnippet}", got:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('matching node runtime', {
  actualVersion: 'v24.16.0',
  expectedVersion: '24.16.0',
});

assertRejected(
  'wrong node runtime',
  {
    actualVersion: 'v22.18.0',
    expectedVersion: '24.16.0',
  },
  'does not match .nvmrc',
);

assertRejected(
  'missing expected runtime',
  {
    actualVersion: 'v24.16.0',
    expectedVersion: '',
  },
  'Expected Node version',
);

console.log('Node runtime version guard checks are valid.');

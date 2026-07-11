import {
  expectedElectrumEnvFiles,
  getElectrumEndpointReadinessSummaryErrors,
  parseEndpointEntry,
} from './electrumEndpointReadinessSummaryGuard.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const entry = ({ env, endpoint, protocol = 'tls', status = 'ready', authorized = 'yes', expiresInDays = '30' }) =>
  [
    `env=${env}`,
    'network=bitcoinvault',
    'environment=production',
    `endpoint=${endpoint}`,
    `protocol=${protocol}`,
    `status=${status}`,
    `authorized=${authorized}`,
    'authorization_error=none',
    'valid_from=Jan 01 00:00:00 2026 GMT',
    'valid_to=Aug 01 00:00:00 2026 GMT',
    `expires_in_days=${expiresInDays}`,
    'fingerprint256=AA:BB:CC',
  ].join('; ');

const entries = [
  entry({
    env: '.env.dev.testnet',
    endpoint: 'electrumx.testnet.btcv.stage.rnd.land:443',
    status: 'certificate-expired',
    authorized: 'no',
    expiresInDays: '-18',
  }),
  entry({ env: '.env.stage.mainnet', endpoint: 'electrumx-mainnet1.bitcoinvault.global:443' }),
  entry({ env: '.env.stage.mainnet', endpoint: 'electrumx-mainnet2.bitcoinvault.global:443' }),
  entry({ env: '.env.prod.mainnet', endpoint: 'electrumx-mainnet1.bitcoinvault.global:443' }),
  entry({ env: '.env.prod.mainnet', endpoint: 'electrumx-mainnet2.bitcoinvault.global:443' }),
  entry({
    env: '.env.beta.testnet',
    endpoint: 'electrumx.testnet.btcv.stage.rnd.land:443',
    status: 'certificate-expired',
    authorized: 'no',
    expiresInDays: '-18',
  }),
  entry({ env: '.env.beta.mainnet', endpoint: 'electrumx-mainnet1.bitcoinvault.global:443' }),
  entry({ env: '.env.beta.mainnet', endpoint: 'electrumx-mainnet2.bitcoinvault.global:443' }),
];

const validSummary = [
  'Electrum endpoint readiness audit',
  'Generated at: 2026-07-11T20:00:00.000Z',
  `Env files scanned: ${expectedElectrumEnvFiles.length}`,
  `Electrum endpoint entries: ${entries.length}`,
  'Unique endpoints: 3',
  'Ready entries: 6',
  'Certificate expired entries: 2',
  'TLS authorization error entries: 0',
  'Connection error entries: 0',
  'Unsupported protocol entries: 0',
  'Missing config entries: 0',
  'Secret values printed: no',
  'Required action: renew or fix expired Electrum TLS certificates, then rerun release smoke.',
  '',
  'Endpoint entries:',
  ...entries.map(line => `- ${line}`),
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getElectrumEndpointReadinessSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getElectrumEndpointReadinessSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Electrum endpoint readiness fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('Electrum endpoint readiness audit', 'Other audit'), 'summary header');
assertRejected('Mismatched count fixture', validSummary.replace('Electrum endpoint entries: 8', 'Electrum endpoint entries: 7'), 'but listed 8');
assertRejected('Secret fixture', `${validSummary}\nSENTRY_AUTH_TOKEN=secret`, 'secret-looking values');
assertRejected(
  'Missing env fixture',
  validSummary.replace('- env=.env.beta.testnet; ', '- env=.env.other; '),
  'missing env file .env.beta.testnet',
);
assertRejected('Invalid status fixture', validSummary.replace('status=ready', 'status=unknown'), 'status is invalid');
assertAccepted(
  'Unsupported protocol fixture',
  validSummary
    .replace('Ready entries: 6', 'Ready entries: 5')
    .replace('Unsupported protocol entries: 0', 'Unsupported protocol entries: 1')
    .replace('protocol=tls; status=ready; authorized=yes', 'protocol=ssl; status=unsupported-protocol; authorized=not-applicable'),
);
assertRejected(
  'Invalid protocol fixture',
  validSummary.replace('protocol=tls; status=ready', 'protocol=ssl; status=ready'),
  'unsupported protocol with unsupported-protocol status',
);
assertRejected(
  'Missing renew action fixture',
  validSummary.replace('Required action: renew or fix expired Electrum TLS certificates, then rerun release smoke.', 'Required action: none.'),
  'renew/fix required action',
);

const parsed = parseEndpointEntry(entries[0]);
assert(parsed.get('env') === '.env.dev.testnet', 'parseEndpointEntry must read env');
assert(parsed.get('status') === 'certificate-expired', 'parseEndpointEntry must read status');
assert(parsed.get('expires_in_days') === '-18', 'parseEndpointEntry must read expires_in_days');

console.log('Electrum endpoint readiness guard checks are valid.');

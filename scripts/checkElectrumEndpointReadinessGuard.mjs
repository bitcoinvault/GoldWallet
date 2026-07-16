import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  classifyElectrumTlsStatus,
  expectedElectrumEnvFiles,
  getElectrumEndpointReadinessSummaryErrors,
  parseEndpointEntry,
} from './electrumEndpointReadinessSummaryGuard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const expectedTlsStatuses = [
  [{ authorized: true, expiresInDays: '-1' }, 'certificate-expired'],
  [{ authorized: false, expiresInDays: '21' }, 'tls-authorization-error'],
  [{ authorized: true, expiresInDays: 'not-applicable' }, 'tls-authorization-error'],
  [{ authorized: true, expiresInDays: '' }, 'tls-authorization-error'],
  [{ authorized: true, expiresInDays: null }, 'tls-authorization-error'],
  [{ authorized: true, expiresInDays: '0' }, 'certificate-expiring'],
  [{ authorized: true, expiresInDays: '30' }, 'certificate-expiring'],
  [{ authorized: true, expiresInDays: '31' }, 'ready'],
];

expectedTlsStatuses.forEach(([input, expected]) => {
  assert(
    classifyElectrumTlsStatus(input) === expected,
    `TLS status for ${JSON.stringify(input)} must be ${expected}`,
  );
});

const entry = ({ env, endpoint, protocol = 'tls', status = 'ready', authorized = 'yes', expiresInDays = '45' }) =>
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
  entry({ env: '.env.stage.mainnet', endpoint: 'electrumx-mainnet1.bitcoinvault.global:443', status: 'certificate-expiring', expiresInDays: '21' }),
  entry({ env: '.env.stage.mainnet', endpoint: 'electrumx-mainnet2.bitcoinvault.global:443', status: 'certificate-expiring', expiresInDays: '21' }),
  entry({ env: '.env.prod.mainnet', endpoint: 'electrumx-mainnet1.bitcoinvault.global:443', status: 'certificate-expiring', expiresInDays: '21' }),
  entry({ env: '.env.prod.mainnet', endpoint: 'electrumx-mainnet2.bitcoinvault.global:443', status: 'certificate-expiring', expiresInDays: '21' }),
  entry({
    env: '.env.beta.testnet',
    endpoint: 'electrumx.testnet.btcv.stage.rnd.land:443',
    status: 'certificate-expired',
    authorized: 'no',
    expiresInDays: '-18',
  }),
  entry({ env: '.env.beta.mainnet', endpoint: 'electrumx-mainnet1.bitcoinvault.global:443', status: 'certificate-expiring', expiresInDays: '21' }),
  entry({ env: '.env.beta.mainnet', endpoint: 'electrumx-mainnet2.bitcoinvault.global:443', status: 'certificate-expiring', expiresInDays: '21' }),
];

const validSummary = [
  'Electrum endpoint readiness audit',
  'Generated at: 2026-07-11T20:00:00.000Z',
  `Env files scanned: ${expectedElectrumEnvFiles.length}`,
  `Electrum endpoint entries: ${entries.length}`,
  'Unique endpoints: 3',
  'Certificate warning threshold days: 30',
  'Ready entries: 0',
  'Certificate expired entries: 2',
  'Certificate expiring entries: 6',
  'Unique expired endpoints: 1',
  'Unique expiring endpoints: 2',
  'Release gate ready: no',
  'Release gate blocking entries: 8',
  'Release gate blocking unique endpoints: 3',
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
assert(
  packageJson.scripts['electrum:endpoint-readiness:release-gate'] ===
    'node scripts/auditElectrumEndpointReadiness.mjs --require-ready',
  'package.json must expose the strict Electrum endpoint release gate',
);
assert(
  read('scripts/auditElectrumEndpointReadiness.mjs').includes("process.argv.includes('--require-ready')"),
  'Electrum endpoint audit must support --require-ready',
);
assertRejected(
  'Missing release gate readiness fixture',
  validSummary.replace('Release gate ready: no\n', ''),
  'Release gate ready',
);
assertRejected(
  'Mismatched release gate blocker count fixture',
  validSummary.replace('Release gate blocking entries: 8', 'Release gate blocking entries: 7'),
  'Release gate blocking entries count',
);
assertRejected('Missing header fixture', validSummary.replace('Electrum endpoint readiness audit', 'Other audit'), 'summary header');
assertRejected('Mismatched count fixture', validSummary.replace('Electrum endpoint entries: 8', 'Electrum endpoint entries: 7'), 'but listed 8');
assertRejected('Secret fixture', `${validSummary}\nSENTRY_AUTH_TOKEN=secret`, 'secret-looking values');
assertRejected(
  'Missing env fixture',
  validSummary.replace('- env=.env.beta.testnet; ', '- env=.env.other; '),
  'missing env file .env.beta.testnet',
);
assertRejected(
  'Invalid status fixture',
  validSummary.replace('status=certificate-expiring', 'status=unknown'),
  'status is invalid',
);
assertRejected(
  'Expiring certificate above threshold fixture',
  validSummary.replace(
    'status=certificate-expiring; authorized=yes; authorization_error=none; valid_from=Jan 01 00:00:00 2026 GMT; valid_to=Aug 01 00:00:00 2026 GMT; expires_in_days=21',
    'status=certificate-expiring; authorized=yes; authorization_error=none; valid_from=Jan 01 00:00:00 2026 GMT; valid_to=Aug 01 00:00:00 2026 GMT; expires_in_days=31',
  ),
  'certificate-expiring status must be within the warning threshold',
);
assertRejected(
  'Warning threshold drift fixture',
  validSummary.replace('Certificate warning threshold days: 30', 'Certificate warning threshold days: 29'),
  'Certificate warning threshold days must be 30',
);
assertRejected(
  'Unauthorized expiring certificate fixture',
  validSummary.replace('status=certificate-expiring; authorized=yes', 'status=certificate-expiring; authorized=no'),
  'certificate-expiring TLS status must be authorized',
);
assertAccepted(
  'Unsupported protocol fixture',
  validSummary
    .replace('Certificate expiring entries: 6', 'Certificate expiring entries: 5')
    .replace('Unsupported protocol entries: 0', 'Unsupported protocol entries: 1')
    .replace('protocol=tls; status=certificate-expiring; authorized=yes', 'protocol=ssl; status=unsupported-protocol; authorized=not-applicable'),
);
assertRejected(
  'Invalid protocol fixture',
  validSummary.replace('protocol=tls; status=certificate-expiring', 'protocol=ssl; status=certificate-expiring'),
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

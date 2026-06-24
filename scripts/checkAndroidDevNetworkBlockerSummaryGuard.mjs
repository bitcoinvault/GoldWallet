import { getAndroidDevNetworkBlockerSummaryErrors } from './androidDevNetworkBlockerSummaryGuard.mjs';

const fail = message => {
  console.error(`Android dev network blocker summary guard failed: ${message}`);
  process.exit(1);
};

const assert = (condition, message) => {
  if (!condition) {
    fail(message);
  }
};

const validSummary = [
  'Android dev network blocker audit',
  'Generated at: 2026-06-24T18:00:00.000Z',
  'Full dev smoke summary present: yes',
  'Full dev smoke outcome: failed',
  'Full dev smoke reason: UI hierarchy is missing expected text(s): Wallets, No wallets, Create new wallet, Import wallet',
  'No-network dev smoke summary present: yes',
  'No-network dev smoke outcome: passed',
  'No-network dev smoke expected UI: No network',
  'No-network dev smoke summary valid: yes',
  'No-network dev smoke summary errors: 0',
  'Dev log present: yes',
  'Dev log path: D:\\GoldWallet\\local-docs\\android-smoke-dev.log',
  'Dev log bytes: 12345',
  'Dev log sha256: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  'SSL handshake exception lines: 4',
  'Certificate expired exception lines: 4',
  'TCP socket exception lines: 4',
  'Dev/testnet Electrum endpoint: electrumx.testnet.btcv.stage.rnd.land:443 tls',
  'Certificate expired at: Tue Jun 23 16:52:40 GMT 2026',
  'Certificate compared at sample: Wed Jun 24 19:58:50 GMT 2026',
  'No-network UI proof ready: yes',
  'Expired certificate evidence ready: yes',
  'Reduced no-network smoke is full dev proof: no',
  'Android dev smoke gate remains blocked: yes',
  'Dev blocker outcome: blocked-by-electrum-certificate-expired',
  'Secret values printed: no',
  'Required action: renew or fix the dev/testnet Electrum TLS certificate for electrumx.testnet.btcv.stage.rnd.land:443 tls, then rerun android:dev:smoke:embedded and Camera/QR validation.',
  '',
  'Blocker evidence lines:',
  '06-24 19:58:50.108 E TcpSockets: javax.net.ssl.SSLHandshakeException: Chain validation failed',
  '06-24 19:58:50.108 E TcpSockets: Caused by: java.security.cert.CertificateExpiredException: Certificate expired at Tue Jun 23 16:52:40 GMT 2026',
  '',
].join('\n');

const validErrors = getAndroidDevNetworkBlockerSummaryErrors(validSummary);
assert(validErrors.length === 0, `valid summary should pass, received: ${validErrors.join('; ')}`);

const passedFullSmoke = validSummary.replace('Full dev smoke outcome: failed', 'Full dev smoke outcome: passed');
const passedFullSmokeErrors = getAndroidDevNetworkBlockerSummaryErrors(passedFullSmoke);
assert(
  passedFullSmokeErrors.some(error => error.includes('Full dev smoke outcome must be failed')),
  'summary that claims full dev smoke passed should fail',
);

const missingNoNetworkProof = validSummary.replace('No-network UI proof ready: yes', 'No-network UI proof ready: no');
const missingNoNetworkProofErrors = getAndroidDevNetworkBlockerSummaryErrors(missingNoNetworkProof);
assert(
  missingNoNetworkProofErrors.some(error => error.includes('No-network UI proof ready must be yes')),
  'summary without no-network UI proof should fail',
);

const missingEndpoint = validSummary.replace(
  'Dev/testnet Electrum endpoint: electrumx.testnet.btcv.stage.rnd.land:443 tls',
  'Dev/testnet Electrum endpoint: <missing>:<missing> <missing>',
);
const missingEndpointErrors = getAndroidDevNetworkBlockerSummaryErrors(missingEndpoint);
assert(
  missingEndpointErrors.some(error => error.includes('Dev/testnet Electrum endpoint must be')),
  'summary without the configured Electrum endpoint should fail',
);

const incorrectlyClaimedFullProof = validSummary.replace(
  'Reduced no-network smoke is full dev proof: no',
  'Reduced no-network smoke is full dev proof: yes',
);
const incorrectlyClaimedFullProofErrors = getAndroidDevNetworkBlockerSummaryErrors(incorrectlyClaimedFullProof);
assert(
  incorrectlyClaimedFullProofErrors.some(error => error.includes('Reduced no-network smoke is full dev proof must be no')),
  'summary that treats reduced no-network smoke as full dev proof should fail',
);

const missingEvidenceLines = validSummary.replace('SSLHandshakeException', 'TcpSocketException');
const missingEvidenceLinesErrors = getAndroidDevNetworkBlockerSummaryErrors(missingEvidenceLines);
assert(
  missingEvidenceLinesErrors.some(error => error.includes('SSLHandshakeException evidence')),
  'summary without SSLHandshakeException evidence should fail',
);

console.log('Android dev network blocker summary guard checks are valid.');


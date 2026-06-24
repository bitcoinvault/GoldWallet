import { getAndroidReleaseNetworkBlockerSummaryErrors } from './androidReleaseNetworkBlockerSummaryGuard.mjs';

const fail = message => {
  console.error(`Android release network blocker summary guard failed: ${message}`);
  process.exit(1);
};

const assert = (condition, message) => {
  if (!condition) {
    fail(message);
  }
};

const validSummary = [
  'Android release network blocker audit',
  'Generated at: 2026-06-24T14:00:00.000Z',
  'Full release smoke summary present: yes',
  'Full release smoke outcome: failed',
  'Full release smoke reason: UI hierarchy is missing expected text(s): Wallets, No wallets, Create new wallet, Import wallet',
  'No-network release smoke summary present: yes',
  'No-network release smoke outcome: passed',
  'No-network release smoke expected UI: No network',
  'No-network release smoke summary valid: yes',
  'No-network release smoke summary errors: 0',
  'Release log present: yes',
  'Release log path: D:\\GoldWallet\\local-docs\\android-smoke-dev-release.log',
  'Release log bytes: 12345',
  'Release log sha256: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  'SSL handshake exception lines: 4',
  'Certificate expired exception lines: 4',
  'TCP socket exception lines: 4',
  'Certificate expired at: Tue Jun 23 16:52:40 GMT 2026',
  'Certificate compared at sample: Wed Jun 24 13:48:29 GMT 2026',
  'No-network UI proof ready: yes',
  'Expired certificate evidence ready: yes',
  'Release blocker outcome: blocked-by-electrum-certificate-expired',
  'Secret values printed: no',
  'Required action: renew or fix the dev/testnet Electrum TLS certificate, then rerun Android devRelease smoke and release create-wallet validation.',
  '',
  'Blocker evidence lines:',
  '06-24 13:48:29.391 E TcpSockets: javax.net.ssl.SSLHandshakeException: Chain validation failed',
  '06-24 13:48:29.391 E TcpSockets: Caused by: java.security.cert.CertificateExpiredException: Certificate expired at Tue Jun 23 16:52:40 GMT 2026',
  '',
].join('\n');

const validErrors = getAndroidReleaseNetworkBlockerSummaryErrors(validSummary);
assert(validErrors.length === 0, `valid summary should pass, received: ${validErrors.join('; ')}`);

const missingNoNetworkProof = validSummary.replace('No-network UI proof ready: yes', 'No-network UI proof ready: no');
const missingNoNetworkProofErrors = getAndroidReleaseNetworkBlockerSummaryErrors(missingNoNetworkProof);
assert(
  missingNoNetworkProofErrors.some(error => error.includes('No-network UI proof ready must be yes')),
  'summary without no-network UI proof should fail',
);

const missingCertificateEvidence = validSummary.replace(
  'Release blocker outcome: blocked-by-electrum-certificate-expired',
  'Release blocker outcome: inconclusive',
);
const missingCertificateEvidenceErrors = getAndroidReleaseNetworkBlockerSummaryErrors(missingCertificateEvidence);
assert(
  missingCertificateEvidenceErrors.some(error => error.includes('Release blocker outcome must be')),
  'summary without expired-certificate blocker outcome should fail',
);

const missingEvidenceLines = validSummary.replace('SSLHandshakeException', 'TcpSocketException');
const missingEvidenceLinesErrors = getAndroidReleaseNetworkBlockerSummaryErrors(missingEvidenceLines);
assert(
  missingEvidenceLinesErrors.some(error => error.includes('SSLHandshakeException evidence')),
  'summary without SSLHandshakeException evidence should fail',
);

console.log('Android release network blocker summary guard checks are valid.');

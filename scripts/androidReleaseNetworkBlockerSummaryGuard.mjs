import { getLineValue } from './androidSmokeSummaryGuard.mjs';

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;

const requiredLabels = [
  'Generated at',
  'Full release smoke summary present',
  'Full release smoke outcome',
  'Full release smoke reason',
  'Full release smoke data storage preflight',
  'Full release smoke data storage available KiB',
  'Full release smoke data storage required KiB',
  'Full release smoke data storage proof ready',
  'No-network release smoke summary present',
  'No-network release smoke outcome',
  'No-network release smoke expected UI',
  'No-network release smoke summary valid',
  'Release log present',
  'Release log path',
  'Release log bytes',
  'Release log sha256',
  'SSL handshake exception lines',
  'Certificate expired exception lines',
  'TCP socket exception lines',
  'Dev/testnet Electrum endpoint',
  'Certificate expired at',
  'Certificate compared at sample',
  'No-network UI proof ready',
  'Expired certificate evidence ready',
  'Reduced no-network smoke is full release proof',
  'Release services gate remains blocked',
  'Release blocker outcome',
  'Secret values printed',
  'Required action',
];

export const getAndroidReleaseNetworkBlockerSummaryErrors = summary => {
  const errors = [];

  if (!summary.startsWith('Android release network blocker audit')) {
    errors.push('Summary must start with Android release network blocker audit');
  }

  for (const label of requiredLabels) {
    if (!getLineValue(summary, label)) {
      errors.push(`${label} is missing`);
    }
  }

  if (!isIsoTimestamp(getLineValue(summary, 'Generated at'))) {
    errors.push('Generated at must be an ISO timestamp');
  }

  [
    ['Full release smoke summary present', 'yes'],
    ['Full release smoke outcome', 'failed'],
    ['Full release smoke data storage preflight', 'passed'],
    ['Full release smoke data storage proof ready', 'yes'],
    ['No-network release smoke summary present', 'yes'],
    ['No-network release smoke outcome', 'passed'],
    ['No-network release smoke summary valid', 'yes'],
    ['Release log present', 'yes'],
    ['No-network UI proof ready', 'yes'],
    ['Expired certificate evidence ready', 'yes'],
    ['Reduced no-network smoke is full release proof', 'no'],
    ['Release services gate remains blocked', 'yes'],
    ['Release blocker outcome', 'blocked-by-electrum-certificate-expired'],
    ['Secret values printed', 'no'],
  ].forEach(([label, expectedValue]) => {
    const actualValue = getLineValue(summary, label);

    if (actualValue !== expectedValue) {
      errors.push(`${label} must be ${expectedValue}. Received: ${actualValue || 'missing'}`);
    }
  });

  if (!getLineValue(summary, 'No-network release smoke expected UI').includes('No network')) {
    errors.push('No-network release smoke expected UI must include No network');
  }

  if (!/\bGMT\b/.test(getLineValue(summary, 'Certificate expired at'))) {
    errors.push('Certificate expired at must include the parsed GMT timestamp from logcat');
  }

  if (!/\bGMT\b/.test(getLineValue(summary, 'Certificate compared at sample'))) {
    errors.push('Certificate compared at sample must include the parsed GMT timestamp from logcat');
  }

  const electrumEndpoint = getLineValue(summary, 'Dev/testnet Electrum endpoint');
  if (!/^electrumx\.testnet\.btcv\.stage\.rnd\.land:443 tls$/.test(electrumEndpoint)) {
    errors.push(
      `Dev/testnet Electrum endpoint must be electrumx.testnet.btcv.stage.rnd.land:443 tls. Received: ${
        electrumEndpoint || 'missing'
      }`,
    );
  }

  [
    'Full release smoke data storage available KiB',
    'Full release smoke data storage required KiB',
    'Release log bytes',
    'SSL handshake exception lines',
    'Certificate expired exception lines',
    'TCP socket exception lines',
  ].forEach(
    label => {
      if (!isPositiveInteger(getLineValue(summary, label))) {
        errors.push(`${label} must be a positive integer`);
      }
    },
  );

  const availableKilobytes = getLineValue(summary, 'Full release smoke data storage available KiB');
  const requiredKilobytes = getLineValue(summary, 'Full release smoke data storage required KiB');
  if (isPositiveInteger(availableKilobytes) && isPositiveInteger(requiredKilobytes)) {
    if (Number(availableKilobytes) < Number(requiredKilobytes)) {
      errors.push(
        `Full release smoke data storage available KiB must be greater than or equal to required KiB. Received: ${availableKilobytes} < ${requiredKilobytes}`,
      );
    }
  }

  const logSha256 = getLineValue(summary, 'Release log sha256');
  if (!/^[a-f0-9]{64}$/.test(logSha256)) {
    errors.push(`Release log sha256 must be a lowercase SHA-256 digest. Received: ${logSha256 || 'missing'}`);
  }

  const requiredAction = getLineValue(summary, 'Required action');
  if (
    !/renew|replace|fix/i.test(requiredAction) ||
    !/dev\/testnet Electrum TLS certificate/.test(requiredAction) ||
    !/electrumx\.testnet\.btcv\.stage\.rnd\.land:443 tls/.test(requiredAction) ||
    !/rerun/i.test(requiredAction)
  ) {
    errors.push(
      'Required action must mention fixing the dev/testnet Electrum TLS certificate endpoint and rerunning validation',
    );
  }

  if (!summary.includes('Blocker evidence lines:')) {
    errors.push('Blocker evidence lines section must be present');
  } else {
    const evidenceSection = summary.split('Blocker evidence lines:')[1] || '';
    if (evidenceSection.includes('<none>')) {
      errors.push('Blocker evidence lines must not be <none>');
    }
    if (!/SSLHandshakeException/.test(evidenceSection)) {
      errors.push('Blocker evidence lines must include SSLHandshakeException evidence');
    }
    if (!/CertificateExpiredException|Certificate expired at/.test(evidenceSection)) {
      errors.push('Blocker evidence lines must include certificate expiration evidence');
    }
  }

  return errors;
};

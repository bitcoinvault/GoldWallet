import { getLineValue } from './androidSmokeSummaryGuard.mjs';

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;

const requiredLabels = [
  'Generated at',
  'Full dev smoke summary present',
  'Full dev smoke outcome',
  'Full dev smoke reason',
  'No-network dev smoke summary present',
  'No-network dev smoke outcome',
  'No-network dev smoke expected UI',
  'No-network dev smoke summary valid',
  'No-network dev smoke summary errors',
  'Dev log present',
  'Dev log path',
  'Dev log bytes',
  'Dev log sha256',
  'SSL handshake exception lines',
  'Certificate expired exception lines',
  'TCP socket exception lines',
  'Dev/testnet Electrum endpoint',
  'Certificate expired at',
  'Certificate compared at sample',
  'No-network UI proof ready',
  'Expired certificate evidence ready',
  'Reduced no-network smoke is full dev proof',
  'Android dev smoke gate remains blocked',
  'Dev blocker outcome',
  'Secret values printed',
  'Required action',
];

export const getAndroidDevNetworkBlockerSummaryErrors = summary => {
  const errors = [];

  if (!summary.startsWith('Android dev network blocker audit')) {
    errors.push('Summary must start with Android dev network blocker audit');
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
    ['Full dev smoke summary present', 'yes'],
    ['Full dev smoke outcome', 'failed'],
    ['No-network dev smoke summary present', 'yes'],
    ['No-network dev smoke outcome', 'passed'],
    ['No-network dev smoke summary valid', 'yes'],
    ['No-network dev smoke summary errors', '0'],
    ['Dev log present', 'yes'],
    ['No-network UI proof ready', 'yes'],
    ['Expired certificate evidence ready', 'yes'],
    ['Reduced no-network smoke is full dev proof', 'no'],
    ['Android dev smoke gate remains blocked', 'yes'],
    ['Dev blocker outcome', 'blocked-by-electrum-certificate-expired'],
    ['Secret values printed', 'no'],
  ].forEach(([label, expectedValue]) => {
    const actualValue = getLineValue(summary, label);

    if (actualValue !== expectedValue) {
      errors.push(`${label} must be ${expectedValue}. Received: ${actualValue || 'missing'}`);
    }
  });

  const fullDevSmokeReason = getLineValue(summary, 'Full dev smoke reason');
  const hasMissingDashboardTextReason = fullDevSmokeReason.includes('Wallets, No wallets, Create new wallet, Import wallet');
  const hasStartupRuntimeBlockerReason = fullDevSmokeReason === 'not completed';

  if (!hasMissingDashboardTextReason && !hasStartupRuntimeBlockerReason) {
    errors.push('Full dev smoke reason must name the missing dashboard texts or show startup was not completed');
  }

  if (!getLineValue(summary, 'No-network dev smoke expected UI').includes('No network')) {
    errors.push('No-network dev smoke expected UI must include No network');
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

  ['Dev log bytes', 'SSL handshake exception lines', 'Certificate expired exception lines', 'TCP socket exception lines'].forEach(
    label => {
      if (!isPositiveInteger(getLineValue(summary, label))) {
        errors.push(`${label} must be a positive integer`);
      }
    },
  );

  const logSha256 = getLineValue(summary, 'Dev log sha256');
  if (!/^[a-f0-9]{64}$/.test(logSha256)) {
    errors.push(`Dev log sha256 must be a lowercase SHA-256 digest. Received: ${logSha256 || 'missing'}`);
  }

  const requiredAction = getLineValue(summary, 'Required action');
  if (
    !/renew|replace|fix/i.test(requiredAction) ||
    !/dev\/testnet Electrum TLS certificate/.test(requiredAction) ||
    !/electrumx\.testnet\.btcv\.stage\.rnd\.land:443 tls/.test(requiredAction) ||
    !/android:dev:smoke:embedded/.test(requiredAction)
  ) {
    errors.push(
      'Required action must mention fixing the dev/testnet Electrum TLS certificate endpoint and rerunning android:dev:smoke:embedded',
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


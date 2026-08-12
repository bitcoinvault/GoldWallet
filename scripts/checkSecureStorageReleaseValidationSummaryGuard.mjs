import { getSecureStorageReleaseValidationSummaryErrors } from './secureStorageReleaseValidationSummaryGuard.mjs';
import { secureStorageReleaseSummaryRefreshSteps } from './runSecureStorageReleaseValidationSummaryRefresh.mjs';

const validSummary = [
  'Secure-storage release validation summary',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'Current secure-storage package: react-native-keychain@10.0.0',
  'Legacy secure-storage package: <removed>',
  'Migration summary valid: yes',
  'Removal readiness summary valid: yes',
  'First-party migration summary present: yes',
  'First-party migration summary valid: yes',
  'Android dev smoke summary present: yes',
  'Android dev smoke summary valid: yes',
  'Android smoke artifact base: android-smoke-dev',
  'Android smoke outcome: passed',
  'Android release smoke summary present: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke artifact base: android-smoke-dev-release',
  'Android release smoke outcome: passed',
  'Android release create-wallet smoke summary present: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke artifact base: android-create-wallet-smoke-dev-release',
  'Android release create-wallet smoke outcome: passed',
  'Controlled network blocker outcome: <none>',
  'Controlled network blocker accepted: no',
  'Android dev smoke secure-storage steps completed: yes',
  'Full Android runtime proof ready: yes',
  'Focused validation script: test:storage-network:focused',
  'Keychain primary write: yes',
  'Legacy fallback reads active: yes',
  'Legacy writes disabled: yes',
  'Legacy cleanup after successful migration: yes',
  'Legacy fallback instrumentation active: yes',
  'Removal release validation claimed: no',
  'Legacy package removal ready: yes',
  'Android warning source still expected: no',
  'Migration summary errors: 0',
  'Removal readiness summary errors: 0',
  'Android dev smoke summary errors: 0',
  'Android release smoke summary errors: 0',
  'Android release create-wallet smoke summary errors: 0',
  'Android dev network blocker summary errors: 0',
  'First-party migration summary errors: 0',
  'Secure-storage release validation evidence ready: yes',
  'Android release evidence ready: yes',
  'Secret values printed: no',
  'Required action: keep the first-party migration bridge through a validated cross-platform rollout window before removing fallback reads.',
  '',
].join('\n');

const releaseEvidenceMissingSummary = validSummary
  .replace('Android release smoke summary present: yes', 'Android release smoke summary present: no')
  .replace('Android release smoke summary valid: yes', 'Android release smoke summary valid: no')
  .replace(
    'Android release smoke artifact base: android-smoke-dev-release',
    'Android release smoke artifact base: <missing>',
  )
  .replace('Android release smoke outcome: passed', 'Android release smoke outcome: <missing>')
  .replace(
    'Android release create-wallet smoke summary present: yes',
    'Android release create-wallet smoke summary present: no',
  )
  .replace(
    'Android release create-wallet smoke summary valid: yes',
    'Android release create-wallet smoke summary valid: no',
  )
  .replace(
    'Android release create-wallet smoke artifact base: android-create-wallet-smoke-dev-release',
    'Android release create-wallet smoke artifact base: <missing>',
  )
  .replace(
    'Android release create-wallet smoke outcome: passed',
    'Android release create-wallet smoke outcome: <missing>',
  )
  .replace(
    'Android release smoke summary errors: 0',
    'Android release smoke summary errors: 1\n- missing Android release smoke summary',
  )
  .replace(
    'Android release create-wallet smoke summary errors: 0',
    'Android release create-wallet smoke summary errors: 1\n- missing Android release create-wallet smoke summary',
  )
  .replace('Full Android runtime proof ready: yes', 'Full Android runtime proof ready: no')
  .replace('Android release evidence ready: yes', 'Android release evidence ready: no');

const controlledBlockerSummary = validSummary
  .replace('Android dev smoke summary valid: yes', 'Android dev smoke summary valid: no')
  .replace('Android smoke outcome: passed', 'Android smoke outcome: failed')
  .replace('Android release smoke summary valid: yes', 'Android release smoke summary valid: no')
  .replace('Android release smoke outcome: passed', 'Android release smoke outcome: failed')
  .replace(
    'Android release create-wallet smoke summary valid: yes',
    'Android release create-wallet smoke summary valid: no',
  )
  .replace('Android release create-wallet smoke outcome: passed', 'Android release create-wallet smoke outcome: failed')
  .replace(
    'Controlled network blocker outcome: <none>',
    'Controlled network blocker outcome: blocked-by-electrum-certificate-expired',
  )
  .replace('Controlled network blocker accepted: no', 'Controlled network blocker accepted: yes')
  .replace('Full Android runtime proof ready: yes', 'Full Android runtime proof ready: no')
  .replace('Android dev smoke summary errors: 0', 'Android dev smoke summary errors: 8')
  .replace('Android release smoke summary errors: 0', 'Android release smoke summary errors: 8')
  .replace(
    'Android release create-wallet smoke summary errors: 0',
    'Android release create-wallet smoke summary errors: 2',
  )
  .replace('Android release evidence ready: yes', 'Android release evidence ready: no')
  .replace(
    'Required action: keep the first-party migration bridge through a validated cross-platform rollout window before removing fallback reads.',
    'Required action: fix the dev/testnet Electrum TLS certificate and rerun full Android dev and release smoke; keep the first-party migration bridge through a validated cross-platform rollout window.',
  );

const assertAccepted = (label, summary) => {
  const errors = getSecureStorageReleaseValidationSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getSecureStorageReleaseValidationSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid secure-storage release validation summary fixture', validSummary);
assertAccepted(
  'Secure-storage release validation summary without optional release evidence fixture',
  releaseEvidenceMissingSummary,
);
assertAccepted('Secure-storage controlled Electrum blocker fixture', controlledBlockerSummary);
assertRejected(
  'Missing header fixture',
  validSummary.replace('Secure-storage release validation summary', 'Bad summary'),
  'summary header',
);
assertRejected(
  'Bad timestamp fixture',
  validSummary.replace('Generated at: 2026-06-11T00:00:00.000Z', 'Generated at: now'),
  'ISO timestamp',
);
assertRejected(
  'Bad current package fixture',
  validSummary.replace('react-native-keychain@10.0.0', 'react-native-keychain@9.0.0'),
  'Current secure-storage package',
);
assertRejected(
  'Invalid migration summary fixture',
  validSummary.replace('Migration summary valid: yes', 'Migration summary valid: no'),
  'Migration summary must be valid',
);
assertRejected(
  'Invalid removal summary fixture',
  validSummary.replace('Removal readiness summary valid: yes', 'Removal readiness summary valid: no'),
  'Removal readiness summary must be valid',
);
assertRejected(
  'Missing first-party migration fixture',
  validSummary.replace('First-party migration summary present: yes', 'First-party migration summary present: no'),
  'First-party migration summary must be present',
);
assertRejected(
  'Invalid first-party migration fixture',
  validSummary.replace('First-party migration summary valid: yes', 'First-party migration summary valid: no'),
  'First-party migration summary must be valid',
);
assertRejected(
  'Missing smoke fixture',
  validSummary.replace('Android dev smoke summary present: yes', 'Android dev smoke summary present: no'),
  'Android dev smoke summary must be present',
);
assertRejected(
  'Failed smoke fixture',
  validSummary.replace('Android smoke outcome: passed', 'Android smoke outcome: failed'),
  'Android smoke outcome must be passed',
);
assertRejected(
  'Failed release smoke fixture',
  validSummary.replace('Android release smoke outcome: passed', 'Android release smoke outcome: failed'),
  'Android release smoke outcome',
);
assertRejected(
  'Failed release create-wallet smoke fixture',
  validSummary.replace(
    'Android release create-wallet smoke outcome: passed',
    'Android release create-wallet smoke outcome: failed',
  ),
  'Android release create-wallet smoke outcome',
);
assertRejected(
  'Inconsistent release evidence fixture',
  validSummary.replace('Android release evidence ready: yes', 'Android release evidence ready: no'),
  'Android release evidence ready must be yes',
);
assertRejected(
  'Controlled blocker without storage steps fixture',
  controlledBlockerSummary.replace(
    'Android dev smoke secure-storage steps completed: yes',
    'Android dev smoke secure-storage steps completed: no',
  ),
  'Controlled network blocker accepted requires completed Android dev secure-storage steps',
);
assertRejected(
  'Controlled blocker with full proof fixture',
  controlledBlockerSummary.replace('Full Android runtime proof ready: no', 'Full Android runtime proof ready: yes'),
  'Full Android runtime proof must remain no',
);
assertRejected(
  'Fallback removed fixture',
  validSummary.replace('Legacy fallback reads active: yes', 'Legacy fallback reads active: no'),
  'Legacy fallback reads must remain active',
);
assertRejected(
  'No fallback instrumentation fixture',
  validSummary.replace('Legacy fallback instrumentation active: yes', 'Legacy fallback instrumentation active: no'),
  'Legacy fallback instrumentation',
);
assertRejected(
  'Removal overclaimed fixture',
  validSummary.replace('Removal release validation claimed: no', 'Removal release validation claimed: yes'),
  'must remain unclaimed',
);
assertRejected(
  'Removal not ready fixture',
  validSummary.replace('Legacy package removal ready: yes', 'Legacy package removal ready: no'),
  'Legacy package removal must remain ready',
);
assertRejected(
  'Secret printed fixture',
  validSummary.replace('Secret values printed: no', 'Secret values printed: yes'),
  'must not print secret values',
);

const refreshScripts = secureStorageReleaseSummaryRefreshSteps.map(step => step.args.at(-1));
const expectedRefreshScripts = [
  'secure-storage:migration:audit',
  'secure-storage:migration:check-summary',
  'secure-storage:removal-readiness:audit',
  'secure-storage:removal-readiness:check-summary',
];
if (
  refreshScripts.length !== 5 ||
  expectedRefreshScripts.some((script, index) => refreshScripts[index] !== script) ||
  !refreshScripts[4].endsWith('runSecureStorageReleaseValidationSummary.mjs')
) {
  console.error(
    'Secure-storage release summary must refresh and validate migration/removal evidence before aggregation.',
  );
  process.exit(1);
}

console.log('Secure-storage release validation summary guard checks are valid.');

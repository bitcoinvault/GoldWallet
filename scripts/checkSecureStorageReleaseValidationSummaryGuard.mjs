import { getSecureStorageReleaseValidationSummaryErrors } from './secureStorageReleaseValidationSummaryGuard.mjs';

const validSummary = [
  'Secure-storage release validation summary',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'Current secure-storage package: react-native-keychain@10.0.0',
  'Legacy secure-storage package: react-native-secure-key-store@2.0.10',
  'Migration summary valid: yes',
  'Removal readiness summary valid: yes',
  'Android dev smoke summary present: yes',
  'Android dev smoke summary valid: yes',
  'Android smoke artifact base: android-smoke-dev',
  'Android smoke outcome: passed',
  'Focused validation script: test:storage-network:focused',
  'Keychain primary write: yes',
  'Legacy fallback reads active: yes',
  'Legacy writes disabled: yes',
  'Legacy cleanup after successful migration: yes',
  'Removal release validation claimed: no',
  'Legacy package removal ready: no',
  'Android warning source still expected: yes',
  'Migration summary errors: 0',
  'Removal readiness summary errors: 0',
  'Android dev smoke summary errors: 0',
  'Secure-storage release validation evidence ready: yes',
  'Secret values printed: no',
  'Required action: keep react-native-secure-key-store installed until fallback-free validation is claimed for migrated PIN, transaction-password, and encrypted wallet data.',
  '',
].join('\n');

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
assertRejected('Missing header fixture', validSummary.replace('Secure-storage release validation summary', 'Bad summary'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-06-11T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad current package fixture', validSummary.replace('react-native-keychain@10.0.0', 'react-native-keychain@9.0.0'), 'Current secure-storage package');
assertRejected('Invalid migration summary fixture', validSummary.replace('Migration summary valid: yes', 'Migration summary valid: no'), 'Migration summary must be valid');
assertRejected('Invalid removal summary fixture', validSummary.replace('Removal readiness summary valid: yes', 'Removal readiness summary valid: no'), 'Removal readiness summary must be valid');
assertRejected('Missing smoke fixture', validSummary.replace('Android dev smoke summary present: yes', 'Android dev smoke summary present: no'), 'Android dev smoke summary must be present');
assertRejected('Failed smoke fixture', validSummary.replace('Android smoke outcome: passed', 'Android smoke outcome: failed'), 'Android smoke outcome must be passed');
assertRejected('No fallback fixture', validSummary.replace('Legacy fallback reads active: yes', 'Legacy fallback reads active: no'), 'Legacy fallback reads must remain active');
assertRejected('Removal claimed fixture', validSummary.replace('Removal release validation claimed: no', 'Removal release validation claimed: yes'), 'Removal release validation must remain unclaimed');
assertRejected('Removal ready fixture', validSummary.replace('Legacy package removal ready: no', 'Legacy package removal ready: yes'), 'Legacy package removal must remain blocked');
assertRejected('Secret printed fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');

console.log('Secure-storage release validation summary guard checks are valid.');

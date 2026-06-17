import { getSecureStorageRemovalReadinessSummaryErrors } from './secureStorageRemovalReadinessSummaryGuard.mjs';

const validSummary = [
  'Secure-storage removal readiness audit',
  'Generated at: 2026-06-03T00:00:00.000Z',
  'Current secure-storage package: react-native-keychain@10.0.0',
  'Legacy secure-storage package: react-native-secure-key-store@2.0.10',
  'Current posture: staged migration with legacy fallback',
  'Keychain primary write: yes',
  'Legacy fallback reads active: yes',
  'Legacy write path disabled: yes',
  'Legacy cleanup after successful migration: yes',
  'Legacy fallback instrumentation active: yes',
  'SecureStorageService fallback migration tests present: yes',
  'SecureStorageService keychain-failure empty fallback tests present: yes',
  'SecureStorageService fallback-free keychain tests present: yes',
  'AppStorage fallback migration tests present: yes',
  'AppStorage keychain-failure empty fallback tests present: yes',
  'AppStorage fallback-free encrypted wallet tests present: yes',
  'Fallback migration tests present: yes',
  'Removal release validation claimed: no',
  'Android warning source still expected: yes',
  'Legacy package removal ready: no',
  'Required release validation: migrated PIN, transaction-password, and encrypted wallet data without the fallback backend',
  'Removal blocker: release validation is not claimed while legacy fallback reads remain active',
  'Warnings: 0',
  'Errors: 0',
  'Secret values printed: no',
  'Required action: keep react-native-secure-key-store installed until release validation is claimed for migrated secure values.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getSecureStorageRemovalReadinessSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getSecureStorageRemovalReadinessSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid secure-storage removal readiness summary fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('Secure-storage removal readiness audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-06-03T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad current package fixture', validSummary.replace('Current secure-storage package: react-native-keychain@10.0.0', 'Current secure-storage package: missing'), 'Current secure-storage package');
assertRejected('Bad posture fixture', validSummary.replace('Current posture: staged migration with legacy fallback', 'Current posture: removed'), 'staged migration');
assertRejected('No fallback fixture', validSummary.replace('Legacy fallback reads active: yes', 'Legacy fallback reads active: no'), 'Legacy fallback reads');
assertRejected(
  'Missing cleanup fixture',
  validSummary.replace('Legacy cleanup after successful migration: yes', 'Legacy cleanup after successful migration: no'),
  'Legacy cleanup after successful migration',
);
assertRejected(
  'Missing instrumentation fixture',
  validSummary.replace('Legacy fallback instrumentation active: yes', 'Legacy fallback instrumentation active: no'),
  'Legacy fallback instrumentation',
);
assertRejected(
  'Missing SecureStorageService fallback tests fixture',
  validSummary.replace('SecureStorageService fallback migration tests present: yes', 'SecureStorageService fallback migration tests present: no'),
  'SecureStorageService fallback migration tests',
);
assertRejected(
  'Missing SecureStorageService keychain-failure empty fallback tests fixture',
  validSummary.replace(
    'SecureStorageService keychain-failure empty fallback tests present: yes',
    'SecureStorageService keychain-failure empty fallback tests present: no',
  ),
  'SecureStorageService keychain-failure empty fallback tests',
);
assertRejected(
  'Missing SecureStorageService fallback-free keychain tests fixture',
  validSummary.replace(
    'SecureStorageService fallback-free keychain tests present: yes',
    'SecureStorageService fallback-free keychain tests present: no',
  ),
  'SecureStorageService fallback-free keychain tests',
);
assertRejected(
  'Missing AppStorage fallback tests fixture',
  validSummary.replace('AppStorage fallback migration tests present: yes', 'AppStorage fallback migration tests present: no'),
  'AppStorage fallback migration tests',
);
assertRejected(
  'Missing AppStorage keychain-failure empty fallback tests fixture',
  validSummary.replace(
    'AppStorage keychain-failure empty fallback tests present: yes',
    'AppStorage keychain-failure empty fallback tests present: no',
  ),
  'AppStorage keychain-failure empty fallback tests',
);
assertRejected(
  'Missing AppStorage fallback-free encrypted wallet tests fixture',
  validSummary.replace(
    'AppStorage fallback-free encrypted wallet tests present: yes',
    'AppStorage fallback-free encrypted wallet tests present: no',
  ),
  'AppStorage fallback-free encrypted wallet tests',
);
assertRejected('Claimed validation fixture', validSummary.replace('Removal release validation claimed: no', 'Removal release validation claimed: yes'), 'must not be claimed');
assertRejected('Removal ready fixture', validSummary.replace('Legacy package removal ready: no', 'Legacy package removal ready: yes'), 'must stay blocked');
assertRejected(
  'Missing required validation fixture',
  validSummary.replace(
    'Required release validation: migrated PIN, transaction-password, and encrypted wallet data without the fallback backend',
    'Required release validation: migrated PIN',
  ),
  'Required release validation',
);
assertRejected('Secret leak fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');
assertRejected(
  'Missing required action fixture',
  validSummary.replace(
    'Required action: keep react-native-secure-key-store installed until release validation is claimed for migrated secure values.',
    'Required action: remove package.',
  ),
  'keep react-native-secure-key-store installed',
);

console.log('Secure-storage removal readiness summary guard checks are valid.');

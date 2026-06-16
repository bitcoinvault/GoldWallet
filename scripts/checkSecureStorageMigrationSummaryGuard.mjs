import { getSecureStorageMigrationSummaryErrors } from './secureStorageMigrationSummaryGuard.mjs';

const validSummary = [
  'Secure-storage migration audit',
  'Generated at: 2026-05-29T00:00:00.000Z',
  'Current secure-storage package: react-native-keychain@10.0.0',
  'Legacy secure-storage package: react-native-secure-key-store@2.0.10',
  'SecureStorageService file: src/services/SecureStorageService.ts',
  'AppStorage secure-storage file: class/app-storage.js',
  'Stores PIN: yes',
  'Stores transaction password hash: yes',
  'Keychain primary write: yes',
  'Legacy secure-storage writes disabled: yes',
  'Legacy secure-storage fallback reads active: yes',
  'Legacy secure-storage cleanup after successful migration: yes',
  'Legacy fallback instrumentation active: yes',
  'Focused validation script: test:storage-network:focused',
  'Focused validation command: yarn test:secure-storage:unit && yarn test:storage && yarn test:authenticator && yarn test:wallet-core:offline',
  'Warning baseline mentions secure-key-store: yes',
  'Legacy secure-storage removal ready: no',
  'Legacy secure-storage removal blocker: legacy fallback reads are still active; remove react-native-secure-key-store only after a release validates migrated PIN, transaction-password, and encrypted wallet data without the fallback backend',
  'Secure-storage migration baseline stable: yes',
  'Warnings: 0',
  'Errors: 0',
  'Required action: none; secure-storage migration baseline is stable for a dedicated storage validation branch.',
].join('\n');

const invalidSummary = validSummary
  .replace('Current secure-storage package: react-native-keychain@10.0.0', 'Current secure-storage package: <missing>')
  .replace('Secure-storage migration baseline stable: yes', 'Secure-storage migration baseline stable: no')
  .replace(
    'Required action: none; secure-storage migration baseline is stable for a dedicated storage validation branch.',
    'Required action: restore secure-storage migration baseline before replacing the dependency.',
  );

const invalidFocusedValidationSummary = validSummary.replace(
  'Focused validation command: yarn test:secure-storage:unit && yarn test:storage && yarn test:authenticator && yarn test:wallet-core:offline',
  'Focused validation command: yarn test:storage && yarn test:authenticator && yarn test:wallet-core:offline',
);

const assertAccepted = (label, summary) => {
  const errors = getSecureStorageMigrationSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getSecureStorageMigrationSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid secure-storage migration summary fixture', validSummary);
assertRejected('Invalid secure-storage package fixture', invalidSummary, 'Current secure-storage package');
assertRejected(
  'Legacy secure-storage package fixture',
  validSummary.replace('Legacy secure-storage package: react-native-secure-key-store@2.0.10', 'Legacy secure-storage package: <missing>'),
  'Legacy secure-storage package',
);
assertRejected('Invalid AppStorage file fixture', validSummary.replace('AppStorage secure-storage file: class/app-storage.js', 'AppStorage secure-storage file: <missing>'), 'AppStorage secure-storage file');
assertRejected('Invalid focused validation command fixture', invalidFocusedValidationSummary, 'Focused validation command');
assertRejected(
  'Keychain primary write fixture',
  validSummary.replace('Keychain primary write: yes', 'Keychain primary write: no'),
  'Keychain primary write must be yes',
);
assertRejected(
  'Legacy secure-storage writes disabled fixture',
  validSummary.replace('Legacy secure-storage writes disabled: yes', 'Legacy secure-storage writes disabled: no'),
  'Legacy secure-storage writes disabled must be yes',
);
assertRejected(
  'Legacy secure-storage fallback reads active fixture',
  validSummary.replace('Legacy secure-storage fallback reads active: yes', 'Legacy secure-storage fallback reads active: no'),
  'Legacy secure-storage fallback reads active must be yes',
);
assertRejected(
  'Legacy secure-storage cleanup fixture',
  validSummary.replace('Legacy secure-storage cleanup after successful migration: yes', 'Legacy secure-storage cleanup after successful migration: no'),
  'Legacy secure-storage cleanup after successful migration must be yes',
);
assertRejected(
  'Legacy fallback instrumentation fixture',
  validSummary.replace('Legacy fallback instrumentation active: yes', 'Legacy fallback instrumentation active: no'),
  'Legacy fallback instrumentation',
);
assertRejected(
  'Legacy secure-storage removal ready fixture',
  validSummary.replace('Legacy secure-storage removal ready: no', 'Legacy secure-storage removal ready: yes'),
  'Legacy secure-storage removal must stay blocked',
);
assertRejected(
  'Legacy secure-storage removal blocker fixture',
  validSummary.replace(
    'Legacy secure-storage removal blocker: legacy fallback reads are still active; remove react-native-secure-key-store only after a release validates migrated PIN, transaction-password, and encrypted wallet data without the fallback backend',
    'Legacy secure-storage removal blocker: none',
  ),
  'active legacy fallback reads',
);
assertRejected('Missing header fixture', validSummary.replace('Secure-storage migration audit', 'Bad header'), 'summary header');

console.log('Secure-storage migration summary guard checks are valid.');

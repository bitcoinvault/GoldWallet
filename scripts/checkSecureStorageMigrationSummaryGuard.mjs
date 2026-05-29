import { getSecureStorageMigrationSummaryErrors } from './secureStorageMigrationSummaryGuard.mjs';

const validSummary = [
  'Secure-storage migration audit',
  'Generated at: 2026-05-29T00:00:00.000Z',
  'Current secure-storage package: react-native-secure-key-store@2.0.10',
  'Replacement secure-storage package: react-native-keychain@10.0.0',
  'SecureStorageService file: src/services/SecureStorageService.ts',
  'Stores PIN: yes',
  'Stores transaction password hash: yes',
  'Focused validation script: test:storage-network:focused',
  'Warning baseline mentions secure-key-store: yes',
  'Secure-storage migration baseline stable: yes',
  'Warnings: 1',
  '- local Android warning audit summary does not mention react-native-secure-key-store; refresh the warning audit before migration.',
  'Errors: 0',
  'Required action: none; secure-storage migration baseline is stable for a dedicated storage validation branch.',
].join('\n');

const invalidSummary = validSummary
  .replace('Current secure-storage package: react-native-secure-key-store@2.0.10', 'Current secure-storage package: <missing>')
  .replace('Secure-storage migration baseline stable: yes', 'Secure-storage migration baseline stable: no')
  .replace(
    'Required action: none; secure-storage migration baseline is stable for a dedicated storage validation branch.',
    'Required action: restore secure-storage migration baseline before replacing the dependency.',
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
assertRejected('Missing header fixture', validSummary.replace('Secure-storage migration audit', 'Bad header'), 'summary header');

console.log('Secure-storage migration summary guard checks are valid.');

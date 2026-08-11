import { getSecureStorageMigrationSummaryErrors } from './secureStorageMigrationSummaryGuard.mjs';

const validSummary = [
  'Secure-storage migration audit',
  'Generated at: 2026-07-15T00:00:00.000Z',
  'Current secure-storage package: react-native-keychain@10.0.0',
  'Legacy secure-storage package: <removed>',
  'SecureStorageService file: src/services/SecureStorageService.ts',
  'AppStorage secure-storage file: class/app-storage.js',
  'Stores PIN: yes',
  'Stores transaction password hash: yes',
  'Keychain primary write: yes',
  'Legacy secure-storage fallback reads active: yes',
  'Legacy third-party runtime removed: yes',
  'First-party migration bridge active: yes',
  'Focused validation script: test:storage-network:focused',
  'Focused validation command: yarn test:secure-storage:unit && yarn test:storage && yarn test:authenticator && yarn test:wallet-core:offline',
  'Secure-storage migration baseline stable: yes',
  'Errors: 0',
  'Required action: keep the first-party migration bridge through a validated cross-platform rollout window.',
  '',
].join('\n');

const assertRejected = (summary, expected) => {
  const errors = getSecureStorageMigrationSummaryErrors(summary);
  if (!errors.some(error => error.includes(expected))) throw new Error(`Expected rejection containing ${expected}: ${errors.join('; ')}`);
};

if (getSecureStorageMigrationSummaryErrors(validSummary).length > 0) throw new Error('Valid secure-storage migration fixture was rejected');
assertRejected(validSummary.replace('Legacy secure-storage package: <removed>', 'Legacy secure-storage package: react-native-secure-key-store@2.0.10'), 'must be <removed>');
assertRejected(validSummary.replace('Legacy secure-storage fallback reads active: yes', 'Legacy secure-storage fallback reads active: no'), 'must be yes');
assertRejected(validSummary.replace('Legacy third-party runtime removed: yes', 'Legacy third-party runtime removed: no'), 'must be yes');
assertRejected(validSummary.replace('First-party migration bridge active: yes', 'First-party migration bridge active: no'), 'must be yes');
console.log('Secure-storage migration summary guard checks are valid.');

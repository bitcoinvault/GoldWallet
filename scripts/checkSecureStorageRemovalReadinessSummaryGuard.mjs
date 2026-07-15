import { getSecureStorageRemovalReadinessSummaryErrors } from './secureStorageRemovalReadinessSummaryGuard.mjs';

const validSummary = [
  'Secure-storage removal readiness audit',
  'Generated at: 2026-07-15T00:00:00.000Z',
  'Current secure-storage package: react-native-keychain@10.0.0',
  'Legacy secure-storage package: <removed>',
  'Current posture: Keychain-only after validated historical migration',
  'Keychain primary write: yes',
  'Legacy fallback reads active: no',
  'Legacy package absent: yes',
  'Legacy adapter absent: yes',
  'Keychain-only tests present: yes',
  'Historical legacy migration proof guarded: yes',
  'Removal release validation claimed: yes',
  'Android warning source still expected: no',
  'Legacy package removal ready: yes',
  'Errors: 0',
  'Required action: none; keep the removed legacy backend from returning.',
  '',
].join('\n');

const assertRejected = (summary, expected) => {
  const errors = getSecureStorageRemovalReadinessSummaryErrors(summary);
  if (!errors.some(error => error.includes(expected))) throw new Error(`Expected rejection containing ${expected}: ${errors.join('; ')}`);
};

if (getSecureStorageRemovalReadinessSummaryErrors(validSummary).length > 0) throw new Error('Valid secure-storage removal fixture was rejected');
assertRejected(validSummary.replace('Legacy secure-storage package: <removed>', 'Legacy secure-storage package: react-native-secure-key-store@2.0.10'), 'must be <removed>');
assertRejected(validSummary.replace('Legacy fallback reads active: no', 'Legacy fallback reads active: yes'), 'must be no');
assertRejected(validSummary.replace('Legacy package removal ready: yes', 'Legacy package removal ready: no'), 'must be yes');
console.log('Secure-storage removal readiness summary guard checks are valid.');

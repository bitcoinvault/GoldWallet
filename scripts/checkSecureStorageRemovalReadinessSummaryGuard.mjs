import { getSecureStorageRemovalReadinessSummaryErrors } from './secureStorageRemovalReadinessSummaryGuard.mjs';

const validSummary = [
  'Secure-storage removal readiness audit',
  'Generated at: 2026-07-15T00:00:00.000Z',
  'Current secure-storage package: react-native-keychain@10.0.0',
  'Legacy secure-storage package: <removed>',
  'Current posture: Keychain primary with first-party legacy migration bridge',
  'Keychain primary write: yes',
  'Legacy fallback reads active: yes',
  'Legacy package absent: yes',
  'Legacy adapter absent: yes',
  'Keychain-only tests present: yes',
  'Historical legacy migration proof guarded: yes',
  'First-party migration bridge active: yes',
  'iOS migration runtime validated: no',
  'Migration release deployment confirmed: no',
  'Removal release validation claimed: no',
  'Android warning source still expected: no',
  'Legacy package removal ready: yes',
  'Fallback removal ready: no',
  'Errors: 0',
  'Required action: ship and validate the cross-platform migration window before removing the first-party fallback bridge.',
  '',
].join('\n');

const assertRejected = (summary, expected) => {
  const errors = getSecureStorageRemovalReadinessSummaryErrors(summary);
  if (!errors.some(error => error.includes(expected))) throw new Error(`Expected rejection containing ${expected}: ${errors.join('; ')}`);
};

if (getSecureStorageRemovalReadinessSummaryErrors(validSummary).length > 0) throw new Error('Valid secure-storage removal fixture was rejected');
assertRejected(validSummary.replace('Legacy secure-storage package: <removed>', 'Legacy secure-storage package: react-native-secure-key-store@2.0.10'), 'must be <removed>');
assertRejected(validSummary.replace('Legacy fallback reads active: yes', 'Legacy fallback reads active: no'), 'must be yes');
assertRejected(validSummary.replace('Fallback removal ready: no', 'Fallback removal ready: yes'), 'must be no');
console.log('Secure-storage removal readiness summary guard checks are valid.');

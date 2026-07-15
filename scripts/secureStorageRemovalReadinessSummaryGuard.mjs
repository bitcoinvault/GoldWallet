const value = (summary, label) => {
  const line = summary.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

export const getSecureStorageRemovalReadinessSummaryErrors = summary => {
  const errors = [];
  if (!summary.startsWith('Secure-storage removal readiness audit')) errors.push('summary header is missing');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value(summary, 'Generated at'))) errors.push('Generated at must be an ISO timestamp');
  if (value(summary, 'Current secure-storage package') !== 'react-native-keychain@10.0.0') errors.push('Current secure-storage package must be react-native-keychain@10.0.0');
  if (value(summary, 'Legacy secure-storage package') !== '<removed>') errors.push('Legacy secure-storage package must be <removed>');
  if (value(summary, 'Current posture') !== 'Keychain-only after validated historical migration') errors.push('Current posture must be Keychain-only after validated historical migration');
  for (const label of ['Keychain primary write', 'Legacy package absent', 'Legacy adapter absent', 'Keychain-only tests present', 'Historical legacy migration proof guarded', 'Removal release validation claimed', 'Legacy package removal ready']) {
    if (value(summary, label) !== 'yes') errors.push(`${label} must be yes`);
  }
  for (const label of ['Legacy fallback reads active', 'Android warning source still expected']) {
    if (value(summary, label) !== 'no') errors.push(`${label} must be no`);
  }
  if (value(summary, 'Errors') !== '0') errors.push('Errors must be 0');
  if (!value(summary, 'Required action').includes('keep the removed legacy backend from returning')) errors.push('Required action must preserve legacy removal');
  return errors;
};

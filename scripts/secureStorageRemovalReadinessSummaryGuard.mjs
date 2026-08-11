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
  if (value(summary, 'Current posture') !== 'Keychain primary with first-party legacy migration bridge') errors.push('Current posture must preserve the first-party migration bridge');
  for (const label of ['Keychain primary write', 'Legacy fallback reads active', 'Legacy package absent', 'Legacy adapter absent', 'Keychain-only tests present', 'Historical legacy migration proof guarded', 'First-party migration bridge active', 'Legacy package removal ready']) {
    if (value(summary, label) !== 'yes') errors.push(`${label} must be yes`);
  }
  for (const label of ['iOS migration runtime validated', 'Migration release deployment confirmed', 'Removal release validation claimed', 'Android warning source still expected', 'Fallback removal ready']) {
    if (value(summary, label) !== 'no') errors.push(`${label} must be no`);
  }
  if (value(summary, 'Errors') !== '0') errors.push('Errors must be 0');
  if (!value(summary, 'Required action').includes('validate the cross-platform migration window')) errors.push('Required action must preserve the migration window');
  return errors;
};

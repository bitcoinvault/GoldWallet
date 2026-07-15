const value = (summary, label) => {
  const line = summary.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

export const getSecureStorageMigrationSummaryErrors = summary => {
  const errors = [];
  const requiredYes = [
    'Stores PIN',
    'Stores transaction password hash',
    'Keychain primary write',
    'Legacy secure-storage runtime removed',
    'Secure-storage migration baseline stable',
  ];

  if (!summary.startsWith('Secure-storage migration audit')) errors.push('Secure-storage migration summary header is missing');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value(summary, 'Generated at'))) errors.push('Generated at must be an ISO timestamp');
  if (value(summary, 'Current secure-storage package') !== 'react-native-keychain@10.0.0') errors.push('Current secure-storage package must be react-native-keychain@10.0.0');
  if (value(summary, 'Legacy secure-storage package') !== '<removed>') errors.push('Legacy secure-storage package must be <removed>');
  requiredYes.forEach(label => {
    if (value(summary, label) !== 'yes') errors.push(`${label} must be yes`);
  });
  if (value(summary, 'Legacy secure-storage fallback reads active') !== 'no') errors.push('Legacy secure-storage fallback reads active must be no');
  if (value(summary, 'Focused validation script') !== 'test:storage-network:focused') errors.push('Focused validation script must be test:storage-network:focused');
  for (const command of ['yarn test:secure-storage:unit', 'yarn test:storage', 'yarn test:authenticator', 'yarn test:wallet-core:offline']) {
    if (!value(summary, 'Focused validation command').includes(command)) errors.push(`Focused validation command must include ${command}`);
  }
  if (value(summary, 'Errors') !== '0') errors.push('Errors must be 0');
  if (!value(summary, 'Required action').includes('keep secure storage on the validated Keychain-only baseline')) errors.push('Required action must preserve the Keychain-only baseline');
  return errors;
};

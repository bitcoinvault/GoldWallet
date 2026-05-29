const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getBulletLinesAfter = (content, label) => {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.startsWith(`${label}: `));
  const bulletLines = [];

  if (startIndex === -1) {
    return bulletLines;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (!lines[index].startsWith('- ')) {
      break;
    }

    bulletLines.push(lines[index].slice(2));
  }

  return bulletLines;
};

export const getSecureStorageMigrationSummaryErrors = summary => {
  const errors = [];
  const currentPackage = getLineValue(summary, 'Current secure-storage package');
  const replacementPackage = getLineValue(summary, 'Replacement secure-storage package');
  const serviceFile = getLineValue(summary, 'SecureStorageService file');
  const storesPin = getLineValue(summary, 'Stores PIN');
  const storesTransactionPassword = getLineValue(summary, 'Stores transaction password hash');
  const focusedValidation = getLineValue(summary, 'Focused validation script');
  const focusedValidationCommand = getLineValue(summary, 'Focused validation command');
  const warningBaselineMentionsSecureStorage = getLineValue(summary, 'Warning baseline mentions secure-key-store');
  const baselineStable = getLineValue(summary, 'Secure-storage migration baseline stable');
  const warningCount = getLineValue(summary, 'Warnings');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Secure-storage migration audit')) {
    errors.push('Secure-storage migration summary header is missing');
  }

  if (currentPackage !== 'react-native-secure-key-store@2.0.10') {
    errors.push(`Current secure-storage package must be react-native-secure-key-store@2.0.10. Received: ${currentPackage || 'missing'}`);
  }

  if (replacementPackage !== 'react-native-keychain@10.0.0') {
    errors.push(`Replacement secure-storage package must be react-native-keychain@10.0.0. Received: ${replacementPackage || 'missing'}`);
  }

  if (serviceFile !== 'src/services/SecureStorageService.ts') {
    errors.push(`SecureStorageService file must be src/services/SecureStorageService.ts. Received: ${serviceFile || 'missing'}`);
  }

  [
    ['Stores PIN', storesPin],
    ['Stores transaction password hash', storesTransactionPassword],
    ['Warning baseline mentions secure-key-store', warningBaselineMentionsSecureStorage],
    ['Secure-storage migration baseline stable', baselineStable],
  ].forEach(([label, value]) => {
    if (!['yes', 'no'].includes(value || '')) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  if (focusedValidation !== 'test:storage-network:focused') {
    errors.push(`Focused validation script must be test:storage-network:focused. Received: ${focusedValidation || 'missing'}`);
  }

  if (
    focusedValidationCommand !==
    'yarn test:secure-storage:unit && yarn test:storage && yarn test:authenticator && yarn test:wallet-core:offline'
  ) {
    errors.push(`Focused validation command must include secure-storage, storage, authenticator, and wallet-core checks. Received: ${focusedValidationCommand || 'missing'}`);
  }

  if (Number(warningCount) !== warningLines.length) {
    errors.push(`Warnings count must be ${warningLines.length}. Received: ${warningCount || 'missing'}`);
  }

  if (baselineStable === 'yes' && !requiredAction.includes('none; secure-storage migration baseline is stable')) {
    errors.push('Stable baseline summary must include the no-action secure-storage required action');
  }

  if (baselineStable === 'no' && !requiredAction.includes('restore secure-storage migration baseline')) {
    errors.push('Unstable baseline summary must include the secure-storage restoration required action');
  }

  return errors;
};

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

const requiredFocusedValidationCommands = [
  'yarn test:secure-storage:unit',
  'yarn test:storage',
  'yarn test:authenticator',
  'yarn test:wallet-core:offline',
];

export const getSecureStorageMigrationSummaryErrors = summary => {
  const errors = [];
  const currentPackage = getLineValue(summary, 'Current secure-storage package');
  const legacyPackage = getLineValue(summary, 'Legacy secure-storage package');
  const serviceFile = getLineValue(summary, 'SecureStorageService file');
  const appStorageFile = getLineValue(summary, 'AppStorage secure-storage file');
  const storesPin = getLineValue(summary, 'Stores PIN');
  const storesTransactionPassword = getLineValue(summary, 'Stores transaction password hash');
  const keychainPrimaryWrite = getLineValue(summary, 'Keychain primary write');
  const legacyWritesDisabled = getLineValue(summary, 'Legacy secure-storage writes disabled');
  const legacyFallbackReadsActive = getLineValue(summary, 'Legacy secure-storage fallback reads active');
  const legacyCleanupAfterSuccessfulMigration = getLineValue(summary, 'Legacy secure-storage cleanup after successful migration');
  const legacyFallbackInstrumentation = getLineValue(summary, 'Legacy fallback instrumentation active');
  const focusedValidation = getLineValue(summary, 'Focused validation script');
  const focusedValidationCommand = getLineValue(summary, 'Focused validation command');
  const warningBaselineMentionsSecureStorage = getLineValue(summary, 'Warning baseline mentions secure-key-store');
  const legacyRemovalReady = getLineValue(summary, 'Legacy secure-storage removal ready');
  const legacyRemovalBlocker = getLineValue(summary, 'Legacy secure-storage removal blocker');
  const baselineStable = getLineValue(summary, 'Secure-storage migration baseline stable');
  const warningCount = getLineValue(summary, 'Warnings');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Secure-storage migration audit')) {
    errors.push('Secure-storage migration summary header is missing');
  }

  if (currentPackage !== 'react-native-keychain@10.0.0') {
    errors.push(`Current secure-storage package must be react-native-keychain@10.0.0. Received: ${currentPackage || 'missing'}`);
  }

  if (legacyPackage !== 'react-native-secure-key-store@2.0.10') {
    errors.push(`Legacy secure-storage package must be react-native-secure-key-store@2.0.10. Received: ${legacyPackage || 'missing'}`);
  }

  if (serviceFile !== 'src/services/SecureStorageService.ts') {
    errors.push(`SecureStorageService file must be src/services/SecureStorageService.ts. Received: ${serviceFile || 'missing'}`);
  }

  if (appStorageFile !== 'class/app-storage.js') {
    errors.push(`AppStorage secure-storage file must be class/app-storage.js. Received: ${appStorageFile || 'missing'}`);
  }

  [
    ['Stores PIN', storesPin],
    ['Stores transaction password hash', storesTransactionPassword],
    ['Keychain primary write', keychainPrimaryWrite],
    ['Legacy secure-storage writes disabled', legacyWritesDisabled],
    ['Legacy secure-storage fallback reads active', legacyFallbackReadsActive],
    ['Legacy secure-storage cleanup after successful migration', legacyCleanupAfterSuccessfulMigration],
    ['Legacy fallback instrumentation active', legacyFallbackInstrumentation],
    ['Warning baseline mentions secure-key-store', warningBaselineMentionsSecureStorage],
    ['Legacy secure-storage removal ready', legacyRemovalReady],
    ['Secure-storage migration baseline stable', baselineStable],
  ].forEach(([label, value]) => {
    if (!['yes', 'no'].includes(value || '')) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  if (focusedValidation !== 'test:storage-network:focused') {
    errors.push(`Focused validation script must be test:storage-network:focused. Received: ${focusedValidation || 'missing'}`);
  }

  const missingFocusedValidationCommands = requiredFocusedValidationCommands.filter(
    command => !focusedValidationCommand.includes(command),
  );

  if (missingFocusedValidationCommands.length > 0) {
    errors.push(
      `Focused validation command must include secure-storage, storage, authenticator, and wallet-core checks. Missing: ${missingFocusedValidationCommands.join(', ')}. Received: ${focusedValidationCommand || 'missing'}`,
    );
  }

  if (Number(warningCount) !== warningLines.length) {
    errors.push(`Warnings count must be ${warningLines.length}. Received: ${warningCount || 'missing'}`);
  }

  if (legacyRemovalReady !== 'no') {
    errors.push(`Legacy secure-storage removal must stay blocked while fallback reads are active. Received: ${legacyRemovalReady || 'missing'}`);
  }

  if (keychainPrimaryWrite !== 'yes') {
    errors.push(`Keychain primary write must be yes while legacy secure-storage writes are disabled. Received: ${keychainPrimaryWrite || 'missing'}`);
  }

  if (legacyWritesDisabled !== 'yes') {
    errors.push(`Legacy secure-storage writes disabled must be yes. Received: ${legacyWritesDisabled || 'missing'}`);
  }

  if (legacyFallbackReadsActive !== 'yes') {
    errors.push(`Legacy secure-storage fallback reads active must be yes until removal validation is complete. Received: ${legacyFallbackReadsActive || 'missing'}`);
  }

  if (legacyCleanupAfterSuccessfulMigration !== 'yes') {
    errors.push(`Legacy secure-storage cleanup after successful migration must be yes. Received: ${legacyCleanupAfterSuccessfulMigration || 'missing'}`);
  }

  if (legacyFallbackInstrumentation !== 'yes') {
    errors.push(`Legacy fallback instrumentation must stay active before removal readiness can be tracked. Received: ${legacyFallbackInstrumentation || 'missing'}`);
  }

  if (!legacyRemovalBlocker.includes('legacy fallback reads are still active')) {
    errors.push('Legacy secure-storage removal blocker must mention the active legacy fallback reads');
  }

  if (baselineStable === 'yes' && !requiredAction.includes('none; secure-storage migration baseline is stable')) {
    errors.push('Stable baseline summary must include the no-action secure-storage required action');
  }

  if (baselineStable === 'no' && !requiredAction.includes('restore secure-storage migration baseline')) {
    errors.push('Unstable baseline summary must include the secure-storage restoration required action');
  }

  return errors;
};

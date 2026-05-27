export const expectedQrScanCallerFiles = new Set([
  'src/screens/AuthenticatorList/AuthenticatorListScreen.tsx',
  'src/screens/CreateContactScreen.tsx',
  'src/screens/ImportAuthenticator/ImportAuthenticatorScreen.tsx',
  'src/screens/ImportWalletScreen.tsx',
  'src/screens/IntegrateKeyScreen.tsx',
  'src/screens/RecoverySeed/RecoverySeedScreen.tsx',
  'src/screens/RecoverySend/RecoverySendScreen.tsx',
  'src/screens/SendCoinsScreen.tsx',
]);

export const getQrScanCallerInventoryErrors = callerFiles => {
  const callerSet = callerFiles instanceof Set ? callerFiles : new Set(callerFiles);
  const missingCallers = [...expectedQrScanCallerFiles].filter(filePath => !callerSet.has(filePath));
  const unexpectedCallers = [...callerSet].filter(filePath => !expectedQrScanCallerFiles.has(filePath));
  const errors = [];

  if (missingCallers.length > 0) {
    errors.push({
      label: 'Expected QR scanner caller(s) are missing',
      files: missingCallers,
    });
  }

  if (unexpectedCallers.length > 0) {
    errors.push({
      label: 'Unexpected QR scanner caller(s) found',
      files: unexpectedCallers,
    });
  }

  return errors;
};

export const assertQrScanCallerInventory = callerFiles => {
  const errors = getQrScanCallerInventoryErrors(callerFiles);

  if (errors.length > 0) {
    throw new Error(errors.map(error => `${error.label}:\n${error.files.map(filePath => `- ${filePath}`).join('\n')}`).join('\n'));
  }
};

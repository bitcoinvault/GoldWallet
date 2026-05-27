export const expectedQrRenderUsageFiles = new Set([
  'src/screens/ContactQRCodeScreen.tsx',
  'src/screens/ExportWalletScreen.tsx',
  'src/screens/ExportWalletXpubScreen.tsx',
  'src/screens/OptionsAuthenticator/OptionsAuthenticatorScreen.tsx',
  'src/screens/ReceiveCoinsScreen.tsx',
]);

export const getQrRenderUsageErrors = usageFiles => {
  const usageSet = usageFiles instanceof Set ? usageFiles : new Set(usageFiles);
  const missingUsage = [...expectedQrRenderUsageFiles].filter(filePath => !usageSet.has(filePath));
  const unexpectedUsage = [...usageSet].filter(filePath => !expectedQrRenderUsageFiles.has(filePath));
  const errors = [];

  if (missingUsage.length > 0) {
    errors.push({
      label: 'Expected QR render usage is missing',
      files: missingUsage,
    });
  }

  if (unexpectedUsage.length > 0) {
    errors.push({
      label: 'Unexpected QR render usage found',
      files: unexpectedUsage,
    });
  }

  return errors;
};

export const formatQrRenderUsageErrors = errors =>
  errors.map(error => `${error.label}:\n${error.files.map(filePath => `- ${filePath}`).join('\n')}`).join('\n');

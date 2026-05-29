export const expectedCameraKitUsageFiles = new Set(['src/screens/ScanQrCodeScreen.tsx']);
export const expectedCameraUsageFiles = expectedCameraKitUsageFiles;

export const getCameraUsageScopeErrors = usageFiles => {
  const usageSet = usageFiles instanceof Set ? usageFiles : new Set(usageFiles);
  const missingUsage = [...expectedCameraKitUsageFiles].filter(filePath => !usageSet.has(filePath));
  const unexpectedUsage = [...usageSet].filter(filePath => !expectedCameraKitUsageFiles.has(filePath));
  const errors = [];

  if (unexpectedUsage.length > 0) {
    errors.push({
      label: 'Unexpected react-native-camera-kit runtime usage found',
      files: unexpectedUsage,
    });
  }

  if (missingUsage.length > 0) {
    errors.push({
      label: 'Expected react-native-camera-kit runtime usage is missing',
      files: missingUsage,
    });
  }

  return errors;
};

export const assertCameraUsageScope = usageFiles => {
  const errors = getCameraUsageScopeErrors(usageFiles);

  if (errors.length > 0) {
    throw new Error(errors.map(error => `${error.label}:\n${error.files.map(filePath => `- ${filePath}`).join('\n')}`).join('\n'));
  }
};

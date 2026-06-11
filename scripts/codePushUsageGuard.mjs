export const expectedCodePushRuntimeUsageFiles = new Set([]);

export const expectedCodePushNativeUsageFiles = new Set([]);

const getScopeErrors = (usageFiles, expectedFiles, unexpectedLabel, missingLabel) => {
  const usageSet = usageFiles instanceof Set ? usageFiles : new Set(usageFiles);
  const missingUsage = [...expectedFiles].filter(filePath => !usageSet.has(filePath));
  const unexpectedUsage = [...usageSet].filter(filePath => !expectedFiles.has(filePath));
  const errors = [];

  if (unexpectedUsage.length > 0) {
    errors.push({
      label: unexpectedLabel,
      files: unexpectedUsage,
    });
  }

  if (missingUsage.length > 0) {
    errors.push({
      label: missingLabel,
      files: missingUsage,
    });
  }

  return errors;
};

export const getCodePushRuntimeUsageErrors = usageFiles =>
  getScopeErrors(
    usageFiles,
    expectedCodePushRuntimeUsageFiles,
    'Unexpected react-native-code-push runtime usage found',
    'Expected react-native-code-push runtime usage is missing',
  );

export const getCodePushNativeUsageErrors = usageFiles =>
  getScopeErrors(
    usageFiles,
    expectedCodePushNativeUsageFiles,
    'Unexpected CodePush native integration usage found',
    'Expected CodePush native integration usage is missing',
  );

export const formatCodePushUsageErrors = errors =>
  errors.map(error => `${error.label}:\n${error.files.map(filePath => `- ${filePath}`).join('\n')}`).join('\n');

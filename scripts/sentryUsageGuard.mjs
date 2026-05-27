export const expectedSentryUsageFiles = new Set(['App.tsx', 'Main.tsx', 'logger/index.ts']);

export const getSentryUsageScopeErrors = usageFiles => {
  const usageSet = usageFiles instanceof Set ? usageFiles : new Set(usageFiles);
  const missingUsage = [...expectedSentryUsageFiles].filter(filePath => !usageSet.has(filePath));
  const unexpectedUsage = [...usageSet].filter(filePath => !expectedSentryUsageFiles.has(filePath));
  const errors = [];

  if (unexpectedUsage.length > 0) {
    errors.push({
      label: 'Unexpected @sentry/react-native runtime usage found',
      files: unexpectedUsage,
    });
  }

  if (missingUsage.length > 0) {
    errors.push({
      label: 'Expected @sentry/react-native runtime usage is missing',
      files: missingUsage,
    });
  }

  return errors;
};

export const assertSentryUsageScope = usageFiles => {
  const errors = getSentryUsageScopeErrors(usageFiles);

  if (errors.length > 0) {
    throw new Error(errors.map(error => `${error.label}:\n${error.files.map(filePath => `- ${filePath}`).join('\n')}`).join('\n'));
  }
};

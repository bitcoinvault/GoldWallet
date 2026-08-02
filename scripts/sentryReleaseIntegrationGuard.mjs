export const expectedSentryAndroidSnippets = [
  'project.ext.sentryCli',
  'logLevel: "info"',
  'apply from: "../../node_modules/@sentry/react-native/sentry.gradle"',
];

export const expectedSentryMetroSnippets = [
  "require('@sentry/react-native/metro')",
  'module.exports = withSentryConfig(',
  'mergeConfig(defaultConfig,',
];

export const expectedSentryIosSnippets = [
  '$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh',
  '../node_modules/@sentry/react-native/scripts/sentry-xcode.sh',
  '../node_modules/@sentry/react-native/scripts/sentry-xcode-debug-files.sh',
  'Upload Debug Symbols to Sentry',
];

export const getSentryReleaseIntegrationErrors = ({ androidBuildGradle, iosProject, metroConfig }) => {
  const errors = [];

  expectedSentryAndroidSnippets.forEach(snippet => {
    if (!androidBuildGradle.includes(snippet)) {
      errors.push(`Android Sentry integration is missing "${snippet}"`);
    }
  });

  if (androidBuildGradle.includes('logLevel: "debug"')) {
    errors.push('Android Sentry CLI debug logging can expose a credential prefix');
  }

  expectedSentryMetroSnippets.forEach(snippet => {
    if (!metroConfig.includes(snippet)) {
      errors.push(`Sentry Metro integration is missing "${snippet}"`);
    }
  });

  expectedSentryIosSnippets.forEach(snippet => {
    if (!iosProject.includes(snippet)) {
      errors.push(`iOS Sentry integration is missing "${snippet}"`);
    }
  });

  const iosBundlePhaseCount = (iosProject.match(/@sentry\/react-native\/scripts\/sentry-xcode\.sh/g) || []).length;
  const iosDsymPhaseCount = (
    iosProject.match(/@sentry\/react-native\/scripts\/sentry-xcode-debug-files\.sh/g) || []
  ).length;

  if (iosBundlePhaseCount !== 4) {
    errors.push(`iOS Sentry bundle/source-map phases changed unexpectedly (${iosBundlePhaseCount})`);
  }

  if (iosDsymPhaseCount !== 3) {
    errors.push(`iOS Sentry dSYM upload phases changed unexpectedly (${iosDsymPhaseCount})`);
  }

  return errors;
};

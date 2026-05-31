export const expectedRemainingWarningFollowups = [
  {
    packageName: 'react-native-secure-key-store',
    warningSource: 'node_modules/react-native-secure-key-store/android/build.gradle:46',
    followUp: 'dedicated secure-storage removal after legacy fallback migration validation',
  },
];

export const getRemainingWarningPlanErrors = documentText => {
  const errors = [];

  expectedRemainingWarningFollowups.forEach(({ packageName, warningSource, followUp }) => {
    if (!documentText.includes(packageName)) {
      errors.push(`Remaining warning plan is missing package ${packageName}`);
    }

    if (!documentText.includes(warningSource)) {
      errors.push(`Remaining warning plan is missing warning source ${warningSource}`);
    }

    if (!documentText.includes(followUp)) {
      errors.push(`Remaining warning plan is missing follow-up "${followUp}"`);
    }
  });

  [
    '@react-native-community/toolbar-android',
    'react-native-vector-icons',
    'react-native-localize',
    'react-native-exit-app',
    'react-native-device-info',
    'react-native-camera',
    '@react-native-community/masked-view',
  ].forEach(
    packageName => {
      const unexpectedRowPrefix = `| \`${packageName}\` |`;

      if (documentText.split('\n').some(line => line.startsWith(unexpectedRowPrefix))) {
        errors.push(`Resolved warning package ${packageName} must not be listed as a remaining warning`);
      }
    },
  );

  return errors;
};

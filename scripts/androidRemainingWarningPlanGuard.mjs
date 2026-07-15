export const expectedRemainingWarningFollowups = [];

export const getRemainingWarningPlanErrors = documentText => {
  const errors = [];

  expectedRemainingWarningFollowups.forEach(({ packageName, warningSource, followUp, evidence }) => {
    if (!documentText.includes(packageName)) {
      errors.push(`Remaining warning plan is missing package ${packageName}`);
    }

    if (!documentText.includes(warningSource)) {
      errors.push(`Remaining warning plan is missing warning source ${warningSource}`);
    }

    if (!documentText.includes(followUp)) {
      errors.push(`Remaining warning plan is missing follow-up "${followUp}"`);
    }

    if (!documentText.includes(evidence)) {
      errors.push(`Remaining warning plan is missing evidence "${evidence}"`);
    }
  });

  if (!documentText.includes('Targeted Android Gradle warnings: 0')) {
    errors.push('Remaining warning plan must record zero targeted Android Gradle warnings');
  }

  if (!documentText.includes('No targeted Android Gradle warning sources remain')) {
    errors.push('Remaining warning plan must state that no targeted warning sources remain');
  }

  [
    '@react-native-community/toolbar-android',
    'react-native-vector-icons',
    'react-native-localize',
    'react-native-exit-app',
    'react-native-device-info',
    'react-native-camera',
    '@react-native-community/masked-view',
    'react-native-secure-key-store',
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

export const expectedPushNotificationIosRuntimeUsageFiles = new Set(['src/navigators/Navigator.tsx']);

export const expectedPushNotificationIosNativeUsageFiles = new Set([
  'ios/GoldWallet/AppDelegate.h',
  'ios/GoldWallet/AppDelegate.m',
  'ios/GoldWallet/Info.plist',
  'ios/GoldWallet-beta.plist',
  'ios/GoldWalletDev-Info.plist',
  'ios/GoldWalletStage-Info.plist',
]);

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

export const getPushNotificationIosRuntimeUsageErrors = usageFiles =>
  getScopeErrors(
    usageFiles,
    expectedPushNotificationIosRuntimeUsageFiles,
    'Unexpected @react-native-community/push-notification-ios runtime usage found',
    'Expected @react-native-community/push-notification-ios runtime usage is missing',
  );

export const getPushNotificationIosNativeUsageErrors = usageFiles =>
  getScopeErrors(
    usageFiles,
    expectedPushNotificationIosNativeUsageFiles,
    'Unexpected iOS push notification native integration usage found',
    'Expected iOS push notification native integration usage is missing',
  );

export const formatPushNotificationIosUsageErrors = errors =>
  errors.map(error => `${error.label}:\n${error.files.map(filePath => `- ${filePath}`).join('\n')}`).join('\n');

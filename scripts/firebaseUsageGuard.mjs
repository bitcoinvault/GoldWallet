export const expectedFirebaseRuntimeUsageFiles = new Set([
  'src/navigators/Navigator.tsx',
  'src/services/NotificationServices.tsx',
]);

export const expectedFirebaseNativeUsageFiles = new Set([
  'android/app/build.gradle',
  'android/app/src/beta/google-services.json',
  'android/app/src/dev/google-services.json',
  'android/app/src/prod/google-services.json',
  'android/app/src/stage/google-services.json',
  'android/build.gradle',
  'ios/GoldWallet.xcodeproj/project.pbxproj',
  'ios/GoldWallet.xcodeproj/xcshareddata/xcschemes/GoldWallet (Debug).xcscheme',
  'ios/GoldWallet.xcodeproj/xcshareddata/xcschemes/GoldWallet (Release).xcscheme',
  'ios/GoldWallet.xcodeproj/xcshareddata/xcschemes/GoldWallet Dev (Debug).xcscheme',
  'ios/GoldWallet.xcodeproj/xcshareddata/xcschemes/GoldWallet Dev (Release).xcscheme',
  'ios/GoldWallet.xcodeproj/xcshareddata/xcschemes/GoldWallet Stage (Debug).xcscheme',
  'ios/GoldWallet.xcodeproj/xcshareddata/xcschemes/GoldWallet Stage (Release).xcscheme',
  'ios/GoogleService-Info-dev.plist',
  'ios/GoogleService-Info-prod.plist',
  'ios/GoogleService-Info-stage.plist',
  'ios/GoogleService-Info.plist',
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

export const getFirebaseRuntimeUsageErrors = usageFiles =>
  getScopeErrors(
    usageFiles,
    expectedFirebaseRuntimeUsageFiles,
    'Unexpected @react-native-firebase runtime usage found',
    'Expected @react-native-firebase runtime usage is missing',
  );

export const getFirebaseNativeUsageErrors = usageFiles =>
  getScopeErrors(
    usageFiles,
    expectedFirebaseNativeUsageFiles,
    'Unexpected Firebase native integration usage found',
    'Expected Firebase native integration usage is missing',
  );

export const formatFirebaseUsageErrors = errors =>
  errors.map(error => `${error.label}:\n${error.files.map(filePath => `- ${filePath}`).join('\n')}`).join('\n');

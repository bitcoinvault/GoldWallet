import path from 'path';

export const getAndroidDevSmokeEvidenceOptions = root => ({
  expectedArtifactBase: 'android-smoke-dev',
  requireDataStoragePreflight: true,
  requireSmokeApkDigest: true,
  expectedSmokeApkPath: path.join(
    root,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'dev',
    'debug',
    'app-dev-debug.apk',
  ),
  requireSourceApkDigest: true,
  expectedSourceApkPath: path.join(
    root,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'dev',
    'debug',
    'app-dev-debug.apk',
  ),
});

export const getAndroidDevNoNetworkSmokeEvidenceOptions = root => ({
  ...getAndroidDevSmokeEvidenceOptions(root),
  expectedArtifactBase: 'android-smoke-dev-no-network',
});


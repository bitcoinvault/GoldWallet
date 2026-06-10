import path from 'path';

export const getAndroidReleaseSmokeEvidenceOptions = root => ({
  expectedArtifactBase: 'android-smoke-dev-release',
  requireSmokeApkDigest: true,
  expectedSmokeApkPath: path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk'),
  requireSourceApkDigest: true,
  expectedSourceApkPath: path.join(
    root,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'dev',
    'release',
    'app-dev-release-unsigned.apk',
  ),
});

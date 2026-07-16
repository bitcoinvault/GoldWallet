import path from 'path';
import { getAndroidReleaseSmokeVariantConfig } from './androidReleaseSmokeVariant.mjs';

export const getAndroidReleaseSmokeEvidenceOptions = (root, variant = 'dev') => {
  const config = getAndroidReleaseSmokeVariantConfig(root, variant);

  return {
    expectedArtifactBase: config.artifactBase,
    requireDataStoragePreflight: true,
    requireSmokeApkDigest: true,
    expectedSmokeApkPath: config.signedApkPath,
    requireSourceApkDigest: true,
    expectedSourceApkPath: config.unsignedApkPath,
  };
};

export const getAndroidReleaseNoNetworkSmokeEvidenceOptions = root => ({
  expectedArtifactBase: 'android-smoke-dev-release-no-network',
  requireDataStoragePreflight: true,
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

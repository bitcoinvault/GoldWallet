import path from 'path';
import {
  getAndroidReleaseCreateWalletSmokeVariantConfig,
  getAndroidReleaseImportWalletSmokeVariantConfig,
  getAndroidReleaseSmokeVariantConfig,
  supportedAndroidReleaseSmokeVariants,
} from './androidReleaseSmokeVariant.mjs';

export const sentryAndroidReleaseEvidenceEnvName = 'SENTRY_ANDROID_RELEASE_EVIDENCE_VARIANT';
export const defaultSentryAndroidReleaseEvidenceVariant = 'prod';

export const getSentryAndroidReleaseEvidenceConfig = (root, env = process.env) => {
  const configuredVariant = env[sentryAndroidReleaseEvidenceEnvName];
  const variant = (configuredVariant || defaultSentryAndroidReleaseEvidenceVariant).trim();

  if (!supportedAndroidReleaseSmokeVariants.includes(variant)) {
    throw new Error(
      `Unsupported Sentry Android release evidence variant: ${variant}. Expected one of: ${supportedAndroidReleaseSmokeVariants.join(', ')}`,
    );
  }

  const smokeConfig = getAndroidReleaseSmokeVariantConfig(root, variant);
  const createWalletConfig = getAndroidReleaseCreateWalletSmokeVariantConfig(root, variant);
  const importWalletConfig = getAndroidReleaseImportWalletSmokeVariantConfig(root, variant);

  return {
    variant,
    packageName: smokeConfig.packageName,
    activityName: importWalletConfig.activityName,
    smokeArtifactBase: smokeConfig.artifactBase,
    createWalletArtifactBase: createWalletConfig.artifactBase,
    importWalletArtifactBase: importWalletConfig.artifactBase,
    smokeSummaryPath: path.join(root, 'local-docs', `${smokeConfig.artifactBase}-summary.txt`),
    createWalletSmokeSummaryPath: path.join(root, 'local-docs', `${createWalletConfig.artifactBase}-summary.txt`),
    importWalletSmokeSummaryPath: path.join(root, 'local-docs', `${importWalletConfig.artifactBase}-summary.txt`),
    signedSmokeApkPath: smokeConfig.signedApkPath,
    unsignedApkPath: smokeConfig.unsignedApkPath,
  };
};

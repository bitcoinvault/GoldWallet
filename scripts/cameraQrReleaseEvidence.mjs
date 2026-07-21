import path from 'path';

import { getAndroidReleaseSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import {
  getAndroidReleaseCreateWalletSmokeVariantConfig,
  getAndroidReleaseSmokeVariantConfig,
} from './androidReleaseSmokeVariant.mjs';

export const getCameraQrReleaseEvidenceConfig = (root, variant = 'dev') => {
  const smoke = getAndroidReleaseSmokeVariantConfig(root, variant);
  const createWallet = getAndroidReleaseCreateWalletSmokeVariantConfig(root, variant);

  return {
    variant,
    smoke,
    createWallet,
    smokeSummaryPath: path.join(root, 'local-docs', `${smoke.artifactBase}-summary.txt`),
    createWalletSummaryPath: path.join(root, 'local-docs', `${createWallet.artifactBase}-summary.txt`),
    smokeEvidenceOptions: getAndroidReleaseSmokeEvidenceOptions(root, variant),
    createWalletEvidenceOptions: {
      expectedApkPath: smoke.signedApkPath,
      expectedArtifactBase: createWallet.artifactBase,
    },
    smokeScript: `android:${variant}:release:smoke:embedded`,
    smokeSummaryScript: `android:${variant}:release:check-smoke-summary`,
    createWalletScript: `android:${variant}:release:create-wallet-smoke:embedded`,
    createWalletSummaryScript: `android:${variant}:release:check-create-wallet-smoke-summary`,
  };
};

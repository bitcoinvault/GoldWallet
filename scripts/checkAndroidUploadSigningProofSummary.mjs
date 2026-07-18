import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidAppBundleProjectMetadata, getAndroidAppBundleVariantConfig } from './androidAppBundleValidation.mjs';
import { getAndroidSignedBundleSummaryErrors } from './androidSignedBundleSummary.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const proofAab = path.join(root, 'local-docs', 'android-upload-signing-proof-prod-release.aab');
const summaryPath = path.join(root, 'local-docs', 'android-upload-signing-proof-summary.txt');
const runtimeConfig = getAndroidAppBundleVariantConfig(root, 'prod', {
  aabPath: proofAab,
  artifactBase: 'android-upload-signing-proof-prod-release-runtime',
});
const runtimeSmokeSummaryPath = path.join(root, 'local-docs', `${runtimeConfig.smokeArtifactBase}-summary.txt`);
const errors = [];

if (!existsSync(proofAab)) errors.push(`Proof AAB is missing: ${proofAab}`);
if (!existsSync(summaryPath)) errors.push(`Proof summary is missing: ${summaryPath}`);

if (errors.length === 0) {
  const summary = readFileSync(summaryPath, 'utf8');
  const metadata = getAndroidAppBundleProjectMetadata(root);
  errors.push(
    ...getAndroidSignedBundleSummaryErrors({
      summary,
      aabPath: proofAab,
      runtimeUniversalApkPath: runtimeConfig.universalApkPath,
      runtimeSmokeSummaryPath,
      metadata,
      localProof: true,
    }),
  );
}

if (errors.length > 0) {
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android upload signing local proof summary is valid.');

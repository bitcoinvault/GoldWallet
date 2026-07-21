import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidAppBundleProjectMetadata, getAndroidAppBundleVariantConfig } from './androidAppBundleValidation.mjs';
import { getAndroidSignedBundleSummaryErrors } from './androidSignedBundleSummary.mjs';
import { getSentryAndroidCandidateEvidenceConfig } from './sentryAndroidCandidateEvidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'local-docs');
const aabPath = path.join(outputDir, 'android-prod-signed-bundle.aab');
const summaryPath = path.join(outputDir, 'android-prod-signed-bundle-summary.txt');
const runtimeConfig = getAndroidAppBundleVariantConfig(root, 'prod', {
  aabPath,
  artifactBase: 'android-prod-signed-bundle-runtime',
});
const runtimeSmokeSummaryPath = path.join(outputDir, `${runtimeConfig.smokeArtifactBase}-summary.txt`);

if (!existsSync(aabPath) || !existsSync(summaryPath)) {
  if (!existsSync(aabPath)) console.error(`Production signed AAB is missing: ${aabPath}`);
  if (!existsSync(summaryPath)) console.error(`Production signed bundle summary is missing: ${summaryPath}`);
  process.exit(1);
}
const sentryCandidateConfig = getSentryAndroidCandidateEvidenceConfig(root, {
  aabPath,
  artifactBase: 'android-prod-signed-bundle-sentry',
});

const errors = getAndroidSignedBundleSummaryErrors({
  summary: readFileSync(summaryPath, 'utf8'),
  aabPath,
  runtimeUniversalApkPath: runtimeConfig.universalApkPath,
  runtimeSmokeSummaryPath,
  sentryCandidateConfig,
  sentryCandidateType: 'production-signed-candidate',
  metadata: getAndroidAppBundleProjectMetadata(root),
});
if (errors.length > 0) {
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android production signed bundle summary is valid.');

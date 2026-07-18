import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidAppBundleProjectMetadata, getAndroidAppBundleVariantConfig } from './androidAppBundleValidation.mjs';
import { getAndroidSignedBundleSummaryErrors } from './androidSignedBundleSummary.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'local-docs');
const aabPath = path.join(outputDir, 'android-prod-signed-bundle.aab');
const summaryPath = path.join(outputDir, 'android-prod-signed-bundle-summary.txt');
const runtimeConfig = getAndroidAppBundleVariantConfig(root, 'prod', {
  aabPath,
  artifactBase: 'android-prod-signed-bundle-runtime',
});
const runtimeSmokeSummaryPath = path.join(outputDir, `${runtimeConfig.smokeArtifactBase}-summary.txt`);

if (!existsSync(summaryPath)) {
  console.error(`Production signed bundle summary is missing: ${summaryPath}`);
  process.exit(1);
}

const errors = getAndroidSignedBundleSummaryErrors({
  summary: readFileSync(summaryPath, 'utf8'),
  aabPath,
  runtimeUniversalApkPath: runtimeConfig.universalApkPath,
  runtimeSmokeSummaryPath,
  metadata: getAndroidAppBundleProjectMetadata(root),
});
if (errors.length > 0) {
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android production signed bundle summary is valid.');

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidAppBundleArtifactErrors,
  getAndroidAppBundleSummaryErrors,
  getAndroidAppBundleVariantConfig,
  parseAndroidAppBundleVariant,
} from './androidAppBundleValidation.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  const variant = parseAndroidAppBundleVariant(process.argv.slice(2));
  const config = getAndroidAppBundleVariantConfig(root, variant);

  if (!existsSync(config.summaryPath)) {
    throw new Error(`Android App Bundle summary not found: ${config.summaryPath}`);
  }

  const summary = readFileSync(config.summaryPath, 'utf8');
  const errors = [
    ...getAndroidAppBundleSummaryErrors(summary, config),
    ...getAndroidAppBundleArtifactErrors(summary, config),
  ];
  const smokeSummaryPath = path.join(root, 'local-docs', `${config.smokeArtifactBase}-summary.txt`);
  if (!existsSync(smokeSummaryPath)) {
    errors.push(`Android App Bundle smoke summary not found: ${smokeSummaryPath}`);
  } else {
    errors.push(
      ...getAndroidEmbeddedSmokeSummaryErrors(readFileSync(smokeSummaryPath, 'utf8'), {
        expectedArtifactBase: config.smokeArtifactBase,
        requireDataStoragePreflight: true,
        requireSmokeApkDigest: true,
        expectedSmokeApkPath: config.universalApkPath,
        requireSourceApkDigest: true,
        expectedSourceApkPath: config.aabPath,
      }),
    );
  }
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  console.log(`Android App Bundle ${config.displayName} summary is valid.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

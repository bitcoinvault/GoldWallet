import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroid16KbRuntimeProofConfig,
  getAndroid16KbRuntimeProofSummaryErrors,
} from './android16KbRuntimeProofSummary.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { ANDROID_16_KB_RUNTIME_PAGE_SIZE } from './androidRuntimePageSize.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = getAndroid16KbRuntimeProofConfig(root);
const errors = [];

if (!existsSync(config.summaryPath)) {
  errors.push(`Android 16 KB runtime proof summary is missing: ${config.summaryPath}`);
} else {
  errors.push(
    ...getAndroid16KbRuntimeProofSummaryErrors({ summary: readFileSync(config.summaryPath, 'utf8'), config }),
  );
}

if (existsSync(config.smokeSummaryPath)) {
  errors.push(
    ...getAndroidEmbeddedSmokeSummaryErrors(readFileSync(config.smokeSummaryPath, 'utf8'), {
      expectedArtifactBase: 'android-upload-signing-proof-prod-release-runtime-smoke',
      expectedRuntimePageSize: ANDROID_16_KB_RUNTIME_PAGE_SIZE,
      requireDataStoragePreflight: true,
      requireSmokeApkDigest: true,
      expectedSmokeApkPath: config.universalApkPath,
      requireSourceApkDigest: true,
      expectedSourceApkPath: config.aabPath,
    }),
  );
}

if (errors.length > 0) {
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android 16 KB exact signed-AAB runtime proof summary is valid.');

import { spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import {
  getAndroid16KbRuntimeProofConfig,
  renderAndroid16KbRuntimeProofSummary,
} from './android16KbRuntimeProofSummary.mjs';
import {
  ANDROID_16_KB_RUNTIME_PAGE_SIZE,
  assertAndroid16KbRuntimePageSize,
  getAndroid16KbRuntimeProofEnvironment,
  readAndroidRuntimePageSize,
} from './androidRuntimePageSize.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'local-docs');
const sourceAabPath = path.join(outputDir, 'android-upload-signing-proof-prod-release.aab');
const universalApkPath = path.join(outputDir, 'android-upload-signing-proof-prod-release-runtime-universal.apk');
const smokeSummaryPath = path.join(outputDir, 'android-upload-signing-proof-prod-release-runtime-smoke-summary.txt');
const proofConfig = getAndroid16KbRuntimeProofConfig(root);

const run = (label, script, env) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    env,
    encoding: 'utf8',
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.error?.message || `exit ${result.status}`}`);
  }
};

try {
  const runtime = readAndroidRuntimePageSize({ serial: process.env.ANDROID_SERIAL });
  assertAndroid16KbRuntimePageSize(runtime.pageSize);
  console.log(`Android runtime serial: ${runtime.serial}`);
  console.log(`Android runtime page size: ${runtime.pageSize}`);

  const proofEnvironment = getAndroid16KbRuntimeProofEnvironment();
  run(
    'build and validate exact locally signed AAB on the 16 KB runtime',
    'scripts/runAndroidUploadSigningProof.mjs',
    proofEnvironment,
  );
  run('validate local signing proof summary', 'scripts/checkAndroidUploadSigningProofSummary.mjs', proofEnvironment);

  if (![sourceAabPath, universalApkPath, smokeSummaryPath].every(existsSync)) {
    throw new Error('Android 16 KB runtime proof artifacts are incomplete');
  }

  const smokeSummary = readFileSync(smokeSummaryPath, 'utf8');
  const smokeErrors = getAndroidEmbeddedSmokeSummaryErrors(smokeSummary, {
    expectedArtifactBase: 'android-upload-signing-proof-prod-release-runtime-smoke',
    expectedRuntimePageSize: ANDROID_16_KB_RUNTIME_PAGE_SIZE,
    requireDataStoragePreflight: true,
    requireSmokeApkDigest: true,
    expectedSmokeApkPath: universalApkPath,
    requireSourceApkDigest: true,
    expectedSourceApkPath: sourceAabPath,
  });

  if (smokeErrors.length > 0) {
    throw new Error(`Android 16 KB runtime smoke evidence is invalid:\n${smokeErrors.join('\n')}`);
  }

  writeFileSync(
    proofConfig.summaryPath,
    renderAndroid16KbRuntimeProofSummary({ config: proofConfig, serial: runtime.serial, pageSize: runtime.pageSize }),
  );
  run(
    'validate dedicated Android 16 KB runtime proof summary',
    'scripts/checkAndroid16KbRuntimeProofSummary.mjs',
    proofEnvironment,
  );

  console.log('Android 16 KB exact signed-AAB runtime proof passed.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';

import { getLineValue } from './androidSmokeSummaryGuard.mjs';
import { ANDROID_16_KB_RUNTIME_PAGE_SIZE } from './androidRuntimePageSize.mjs';

const hashFile = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);

export const getAndroid16KbRuntimeProofConfig = root => {
  const outputDir = path.join(root, 'local-docs');

  return {
    aabPath: path.join(outputDir, 'android-upload-signing-proof-prod-release.aab'),
    universalApkPath: path.join(outputDir, 'android-upload-signing-proof-prod-release-runtime-universal.apk'),
    smokeSummaryPath: path.join(outputDir, 'android-upload-signing-proof-prod-release-runtime-smoke-summary.txt'),
    summaryPath: path.join(outputDir, 'android-16kb-runtime-proof-summary.txt'),
  };
};

export const renderAndroid16KbRuntimeProofSummary = ({ config, serial, pageSize, generatedAt = new Date() }) =>
  [
    'Android 16 KB exact signed-AAB runtime proof',
    `Generated at: ${generatedAt.toISOString()}`,
    `Android serial: ${serial}`,
    `Required runtime page size bytes: ${ANDROID_16_KB_RUNTIME_PAGE_SIZE}`,
    `Observed runtime page size bytes: ${pageSize}`,
    'Runtime page size check: passed',
    `Signed AAB path: ${config.aabPath}`,
    `Signed AAB bytes: ${statSync(config.aabPath).size}`,
    `Signed AAB SHA-256: ${hashFile(config.aabPath)}`,
    `Runtime universal APK path: ${config.universalApkPath}`,
    `Runtime universal APK bytes: ${statSync(config.universalApkPath).size}`,
    `Runtime universal APK SHA-256: ${hashFile(config.universalApkPath)}`,
    `Runtime smoke summary path: ${config.smokeSummaryPath}`,
    `Runtime smoke summary bytes: ${statSync(config.smokeSummaryPath).size}`,
    `Runtime smoke summary SHA-256: ${hashFile(config.smokeSummaryPath)}`,
    'Proof result: passed',
    'Production upload key used: no',
    'Secret values printed: no',
    '',
  ].join('\n');

export const getAndroid16KbRuntimeProofSummaryErrors = ({ summary, config }) => {
  const errors = [];
  const requiredFiles = [config.aabPath, config.universalApkPath, config.smokeSummaryPath];
  if (requiredFiles.some(filePath => !existsSync(filePath) || statSync(filePath).size === 0)) {
    return ['Android 16 KB runtime proof artifacts are missing or empty'];
  }

  const smokeSummary = readFileSync(config.smokeSummaryPath, 'utf8');
  const expected = new Map([
    ['Android serial', getLineValue(smokeSummary, 'Android serial')],
    ['Required runtime page size bytes', String(ANDROID_16_KB_RUNTIME_PAGE_SIZE)],
    ['Observed runtime page size bytes', String(ANDROID_16_KB_RUNTIME_PAGE_SIZE)],
    ['Runtime page size check', 'passed'],
    ['Signed AAB path', config.aabPath],
    ['Signed AAB bytes', String(statSync(config.aabPath).size)],
    ['Signed AAB SHA-256', hashFile(config.aabPath)],
    ['Runtime universal APK path', config.universalApkPath],
    ['Runtime universal APK bytes', String(statSync(config.universalApkPath).size)],
    ['Runtime universal APK SHA-256', hashFile(config.universalApkPath)],
    ['Runtime smoke summary path', config.smokeSummaryPath],
    ['Runtime smoke summary bytes', String(statSync(config.smokeSummaryPath).size)],
    ['Runtime smoke summary SHA-256', hashFile(config.smokeSummaryPath)],
    ['Proof result', 'passed'],
    ['Production upload key used', 'no'],
    ['Secret values printed', 'no'],
  ]);

  if (summary.split(/\r?\n/).filter(line => line === 'Android 16 KB exact signed-AAB runtime proof').length !== 1) {
    errors.push('Android 16 KB runtime proof summary title is missing or duplicated');
  }
  if (!isIsoTimestamp(getLineValue(summary, 'Generated at'))) {
    errors.push('Android 16 KB runtime proof generated timestamp is invalid');
  }
  for (const [label, expectedValue] of expected) {
    if (getLineValue(summary, label) !== expectedValue) {
      errors.push(`Android 16 KB runtime proof has an invalid ${label}`);
    }
  }

  return errors;
};

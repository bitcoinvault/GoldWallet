import assert from 'assert';
import { createHash } from 'crypto';
import { mkdirSync, rmSync, statSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import { getAndroidSignedBundleSummaryErrors } from './androidSignedBundleSummary.mjs';

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-signed-bundle-summary-${process.pid}`);
const aabPath = path.join(fixtureRoot, 'candidate.aab');
const apkPath = path.join(fixtureRoot, 'candidate.apk');
const smokePath = path.join(fixtureRoot, 'smoke-summary.txt');
const hash = filePath => createHash('sha256').update(filePath === aabPath ? 'aab' : filePath === apkPath ? 'apk' : 'smoke').digest('hex');

try {
  mkdirSync(fixtureRoot, { recursive: true });
  writeFileSync(aabPath, 'aab');
  writeFileSync(apkPath, 'apk');
  writeFileSync(smokePath, 'smoke');
  const summary = [
    'Android upload signing local proof',
    'Variant: prodRelease',
    'Gradle signing requirement: enforced',
    'Configured alias certificate match: passed',
    'AAB JAR signature: verified',
    'Bundle validation: passed',
    'AAB page alignment: PAGE_ALIGNMENT_16K',
    'Version code: 14',
    'Version name: 6.5.1',
    'AAB version metadata match: passed',
    `AAB bytes: ${statSync(aabPath).size}`,
    `AAB SHA-256: ${hash(aabPath)}`,
    `Certificate SHA-256: ${'d'.repeat(64)}`,
    'Candidate-bound emulator smoke: passed',
    'Runtime universal APK 16 KB ZIP alignment: passed',
    'Runtime universal APK 16 KB 64-bit ELF alignment: passed',
    'Runtime 16 KB native libraries checked: 58',
    'Runtime 16 KB ELF LOAD segments checked: 170',
    `Runtime source AAB SHA-256: ${hash(aabPath)}`,
    `Runtime universal APK bytes: ${statSync(apkPath).size}`,
    `Runtime universal APK SHA-256: ${hash(apkPath)}`,
    `Runtime smoke summary SHA-256: ${hash(smokePath)}`,
    'Certificate identity: GoldWallet Local Signing Proof',
    'Temporary keystore retained: no',
    'Production upload key used: no',
    'Production release version ready: not-required-for-local-proof',
    'Production Play upload readiness: not claimed',
    'Sentry upload: independently gated',
    'Secret values printed: no',
    '',
  ].join('\n');
  const options = {
    aabPath,
    runtimeUniversalApkPath: apkPath,
    runtimeSmokeSummaryPath: smokePath,
    metadata: { versionCode: '14', versionName: '6.5.1' },
    localProof: true,
  };

  assert.deepStrictEqual(getAndroidSignedBundleSummaryErrors({ ...options, summary }), []);
  assert(
    getAndroidSignedBundleSummaryErrors({
      ...options,
      summary: summary.replace(`Runtime source AAB SHA-256: ${hash(aabPath)}`, `Runtime source AAB SHA-256: ${'f'.repeat(64)}`),
    }).some(error => error.includes('Runtime source AAB SHA-256')),
  );
  assert(
    getAndroidSignedBundleSummaryErrors({
      ...options,
      summary: summary.replace('Candidate-bound emulator smoke: passed', 'Candidate-bound emulator smoke: skipped'),
    }).some(error => error.includes('Candidate-bound emulator smoke: passed')),
  );
  assert(
    getAndroidSignedBundleSummaryErrors({
      ...options,
      summary: summary.replace('Secret values printed: no', 'Secret values printed: yes'),
    }).some(error => error.includes('Secret values printed: no')),
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android signed bundle summary guard checks passed.');

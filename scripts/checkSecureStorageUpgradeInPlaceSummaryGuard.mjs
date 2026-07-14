import assert from 'assert';

import { getSecureStorageUpgradeInPlaceSummaryErrors } from './secureStorageUpgradeInPlaceSummaryGuard.mjs';

const baselineSha = 'a'.repeat(64);
const candidateSha = 'b'.repeat(64);
const validSummary = [
  'Generated at: 2026-07-14T20:00:00.000Z',
  'Secure-storage upgrade-in-place outcome: passed',
  'Secure-storage upgrade-in-place exit code: 0',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet',
  'Persisted wallet name: UpgradeWallet',
  'Baseline APK path: D:\\baseline.apk',
  'Baseline APK bytes: 100',
  `Baseline APK sha256: ${baselineSha}`,
  'Candidate APK path: D:\\candidate.apk',
  'Candidate APK bytes: 101',
  `Candidate APK sha256: ${candidateSha}`,
  'Baseline legacy native package linked: yes',
  'Candidate legacy native package linked: no',
  'Candidate installed with adb install -r: yes',
  'Application data preserved across APK update: yes',
  'Unlock screen reached after APK update: yes',
  'Incorrect PIN rejected after APK update: yes',
  'Correct PIN accepted after APK update: yes',
  'Persisted wallet card visible after APK update: yes',
  'App process changed across APK update: yes',
  'Secure window flag after APK update: no',
  'Fatal/runtime logcat findings: no',
  'Pre-update App PID: 1234',
  'Post-update App PID: 5678',
  'Captured logcat lines: 10',
  'Screenshot bytes: 200',
].join('\n');

assert.deepStrictEqual(getSecureStorageUpgradeInPlaceSummaryErrors(validSummary, { requireArtifacts: false }), []);

assert.ok(
  getSecureStorageUpgradeInPlaceSummaryErrors(
    validSummary.replace('Candidate legacy native package linked: no', 'Candidate legacy native package linked: yes'),
    { requireArtifacts: false },
  ).some(error => error.includes('Candidate legacy native package linked: no')),
);

assert.ok(
  getSecureStorageUpgradeInPlaceSummaryErrors(validSummary.replace(candidateSha, baselineSha), {
    requireArtifacts: false,
  }).some(error => error.includes('digests must differ')),
);

assert.ok(
  getSecureStorageUpgradeInPlaceSummaryErrors(`${validSummary}\nMnemonic: abandon abandon abandon`, {
    requireArtifacts: false,
  }).some(error => error.includes('secret-bearing fields')),
);

console.log('Secure-storage upgrade-in-place summary guard checks passed.');

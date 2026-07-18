import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';

const hashFile = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

export const getAndroidSignedBundleSummaryErrors = ({
  summary,
  aabPath,
  runtimeUniversalApkPath,
  runtimeSmokeSummaryPath,
  metadata,
  localProof = false,
}) => {
  const errors = [];
  const requiredFiles = [
    ['signed AAB', aabPath],
    ['runtime universal APK', runtimeUniversalApkPath],
    ['runtime smoke summary', runtimeSmokeSummaryPath],
  ];

  for (const [label, filePath] of requiredFiles) {
    if (!existsSync(filePath) || statSync(filePath).size === 0) {
      errors.push(`Android ${label} is missing or empty: ${filePath}`);
    }
  }
  if (errors.length > 0) return errors;

  const requiredLines = [
    localProof ? 'Android upload signing local proof' : 'Android production signed bundle evidence',
    'Variant: prodRelease',
    'Gradle signing requirement: enforced',
    'Configured alias certificate match: passed',
    'AAB JAR signature: verified',
    'Bundle validation: passed',
    'AAB page alignment: PAGE_ALIGNMENT_16K',
    `Version code: ${metadata.versionCode}`,
    `Version name: ${metadata.versionName}`,
    'AAB version metadata match: passed',
    `AAB bytes: ${statSync(aabPath).size}`,
    `AAB SHA-256: ${hashFile(aabPath)}`,
    'Candidate-bound emulator smoke: passed',
    'Runtime universal APK 16 KB ZIP alignment: passed',
    'Runtime universal APK 16 KB 64-bit ELF alignment: passed',
    `Runtime source AAB SHA-256: ${hashFile(aabPath)}`,
    `Runtime universal APK bytes: ${statSync(runtimeUniversalApkPath).size}`,
    `Runtime universal APK SHA-256: ${hashFile(runtimeUniversalApkPath)}`,
    `Runtime smoke summary SHA-256: ${hashFile(runtimeSmokeSummaryPath)}`,
    `Production upload key used: ${localProof ? 'no' : 'yes'}`,
    `Production release version ready: ${localProof ? 'not-required-for-local-proof' : 'yes'}`,
    'Production Play upload readiness: not claimed',
    'Sentry upload: independently gated',
    'Secret values printed: no',
  ];
  errors.push(...requiredLines.filter(line => !summary.includes(line)).map(line => `Signed bundle summary is missing: ${line}`));

  if (!/^Certificate SHA-256: [a-f0-9]{64}$/m.test(summary)) {
    errors.push('Signed bundle certificate SHA-256 is invalid');
  }
  for (const label of ['Runtime 16 KB native libraries checked', 'Runtime 16 KB ELF LOAD segments checked']) {
    if (!new RegExp(`^${label}: [1-9]\\d*$`, 'm').test(summary)) {
      errors.push(`Signed bundle summary has an invalid ${label}`);
    }
  }
  if (localProof) {
    for (const line of ['Certificate identity: GoldWallet Local Signing Proof', 'Temporary keystore retained: no']) {
      if (!summary.includes(line)) errors.push(`Signed bundle summary is missing: ${line}`);
    }
  }

  return errors;
};

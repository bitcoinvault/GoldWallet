import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';

import { getSentryAndroidCandidateEvidenceErrors } from './sentryAndroidCandidateEvidence.mjs';

const hashFile = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

export const getAndroidSignedBundleSummaryErrors = ({
  summary,
  aabPath,
  runtimeUniversalApkPath,
  runtimeSmokeSummaryPath,
  sentryCandidateConfig,
  sentryCandidateType,
  metadata,
  localProof = false,
}) => {
  const errors = [];
  if (!sentryCandidateConfig) return ['Android Sentry candidate evidence config is missing'];
  const requiredFiles = [
    ['signed AAB', aabPath],
    ['runtime universal APK', runtimeUniversalApkPath],
    ['runtime smoke summary', runtimeSmokeSummaryPath],
    ['Sentry candidate manifest', sentryCandidateConfig?.manifestPath],
    ['Sentry embedded bundle snapshot', sentryCandidateConfig?.embeddedBundlePath],
    ['Sentry generated bundle snapshot', sentryCandidateConfig?.generatedBundlePath],
    ['Sentry source map snapshot', sentryCandidateConfig?.sourceMapPath],
  ];

  for (const [label, filePath] of requiredFiles) {
    if (!existsSync(filePath) || statSync(filePath).size === 0) {
      errors.push(`Android ${label} is missing or empty: ${filePath}`);
    }
  }
  if (errors.length > 0) return errors;

  const sentryManifestContent = readFileSync(sentryCandidateConfig.manifestPath, 'utf8');
  const sentryEvidenceErrors = getSentryAndroidCandidateEvidenceErrors({
    manifestContent: sentryManifestContent,
    config: sentryCandidateConfig,
    metadata,
    candidateType: sentryCandidateType,
    generatedReactOutputsCleaned: true,
    sentryAutoUploadDisabled: true,
    sentryUploadAttempted: false,
    secretValuesPrinted: false,
  });
  errors.push(...sentryEvidenceErrors.map(error => `Sentry candidate evidence: ${error}`));
  let sentryEvidence;
  try {
    sentryEvidence = JSON.parse(sentryManifestContent);
  } catch {
    return errors;
  }
  if (sentryEvidenceErrors.length > 0) return errors;

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
    `Sentry candidate type: ${sentryCandidateType}`,
    `Sentry candidate release: ${sentryEvidence.sentryRelease}`,
    `Sentry candidate dist: ${sentryEvidence.sentryDist}`,
    `Sentry embedded bundle SHA-256: ${sentryEvidence.embeddedBundle.sha256}`,
    `Sentry generated bundle SHA-256: ${sentryEvidence.generatedBundle.sha256}`,
    `Sentry source map SHA-256: ${sentryEvidence.sourceMap.sha256}`,
    `Sentry candidate identity: ${sentryEvidence.candidateIdentity}`,
    `Sentry candidate manifest SHA-256: ${hashFile(sentryCandidateConfig.manifestPath)}`,
    'Sentry candidate bundle digest match: passed',
    'Sentry generated React outputs cleaned before build: yes',
    'Sentry automatic upload disabled: yes',
    'Sentry upload attempted: no',
    'Sentry upload validation: not claimed',
    `Production upload key used: ${localProof ? 'no' : 'yes'}`,
    `Production release version ready: ${localProof ? 'not-required-for-local-proof' : 'yes'}`,
    'Production Play upload readiness: not claimed',
    'Sentry upload: independently gated',
    'Secret values printed: no',
  ];
  const expectedTitle = requiredLines[0];
  const expectedValues = new Map(requiredLines.slice(1).map(line => {
    const separator = line.indexOf(': ');
    return [line.slice(0, separator), line.slice(separator + 2)];
  }));
  if (localProof) {
    expectedValues.set('Certificate identity', 'GoldWallet Local Signing Proof');
    expectedValues.set('Temporary keystore retained', 'no');
  }
  const dynamicLabels = new Set([
    'Certificate SHA-256',
    'Runtime 16 KB native libraries checked',
    'Runtime 16 KB ELF LOAD segments checked',
  ]);
  const parsedValues = new Map();
  let titleCount = 0;
  for (const line of summary.split(/\r?\n/).filter(Boolean)) {
    if (line === expectedTitle) {
      titleCount += 1;
      continue;
    }
    const separator = line.indexOf(': ');
    if (separator < 1) {
      errors.push(`Signed bundle summary has an unknown line: ${line}`);
      continue;
    }
    const label = line.slice(0, separator);
    const value = line.slice(separator + 2);
    if (!expectedValues.has(label) && !dynamicLabels.has(label)) {
      errors.push(`Signed bundle summary has an unknown label: ${label}`);
      continue;
    }
    if (parsedValues.has(label)) {
      errors.push(`Signed bundle summary has a duplicate label: ${label}`);
      continue;
    }
    parsedValues.set(label, value);
  }
  if (titleCount !== 1) errors.push(`Signed bundle summary must contain its title exactly once: ${expectedTitle}`);
  for (const [label, expectedValue] of expectedValues) {
    if (parsedValues.get(label) !== expectedValue) {
      errors.push(`Signed bundle summary has an invalid ${label}: expected ${expectedValue}`);
    }
  }

  if (!/^Certificate SHA-256: [a-f0-9]{64}$/m.test(summary)) {
    errors.push('Signed bundle certificate SHA-256 is invalid');
  }
  for (const label of ['Runtime 16 KB native libraries checked', 'Runtime 16 KB ELF LOAD segments checked']) {
    if (!new RegExp(`^${label}: [1-9]\\d*$`, 'm').test(summary)) {
      errors.push(`Signed bundle summary has an invalid ${label}`);
    }
  }
  return errors;
};

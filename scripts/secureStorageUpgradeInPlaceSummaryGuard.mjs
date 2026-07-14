import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}:`));

  return line ? line.slice(label.length + 1).trim() : '';
};

const hasLine = (content, expectedLine) => content.split(/\r?\n/).includes(expectedLine);
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;
const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

const requireFileEvidence = (summary, prefix, errors, requireArtifacts) => {
  const filePath = getLineValue(summary, `${prefix} APK path`);
  const bytes = getLineValue(summary, `${prefix} APK bytes`);
  const sha256 = getLineValue(summary, `${prefix} APK sha256`);

  if (!filePath) {
    errors.push(`${prefix} APK path is missing`);
    return;
  }

  if (!isPositiveInteger(bytes)) {
    errors.push(`${prefix} APK bytes must be a positive integer`);
  }

  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    errors.push(`${prefix} APK sha256 must be a lowercase SHA-256 digest`);
  }

  if (!requireArtifacts) {
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).size <= 0) {
    errors.push(`${prefix} APK path must point to a non-empty file`);
    return;
  }

  if (Number(bytes) !== statSync(filePath).size) {
    errors.push(`${prefix} APK bytes do not match the current file`);
  }

  if (sha256 !== fileSha256(filePath)) {
    errors.push(`${prefix} APK sha256 does not match the current file`);
  }
};

export const getSecureStorageUpgradeInPlaceSummaryErrors = (summary, { requireArtifacts = true } = {}) => {
  const errors = [];

  if (!isIsoTimestamp(getLineValue(summary, 'Generated at'))) {
    errors.push('Generated at must be an ISO timestamp');
  }

  [
    'Secure-storage upgrade-in-place outcome: passed',
    'Secure-storage upgrade-in-place exit code: 0',
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
  ].forEach(expectedLine => {
    if (!hasLine(summary, expectedLine)) {
      errors.push(`Expected line not found: ${expectedLine}`);
    }
  });

  ['Android serial', 'Android package', 'Persisted wallet name'].forEach(label => {
    if (!getLineValue(summary, label)) {
      errors.push(`${label} is missing`);
    }
  });

  ['Pre-update App PID', 'Post-update App PID', 'Captured logcat lines', 'Screenshot bytes'].forEach(label => {
    if (!isPositiveInteger(getLineValue(summary, label))) {
      errors.push(`${label} must be a positive integer`);
    }
  });

  const preUpdatePid = getLineValue(summary, 'Pre-update App PID');
  const postUpdatePid = getLineValue(summary, 'Post-update App PID');
  if (isPositiveInteger(preUpdatePid) && preUpdatePid === postUpdatePid) {
    errors.push('Pre-update App PID and Post-update App PID must differ');
  }

  requireFileEvidence(summary, 'Baseline', errors, requireArtifacts);
  requireFileEvidence(summary, 'Candidate', errors, requireArtifacts);

  const baselineSha = getLineValue(summary, 'Baseline APK sha256');
  const candidateSha = getLineValue(summary, 'Candidate APK sha256');
  if (/^[a-f0-9]{64}$/.test(baselineSha) && baselineSha === candidateSha) {
    errors.push('Baseline and candidate APK SHA-256 digests must differ');
  }

  if (/^(Mnemonic|Seed phrase|Private key|WIF|Secret|PIN):/im.test(summary)) {
    errors.push('Summary must not contain secret-bearing fields');
  }

  return errors;
};

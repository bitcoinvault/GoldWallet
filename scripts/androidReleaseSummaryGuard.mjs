import { existsSync, statSync } from 'fs';
import path from 'path';

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};

const hasLine = (content, expectedLine) => content.split(/\r?\n/).includes(expectedLine);
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;
const isSha256 = value => /^[a-f0-9]{64}$/.test(value);

export const getAndroidReleaseSummaryErrors = (summary, root = process.cwd(), options = {}) => {
  const errors = [];
  const expectedApkRelativePath =
    options.expectedApkRelativePath || 'android\\app\\build\\outputs\\apk\\dev\\release\\app-dev-release-unsigned.apk';
  const apkRelativePath = getLineValue(summary, 'Release APK');
  const apkSize = getLineValue(summary, 'Release APK bytes');
  const apkSha256 = getLineValue(summary, 'Release APK sha256');
  const apkPath = apkRelativePath ? path.join(root, apkRelativePath) : '';
  const requiredAction = getLineValue(summary, 'Required Sentry upload follow-up');
  const javaExecutable = getLineValue(summary, 'Java executable');
  const javaVersion = getLineValue(summary, 'Java version');

  if (!summary.startsWith('Android dev release validation')) {
    errors.push('summary header is missing or invalid');
  }

  ['Generated at', 'Started at'].forEach(label => {
    const value = getLineValue(summary, label);

    if (!isIsoTimestamp(value)) {
      errors.push(`${label} must be an ISO timestamp. Received: ${value || 'missing'}`);
    }
  });

  [
    'Gradle task: :app:assembleDevRelease',
    'Exit code: 0',
    'Sentry auto upload disabled for local build: yes',
    'Sentry release upload validation: not claimed',
    'Release APK exists: yes',
  ].forEach(expectedLine => {
    if (!hasLine(summary, expectedLine)) {
      errors.push(`Expected line not found: ${expectedLine}`);
    }
  });

  if (apkRelativePath !== expectedApkRelativePath) {
    errors.push(`Release APK path is unexpected: ${apkRelativePath || 'missing'}`);
  }

  if (!isPositiveInteger(apkSize)) {
    errors.push(`Release APK bytes must be a positive integer. Received: ${apkSize || 'missing'}`);
  }

  if (!isSha256(apkSha256)) {
    errors.push(`Release APK sha256 must be a lowercase SHA-256 digest. Received: ${apkSha256 || 'missing'}`);
  }

  if (!javaExecutable) {
    errors.push('Java executable line is missing');
  }

  if (!javaVersion.includes('17.')) {
    errors.push(`Java version must report JDK 17. Received: ${javaVersion || 'missing'}`);
  }

  if (!apkPath || !existsSync(apkPath)) {
    errors.push(`Release APK file does not exist: ${apkRelativePath || 'missing'}`);
  } else if (statSync(apkPath).size !== Number(apkSize)) {
    errors.push(`Release APK byte count does not match file size for ${apkRelativePath}`);
  }

  if (!requiredAction.includes('sentry.properties') || !requiredAction.includes('SENTRY_AUTH_TOKEN')) {
    errors.push('Sentry required-action line must name sentry.properties and SENTRY_AUTH_TOKEN');
  }

  return errors;
};

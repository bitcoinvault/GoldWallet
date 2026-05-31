import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};

const hasLine = (content, expectedLine) => content.split(/\r?\n/).includes(expectedLine);
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;
const isNonNegativeInteger = value => /^\d+$/.test(value);
const isSha256 = value => /^[a-f0-9]{64}$/.test(value);
const sha256File = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

export const getAndroidReleaseSummaryErrors = (summary, root = process.cwd(), options = {}) => {
  const errors = [];
  const expectedVariants = options.expectedVariants || ['dev', 'stage', 'prod'];
  const variants = getLineValue(summary, 'Variants')
    .split(',')
    .map(variant => variant.trim())
    .filter(Boolean);
  const variantCount = getLineValue(summary, 'Variant count');
  const requiredAction = getLineValue(summary, 'Required Sentry upload follow-up');
  const javaExecutable = getLineValue(summary, 'Java executable');
  const javaVersion = getLineValue(summary, 'Java version');

  if (!summary.startsWith('Android release validation')) {
    errors.push('summary header is missing or invalid');
  }

  ['Generated at', 'Started at'].forEach(label => {
    const value = getLineValue(summary, label);

    if (!isIsoTimestamp(value)) {
      errors.push(`${label} must be an ISO timestamp. Received: ${value || 'missing'}`);
    }
  });

  [
    'Sentry auto upload disabled for local build: yes',
    'Sentry release upload validation: not claimed',
  ].forEach(expectedLine => {
    if (!hasLine(summary, expectedLine)) {
      errors.push(`Expected line not found: ${expectedLine}`);
    }
  });

  if (variants.join(',') !== expectedVariants.join(',')) {
    errors.push(`Variants are unexpected: ${variants.join(', ') || 'missing'}`);
  }

  if (!isPositiveInteger(variantCount) || Number(variantCount) !== expectedVariants.length) {
    errors.push(`Variant count must be ${expectedVariants.length}. Received: ${variantCount || 'missing'}`);
  }

  expectedVariants.forEach(variant => {
    const expectedTask = `:app:assemble${variant[0].toUpperCase()}${variant.slice(1)}Release`;
    const apkRelativePath = getLineValue(summary, `Variant ${variant} Release APK`);
    const apkSize = getLineValue(summary, `Variant ${variant} Release APK bytes`);
    const apkSha256 = getLineValue(summary, `Variant ${variant} Release APK sha256`);
    const apkPath = apkRelativePath ? path.join(root, apkRelativePath) : '';

    [
      `Variant ${variant} Gradle task: ${expectedTask}`,
      `Variant ${variant} exit code: 0`,
      `Variant ${variant} Release APK exists: yes`,
      `Variant ${variant} spawn error: none`,
    ].forEach(expectedLine => {
      if (!hasLine(summary, expectedLine)) {
        errors.push(`Expected line not found: ${expectedLine}`);
      }
    });

    const expectedApkRelativePath =
      options.expectedApkRelativePaths?.[variant] ||
      path.join(
        'android',
        'app',
        'build',
        'outputs',
        'apk',
        variant,
        'release',
        `app-${variant}-release-unsigned.apk`,
      );

    if (apkRelativePath !== expectedApkRelativePath) {
      errors.push(`Variant ${variant} Release APK path is unexpected: ${apkRelativePath || 'missing'}`);
    }

    if (!isPositiveInteger(apkSize)) {
      errors.push(`Variant ${variant} Release APK bytes must be a positive integer. Received: ${apkSize || 'missing'}`);
    }

    if (!isSha256(apkSha256)) {
      errors.push(`Variant ${variant} Release APK sha256 must be a lowercase SHA-256 digest. Received: ${apkSha256 || 'missing'}`);
    }

    if (!apkPath || !existsSync(apkPath)) {
      errors.push(`Variant ${variant} Release APK file does not exist: ${apkRelativePath || 'missing'}`);
    } else {
      if (isNonNegativeInteger(apkSize) && statSync(apkPath).size !== Number(apkSize)) {
        errors.push(`Variant ${variant} Release APK byte count does not match file size for ${apkRelativePath}`);
      }

      if (isSha256(apkSha256) && sha256File(apkPath) !== apkSha256) {
        errors.push(`Variant ${variant} Release APK sha256 does not match file digest for ${apkRelativePath}`);
      }
    }
  });

  if (summary.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') || summary.includes('CODEPUSH_DEPLOYMENT_KEY_IOS=')) {
    errors.push('Android release summary must not print CodePush deployment key values');
  }

  if (!javaExecutable) {
    errors.push('Java executable line is missing');
  }

  if (!javaVersion.includes('17.')) {
    errors.push(`Java version must report JDK 17. Received: ${javaVersion || 'missing'}`);
  }

  if (!requiredAction.includes('sentry.properties') || !requiredAction.includes('SENTRY_AUTH_TOKEN')) {
    errors.push('Sentry required-action line must name sentry.properties and SENTRY_AUTH_TOKEN');
  }

  return errors;
};

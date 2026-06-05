import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';

export const androidReleaseFingerprintInputs = [
  'package.json',
  'yarn.lock',
  'android/build.gradle',
  'android/app/build.gradle',
  'android/gradle.properties',
  'android/gradle/wrapper/gradle-wrapper.properties',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/src/main/java/io/goldwallet/wallet/MainApplication.java',
  'android/app/src/main/res/values/strings.xml',
  'android/app/src/beta/google-services.json',
  'android/app/src/dev/google-services.json',
  'android/app/src/prod/google-services.json',
  'android/app/src/stage/google-services.json',
  '.env.beta.mainnet',
  '.env.beta.testnet',
  '.env.dev.testnet',
  '.env.prod.mainnet',
  '.env.stage.mainnet',
];

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
export const normalizeAndroidReleaseFingerprintContent = content =>
  content.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

export const getAndroidReleaseInputFingerprint = (root = process.cwd(), inputs = androidReleaseFingerprintInputs) => {
  const hash = createHash('sha256');

  inputs.forEach(relativePath => {
    const absolutePath = path.join(root, relativePath);

    hash.update(relativePath.replaceAll(path.sep, '/'));
    hash.update('\0');

    if (existsSync(absolutePath)) {
      hash.update(normalizeAndroidReleaseFingerprintContent(readFileSync(absolutePath)));
    } else {
      hash.update('<missing>');
    }

    hash.update('\0');
  });

  return hash.digest('hex');
};

export const getAndroidReleaseSummaryErrors = (summary, root = process.cwd(), options = {}) => {
  const errors = [];
  const expectedVariants = options.expectedVariants || ['dev', 'stage', 'prod', 'beta'];
  const variants = getLineValue(summary, 'Variants')
    .split(',')
    .map(variant => variant.trim())
    .filter(Boolean);
  const variantCount = getLineValue(summary, 'Variant count');
  const requiredAction = getLineValue(summary, 'Required Sentry upload follow-up');
  const javaExecutable = getLineValue(summary, 'Java executable');
  const javaVersion = getLineValue(summary, 'Java version');
  const releaseInputFingerprint = getLineValue(summary, 'Release input fingerprint');
  const releaseInputFingerprintFiles = getLineValue(summary, 'Release input fingerprint files');
  const gradleRetryMaxAttempts = getLineValue(summary, 'Gradle retry max attempts');
  const gradleRetryExitCodes = getLineValue(summary, 'Gradle retry exit codes');
  const currentReleaseInputFingerprint = getAndroidReleaseInputFingerprint(root);

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

  if (!isSha256(releaseInputFingerprint)) {
    errors.push(`Release input fingerprint must be a lowercase SHA-256 digest. Received: ${releaseInputFingerprint || 'missing'}`);
  } else if (releaseInputFingerprint !== currentReleaseInputFingerprint) {
    errors.push('Release input fingerprint does not match current release inputs; rerun android:dev:release:validate-local');
  }

  if (!isPositiveInteger(releaseInputFingerprintFiles) || Number(releaseInputFingerprintFiles) !== androidReleaseFingerprintInputs.length) {
    errors.push(
      `Release input fingerprint files must be ${androidReleaseFingerprintInputs.length}. Received: ${
        releaseInputFingerprintFiles || 'missing'
      }`,
    );
  }

  if (!isPositiveInteger(gradleRetryMaxAttempts)) {
    errors.push(`Gradle retry max attempts must be a positive integer. Received: ${gradleRetryMaxAttempts || 'missing'}`);
  }

  if (gradleRetryExitCodes !== 'none' && !/^\d+(, \d+)*$/.test(gradleRetryExitCodes)) {
    errors.push(`Gradle retry exit codes must be comma-separated integer exit codes or none. Received: ${gradleRetryExitCodes || 'missing'}`);
  }

  expectedVariants.forEach(variant => {
    const expectedTask = `:app:assemble${variant[0].toUpperCase()}${variant.slice(1)}Release`;
    const apkRelativePath = getLineValue(summary, `Variant ${variant} Release APK`);
    const apkSize = getLineValue(summary, `Variant ${variant} Release APK bytes`);
    const apkSha256 = getLineValue(summary, `Variant ${variant} Release APK sha256`);
    const gradleAttempts = getLineValue(summary, `Variant ${variant} Gradle attempts`);
    const gradleAttemptExitCodes = getLineValue(summary, `Variant ${variant} Gradle attempt exit codes`);
    const gradleRetryReason = getLineValue(summary, `Variant ${variant} Gradle retry reason`);
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

    if (!isPositiveInteger(gradleAttempts)) {
      errors.push(`Variant ${variant} Gradle attempts must be a positive integer. Received: ${gradleAttempts || 'missing'}`);
    }

    const attemptExitCodes = gradleAttemptExitCodes
      .split(',')
      .map(code => code.trim())
      .filter(Boolean);

    if (attemptExitCodes.length === 0 || attemptExitCodes.some(code => !/^\d+$/.test(code))) {
      errors.push(`Variant ${variant} Gradle attempt exit codes must be comma-separated integers. Received: ${gradleAttemptExitCodes || 'missing'}`);
    }

    if (isPositiveInteger(gradleAttempts) && attemptExitCodes.length !== Number(gradleAttempts)) {
      errors.push(`Variant ${variant} Gradle attempt exit code count must match Gradle attempts`);
    }

    if (isPositiveInteger(gradleAttempts) && Number(gradleAttempts) > 1 && gradleRetryReason === 'none') {
      errors.push(`Variant ${variant} Gradle retry reason must describe retry when attempts exceed 1`);
    }

    if (isPositiveInteger(gradleAttempts) && Number(gradleAttempts) === 1 && gradleRetryReason !== 'none') {
      errors.push(`Variant ${variant} Gradle retry reason must be none for a single attempt`);
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

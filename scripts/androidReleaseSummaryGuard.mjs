import { createHash } from 'crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

export const androidReleaseFingerprintInputs = [
  'package.json',
  'yarn.lock',
  'babel.config.js',
  'metro.config.js',
  'react-native.config.js',
  'android/build.gradle',
  'android/app/build.gradle',
  'android/release-version.properties',
  'android/release-version.gradle',
  'android/release-version-contract.json',
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

export const androidReleaseSourceFingerprintRoots = [
  'App.tsx',
  'Main.tsx',
  'index.js',
  'BlueApp.js',
  'BlueElectrum.js',
  'encryption.js',
  'events.js',
  'prompt.js',
  'shim.js',
  'class',
  'error',
  'img',
  'loc',
  'logger',
  'models',
  'src',
  'utils',
];

const androidReleaseSourceFingerprintExtensions = new Set([
  '.gif',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.jsx',
  '.otf',
  '.png',
  '.svg',
  '.ts',
  '.tsx',
  '.ttf',
  '.webp',
]);
const ignoredSourceFingerprintDirectories = new Set([
  '__mocks__',
  '__tests__',
  'android',
  'artifacts',
  'coverage',
  'ios',
  'local-docs',
  'node_modules',
  'scripts',
  'tests',
]);
const binaryFingerprintExtensions = new Set(['.gif', '.jpeg', '.jpg', '.otf', '.png', '.ttf', '.webp']);
const releaseTestFilePattern = /\.(?:e2e|spec|test)\.[jt]sx?$/i;

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
const isLikelySourceMap = filePath => {
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));

    return parsed && parsed.version === 3 && Array.isArray(parsed.sources) && typeof parsed.mappings === 'string';
  } catch {
    return false;
  }
};
export const normalizeAndroidReleaseFingerprintContent = content =>
  content.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const toRelativePath = absolutePath => absolutePath.split(path.sep).join('/');

const collectReleaseSourceFingerprintFiles = (root, relativeRoot) => {
  const absoluteRoot = path.join(root, relativeRoot);

  if (!existsSync(absoluteRoot)) {
    return [];
  }

  const stat = statSync(absoluteRoot);
  if (stat.isFile()) {
    return androidReleaseSourceFingerprintExtensions.has(path.extname(relativeRoot).toLowerCase()) &&
      !releaseTestFilePattern.test(path.basename(relativeRoot))
      ? [toRelativePath(relativeRoot)]
      : [];
  }

  if (!stat.isDirectory()) {
    return [];
  }

  const entries = readdirSync(absoluteRoot, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  return entries.flatMap(entry => {
    const childRelativePath = path.join(relativeRoot, entry.name);

    if (entry.isDirectory()) {
      return ignoredSourceFingerprintDirectories.has(entry.name)
        ? []
        : collectReleaseSourceFingerprintFiles(root, childRelativePath);
    }

    if (
      !entry.isFile() ||
      releaseTestFilePattern.test(entry.name) ||
      !androidReleaseSourceFingerprintExtensions.has(path.extname(entry.name).toLowerCase())
    ) {
      return [];
    }

    return [toRelativePath(childRelativePath)];
  });
};

export const getAndroidReleaseInputFingerprintFiles = (root = process.cwd()) => {
  const files = new Set(androidReleaseFingerprintInputs.map(toRelativePath));

  androidReleaseSourceFingerprintRoots
    .flatMap(relativeRoot => collectReleaseSourceFingerprintFiles(root, relativeRoot))
    .forEach(relativePath => files.add(relativePath));

  return [...files].sort();
};

export const getAndroidReleaseInputFingerprintFileCount = (root = process.cwd()) =>
  getAndroidReleaseInputFingerprintFiles(root).length;

const readFingerprintContent = filePath => {
  const content = readFileSync(filePath);

  return binaryFingerprintExtensions.has(path.extname(filePath).toLowerCase())
    ? content
    : normalizeAndroidReleaseFingerprintContent(content);
};

export const getAndroidReleaseInputFingerprint = (
  root = process.cwd(),
  inputs = getAndroidReleaseInputFingerprintFiles(root),
) => {
  const hash = createHash('sha256');

  inputs.forEach(relativePath => {
    const absolutePath = path.join(root, relativePath);

    hash.update(toRelativePath(relativePath));
    hash.update('\0');

    if (existsSync(absolutePath)) {
      hash.update(readFingerprintContent(absolutePath));
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
  const androidGradlePlugin = getLineValue(summary, 'Android Gradle Plugin');
  const gradleWrapper = getLineValue(summary, 'Gradle wrapper');
  const kotlinGradlePlugin = getLineValue(summary, 'Kotlin Gradle Plugin');
  const compileSdk = getLineValue(summary, 'Compile SDK');
  const targetSdk = getLineValue(summary, 'Target SDK');
  const androidSdkResolutionSource = getLineValue(summary, 'Android SDK resolution source');
  const explicitAndroidHomePresent = getLineValue(summary, 'Explicit ANDROID_HOME present');
  const explicitAndroidSdkRootPresent = getLineValue(summary, 'Explicit ANDROID_SDK_ROOT present');
  const androidLocalPropertiesPresent = getLineValue(summary, 'Android local.properties present');
  const releaseInputFingerprint = getLineValue(summary, 'Release input fingerprint');
  const releaseInputFingerprintFiles = getLineValue(summary, 'Release input fingerprint files');
  const gradleRetryMaxAttempts = getLineValue(summary, 'Gradle retry max attempts');
  const gradleRetryExitCodes = getLineValue(summary, 'Gradle retry exit codes');
  const currentReleaseInputFingerprint = getAndroidReleaseInputFingerprint(root);
  const currentReleaseInputFingerprintFileCount = getAndroidReleaseInputFingerprintFileCount(root);

  if (!summary.startsWith('Android release validation')) {
    errors.push('summary header is missing or invalid');
  }

  ['Generated at', 'Started at'].forEach(label => {
    const value = getLineValue(summary, label);

    if (!isIsoTimestamp(value)) {
      errors.push(`${label} must be an ISO timestamp. Received: ${value || 'missing'}`);
    }
  });

  ['Sentry auto upload disabled for local build: yes', 'Sentry release upload validation: not claimed'].forEach(
    expectedLine => {
      if (!hasLine(summary, expectedLine)) {
        errors.push(`Expected line not found: ${expectedLine}`);
      }
    },
  );

  if (variants.join(',') !== expectedVariants.join(',')) {
    errors.push(`Variants are unexpected: ${variants.join(', ') || 'missing'}`);
  }

  if (!isPositiveInteger(variantCount) || Number(variantCount) !== expectedVariants.length) {
    errors.push(`Variant count must be ${expectedVariants.length}. Received: ${variantCount || 'missing'}`);
  }

  const allowedAndroidSdkResolutionSources = new Set([
    'ANDROID_HOME',
    'ANDROID_SDK_ROOT',
    'ANDROID_HOME+ANDROID_SDK_ROOT',
    'LOCALAPPDATA',
    'HOME_LIBRARY',
    'HOME_ANDROID',
    'none',
  ]);
  if (!allowedAndroidSdkResolutionSources.has(androidSdkResolutionSource)) {
    errors.push(`Android SDK resolution source is invalid: ${androidSdkResolutionSource || 'missing'}`);
  }

  [
    ['Explicit ANDROID_HOME present', explicitAndroidHomePresent],
    ['Explicit ANDROID_SDK_ROOT present', explicitAndroidSdkRootPresent],
    ['Android local.properties present', androidLocalPropertiesPresent],
  ].forEach(([label, value]) => {
    if (!['yes', 'no'].includes(value)) errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
  });

  const expectedExplicitSdkFlags = {
    ANDROID_HOME: ['yes', 'no'],
    ANDROID_SDK_ROOT: ['no', 'yes'],
    'ANDROID_HOME+ANDROID_SDK_ROOT': ['yes', 'yes'],
    LOCALAPPDATA: ['no', 'no'],
    HOME_LIBRARY: ['no', 'no'],
    HOME_ANDROID: ['no', 'no'],
    none: ['no', 'no'],
  }[androidSdkResolutionSource];
  if (
    expectedExplicitSdkFlags &&
    (explicitAndroidHomePresent !== expectedExplicitSdkFlags[0] ||
      explicitAndroidSdkRootPresent !== expectedExplicitSdkFlags[1])
  ) {
    errors.push(
      `Android SDK resolution source ${androidSdkResolutionSource} requires explicit SDK flags ${expectedExplicitSdkFlags.join('/')}`,
    );
  }

  if (androidSdkResolutionSource === 'none' && androidLocalPropertiesPresent !== 'yes') {
    errors.push('Android SDK resolution may be none only when android/local.properties is present');
  }

  if (!isSha256(releaseInputFingerprint)) {
    errors.push(
      `Release input fingerprint must be a lowercase SHA-256 digest. Received: ${releaseInputFingerprint || 'missing'}`,
    );
  } else if (releaseInputFingerprint !== currentReleaseInputFingerprint) {
    errors.push(
      'Release input fingerprint does not match current release inputs; rerun android:dev:release:validate-local',
    );
  }

  if (
    !isPositiveInteger(releaseInputFingerprintFiles) ||
    Number(releaseInputFingerprintFiles) !== currentReleaseInputFingerprintFileCount
  ) {
    errors.push(
      `Release input fingerprint files must be ${currentReleaseInputFingerprintFileCount}. Received: ${
        releaseInputFingerprintFiles || 'missing'
      }`,
    );
  }

  if (!isPositiveInteger(gradleRetryMaxAttempts)) {
    errors.push(
      `Gradle retry max attempts must be a positive integer. Received: ${gradleRetryMaxAttempts || 'missing'}`,
    );
  }

  if (gradleRetryExitCodes !== 'none' && !/^\d+(, \d+)*$/.test(gradleRetryExitCodes)) {
    errors.push(
      `Gradle retry exit codes must be comma-separated integer exit codes or none. Received: ${gradleRetryExitCodes || 'missing'}`,
    );
  }

  expectedVariants.forEach(variant => {
    const expectedTask = `:app:assemble${variant[0].toUpperCase()}${variant.slice(1)}Release`;
    const apkRelativePath = getLineValue(summary, `Variant ${variant} Release APK`);
    const apkSize = getLineValue(summary, `Variant ${variant} Release APK bytes`);
    const apkSha256 = getLineValue(summary, `Variant ${variant} Release APK sha256`);
    const bundleRelativePath = getLineValue(summary, `Variant ${variant} Release JS bundle`);
    const bundleSize = getLineValue(summary, `Variant ${variant} Release JS bundle bytes`);
    const bundleSha256 = getLineValue(summary, `Variant ${variant} Release JS bundle sha256`);
    const sourcemapRelativePath = getLineValue(summary, `Variant ${variant} Release source map`);
    const sourcemapSize = getLineValue(summary, `Variant ${variant} Release source map bytes`);
    const sourcemapSha256 = getLineValue(summary, `Variant ${variant} Release source map sha256`);
    const gradleAttempts = getLineValue(summary, `Variant ${variant} Gradle attempts`);
    const gradleAttemptExitCodes = getLineValue(summary, `Variant ${variant} Gradle attempt exit codes`);
    const gradleRetryReason = getLineValue(summary, `Variant ${variant} Gradle retry reason`);
    const variantExitCode = getLineValue(summary, `Variant ${variant} exit code`);
    const apkPath = apkRelativePath ? path.join(root, apkRelativePath) : '';
    const bundlePath = bundleRelativePath ? path.join(root, bundleRelativePath) : '';
    const sourcemapPath = sourcemapRelativePath ? path.join(root, sourcemapRelativePath) : '';

    [
      `Variant ${variant} Gradle task: ${expectedTask}`,
      `Variant ${variant} exit code: 0`,
      `Variant ${variant} Release APK exists: yes`,
      `Variant ${variant} Release JS bundle exists: yes`,
      `Variant ${variant} Release source map exists: yes`,
      `Variant ${variant} spawn error: none`,
    ].forEach(expectedLine => {
      if (!hasLine(summary, expectedLine)) {
        errors.push(`Expected line not found: ${expectedLine}`);
      }
    });

    const expectedApkRelativePath =
      options.expectedApkRelativePaths?.[variant] ||
      path.join('android', 'app', 'build', 'outputs', 'apk', variant, 'release', `app-${variant}-release-unsigned.apk`);
    const expectedBundleRelativePath =
      options.expectedBundleRelativePaths?.[variant] ||
      path.join(
        'android',
        'app',
        'build',
        'intermediates',
        'assets',
        `${variant}Release`,
        `merge${variant[0].toUpperCase()}${variant.slice(1)}ReleaseAssets`,
        'index.android.bundle',
      );
    const expectedSourcemapRelativePath =
      options.expectedSourcemapRelativePaths?.[variant] ||
      path.join(
        'android',
        'app',
        'build',
        'generated',
        'sourcemaps',
        'react',
        `${variant}Release`,
        'index.android.bundle.map',
      );

    if (apkRelativePath !== expectedApkRelativePath) {
      errors.push(`Variant ${variant} Release APK path is unexpected: ${apkRelativePath || 'missing'}`);
    }

    if (bundleRelativePath !== expectedBundleRelativePath) {
      errors.push(`Variant ${variant} Release JS bundle path is unexpected: ${bundleRelativePath || 'missing'}`);
    }

    if (sourcemapRelativePath !== expectedSourcemapRelativePath) {
      errors.push(`Variant ${variant} Release source map path is unexpected: ${sourcemapRelativePath || 'missing'}`);
    }

    if (!isPositiveInteger(apkSize)) {
      errors.push(`Variant ${variant} Release APK bytes must be a positive integer. Received: ${apkSize || 'missing'}`);
    }

    if (!isSha256(apkSha256)) {
      errors.push(
        `Variant ${variant} Release APK sha256 must be a lowercase SHA-256 digest. Received: ${apkSha256 || 'missing'}`,
      );
    }

    if (!isPositiveInteger(bundleSize)) {
      errors.push(
        `Variant ${variant} Release JS bundle bytes must be a positive integer. Received: ${bundleSize || 'missing'}`,
      );
    }

    if (!isSha256(bundleSha256)) {
      errors.push(
        `Variant ${variant} Release JS bundle sha256 must be a lowercase SHA-256 digest. Received: ${bundleSha256 || 'missing'}`,
      );
    }

    if (!isPositiveInteger(sourcemapSize)) {
      errors.push(
        `Variant ${variant} Release source map bytes must be a positive integer. Received: ${sourcemapSize || 'missing'}`,
      );
    }

    if (!isSha256(sourcemapSha256)) {
      errors.push(
        `Variant ${variant} Release source map sha256 must be a lowercase SHA-256 digest. Received: ${sourcemapSha256 || 'missing'}`,
      );
    }

    if (!isPositiveInteger(gradleAttempts)) {
      errors.push(
        `Variant ${variant} Gradle attempts must be a positive integer. Received: ${gradleAttempts || 'missing'}`,
      );
    }

    const attemptExitCodes = gradleAttemptExitCodes
      .split(',')
      .map(code => code.trim())
      .filter(Boolean);

    if (attemptExitCodes.length === 0 || attemptExitCodes.some(code => !/^\d+$/.test(code))) {
      errors.push(
        `Variant ${variant} Gradle attempt exit codes must be comma-separated integers. Received: ${gradleAttemptExitCodes || 'missing'}`,
      );
    }

    if (isPositiveInteger(gradleAttempts) && attemptExitCodes.length !== Number(gradleAttempts)) {
      errors.push(`Variant ${variant} Gradle attempt exit code count must match Gradle attempts`);
    }

    if (
      isPositiveInteger(gradleAttempts) &&
      isPositiveInteger(gradleRetryMaxAttempts) &&
      Number(gradleAttempts) > Number(gradleRetryMaxAttempts)
    ) {
      errors.push(`Variant ${variant} Gradle attempts must not exceed Gradle retry max attempts`);
    }

    if (attemptExitCodes.length > 0 && attemptExitCodes.at(-1) !== variantExitCode) {
      errors.push(`Variant ${variant} final attempt exit code must match the variant exit code`);
    }

    if (attemptExitCodes.slice(0, -1).some(code => code === '0')) {
      errors.push(`Variant ${variant} earlier Gradle attempts must be nonzero when a retry is recorded`);
    }

    if (isPositiveInteger(gradleAttempts) && Number(gradleAttempts) > 1 && gradleRetryReason === 'none') {
      errors.push(`Variant ${variant} Gradle retry reason must describe retry when attempts exceed 1`);
    }

    if (isPositiveInteger(gradleAttempts) && Number(gradleAttempts) > 1) {
      const retryAttempt = Number(gradleAttempts) - 1;
      const retriedExitCode = attemptExitCodes[retryAttempt - 1];
      const codegenReason = `attempt ${retryAttempt} encountered missing generated React Native JNI/CMake input; retrying next attempt`;
      const transientReason = `attempt ${retryAttempt} exited with known transient Windows native-build code ${retriedExitCode}; retrying next attempt`;
      const configuredTransientExitCodes = gradleRetryExitCodes === 'none' ? [] : gradleRetryExitCodes.split(', ');
      const recognizedReason =
        gradleRetryReason === codegenReason ||
        (gradleRetryReason === transientReason && configuredTransientExitCodes.includes(retriedExitCode));

      if (!recognizedReason) {
        errors.push(`Variant ${variant} Gradle retry reason must match a recognized failed attempt`);
      }
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

    if (!bundlePath || !existsSync(bundlePath)) {
      errors.push(`Variant ${variant} Release JS bundle file does not exist: ${bundleRelativePath || 'missing'}`);
    } else {
      if (isNonNegativeInteger(bundleSize) && statSync(bundlePath).size !== Number(bundleSize)) {
        errors.push(
          `Variant ${variant} Release JS bundle byte count does not match file size for ${bundleRelativePath}`,
        );
      }

      if (isSha256(bundleSha256) && sha256File(bundlePath) !== bundleSha256) {
        errors.push(`Variant ${variant} Release JS bundle sha256 does not match file digest for ${bundleRelativePath}`);
      }
    }

    if (!sourcemapPath || !existsSync(sourcemapPath)) {
      errors.push(`Variant ${variant} Release source map file does not exist: ${sourcemapRelativePath || 'missing'}`);
    } else {
      if (isNonNegativeInteger(sourcemapSize) && statSync(sourcemapPath).size !== Number(sourcemapSize)) {
        errors.push(
          `Variant ${variant} Release source map byte count does not match file size for ${sourcemapRelativePath}`,
        );
      }

      if (isSha256(sourcemapSha256) && sha256File(sourcemapPath) !== sourcemapSha256) {
        errors.push(
          `Variant ${variant} Release source map sha256 does not match file digest for ${sourcemapRelativePath}`,
        );
      }

      if (!isLikelySourceMap(sourcemapPath)) {
        errors.push(`Variant ${variant} Release source map must be a valid source-map JSON file`);
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

  if (androidGradlePlugin !== '8.13.2') {
    errors.push(
      `Android Gradle Plugin must be 8.13.2 for the validated release baseline. Received: ${androidGradlePlugin || 'missing'}`,
    );
  }

  if (gradleWrapper !== '8.13') {
    errors.push(
      `Gradle wrapper must be 8.13 for the validated release baseline. Received: ${gradleWrapper || 'missing'}`,
    );
  }

  if (kotlinGradlePlugin !== '2.1.20') {
    errors.push(
      `Kotlin Gradle Plugin must be 2.1.20 for the validated release baseline. Received: ${kotlinGradlePlugin || 'missing'}`,
    );
  }

  if (compileSdk !== '36') {
    errors.push(`Compile SDK must be 36 for the validated release baseline. Received: ${compileSdk || 'missing'}`);
  }

  if (targetSdk !== '36') {
    errors.push(`Target SDK must be 36 for the validated release baseline. Received: ${targetSdk || 'missing'}`);
  }

  if (!requiredAction.includes('sentry.properties') || !requiredAction.includes('SENTRY_AUTH_TOKEN')) {
    errors.push('Sentry required-action line must name sentry.properties and SENTRY_AUTH_TOKEN');
  }

  return errors;
};

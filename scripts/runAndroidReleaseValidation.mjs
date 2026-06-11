import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { androidReleaseFingerprintInputs, getAndroidReleaseInputFingerprint } from './androidReleaseSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-release-dev-summary.txt');
const javaCommand = process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  : 'java';
const defaultVariants = ['dev', 'stage', 'prod', 'beta'];
const requestedVariants = (process.env.ANDROID_RELEASE_VARIANTS || defaultVariants.join(','))
  .split(',')
  .map(variant => variant.trim().toLowerCase())
  .filter(Boolean);
const allowedVariants = new Set(['dev', 'stage', 'prod', 'beta']);
const invalidVariants = requestedVariants.filter(variant => !allowedVariants.has(variant));
const transientGradleRetryExitCodes = (process.env.ANDROID_RELEASE_GRADLE_RETRY_EXIT_CODES || '1073807364')
  .split(',')
  .map(code => code.trim())
  .filter(Boolean);
const maxGradleAttempts = Number(process.env.ANDROID_RELEASE_GRADLE_MAX_ATTEMPTS || '2');

if (invalidVariants.length > 0) {
  console.error(`Unsupported Android release variant(s): ${invalidVariants.join(', ')}`);
  process.exit(1);
}

if (!Number.isInteger(maxGradleAttempts) || maxGradleAttempts < 1) {
  console.error(`ANDROID_RELEASE_GRADLE_MAX_ATTEMPTS must be a positive integer. Received: ${process.env.ANDROID_RELEASE_GRADLE_MAX_ATTEMPTS}`);
  process.exit(1);
}

if (transientGradleRetryExitCodes.some(code => !/^\d+$/.test(code))) {
  console.error(`ANDROID_RELEASE_GRADLE_RETRY_EXIT_CODES must be comma-separated integer exit codes. Received: ${process.env.ANDROID_RELEASE_GRADLE_RETRY_EXIT_CODES}`);
  process.exit(1);
}

const capitalize = value => `${value[0].toUpperCase()}${value.slice(1)}`;
const getApkPath = variant =>
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', variant, 'release', `app-${variant}-release-unsigned.apk`);
const getReleaseVariantName = variant => `${variant}Release`;
const getReleaseBundlePath = variant =>
  path.join(
    root,
    'android',
    'app',
    'build',
    'intermediates',
    'assets',
    getReleaseVariantName(variant),
    `merge${capitalize(variant)}ReleaseAssets`,
    'index.android.bundle',
  );
const getReleaseSourcemapPath = variant =>
  path.join(
    root,
    'android',
    'app',
    'build',
    'generated',
    'sourcemaps',
    'react',
    getReleaseVariantName(variant),
    'index.android.bundle.map',
  );
const getGeneratedReactPaths = variant => [
  path.join(root, 'android', 'app', 'build', 'generated', 'assets', 'react', getReleaseVariantName(variant)),
  path.join(root, 'android', 'app', 'build', 'generated', 'res', 'react', getReleaseVariantName(variant)),
  path.join(root, 'android', 'app', 'build', 'generated', 'sourcemaps', 'react', getReleaseVariantName(variant)),
  path.join(root, 'android', 'app', 'build', 'intermediates', 'sourcemaps', 'react', getReleaseVariantName(variant)),
];
const getFileEvidence = filePath => {
  const exists = existsSync(filePath);

  return {
    path: filePath,
    exists,
    size: exists ? statSync(filePath).size : 0,
    sha256: exists ? createHash('sha256').update(readFileSync(filePath)).digest('hex') : 'missing',
  };
};
const readTextFile = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const getFirstMatch = (content, pattern) => content.match(pattern)?.[1] || 'missing';
const androidBuildGradle = readTextFile(path.join('android', 'build.gradle'));
const gradleWrapperProperties = readTextFile(path.join('android', 'gradle', 'wrapper', 'gradle-wrapper.properties'));
const androidToolchainEvidence = {
  agp: getFirstMatch(androidBuildGradle, /com\.android\.tools\.build:gradle:([^"')]+)/),
  gradle: getFirstMatch(gradleWrapperProperties, /gradle-(\d+\.\d+(?:\.\d+)?)-/),
  kotlin: getFirstMatch(androidBuildGradle, /kotlinVersion\s*=\s*['"]([^'"]+)['"]/),
  compileSdk: getFirstMatch(androidBuildGradle, /compileSdkVersion\s*=\s*(\d+)/),
  targetSdk: getFirstMatch(androidBuildGradle, /targetSdkVersion\s*=\s*(\d+)/),
};

const env = {
  ...process.env,
  SENTRY_DISABLE_AUTO_UPLOAD: 'true',
};

const shouldRetryGradleResult = (result, attempt) => {
  const status = String(result.status ?? 1);

  return attempt < maxGradleAttempts && !result.error && transientGradleRetryExitCodes.includes(status);
};

const runGradleTaskWithBoundedRetry = task => {
  const attempts = [];
  let retryReason = 'none';
  let result;

  for (let attempt = 1; attempt <= maxGradleAttempts; attempt += 1) {
    result = spawnSync(process.execPath, [path.join(root, 'scripts', 'runAndroidGradle.mjs'), task, '--stacktrace'], {
      cwd: root,
      env,
      stdio: 'inherit',
    });

    attempts.push({
      status: result.status ?? 1,
      error: result.error?.message || '',
    });

    if ((result.status ?? 1) === 0 && !result.error) {
      break;
    }

    if (shouldRetryGradleResult(result, attempt)) {
      retryReason = `attempt ${attempt} exited with known transient Windows native-build code ${result.status}; retrying next attempt`;
      console.warn(`Android release Gradle task ${task} ${retryReason}.`);
      continue;
    }

    break;
  }

  return {
    result,
    attempts,
    retryReason,
  };
};

const startedAt = new Date().toISOString();
const variantResults = requestedVariants.map(variant => {
  const cleanedGeneratedReactPaths = getGeneratedReactPaths(variant);
  cleanedGeneratedReactPaths.forEach(generatedPath => {
    rmSync(generatedPath, { recursive: true, force: true });
  });

  const task = `:app:assemble${capitalize(variant)}Release`;
  const { result, attempts, retryReason } = runGradleTaskWithBoundedRetry(task);
  const apkPath = getApkPath(variant);
  const apkEvidence = getFileEvidence(apkPath);
  const bundleEvidence = getFileEvidence(getReleaseBundlePath(variant));
  const sourcemapEvidence = getFileEvidence(getReleaseSourcemapPath(variant));

  return {
    variant,
    task,
    status: result.status ?? 1,
    error: result.error?.message || '',
    attempts,
    retryReason,
    apk: apkEvidence,
    bundle: bundleEvidence,
    sourcemap: sourcemapEvidence,
    cleanedGeneratedReactPaths,
  };
});
const javaVersion = spawnSync(javaCommand, ['-version'], {
  cwd: root,
  encoding: 'utf8',
});
const javaVersionLine = `${javaVersion.stderr || ''}${javaVersion.stdout || ''}`.split(/\r?\n/)[0]?.trim() || 'unavailable';
const summary = [
  'Android release validation',
  `Generated at: ${new Date().toISOString()}`,
  `Started at: ${startedAt}`,
  `Variants: ${requestedVariants.join(', ')}`,
  `Variant count: ${variantResults.length}`,
  `Java executable: ${javaCommand}`,
  `Java version: ${javaVersionLine}`,
  `Android Gradle Plugin: ${androidToolchainEvidence.agp}`,
  `Gradle wrapper: ${androidToolchainEvidence.gradle}`,
  `Kotlin Gradle Plugin: ${androidToolchainEvidence.kotlin}`,
  `Compile SDK: ${androidToolchainEvidence.compileSdk}`,
  `Target SDK: ${androidToolchainEvidence.targetSdk}`,
  `Release input fingerprint: ${getAndroidReleaseInputFingerprint(root)}`,
  `Release input fingerprint files: ${androidReleaseFingerprintInputs.length}`,
  'Sentry auto upload disabled for local build: yes',
  'Sentry release upload validation: not claimed',
  `Gradle retry max attempts: ${maxGradleAttempts}`,
  `Gradle retry exit codes: ${transientGradleRetryExitCodes.join(', ') || 'none'}`,
  ...variantResults.flatMap(result => [
    `Variant ${result.variant} Gradle task: ${result.task}`,
    `Variant ${result.variant} exit code: ${result.status}`,
    `Variant ${result.variant} Gradle attempts: ${result.attempts.length}`,
    `Variant ${result.variant} Gradle attempt exit codes: ${result.attempts.map(attempt => attempt.status).join(', ')}`,
    `Variant ${result.variant} Gradle retry reason: ${result.retryReason}`,
    `Variant ${result.variant} Release APK: ${path.relative(root, result.apk.path)}`,
    `Variant ${result.variant} Release APK exists: ${result.apk.exists ? 'yes' : 'no'}`,
    `Variant ${result.variant} Release APK bytes: ${result.apk.size}`,
    `Variant ${result.variant} Release APK sha256: ${result.apk.sha256}`,
    `Variant ${result.variant} Release JS bundle: ${path.relative(root, result.bundle.path)}`,
    `Variant ${result.variant} Release JS bundle exists: ${result.bundle.exists ? 'yes' : 'no'}`,
    `Variant ${result.variant} Release JS bundle bytes: ${result.bundle.size}`,
    `Variant ${result.variant} Release JS bundle sha256: ${result.bundle.sha256}`,
    `Variant ${result.variant} Release source map: ${path.relative(root, result.sourcemap.path)}`,
    `Variant ${result.variant} Release source map exists: ${result.sourcemap.exists ? 'yes' : 'no'}`,
    `Variant ${result.variant} Release source map bytes: ${result.sourcemap.size}`,
    `Variant ${result.variant} Release source map sha256: ${result.sourcemap.sha256}`,
    `Variant ${result.variant} cleaned generated React paths: ${result.cleanedGeneratedReactPaths.map(cleanedPath => path.relative(root, cleanedPath)).join(', ')}`,
    `Variant ${result.variant} spawn error: ${result.error || 'none'}`,
  ]),
  'Required Sentry upload follow-up: provide sentry.properties/defaults.org/defaults.project/auth.token or SENTRY_AUTH_TOKEN before claiming source-map upload validation.',
  '',
].join('\n');

mkdirSync(path.dirname(summaryPath), { recursive: true });
writeFileSync(summaryPath, summary);
console.log(`Android release validation summary written to ${path.relative(root, summaryPath)}`);

const failedResult = variantResults.find(
  result => result.status !== 0 || !result.apk.exists || !result.bundle.exists || !result.sourcemap.exists,
);

if (failedResult) {
  process.exit(failedResult.status || 1);
}

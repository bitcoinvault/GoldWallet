import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
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

if (invalidVariants.length > 0) {
  console.error(`Unsupported Android release variant(s): ${invalidVariants.join(', ')}`);
  process.exit(1);
}

const capitalize = value => `${value[0].toUpperCase()}${value.slice(1)}`;
const getApkPath = variant =>
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', variant, 'release', `app-${variant}-release-unsigned.apk`);

const env = {
  ...process.env,
  SENTRY_DISABLE_AUTO_UPLOAD: 'true',
};

const startedAt = new Date().toISOString();
const variantResults = requestedVariants.map(variant => {
  const task = `:app:assemble${capitalize(variant)}Release`;
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'runAndroidGradle.mjs'), task, '--stacktrace'], {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  const apkPath = getApkPath(variant);
  const apkExists = existsSync(apkPath);
  const apkSize = apkExists ? statSync(apkPath).size : 0;
  const apkSha256 = apkExists ? createHash('sha256').update(readFileSync(apkPath)).digest('hex') : 'missing';

  return {
    variant,
    task,
    status: result.status ?? 1,
    error: result.error?.message || '',
    apkPath,
    apkExists,
    apkSize,
    apkSha256,
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
  `Release input fingerprint: ${getAndroidReleaseInputFingerprint(root)}`,
  `Release input fingerprint files: ${androidReleaseFingerprintInputs.length}`,
  'Sentry auto upload disabled for local build: yes',
  'Sentry release upload validation: not claimed',
  ...variantResults.flatMap(result => [
    `Variant ${result.variant} Gradle task: ${result.task}`,
    `Variant ${result.variant} exit code: ${result.status}`,
    `Variant ${result.variant} Release APK: ${path.relative(root, result.apkPath)}`,
    `Variant ${result.variant} Release APK exists: ${result.apkExists ? 'yes' : 'no'}`,
    `Variant ${result.variant} Release APK bytes: ${result.apkSize}`,
    `Variant ${result.variant} Release APK sha256: ${result.apkSha256}`,
    `Variant ${result.variant} spawn error: ${result.error || 'none'}`,
  ]),
  'Required Sentry upload follow-up: provide sentry.properties/defaults.org/defaults.project/auth.token or SENTRY_AUTH_TOKEN before claiming source-map upload validation.',
  '',
].join('\n');

mkdirSync(path.dirname(summaryPath), { recursive: true });
writeFileSync(summaryPath, summary);
console.log(`Android release validation summary written to ${path.relative(root, summaryPath)}`);

const failedResult = variantResults.find(result => result.status !== 0 || !result.apkExists);

if (failedResult) {
  process.exit(failedResult.status || 1);
}

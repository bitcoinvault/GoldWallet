import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-release-dev-summary.txt');
const apkPath = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'dev', 'release', 'app-dev-release-unsigned.apk');
const gradleArgs = [path.join(root, 'scripts', 'runAndroidGradle.mjs'), ':app:assembleDevRelease', '--stacktrace'];
const javaCommand = process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  : 'java';

const env = {
  ...process.env,
  SENTRY_DISABLE_AUTO_UPLOAD: 'true',
};

const startedAt = new Date().toISOString();
const result = spawnSync(process.execPath, gradleArgs, {
  cwd: root,
  env,
  stdio: 'inherit',
});

const apkExists = existsSync(apkPath);
const apkSize = apkExists ? statSync(apkPath).size : 0;
const apkSha256 = apkExists ? createHash('sha256').update(readFileSync(apkPath)).digest('hex') : 'missing';
const javaVersion = spawnSync(javaCommand, ['-version'], {
  cwd: root,
  encoding: 'utf8',
});
const javaVersionLine = `${javaVersion.stderr || ''}${javaVersion.stdout || ''}`.split(/\r?\n/)[0]?.trim() || 'unavailable';
const summary = [
  'Android dev release validation',
  `Generated at: ${new Date().toISOString()}`,
  `Started at: ${startedAt}`,
  'Gradle task: :app:assembleDevRelease',
  `Exit code: ${result.status ?? 1}`,
  `Java executable: ${javaCommand}`,
  `Java version: ${javaVersionLine}`,
  'Sentry auto upload disabled for local build: yes',
  'Sentry release upload validation: not claimed',
  `Release APK: ${path.relative(root, apkPath)}`,
  `Release APK exists: ${apkExists ? 'yes' : 'no'}`,
  `Release APK bytes: ${apkSize}`,
  `Release APK sha256: ${apkSha256}`,
  'Required Sentry upload follow-up: provide sentry.properties/defaults.org/defaults.project/auth.token or SENTRY_AUTH_TOKEN before claiming source-map upload validation.',
  '',
].join('\n');

mkdirSync(path.dirname(summaryPath), { recursive: true });
writeFileSync(summaryPath, summary);
console.log(`Android release validation summary written to ${path.relative(root, summaryPath)}`);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if ((result.status ?? 1) !== 0 || !apkExists) {
  process.exit(result.status ?? 1);
}

import { existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const errors = [];
const warnings = [];
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const run = (command, args = []) =>
  spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

const trimOutput = result => `${result.stdout || ''}${result.stderr || ''}`.trim();
const javaCommand = process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  : 'java';
const javaVersion = run(javaCommand, ['-version']);
const javaOutput = trimOutput(javaVersion);
const javaMajor = javaOutput.match(/version "(\d+)/)?.[1];
const nodeVersion = process.versions.node;
const nodeMajor = Number(nodeVersion.split('.')[0]);
const androidSdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || '';
const adbCandidates = [
  androidSdkRoot ? path.join(androidSdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : '',
  process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe') : '',
  'adb',
].filter(Boolean);
const adbCandidate = adbCandidates.find(candidate => candidate === 'adb' || existsSync(candidate));
const adbVersion = adbCandidate ? run(adbCandidate, ['version']) : null;
const packageJson = JSON.parse(read('package.json'));
const nvmrc = exists('.nvmrc') ? read('.nvmrc').trim() : '';

if (javaVersion.error || !javaMajor) {
  errors.push(`Unable to detect Java version from ${javaCommand}`);
} else if (Number(javaMajor) < 11 || Number(javaMajor) > 17) {
  errors.push(`Android Gradle build supports JDK 11-17; current Java major is ${javaMajor}`);
}

if (!process.env.JAVA_HOME) {
  warnings.push('JAVA_HOME is not set; Gradle runner will fall back to java from PATH.');
}

if (nodeMajor !== 16) {
  warnings.push(`Current Node is ${nodeVersion}; Metro/dev runtime is documented for Node 16 (${nvmrc || 'no .nvmrc found'}).`);
}

if (!androidSdkRoot) {
  warnings.push('ANDROID_SDK_ROOT/ANDROID_HOME is not set; adb lookup will fall back to LOCALAPPDATA or PATH.');
} else if (!existsSync(androidSdkRoot)) {
  errors.push(`Android SDK root does not exist: ${androidSdkRoot}`);
}

if (!adbCandidate || adbVersion?.error || adbVersion?.status !== 0) {
  errors.push('Unable to run adb version from Android SDK, LOCALAPPDATA, or PATH.');
}

[
  ['android/gradlew.bat', 'Windows Gradle wrapper'],
  ['android/gradlew', 'Unix Gradle wrapper'],
  ['scripts/runAndroidGradle.mjs', 'guarded Gradle runner'],
  ['scripts/androidSmokeDev.mjs', 'Android emulator smoke helper'],
  ['scripts/auditAndroidGradleWarnings.mjs', 'Android warning audit helper'],
].forEach(([relativePath, label]) => {
  if (!exists(relativePath)) {
    errors.push(`${label} is missing at ${relativePath}`);
  }
});

[
  ['android:dev:assemble', packageJson.scripts?.['android:dev:assemble']],
  ['android:dev:smoke', packageJson.scripts?.['android:dev:smoke']],
  ['android:dev:verify', packageJson.scripts?.['android:dev:verify']],
  ['android:dev:audit-warnings', packageJson.scripts?.['android:dev:audit-warnings']],
  ['android:dev:check-light', packageJson.scripts?.['android:dev:check-light']],
].forEach(([scriptName, command]) => {
  if (!command) {
    errors.push(`package.json is missing ${scriptName}`);
  }
});

console.log('Android dev environment audit');
console.log(`Node.js: ${nodeVersion}`);
console.log(`.nvmrc: ${nvmrc || '<missing>'}`);
console.log(`JAVA_HOME: ${process.env.JAVA_HOME || '<unset>'}`);
console.log(`Java executable: ${javaCommand}`);
console.log(`Java major: ${javaMajor || '<unknown>'}`);
console.log(`Android SDK root: ${androidSdkRoot || '<unset>'}`);
console.log(`ADB executable: ${adbCandidate || '<missing>'}`);

if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(warning => console.log(`- ${warning}`));
}

if (errors.length > 0) {
  console.log('Android dev environment is not ready:');
  errors.forEach(error => console.log(`- ${error}`));
  process.exit(1);
}

console.log('Android dev environment has the required Java range, adb access, Gradle wrappers, and validation scripts.');

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/runAndroidGradle.mjs <gradle-args...>');
  process.exit(1);
}

const javaCommand = process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  : 'java';

const javaVersion = spawnSync(javaCommand, ['-version'], {
  encoding: 'utf8',
});
const javaVersionOutput = `${javaVersion.stderr || ''}${javaVersion.stdout || ''}`;
const javaMajorVersion = javaVersionOutput.match(/version "(\d+)/)?.[1];

if (javaVersion.error || !javaMajorVersion) {
  console.error('Unable to detect Java version before running Android Gradle.');
  console.error(`Checked Java executable: ${javaCommand}`);
  console.error('Set JAVA_HOME to JDK 17.');
  process.exit(1);
}

if (Number(javaMajorVersion) !== 17) {
  console.error(`GoldWallet Android build requires JDK 17 after the AGP 8.6 upgrade. Current JDK major version is ${javaMajorVersion}.`);
  console.error('Set JAVA_HOME to JDK 17 before running Android Gradle.');
  process.exit(1);
}

const result = spawnSync(gradleCommand, args, {
  cwd: androidDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

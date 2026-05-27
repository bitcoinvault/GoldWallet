import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const args = process.argv.slice(2);

const javaVersion = spawnSync('java', ['-version'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
const javaVersionOutput = `${javaVersion.stderr || ''}${javaVersion.stdout || ''}`;
const javaMajorVersion = javaVersionOutput.match(/version "(\d+)/)?.[1];

if (javaVersion.error || !javaMajorVersion) {
  console.error('Unable to detect Java version before running Android Gradle.');
  console.error('Set JAVA_HOME to JDK 11 or JDK 17.');
  process.exit(1);
}

if (Number(javaMajorVersion) > 17) {
  console.error(`GoldWallet Android build supports JDK 11-17. Current JDK major version is ${javaMajorVersion}.`);
  console.error('Set JAVA_HOME to JDK 11 or JDK 17 before running Android Gradle.');
  process.exit(1);
}

if (args.length === 0) {
  console.error('Usage: node scripts/runAndroidGradle.mjs <gradle-args...>');
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

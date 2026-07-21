import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const normalizeVersion = version => (version || '').trim().replace(/^v/, '');

export const getAndroidGradleEnvironment = ({
  env = process.env,
  nodeExecPath = process.execPath,
  platform = process.platform,
} = {}) => {
  const isWindows = platform === 'win32';
  const pathKey = isWindows ? 'Path' : 'PATH';
  const pathApi = isWindows ? path.win32 : path.posix;
  const delimiter = isWindows ? ';' : ':';
  const sourcePaths = isWindows
    ? Object.entries(env)
        .filter(([key]) => key.toLowerCase() === 'path')
        .map(([, value]) => value || '')
    : [env.PATH || ''];
  const nodeDirectory = pathApi.dirname(nodeExecPath);
  const pathEntries = sourcePaths.flatMap(sourcePath => sourcePath.split(delimiter)).filter(Boolean);
  const normalizePathEntry = entry => (isWindows ? entry.toLowerCase() : entry);
  const gradleEnv = { ...env };

  if (isWindows) {
    Object.keys(gradleEnv)
      .filter(key => key.toLowerCase() === 'path')
      .forEach(key => delete gradleEnv[key]);
  }

  const seenPathEntries = new Set();
  const mergedPathEntries = [nodeDirectory, ...pathEntries].filter(entry => {
    const normalizedEntry = normalizePathEntry(entry);

    if (seenPathEntries.has(normalizedEntry)) {
      return false;
    }

    seenPathEntries.add(normalizedEntry);
    return true;
  });

  return {
    ...gradleEnv,
    NODE_BINARY: nodeExecPath,
    [pathKey]: mergedPathEntries.join(delimiter),
  };
};

const main = () => {
  const androidDir = path.join(root, 'android');
  const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/runAndroidGradle.mjs <gradle-args...>');
    return 1;
  }

  const expectedNodeVersion = normalizeVersion(readFileSync(path.join(root, '.nvmrc'), 'utf8'));
  const currentNodeVersion = normalizeVersion(process.version);

  if (currentNodeVersion !== expectedNodeVersion) {
    console.error(
      `GoldWallet Android build requires Node ${expectedNodeVersion}. Current Node version is ${currentNodeVersion}.`,
    );
    console.error('Run the Yarn command through: corepack yarn node:runtime:yarn <script>');
    return 1;
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
    return 1;
  }

  if (Number(javaMajorVersion) !== 17) {
    console.error(
      `GoldWallet Android build requires JDK 17 after the AGP 8.13 upgrade. Current JDK major version is ${javaMajorVersion}.`,
    );
    console.error('Set JAVA_HOME to JDK 17 before running Android Gradle.');
    return 1;
  }

  const result = spawnSync(gradleCommand, args, {
    cwd: androidDir,
    env: getAndroidGradleEnvironment(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}

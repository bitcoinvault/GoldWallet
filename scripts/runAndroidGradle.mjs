import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidNativePathBudget, getAndroidNativePathBudgetError } from './androidNativePathBudget.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const normalizeVersion = version => (version || '').trim().replace(/^v/, '');

const getEnvironmentValues = (env, name, platform) =>
  Object.entries(env)
    .filter(([key]) => (platform === 'win32' ? key.toLowerCase() === name.toLowerCase() : key === name))
    .map(([, value]) => String(value || '').trim())
    .filter(Boolean);

const getDistinctPathValues = (values, platform) => {
  const pathApi = platform === 'win32' ? path.win32 : path.posix;
  const normalizedValues = new Map();

  values.forEach(value => {
    const normalized = pathApi.normalize(value);
    const root = pathApi.parse(normalized).root;
    const canonical = normalized.length > root.length ? normalized.replace(/[\\/]+$/, '') : normalized;
    const comparisonValue = platform === 'win32' ? canonical.toLowerCase() : canonical;
    if (!normalizedValues.has(comparisonValue)) normalizedValues.set(comparisonValue, canonical);
  });

  return [...normalizedValues.values()];
};

export const getAndroidSdkResolution = ({
  env = process.env,
  platform = process.platform,
  pathExists = existsSync,
} = {}) => {
  const pathApi = platform === 'win32' ? path.win32 : path.posix;
  const androidHomeValues = getDistinctPathValues(getEnvironmentValues(env, 'ANDROID_HOME', platform), platform);
  const androidSdkRootValues = getDistinctPathValues(getEnvironmentValues(env, 'ANDROID_SDK_ROOT', platform), platform);
  const explicitAndroidHomePresent = androidHomeValues.length > 0;
  const explicitAndroidSdkRootPresent = androidSdkRootValues.length > 0;

  if (androidHomeValues.length > 1) {
    throw new Error('Conflicting case-insensitive ANDROID_HOME values are configured. Keep one SDK path.');
  }

  if (androidSdkRootValues.length > 1) {
    throw new Error('Conflicting case-insensitive ANDROID_SDK_ROOT values are configured. Keep one SDK path.');
  }

  const androidHome = androidHomeValues[0] || '';
  const androidSdkRoot = androidSdkRootValues[0] || '';

  if (androidHome && androidSdkRoot) {
    const [normalizedHome] = getDistinctPathValues([androidHome], platform);
    const [normalizedRoot] = getDistinctPathValues([androidSdkRoot], platform);
    const pathsMatch =
      platform === 'win32'
        ? normalizedHome.toLowerCase() === normalizedRoot.toLowerCase()
        : normalizedHome === normalizedRoot;

    if (!pathsMatch) {
      throw new Error('ANDROID_HOME and ANDROID_SDK_ROOT point to different SDK paths. Make them consistent.');
    }
  }

  const explicitRoot = androidHome || androidSdkRoot;
  if (explicitRoot) {
    if (!pathExists(explicitRoot)) {
      throw new Error(`Explicit Android SDK path does not exist: ${explicitRoot}`);
    }

    return {
      root: explicitRoot,
      source:
        androidHome && androidSdkRoot
          ? 'ANDROID_HOME+ANDROID_SDK_ROOT'
          : androidHome
            ? 'ANDROID_HOME'
            : 'ANDROID_SDK_ROOT',
      explicitAndroidHomePresent,
      explicitAndroidSdkRootPresent,
    };
  }

  const home = getEnvironmentValues(env, 'HOME', platform)[0] || '';
  const localAppData = getEnvironmentValues(env, 'LOCALAPPDATA', platform)[0] || '';
  const fallbackCandidates = [
    platform === 'win32' && localAppData
      ? { root: pathApi.join(localAppData, 'Android', 'Sdk'), source: 'LOCALAPPDATA' }
      : null,
    platform === 'darwin' && home
      ? { root: pathApi.join(home, 'Library', 'Android', 'sdk'), source: 'HOME_LIBRARY' }
      : null,
    platform !== 'win32' && platform !== 'darwin' && home
      ? { root: pathApi.join(home, 'Android', 'Sdk'), source: 'HOME_ANDROID' }
      : null,
  ].filter(Boolean);
  const fallback = fallbackCandidates.find(candidate => pathExists(candidate.root));

  return {
    root: fallback?.root || '',
    source: fallback?.source || 'none',
    explicitAndroidHomePresent,
    explicitAndroidSdkRootPresent,
  };
};

export const resolveAndroidSdkRoot = options => getAndroidSdkResolution(options).root;

export const getAndroidGradleEnvironment = ({
  env = process.env,
  nodeExecPath = process.execPath,
  platform = process.platform,
  pathExists = existsSync,
  sdkResolution,
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
  const androidSdkResolution = sdkResolution || getAndroidSdkResolution({ env, platform, pathExists });
  const androidSdkRoot = androidSdkResolution.root;

  if (isWindows) {
    Object.keys(gradleEnv)
      .filter(key => key.toLowerCase() === 'path')
      .forEach(key => delete gradleEnv[key]);

    Object.keys(gradleEnv)
      .filter(key => ['android_home', 'android_sdk_root'].includes(key.toLowerCase()))
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

  if (androidSdkRoot) {
    gradleEnv.ANDROID_HOME = androidSdkRoot;
    gradleEnv.ANDROID_SDK_ROOT = androidSdkRoot;
  }

  return {
    ...gradleEnv,
    NODE_BINARY: nodeExecPath,
    [pathKey]: mergedPathEntries.join(delimiter),
  };
};

export const runAndroidGradle = ({
  args = process.argv.slice(2),
  rootPath = root,
  platform = process.platform,
  pathExists = existsSync,
  spawn = spawnSync,
} = {}) => {
  const androidDir = path.join(rootPath, 'android');
  const gradleCommand = platform === 'win32' ? 'gradlew.bat' : './gradlew';

  if (args.length === 0) {
    console.error('Usage: node scripts/runAndroidGradle.mjs <gradle-args...>');
    return 1;
  }

  const nativePathBudget = getAndroidNativePathBudget({ rootPath, platform, pathExists });
  const nativePathBudgetError = getAndroidNativePathBudgetError(nativePathBudget);
  if (nativePathBudgetError) {
    console.error(nativePathBudgetError);
    return 1;
  }

  const expectedNodeVersion = normalizeVersion(readFileSync(path.join(rootPath, '.nvmrc'), 'utf8'));
  const currentNodeVersion = normalizeVersion(process.version);

  if (currentNodeVersion !== expectedNodeVersion) {
    console.error(
      `GoldWallet Android build requires Node ${expectedNodeVersion}. Current Node version is ${currentNodeVersion}.`,
    );
    console.error('Run the Yarn command through: corepack yarn node:runtime:yarn <script>');
    return 1;
  }

  const javaCommand = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', platform === 'win32' ? 'java.exe' : 'java')
    : 'java';

  const javaVersion = spawn(javaCommand, ['-version'], {
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
      `GoldWallet Android build requires JDK 17 for React Native 0.87 and AGP 9.2. Current JDK major version is ${javaMajorVersion}.`,
    );
    console.error('Set JAVA_HOME to JDK 17 before running Android Gradle.');
    return 1;
  }

  let androidSdkResolution;
  let gradleEnvironment;
  try {
    androidSdkResolution = getAndroidSdkResolution();
    gradleEnvironment = getAndroidGradleEnvironment({ sdkResolution: androidSdkResolution });
  } catch (error) {
    console.error(`Android SDK configuration is invalid: ${error.message}`);
    return 1;
  }

  if (androidSdkResolution.root) {
    console.log(`Android SDK resolved from ${androidSdkResolution.source}: ${androidSdkResolution.root}`);
  }

  const result = spawn(gradleCommand, args, {
    cwd: androidDir,
    env: gradleEnvironment,
    stdio: 'inherit',
    shell: platform === 'win32',
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runAndroidGradle());
}

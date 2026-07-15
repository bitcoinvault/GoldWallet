import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import { getAndroidReleaseExpectedVariantsFromEnv } from './checkAndroidReleaseApkManifest.mjs';
import { getAndroidReleaseSecureStorageDumpErrors } from './androidReleaseSecureStorageApkGuard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'local-docs', 'android-release-dev-summary.txt');
const sdkRoot =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : '');
const executableName = process.platform === 'win32' ? 'apkanalyzer.bat' : 'apkanalyzer';

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const findApkAnalyzer = () => {
  if (!sdkRoot) return '';

  const directCandidates = [
    path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', executableName),
    path.join(sdkRoot, 'tools', 'bin', executableName),
  ];
  const direct = directCandidates.find(candidate => existsSync(candidate));
  if (direct) return direct;

  const commandLineTools = path.join(sdkRoot, 'cmdline-tools');
  if (!existsSync(commandLineTools)) return '';

  return (
    readdirSync(commandLineTools)
      .map(version => path.join(commandLineTools, version, 'bin', executableName))
      .filter(candidate => existsSync(candidate))
      .sort()
      .at(-1) || ''
  );
};

const runApkAnalyzer = (apkAnalyzerPath, apkPath) => {
  const invocation =
    process.platform === 'win32'
      ? { command: 'cmd.exe', args: ['/d', '/s', '/c', apkAnalyzerPath, 'dex', 'packages', apkPath] }
      : { command: apkAnalyzerPath, args: ['dex', 'packages', apkPath] };
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      `apkanalyzer failed for ${path.relative(root, apkPath)}: ${
        result.error?.message || result.stderr?.trim() || `exit ${result.status}`
      }`,
    );
  }

  return result.stdout || '';
};

const main = () => {
  if (!existsSync(summaryPath)) {
    console.error(`Missing Android release summary artifact: ${summaryPath}`);
    return 1;
  }

  const apkAnalyzerPath = findApkAnalyzer();
  if (!apkAnalyzerPath) {
    console.error('Could not find apkanalyzer in the configured Android SDK.');
    return 1;
  }

  const summary = readFileSync(summaryPath, 'utf8');
  const expectedVariants = getAndroidReleaseExpectedVariantsFromEnv();
  const summaryVariants = getLineValue(summary, 'Variants')
    .split(',')
    .map(variant => variant.trim())
    .filter(Boolean);
  const errors = [];
  const variantDumps = {};

  if (summaryVariants.join(',') !== expectedVariants.join(',')) {
    errors.push(
      `Android release summary must cover ${expectedVariants.join(', ')}. Received: ${summaryVariants.join(', ') || 'missing'}`,
    );
  }

  for (const variant of expectedVariants) {
    const relativeApkPath = getLineValue(summary, `Variant ${variant} Release APK`);
    const apkPath = relativeApkPath ? path.join(root, relativeApkPath) : '';

    if (!apkPath || !existsSync(apkPath)) {
      errors.push(`Variant ${variant} release APK is missing: ${relativeApkPath || 'missing'}`);
      continue;
    }

    try {
      variantDumps[variant] = runApkAnalyzer(apkAnalyzerPath, apkPath);
    } catch (error) {
      errors.push(error.message);
    }
  }

  errors.push(...getAndroidReleaseSecureStorageDumpErrors(variantDumps));

  if (errors.length > 0) {
    console.error('Android release secure-storage APK validation failed:');
    errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  console.log(
    `Android release APKs contain react-native-keychain and exclude legacy secure storage for ${expectedVariants.join(', ')}.`,
  );
  return 0;
};

process.exit(main());


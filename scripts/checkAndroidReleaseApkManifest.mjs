import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

import { resolveAndroidReleaseVersion } from './androidReleaseVersioning.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const defaultVariants = ['dev', 'stage', 'prod', 'beta'];
const allowedVariants = new Set(defaultVariants);
const expectedPackageNames = {
  dev: 'io.goldwallet.wallet.dev',
  stage: 'io.goldwallet.wallet.stage',
  prod: 'io.goldwallet.wallet',
  beta: 'io.goldwallet.wallet.beta',
};

export const getAndroidReleaseExpectedVariantsFromEnv = (env = process.env) => {
  const variants = (env.ANDROID_RELEASE_VARIANTS || defaultVariants.join(','))
    .split(',')
    .map(variant => variant.trim().toLowerCase())
    .filter(Boolean);
  const invalidVariants = variants.filter(variant => !allowedVariants.has(variant));

  if (invalidVariants.length > 0) {
    throw new Error(`Unsupported Android release variant(s): ${invalidVariants.join(', ')}`);
  }

  return variants;
};

const getQuotedGradleValue = (content, key) => {
  const match = content.match(new RegExp(`${key}\\s*=\\s*["']([^"']+)["']|${key}\\s+["']([^"']+)["']`));

  return match?.[1] || match?.[2] || '';
};

const getNumericGradleValue = (content, key) => {
  const match = content.match(new RegExp(`${key}\\s*=\\s*(\\d+)|${key}\\s+(\\d+)`));

  return match?.[1] || match?.[2] || '';
};

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};

const getAndroidSdkRoot = () =>
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : '');

const readProjectFile = (projectRoot, relativePath) => {
  const filePath = path.join(projectRoot, relativePath);

  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
};

const getAapt2Path = (projectRoot = root) => {
  const sdkRoot = getAndroidSdkRoot();
  const androidBuildGradle = readProjectFile(projectRoot, path.join('android', 'build.gradle'));
  const buildToolsVersion = getQuotedGradleValue(androidBuildGradle, 'buildToolsVersion');
  const configuredAapt2 = sdkRoot ? path.join(sdkRoot, 'build-tools', buildToolsVersion, process.platform === 'win32' ? 'aapt2.exe' : 'aapt2') : '';

  if (configuredAapt2 && existsSync(configuredAapt2)) {
    return configuredAapt2;
  }

  const buildToolsDir = sdkRoot ? path.join(sdkRoot, 'build-tools') : '';
  if (!buildToolsDir || !existsSync(buildToolsDir)) {
    return '';
  }

  const candidates = readdirSync(buildToolsDir)
    .map(version => path.join(buildToolsDir, version, process.platform === 'win32' ? 'aapt2.exe' : 'aapt2'))
    .filter(candidate => existsSync(candidate))
    .sort();

  return candidates.at(-1) || '';
};

const dumpBadgingWithAapt2 = (aapt2Path, apkPath) => {
  const result = spawnSync(aapt2Path, ['dump', 'badging', apkPath], { encoding: 'utf8' });

  return {
    status: result.status,
    output: `${result.stdout || ''}${result.stderr || ''}`,
    error: result.error?.message || '',
  };
};

const parseBadging = output => {
  const packageLine = output.split(/\r?\n/).find(line => line.startsWith('package:')) || '';
  const value = name => packageLine.match(new RegExp(`${name}='([^']+)'`))?.[1] || '';

  return {
    packageName: value('name'),
    versionCode: value('versionCode'),
    versionName: value('versionName'),
    compileSdkVersion: value('compileSdkVersion'),
    minSdkVersion: output.match(/minSdkVersion:'([^']+)'/)?.[1] || '',
    targetSdkVersion: output.match(/targetSdkVersion:'([^']+)'/)?.[1] || '',
    permissions: [...output.matchAll(/uses-permission: name='([^']+)'/g)].map(match => match[1]),
  };
};

export const getAndroidReleaseApkManifestErrors = ({
  root: auditRoot = root,
  expectedVariants = defaultVariants,
  aapt2Path = getAapt2Path(auditRoot),
  dumpBadging = dumpBadgingWithAapt2,
} = {}) => {
  const auditSummaryPath = path.join(auditRoot, 'local-docs', 'android-release-dev-summary.txt');
  const errors = [];

  if (!existsSync(auditSummaryPath)) {
    return [`Missing Android release summary artifact: ${auditSummaryPath}`];
  }

  if (!aapt2Path) {
    return ['Could not find aapt2 in ANDROID_HOME, ANDROID_SDK_ROOT, or LOCALAPPDATA Android SDK.'];
  }

  const summary = readFileSync(auditSummaryPath, 'utf8');
  const androidBuildGradle = readProjectFile(auditRoot, path.join('android', 'build.gradle'));
  const releaseVersion = resolveAndroidReleaseVersion(auditRoot);
  const variants = getLineValue(summary, 'Variants')
    .split(',')
    .map(variant => variant.trim())
    .filter(Boolean);
  const expectedMinSdk = getNumericGradleValue(androidBuildGradle, 'minSdkVersion');
  const expectedTargetSdk = getNumericGradleValue(androidBuildGradle, 'targetSdkVersion');
  const expectedCompileSdk = getNumericGradleValue(androidBuildGradle, 'compileSdkVersion');
  const expectedVersionCode = String(releaseVersion.versionCode);
  const expectedVersionName = releaseVersion.versionName;

  if (variants.join(',') !== expectedVariants.join(',')) {
    errors.push(`Android release summary must cover ${expectedVariants.join(', ')}. Received: ${variants.join(', ') || 'missing'}`);
  }

  expectedVariants.forEach(variant => {
    const apkRelativePath = getLineValue(summary, `Variant ${variant} Release APK`);
    const apkPath = apkRelativePath ? path.join(auditRoot, apkRelativePath) : '';

    if (!apkPath || !existsSync(apkPath)) {
      errors.push(`Variant ${variant} Release APK file is missing: ${apkRelativePath || 'missing'}`);
      return;
    }

    const result = dumpBadging(aapt2Path, apkPath);
    const output = result.output || '';

    if (result.status !== 0 && !output.includes('package:')) {
      errors.push(`Variant ${variant} aapt2 badging failed: ${output.trim() || result.error || 'unknown error'}`);
      return;
    }

    const manifest = parseBadging(output);
    const expectedPackageName = expectedPackageNames[variant];

    [
      ['package name', manifest.packageName, expectedPackageName],
      ['versionCode', manifest.versionCode, expectedVersionCode],
      ['versionName', manifest.versionName, expectedVersionName],
      ['minSdkVersion', manifest.minSdkVersion, expectedMinSdk],
      ['targetSdkVersion', manifest.targetSdkVersion, expectedTargetSdk],
      ['compileSdkVersion', manifest.compileSdkVersion, expectedCompileSdk],
    ].forEach(([label, actual, expected]) => {
      if (actual !== expected) {
        errors.push(`Variant ${variant} ${label} mismatch: expected ${expected}, received ${actual || 'missing'}`);
      }
    });

    if (!manifest.permissions.includes('android.permission.POST_NOTIFICATIONS')) {
      errors.push(`Variant ${variant} release APK is missing android.permission.POST_NOTIFICATIONS`);
    }
  });

  return errors;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let expectedVariants;

  try {
    expectedVariants = getAndroidReleaseExpectedVariantsFromEnv();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const errors = getAndroidReleaseApkManifestErrors({ expectedVariants });

  if (errors.length > 0) {
    console.error('Android release APK manifest validation failed:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Android release APK manifests are valid for ${expectedVariants.join(', ')} using ${path.relative(root, getAapt2Path(root))}.`);
}

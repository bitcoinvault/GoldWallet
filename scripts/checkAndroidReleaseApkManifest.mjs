import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-release-dev-summary.txt');
const androidBuildGradle = readFileSync(path.join(root, 'android', 'build.gradle'), 'utf8');
const appBuildGradle = readFileSync(path.join(root, 'android', 'app', 'build.gradle'), 'utf8');
const defaultVariants = ['dev', 'stage', 'prod', 'beta'];
const expectedPackageNames = {
  dev: 'io.goldwallet.wallet.dev',
  stage: 'io.goldwallet.wallet.stage',
  prod: 'io.goldwallet.wallet',
  beta: 'io.goldwallet.wallet.beta',
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

const getAapt2Path = () => {
  const sdkRoot = getAndroidSdkRoot();
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

if (!existsSync(summaryPath)) {
  console.error(`Missing Android release summary artifact: ${summaryPath}`);
  process.exit(1);
}

const aapt2Path = getAapt2Path();
if (!aapt2Path) {
  console.error('Could not find aapt2 in ANDROID_HOME, ANDROID_SDK_ROOT, or LOCALAPPDATA Android SDK.');
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const variants = getLineValue(summary, 'Variants')
  .split(',')
  .map(variant => variant.trim())
  .filter(Boolean);
const expectedMinSdk = getNumericGradleValue(androidBuildGradle, 'minSdkVersion');
const expectedTargetSdk = getNumericGradleValue(androidBuildGradle, 'targetSdkVersion');
const expectedCompileSdk = getNumericGradleValue(androidBuildGradle, 'compileSdkVersion');
const expectedVersionCode = getNumericGradleValue(appBuildGradle, 'versionCode');
const expectedVersionName = getQuotedGradleValue(appBuildGradle, 'versionName');
const errors = [];

if (variants.join(',') !== defaultVariants.join(',')) {
  errors.push(`Android release summary must cover ${defaultVariants.join(', ')}. Received: ${variants.join(', ') || 'missing'}`);
}

defaultVariants.forEach(variant => {
  const apkRelativePath = getLineValue(summary, `Variant ${variant} Release APK`);
  const apkPath = apkRelativePath ? path.join(root, apkRelativePath) : '';

  if (!apkPath || !existsSync(apkPath)) {
    errors.push(`Variant ${variant} Release APK file is missing: ${apkRelativePath || 'missing'}`);
    return;
  }

  const result = spawnSync(aapt2Path, ['dump', 'badging', apkPath], { encoding: 'utf8' });
  const output = `${result.stdout || ''}${result.stderr || ''}`;

  if (result.status !== 0 && !output.includes('package:')) {
    errors.push(`Variant ${variant} aapt2 badging failed: ${output.trim() || result.error?.message || 'unknown error'}`);
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

if (errors.length > 0) {
  console.error('Android release APK manifest validation failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Android release APK manifests are valid for ${defaultVariants.join(', ')} using ${path.relative(root, aapt2Path)}.`);

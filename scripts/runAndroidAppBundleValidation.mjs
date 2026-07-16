import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import {
  BUNDLETOOL_SHA256,
  BUNDLETOOL_VERSION,
  getAndroidAppBundleVariantConfig,
  parseAndroidAppBundleVariant,
} from './androidAppBundleValidation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const variant = parseAndroidAppBundleVariant(args);
const skipBuild = args.includes('--skip-build');
const skipSmoke = args.includes('--skip-smoke');
const config = getAndroidAppBundleVariantConfig(root, variant);
const javaHome = process.env.JAVA_HOME;
const executable = name => path.join(javaHome || '', 'bin', `${name}${process.platform === 'win32' ? '.exe' : ''}`);
const javaCommand = javaHome && existsSync(executable('java')) ? executable('java') : 'java';
const jarCommand = javaHome && existsSync(executable('jar')) ? executable('jar') : 'jar';
const bundletoolJar =
  process.env.BUNDLETOOL_JAR || path.join(root, 'local-docs', 'tools', `bundletool-all-${BUNDLETOOL_VERSION}.jar`);
const debugKeystore =
  process.env.ANDROID_APP_BUNDLE_KEYSTORE ||
  (process.env.USERPROFILE && path.join(process.env.USERPROFILE, '.android', 'debug.keystore')) ||
  (process.env.HOME && path.join(process.env.HOME, '.android', 'debug.keystore'));
const androidSdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
const aapt2Command = path.join(
  androidSdk,
  'build-tools',
  config.buildToolsVersion,
  process.platform === 'win32' ? 'aapt2.exe' : 'aapt2',
);

const hashFile = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');
const run = (label, command, commandArgs, options = {}) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    env: options.env || process.env,
    shell: process.platform === 'win32' && /\.(bat|cmd)$/i.test(command),
    stdio: options.capture ? 'pipe' : 'inherit',
    maxBuffer: 32 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    if (options.capture) {
      process.stdout.write(result.stdout || '');
      process.stderr.write(result.stderr || '');
    }
    throw new Error(`${label} failed: ${result.error?.message || `exit ${result.status}`}`);
  }

  return `${result.stdout || ''}${result.stderr || ''}`.trim();
};

const requireFile = (label, filePath) => {
  if (!filePath || !existsSync(filePath) || statSync(filePath).size === 0) {
    throw new Error(`${label} not found or empty: ${filePath || '<not configured>'}`);
  }
};

try {
  requireFile('bundletool', bundletoolJar);
  requireFile('debug keystore', debugKeystore);
  requireFile('aapt2', aapt2Command);

  const bundletoolHash = hashFile(bundletoolJar);
  if (bundletoolHash !== BUNDLETOOL_SHA256) {
    throw new Error(`bundletool SHA-256 mismatch: expected ${BUNDLETOOL_SHA256}, received ${bundletoolHash}`);
  }

  const bundletoolVersion = run('verify bundletool version', javaCommand, ['-jar', bundletoolJar, 'version'], {
    capture: true,
  });
  if (bundletoolVersion !== BUNDLETOOL_VERSION) {
    throw new Error(`bundletool version mismatch: expected ${BUNDLETOOL_VERSION}, received ${bundletoolVersion}`);
  }

  if (!skipBuild) {
    rmSync(config.aabPath, { force: true });
    run(`build ${config.displayName} AAB`, process.execPath, ['scripts/runAndroidGradle.mjs', config.gradleTask], {
      env: { ...process.env, SENTRY_DISABLE_AUTO_UPLOAD: 'true' },
    });
  }
  requireFile(`${config.displayName} AAB`, config.aabPath);

  run(`validate ${config.displayName} AAB`, javaCommand, ['-jar', bundletoolJar, 'validate', `--bundle=${config.aabPath}`], {
    capture: true,
  });

  mkdirSync(path.dirname(config.apksPath), { recursive: true });
  rmSync(config.apksPath, { force: true });
  rmSync(config.universalApkPath, { force: true });
  rmSync(config.extractionDir, { recursive: true, force: true });
  mkdirSync(config.extractionDir, { recursive: true });

  run(`build universal APK Set for ${config.displayName}`, javaCommand, [
    '-jar',
    bundletoolJar,
    'build-apks',
    `--bundle=${config.aabPath}`,
    `--output=${config.apksPath}`,
    '--mode=universal',
    '--overwrite',
    `--ks=${debugKeystore}`,
    '--ks-pass=pass:android',
    '--ks-key-alias=androiddebugkey',
    '--key-pass=pass:android',
  ]);
  requireFile(`${config.displayName} APK Set`, config.apksPath);

  run('extract universal APK from APK Set', jarCommand, ['-xf', config.apksPath, 'universal.apk'], {
    cwd: config.extractionDir,
  });
  const extractedApkPath = path.join(config.extractionDir, 'universal.apk');
  requireFile('extracted universal APK', extractedApkPath);
  renameSync(extractedApkPath, config.universalApkPath);
  rmSync(config.extractionDir, { recursive: true, force: true });

  const badging = run('inspect universal APK manifest', aapt2Command, ['dump', 'badging', config.universalApkPath], {
    capture: true,
  });
  const packageMatch = badging.match(/package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/);
  const minSdk = badging.match(/minSdkVersion:'([^']+)'/)?.[1];
  const targetSdk = badging.match(/targetSdkVersion:'([^']+)'/)?.[1];

  if (!packageMatch || packageMatch[1] !== config.packageName) {
    throw new Error(`Universal APK package mismatch: expected ${config.packageName}, received ${packageMatch?.[1] || 'unknown'}`);
  }
  const metadata = {
    versionCode: packageMatch[2],
    versionName: packageMatch[3],
    minSdk,
    targetSdk,
  };
  for (const [key, expected] of Object.entries({
    versionCode: config.versionCode,
    versionName: config.versionName,
    minSdk: config.minSdk,
    targetSdk: config.targetSdk,
  })) {
    if (metadata[key] !== expected) {
      throw new Error(`Universal APK ${key} mismatch: expected ${expected}, received ${metadata[key] || 'unknown'}`);
    }
  }

  if (!skipSmoke) {
    run(`smoke ${config.displayName} universal APK`, process.execPath, ['scripts/androidSmokeDev.mjs'], {
      env: {
        ...process.env,
        ANDROID_SMOKE_APK: config.universalApkPath,
        ANDROID_SMOKE_SOURCE_APK: config.aabPath,
        ANDROID_SMOKE_OUTPUT_BASENAME: config.smokeArtifactBase,
        ANDROID_SMOKE_PACKAGE: config.packageName,
        ANDROID_SMOKE_ACTIVITY: `${config.packageName}/io.goldwallet.wallet.MainActivity`,
        ANDROID_SMOKE_REQUIRE_METRO: 'false',
        ANDROID_SMOKE_EXPECT_TEXTS: 'Wallets,No wallets,Create new wallet,Import wallet',
        ANDROID_SMOKE_EXPECT_RESOURCE_IDS:
          'dashboard-header,no-wallets-icon,create-wallet-button,import-wallet-button,navigation-tab-0',
        ANDROID_SMOKE_VALIDATE_EMPTY_DASHBOARD_CTAS: 'true',
        ANDROID_SMOKE_VALIDATE_EMPTY_TAB_NAVIGATION: 'true',
        ANDROID_SMOKE_VALIDATE_QR_SCANNER: 'true',
        ANDROID_SMOKE_VALIDATE_SETTINGS_TERMS_WEBVIEW: 'true',
        ANDROID_SMOKE_WAIT_MS: '45000',
        ANDROID_SMOKE_CLEAR_APP_DATA: 'true',
      },
    });
  }

  const summary = [
    'Android App Bundle validation',
    `Variant: ${config.displayName}`,
    `Package: ${config.packageName}`,
    `Version code: ${metadata.versionCode}`,
    `Version name: ${metadata.versionName}`,
    `Minimum SDK: ${metadata.minSdk}`,
    `Target SDK: ${metadata.targetSdk}`,
    `Bundletool version: ${bundletoolVersion}`,
    `Bundletool SHA-256: ${bundletoolHash}`,
    'Bundle validation: passed',
    `AAB path: ${path.relative(root, config.aabPath)}`,
    `AAB bytes: ${statSync(config.aabPath).size}`,
    `AAB SHA-256: ${hashFile(config.aabPath)}`,
    `APK Set path: ${path.relative(root, config.apksPath)}`,
    `APK Set bytes: ${statSync(config.apksPath).size}`,
    `APK Set SHA-256: ${hashFile(config.apksPath)}`,
    `Universal APK path: ${path.relative(root, config.universalApkPath)}`,
    `Universal APK bytes: ${statSync(config.universalApkPath).size}`,
    `Universal APK SHA-256: ${hashFile(config.universalApkPath)}`,
    `Emulator smoke: ${skipSmoke ? 'skipped' : 'passed'}`,
    'Production signing/upload: not claimed; local debug keystore used for device proof',
    '',
  ].join('\n');
  const summaryPath = skipSmoke ? config.validationOnlySummaryPath : config.summaryPath;
  writeFileSync(summaryPath, summary);
  console.log(`\nAndroid App Bundle evidence written to ${summaryPath}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

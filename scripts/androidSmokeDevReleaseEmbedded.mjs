import { existsSync, mkdirSync, rmSync, statSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  getAndroidReleaseSmokeVariantConfig,
  parseAndroidReleaseSmokeVariant,
} from './androidReleaseSmokeVariant.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const releaseVariant = parseAndroidReleaseSmokeVariant(process.argv.slice(2));
const releaseSmokeConfig = getAndroidReleaseSmokeVariantConfig(root, releaseVariant);
const { displayName, packageName, unsignedApkPath, alignedApkPath, signedApkPath, artifactBase } = releaseSmokeConfig;
const buildToolsDir = [
  process.env.ANDROID_BUILD_TOOLS,
  process.env.ANDROID_HOME && path.join(process.env.ANDROID_HOME, 'build-tools', '36.0.0'),
  process.env.ANDROID_SDK_ROOT && path.join(process.env.ANDROID_SDK_ROOT, 'build-tools', '36.0.0'),
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'build-tools', '36.0.0'),
].find(candidate => candidate && existsSync(candidate));
const zipalignCommand = buildToolsDir && path.join(buildToolsDir, process.platform === 'win32' ? 'zipalign.exe' : 'zipalign');
const apksignerCommand = buildToolsDir && path.join(buildToolsDir, process.platform === 'win32' ? 'apksigner.bat' : 'apksigner');
const debugKeystore =
  process.env.ANDROID_RELEASE_SMOKE_KEYSTORE ||
  (process.env.USERPROFILE && path.join(process.env.USERPROFILE, '.android', 'debug.keystore')) ||
  (process.env.HOME && path.join(process.env.HOME, '.android', 'debug.keystore'));

const run = (label, command, args) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32' && /\.bat$/i.test(command),
    stdio: 'inherit',
  });

  if (result.error || result.status !== 0) {
    const reason = result.error?.message || `exit ${result.status}`;
    throw new Error(`${label} failed: ${reason}`);
  }
};

const prepareSignedReleaseSmokeApk = () => {
  if (!existsSync(unsignedApkPath)) {
    throw new Error(`Missing unsigned ${displayName} APK: ${unsignedApkPath}. Run android:dev:release:verify-local first.`);
  }

  if (!zipalignCommand || !existsSync(zipalignCommand)) {
    throw new Error('zipalign not found. Set ANDROID_BUILD_TOOLS or install Android build-tools 36.0.0.');
  }

  if (!apksignerCommand || !existsSync(apksignerCommand)) {
    throw new Error('apksigner not found. Set ANDROID_BUILD_TOOLS or install Android build-tools 36.0.0.');
  }

  if (!debugKeystore || !existsSync(debugKeystore)) {
    throw new Error('Debug keystore not found. Expected ANDROID_RELEASE_SMOKE_KEYSTORE or the default Android debug keystore.');
  }

  mkdirSync(outputDir, { recursive: true });
  rmSync(alignedApkPath, { force: true });
  rmSync(signedApkPath, { force: true });

  console.log(`Preparing local signed ${displayName} smoke APK from ${path.relative(root, unsignedApkPath)}`);
  run(`zipalign ${displayName} APK for smoke`, zipalignCommand, ['-f', '-p', '4', unsignedApkPath, alignedApkPath]);
  run(`sign ${displayName} APK for smoke`, apksignerCommand, [
    'sign',
    '--ks',
    debugKeystore,
    '--ks-key-alias',
    'androiddebugkey',
    '--ks-pass',
    'pass:android',
    '--key-pass',
    'pass:android',
    '--out',
    signedApkPath,
    alignedApkPath,
  ]);
  run(`verify signed ${displayName} smoke APK`, apksignerCommand, ['verify', '--verbose', signedApkPath]);

  if (!existsSync(signedApkPath) || statSync(signedApkPath).size === 0) {
    throw new Error(`Signed release-smoke APK was not created: ${signedApkPath}`);
  }
};

try {
  if (!process.env.ANDROID_SMOKE_APK) {
    prepareSignedReleaseSmokeApk();
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

process.env.ANDROID_SMOKE_APK ??= signedApkPath;
process.env.ANDROID_SMOKE_SOURCE_APK ??= unsignedApkPath;
process.env.ANDROID_SMOKE_OUTPUT_BASENAME ??= artifactBase;
process.env.ANDROID_SMOKE_PACKAGE ??= packageName;
process.env.ANDROID_SMOKE_ACTIVITY ??= `${packageName}/io.goldwallet.wallet.MainActivity`;
process.env.ANDROID_SMOKE_REQUIRE_METRO ??= 'false';
process.env.ANDROID_SMOKE_EXPECT_TEXTS ??= 'Wallets,No wallets,Create new wallet,Import wallet';
process.env.ANDROID_SMOKE_EXPECT_RESOURCE_IDS ??=
  'dashboard-header,no-wallets-icon,create-wallet-button,import-wallet-button,navigation-tab-0';
process.env.ANDROID_SMOKE_VALIDATE_EMPTY_DASHBOARD_CTAS ??= 'true';
process.env.ANDROID_SMOKE_VALIDATE_EMPTY_TAB_NAVIGATION ??= 'true';
process.env.ANDROID_SMOKE_VALIDATE_QR_SCANNER ??= 'true';
process.env.ANDROID_SMOKE_VALIDATE_SETTINGS_TERMS_WEBVIEW ??= 'true';
process.env.ANDROID_SMOKE_WAIT_MS ??= '45000';
process.env.ANDROID_SMOKE_CLEAR_APP_DATA ??= 'true';

await import('./androidSmokeDev.mjs');

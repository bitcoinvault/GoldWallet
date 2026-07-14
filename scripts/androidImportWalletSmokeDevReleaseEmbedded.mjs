import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidReleaseImportWalletSmokeVariantConfig,
  parseAndroidReleaseSmokeVariant,
} from './androidReleaseSmokeVariant.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const releaseVariant = parseAndroidReleaseSmokeVariant(process.argv.slice(2));
const releaseSmokeConfig = getAndroidReleaseImportWalletSmokeVariantConfig(root, releaseVariant);
const { activityName, artifactBase, displayName, packageName, signedApkPath } = releaseSmokeConfig;

const runNodeScript = (label, scriptPath, args = [], env = {}) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(process.execPath, [path.join(root, scriptPath), ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.error?.message || `exit ${result.status}`}`);
  }
};

try {
  runNodeScript(`run ${displayName} embedded smoke`, 'scripts/androidSmokeDevReleaseEmbedded.mjs', [
    `--variant=${releaseVariant}`,
  ]);

  if (!existsSync(signedApkPath)) {
    throw new Error(`Missing signed ${displayName} smoke APK after release smoke: ${signedApkPath}`);
  }

  runNodeScript(`run ${displayName} import-wallet smoke`, 'scripts/androidImportWalletSmoke.mjs', [], {
    ANDROID_SMOKE_APK: signedApkPath,
    ANDROID_SMOKE_PACKAGE: packageName,
    ANDROID_SMOKE_ACTIVITY: activityName,
    ANDROID_IMPORT_WALLET_SMOKE_OUTPUT_BASENAME: artifactBase,
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

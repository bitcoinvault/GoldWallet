import { existsSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const signedReleaseApk = path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk');
const outputBaseName = 'android-create-wallet-smoke-dev-release';

const runNodeScript = (label, scriptPath, env = {}) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(process.execPath, [path.join(root, scriptPath)], {
    cwd: root,
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
  });

  if (result.error || result.status !== 0) {
    const reason = result.error?.message || `exit ${result.status}`;
    throw new Error(`${label} failed: ${reason}`);
  }
};

try {
  runNodeScript('run devRelease embedded smoke', 'scripts/androidSmokeDevReleaseEmbedded.mjs');

  if (!existsSync(signedReleaseApk)) {
    throw new Error(`Missing signed devRelease smoke APK after release smoke: ${signedReleaseApk}`);
  }

  runNodeScript('run devRelease create-wallet smoke', 'scripts/androidCreateWalletSmoke.mjs', {
    ANDROID_SMOKE_APK: signedReleaseApk,
    ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME: outputBaseName,
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

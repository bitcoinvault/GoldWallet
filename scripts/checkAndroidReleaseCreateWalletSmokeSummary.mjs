import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

process.env.ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME ??= 'android-create-wallet-smoke-dev-release';
process.env.ANDROID_CREATE_WALLET_SMOKE_EXPECTED_APK ??= path.join(
  root,
  'local-docs',
  'android-smoke-dev-release-signed.apk',
);

await import('./checkAndroidCreateWalletSmokeSummary.mjs');

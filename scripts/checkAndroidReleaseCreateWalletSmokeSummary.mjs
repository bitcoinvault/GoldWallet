import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-create-wallet-smoke-dev-release-summary.txt');
const signedReleaseApkPath = path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk');

if (!existsSync(summaryPath)) {
  console.error(`Missing Android release create-wallet smoke summary artifact: ${summaryPath}`);
  process.exit(1);
}

const errors = getAndroidCreateWalletSmokeSummaryErrors(readFileSync(summaryPath, 'utf8'), {
  expectedApkPath: signedReleaseApkPath,
  expectedArtifactBase: 'android-create-wallet-smoke-dev-release',
});

if (errors.length > 0) {
  console.error('Android release create-wallet smoke summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android release create-wallet smoke summary artifact is valid.');

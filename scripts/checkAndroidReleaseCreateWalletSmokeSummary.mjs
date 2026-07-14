import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';
import {
  getAndroidReleaseCreateWalletSmokeVariantConfig,
  parseAndroidReleaseSmokeVariant,
} from './androidReleaseSmokeVariant.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const releaseVariant = parseAndroidReleaseSmokeVariant(process.argv.slice(2));
const releaseSmokeConfig = getAndroidReleaseCreateWalletSmokeVariantConfig(root, releaseVariant);
const { artifactBase, signedApkPath } = releaseSmokeConfig;
const summaryPath = path.join(root, 'local-docs', `${artifactBase}-summary.txt`);

if (!existsSync(summaryPath)) {
  console.error(`Missing Android release create-wallet smoke summary artifact: ${summaryPath}`);
  process.exit(1);
}

const errors = getAndroidCreateWalletSmokeSummaryErrors(readFileSync(summaryPath, 'utf8'), {
  expectedApkPath: signedApkPath,
  expectedArtifactBase: artifactBase,
});

if (errors.length > 0) {
  console.error('Android release create-wallet smoke summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android release create-wallet smoke summary artifact is valid.');

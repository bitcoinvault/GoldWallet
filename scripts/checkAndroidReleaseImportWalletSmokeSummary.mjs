import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidReleaseImportWalletSmokeVariantConfig,
  parseAndroidReleaseSmokeVariant,
} from './androidReleaseSmokeVariant.mjs';
import { getAndroidImportWalletSmokeSummaryErrors } from './checkAndroidImportWalletSmokeSummary.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const releaseVariant = parseAndroidReleaseSmokeVariant(process.argv.slice(2));
const { artifactBase, signedApkPath } = getAndroidReleaseImportWalletSmokeVariantConfig(root, releaseVariant);
const summaryPath = path.join(root, 'local-docs', `${artifactBase}-summary.txt`);

if (!existsSync(summaryPath)) {
  console.error(`Missing Android release import-wallet smoke summary artifact: ${summaryPath}`);
  process.exit(1);
}

const errors = getAndroidImportWalletSmokeSummaryErrors(readFileSync(summaryPath, 'utf8'), {
  expectedApkPath: signedApkPath,
  expectedArtifactBase: artifactBase,
});

if (errors.length > 0) {
  console.error('Android release import-wallet smoke summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android release import-wallet smoke summary artifact is valid.');

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import {
  getAndroidReleaseSmokeVariantConfig,
  parseAndroidReleaseSmokeVariant,
} from './androidReleaseSmokeVariant.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const releaseVariant = parseAndroidReleaseSmokeVariant(process.argv.slice(2));
const releaseSmokeConfig = getAndroidReleaseSmokeVariantConfig(root, releaseVariant);
const { artifactBase, signedApkPath, unsignedApkPath } = releaseSmokeConfig;
const summaryPath = path.join(root, 'local-docs', `${artifactBase}-summary.txt`);

if (!existsSync(summaryPath)) {
  console.error(`Missing Android release smoke summary artifact: ${summaryPath}`);
  process.exit(1);
}

const errors = getAndroidEmbeddedSmokeSummaryErrors(readFileSync(summaryPath, 'utf8'), {
  expectedArtifactBase: artifactBase,
  requireDataStoragePreflight: true,
  requireSmokeApkDigest: true,
  expectedSmokeApkPath: signedApkPath,
  requireSourceApkDigest: true,
  expectedSourceApkPath: unsignedApkPath,
});

if (errors.length > 0) {
  console.error('Android release smoke summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android release smoke summary artifact is valid.');

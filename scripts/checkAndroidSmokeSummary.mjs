import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-smoke-dev-summary.txt');
const debugApkPath = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'dev', 'debug', 'app-dev-debug.apk');

if (!existsSync(summaryPath)) {
  console.error(`Missing Android smoke summary artifact: ${summaryPath}`);
  process.exit(1);
}

const errors = getAndroidSmokeSummaryErrors(readFileSync(summaryPath, 'utf8'), {
  requireSmokeApkDigest: true,
  expectedSmokeApkPath: debugApkPath,
});

if (errors.length > 0) {
  console.error('Android smoke summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android smoke summary artifact is valid.');

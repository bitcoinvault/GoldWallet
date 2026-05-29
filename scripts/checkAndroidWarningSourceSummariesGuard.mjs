import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const checkerPath = path.join(root, 'scripts', 'checkAndroidWarningSourceSummaries.mjs');
const checkerSource = readFileSync(checkerPath, 'utf8');

const requiredSnippets = [
  "import { getCameraQrMigrationSummaryErrors } from './cameraQrMigrationSummaryGuard.mjs';",
  "import { getMaskedViewMigrationSummaryErrors } from './maskedViewMigrationSummaryGuard.mjs';",
  "import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';",
  "label: 'camera QR migration'",
  "relativePath: 'local-docs/camera-qr-migration-summary.txt'",
  "label: 'masked-view migration'",
  "relativePath: 'local-docs/masked-view-migration-summary.txt'",
  "label: 'Sentry Android warning'",
  "relativePath: 'local-docs/sentry-android-warning-summary.txt'",
  'Android warning-source summary artifacts are invalid:',
  'Android warning-source summary artifacts are valid.',
];

const missingSnippets = requiredSnippets.filter(snippet => !checkerSource.includes(snippet));

if (missingSnippets.length > 0) {
  console.error('Android warning-source aggregate checker guard failed:');
  missingSnippets.forEach(snippet => console.error(`- Missing checker snippet: ${snippet}`));
  process.exit(1);
}

console.log('Android warning-source aggregate checker guard checks are valid.');

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCameraQrMigrationSummaryErrors } from './cameraQrMigrationSummaryGuard.mjs';
import { getMaskedViewMigrationSummaryErrors } from './maskedViewMigrationSummaryGuard.mjs';
import { getSecureStorageMigrationSummaryErrors } from './secureStorageMigrationSummaryGuard.mjs';
import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const summaries = [
  {
    label: 'camera QR migration',
    relativePath: 'local-docs/camera-qr-migration-summary.txt',
    getErrors: getCameraQrMigrationSummaryErrors,
  },
  {
    label: 'masked-view migration',
    relativePath: 'local-docs/masked-view-migration-summary.txt',
    getErrors: getMaskedViewMigrationSummaryErrors,
  },
  {
    label: 'secure-storage migration',
    relativePath: 'local-docs/secure-storage-migration-summary.txt',
    getErrors: getSecureStorageMigrationSummaryErrors,
  },
  {
    label: 'Sentry Android warning',
    relativePath: 'local-docs/sentry-android-warning-summary.txt',
    getErrors: getSentryAndroidWarningSummaryErrors,
  },
];

const errors = [];

summaries.forEach(summary => {
  const summaryPath = path.join(root, summary.relativePath);

  if (!existsSync(summaryPath)) {
    errors.push(`${summary.label} summary artifact is missing at ${summary.relativePath}`);
    return;
  }

  const summaryContent = readFileSync(summaryPath, 'utf8');
  summary.getErrors(summaryContent).forEach(error => {
    errors.push(`${summary.label}: ${error}`);
  });
});

if (errors.length > 0) {
  console.error('Android warning-source summary artifacts are invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android warning-source summary artifacts are valid.');

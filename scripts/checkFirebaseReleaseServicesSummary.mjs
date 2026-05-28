import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFirebaseReleaseServicesSummaryErrors } from './firebaseReleaseServicesSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'firebase-release-services-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing Firebase release-services summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getFirebaseReleaseServicesSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Firebase release-services summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Firebase release-services summary artifact is valid.');

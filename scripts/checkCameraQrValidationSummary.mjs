import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCameraQrValidationSummaryErrors } from './cameraQrValidationSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'camera-qr-validation-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing Camera/QR validation summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getCameraQrValidationSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Camera/QR validation summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Camera/QR validation summary artifact is valid.');

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPushNotificationBridgeSummaryErrors } from './pushNotificationBridgeSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'push-notification-bridge-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing push notification bridge summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getPushNotificationBridgeSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Push notification bridge summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Push notification bridge summary artifact is valid.');

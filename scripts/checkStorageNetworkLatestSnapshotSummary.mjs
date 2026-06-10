import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStorageNetworkLatestSnapshotSummaryErrors } from './storageNetworkLatestSnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'storage-network-latest-snapshot.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing storage/network latest snapshot summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getStorageNetworkLatestSnapshotSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Storage/network latest snapshot summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Storage/network latest snapshot summary artifact is valid.');

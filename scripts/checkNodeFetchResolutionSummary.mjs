import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getNodeFetchResolutionSummaryErrors } from './nodeFetchResolutionSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'node-fetch-resolution-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing node-fetch resolution summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getNodeFetchResolutionSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Node fetch resolution summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Node fetch resolution summary artifact is valid.');

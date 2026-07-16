import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidPlayInternalHandoffSummaryErrors,
  parseAndroidPlayHandoffArgs,
  resolveAndroidPlayInternalHandoff,
} from './androidPlayInternalHandoff.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'local-docs', 'android-play-internal-handoff-summary.txt');
if (!existsSync(summaryPath)) {
  console.error(`Android Play internal handoff summary is missing: ${summaryPath}`);
  process.exit(1);
}
const readiness = resolveAndroidPlayInternalHandoff({ root, options: parseAndroidPlayHandoffArgs([]) });
const errors = getAndroidPlayInternalHandoffSummaryErrors(readFileSync(summaryPath, 'utf8'), readiness);
if (errors.length > 0) {
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log('Android Play internal handoff summary is valid.');

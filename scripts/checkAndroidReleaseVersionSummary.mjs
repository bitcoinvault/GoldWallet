import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidReleaseVersionSummaryErrors,
  resolveAndroidPlayReleaseReadiness,
} from './androidReleaseVersioning.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'local-docs', 'android-release-version-readiness-summary.txt');
if (!existsSync(summaryPath)) {
  console.error(`Android release version summary is missing: ${summaryPath}`);
  process.exit(1);
}

const readiness = resolveAndroidPlayReleaseReadiness({ root });
const errors = getAndroidReleaseVersionSummaryErrors(readFileSync(summaryPath, 'utf8'), readiness);
if (errors.length > 0) {
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android release version readiness summary is valid.');

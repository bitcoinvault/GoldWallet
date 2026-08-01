import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { resolveAndroidPlayReleaseReadiness } from './androidReleaseVersioning.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readiness = resolveAndroidPlayReleaseReadiness({ root });
const summary = [
  'Android release version readiness',
  `Package: ${readiness.baseline.packageName}`,
  `Candidate version code: ${readiness.release.versionCode}`,
  `Candidate version name: ${readiness.release.versionName}`,
  `Google Play version code limit: ${readiness.release.contract.maxVersionCode}`,
  'Candidate version code within Google Play limit: yes',
  `Public Play version name: ${readiness.baseline.publicVersionName}`,
  `Public Play baseline observed: ${readiness.baseline.observedAt}`,
  `Public Play baseline source: ${readiness.baseline.source}`,
  `Latest Play version code input: ${readiness.latestVersionCode ?? 'missing'}`,
  `Version name ahead of public Play: ${readiness.versionNameAhead ? 'yes' : 'no'}`,
  `Version code ahead of Play Console: ${readiness.versionCodeAhead ? 'yes' : 'no'}`,
  `Production release version ready: ${readiness.ready ? 'yes' : 'no'}`,
  'Play upload validation: not claimed',
  `Required action: ${readiness.requiredAction}`,
  '',
].join('\n');

const outputDir = path.join(root, 'local-docs');
mkdirSync(outputDir, { recursive: true });
writeFileSync(path.join(outputDir, 'android-release-version-readiness-summary.txt'), summary);
console.log(summary);

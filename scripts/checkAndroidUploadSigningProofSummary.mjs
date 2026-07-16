import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidAppBundleProjectMetadata } from './androidAppBundleValidation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const proofAab = path.join(root, 'local-docs', 'android-upload-signing-proof-prod-release.aab');
const summaryPath = path.join(root, 'local-docs', 'android-upload-signing-proof-summary.txt');
const errors = [];

if (!existsSync(proofAab)) errors.push(`Proof AAB is missing: ${proofAab}`);
if (!existsSync(summaryPath)) errors.push(`Proof summary is missing: ${summaryPath}`);

if (errors.length === 0) {
  const summary = readFileSync(summaryPath, 'utf8');
  const hash = createHash('sha256').update(readFileSync(proofAab)).digest('hex');
  const metadata = getAndroidAppBundleProjectMetadata(root);
  const requiredLines = [
    'Android upload signing local proof',
    'Variant: prodRelease',
    'Gradle signing requirement: enforced',
    'Configured alias certificate match: passed',
    'AAB JAR signature: verified',
    'Bundle validation: passed',
    `Version code: ${metadata.versionCode}`,
    `Version name: ${metadata.versionName}`,
    'AAB version metadata match: passed',
    `AAB bytes: ${statSync(proofAab).size}`,
    `AAB SHA-256: ${hash}`,
    'Temporary keystore retained: no',
    'Production upload key used: no',
    'Production release version ready: not-required-for-local-proof',
    'Production Play upload readiness: not claimed',
    'Sentry upload: independently gated',
    'Secret values printed: no',
  ];
  errors.push(...requiredLines.filter(line => !summary.includes(line)).map(line => `Proof summary is missing: ${line}`));
  if (!/^Certificate SHA-256: [a-f0-9]{64}$/m.test(summary)) errors.push('Proof certificate SHA-256 is invalid');
}

if (errors.length > 0) {
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android upload signing local proof summary is valid.');

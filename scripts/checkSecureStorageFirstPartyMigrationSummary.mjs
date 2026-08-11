import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSecureStorageFirstPartyMigrationSummaryErrors } from './secureStorageFirstPartyMigrationSummaryGuard.mjs';
import { sha256File, sha256MigrationInputs } from './secureStorageFirstPartyMigrationEvidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-first-party-migration-summary.txt');
const candidateApkPath = path.join(root, 'local-docs', 'secure-storage-first-party-migration-prod-release.apk');

if (!existsSync(summaryPath)) {
  console.error(`Missing secure-storage first-party migration summary: ${summaryPath}`);
  process.exit(1);
}

const errors = getSecureStorageFirstPartyMigrationSummaryErrors(readFileSync(summaryPath, 'utf8'), {
  candidateApkSha256: sha256File(candidateApkPath),
  migrationSourceSha256: sha256MigrationInputs(root),
});
if (errors.length > 0) {
  errors.forEach(error => console.error(error));
  process.exit(1);
}

console.log('Secure-storage first-party migration summary is valid.');

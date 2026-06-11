import path from 'path';
import { fileURLToPath } from 'url';
import {
  expectedAndroidReleaseConfigSnippets,
  expectedIosReleaseConfigSnippets,
  expectedIosSchemes,
  getRebrandingReleaseConfigReadinessErrors,
} from './rebrandingReleaseConfigReadinessGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const errors = getRebrandingReleaseConfigReadinessErrors({ root });

if (errors.length > 0) {
  console.error('Rebranding release-config readiness guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Rebranding release-config readiness is guarded for ${expectedAndroidReleaseConfigSnippets.length} Android snippets, ${expectedIosReleaseConfigSnippets.length} iOS snippets, and ${expectedIosSchemes.length} iOS schemes.`,
);

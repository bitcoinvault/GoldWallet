import path from 'path';
import { fileURLToPath } from 'url';
import { expectedExplorerEnvFiles, getExplorerEnvConfigReadinessErrors } from './explorerEnvConfigReadinessGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const errors = getExplorerEnvConfigReadinessErrors({ root });

if (errors.length > 0) {
  console.error('Explorer/env config readiness guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Explorer/env config readiness is documented and guarded for ${expectedExplorerEnvFiles.length} env files.`);

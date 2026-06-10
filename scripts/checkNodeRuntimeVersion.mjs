import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getNodeRuntimeVersionErrors } from './nodeRuntimeVersion.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const expectedVersion = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
const errors = getNodeRuntimeVersionErrors({
  actualVersion: process.version,
  expectedVersion,
});

if (errors.length > 0) {
  console.error('Node runtime version check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Node runtime version matches .nvmrc: ${process.version}`);

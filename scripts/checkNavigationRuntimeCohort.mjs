import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  expectedNavigationRuntimeInstalledVersions,
  expectedNavigationRuntimeVersions,
  getNavigationRuntimeCohortErrors,
} from './navigationRuntimeCohortGuard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const installedPackages = Object.fromEntries(
  [...expectedNavigationRuntimeInstalledVersions.keys()].map(packageName => [
    packageName,
    JSON.parse(readFileSync(path.join(root, 'node_modules', packageName, 'package.json'), 'utf8')),
  ]),
);
const errors = getNavigationRuntimeCohortErrors({
  dependencies: packageJson.dependencies,
  installedPackages,
});

if (errors.length > 0) {
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Navigation runtime cohort matches the validated RN 0.87 baseline.');

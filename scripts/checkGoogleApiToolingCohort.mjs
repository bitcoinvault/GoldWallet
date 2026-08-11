import assert from 'assert';
import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

import { assertGoogleApiToolingCohort } from './googleApiToolingCohort.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const googleApiImportPattern =
  /(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*|\bimport\s*)["'](?:@googleapis\/androidpublisher|googleapis)(?:\/[^"']*)?["']/;
for (const source of [
  'import { google } from "googleapis";',
  "const publisher = require('@googleapis/androidpublisher/build/src');",
  'const api = await import("googleapis/build/src");',
  "import '@googleapis/androidpublisher';",
]) {
  assert(googleApiImportPattern.test(source), `Google API import fixture must be rejected: ${source}`);
}
assert(!googleApiImportPattern.test("const endpoint = 'https://www.googleapis.com/auth/androidpublisher';"));

const trackedSources = spawnSync('git', ['ls-files', '-z', '--', '*.js', '*.jsx', '*.ts', '*.tsx'], {
  cwd: root,
  encoding: 'utf8',
  windowsHide: true,
});
if (trackedSources.error || trackedSources.status !== 0) {
  throw new Error(
    trackedSources.error?.message || trackedSources.stderr?.trim() || `git ls-files exited ${trackedSources.status}`,
  );
}
const toolingPrefixes = ['scripts/', 'tests/'];
const toolingRootFiles = new Set([
  '.prettierrc.js',
  'babel.config.js',
  'jest.config.js',
  'metro.config.js',
  'react-native.config.js',
]);
const runtimeSources = trackedSources.stdout
  .split('\0')
  .filter(Boolean)
  .filter(relativePath => !toolingPrefixes.some(prefix => relativePath.startsWith(prefix)))
  .filter(relativePath => !toolingRootFiles.has(relativePath));
for (const relativePath of runtimeSources) {
  const source = readFileSync(path.join(root, relativePath), 'utf8');
  assert(!googleApiImportPattern.test(source), `${relativePath} must not bundle Google API tooling`);
}

const versions = assertGoogleApiToolingCohort();

console.log(
  `Google API tooling cohort is compatible (Android Publisher ${versions.androidPublisherVersion}, googleapis ${versions.googleApisVersion}).`,
);

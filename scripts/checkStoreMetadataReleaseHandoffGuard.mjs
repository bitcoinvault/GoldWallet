import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getStoreMetadataReleaseHandoffCommands,
  getStoreMetadataReleaseHandoffErrors,
  getStoreMetadataReleaseHandoffOptionErrors,
  getStoreMetadataReleaseHandoffSummary,
  renderStoreMetadataReleaseHandoffCommand,
} from './runStoreMetadataReleaseHandoff.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts || {};
const androidCheckLight = scripts['android:dev:check-light'] || '';
const baselinePreflight = scripts['rn:baseline:preflight'] || '';
const summary = getStoreMetadataReleaseHandoffSummary({
  options: { platform: 'all', dryRun: true },
  generatedAt: '2026-06-16T00:00:00.000Z',
});
const renderedCommands = getStoreMetadataReleaseHandoffCommands().map(renderStoreMetadataReleaseHandoffCommand).join('\n');

[
  'store-metadata:release-handoff',
  'store-metadata:release-handoff:dry-run',
  'check:store-metadata-release-handoff-guard',
].forEach(scriptName => {
  assert(scripts[scriptName], `package.json is missing ${scriptName}`);
});

assert(
  androidCheckLight.includes('check:store-metadata-release-handoff-guard'),
  'android:dev:check-light must include check:store-metadata-release-handoff-guard',
);
assert(
  baselinePreflight.includes('check:store-metadata-release-handoff-guard'),
  'rn:baseline:preflight must include check:store-metadata-release-handoff-guard',
);
assert(
  baselinePreflight.includes('store-metadata:release-handoff:dry-run'),
  'rn:baseline:preflight must render the store metadata release handoff dry run',
);

[
  'corepack yarn check:store-metadata-release-handoff-guard',
  'corepack yarn check:store-metadata-readiness-guard',
  'corepack yarn check:store-metadata-readiness',
  'corepack yarn check:explorer-env-config-readiness',
  'corepack yarn check:rebranding-release-config-readiness',
  'corepack yarn check:android-env-config-files',
  'corepack yarn check:ios-scheme-config',
  'corepack yarn store-metadata:release-handoff:dry-run',
].forEach(expected => {
  assert(renderedCommands.includes(expected), `Expected store metadata release handoff commands to include: ${expected}`);
});

[
  'External store validation: not claimed',
  'Play Console live listing validation: required',
  'App Store Connect live listing validation: required',
  'Store screenshots validation: required',
  'Secret values printed: no',
  'Required action: verify live store listings and screenshots externally before release',
].forEach(expected => {
  assert(summary.includes(expected), `Expected store metadata release handoff summary to include: ${expected}`);
});

assert(
  getStoreMetadataReleaseHandoffErrors(summary).length === 0,
  'Current store metadata release handoff summary must be structurally valid',
);
assert(
  getStoreMetadataReleaseHandoffErrors(`${summary}\nSENTRY_AUTH_TOKEN=secret-value`).some(error =>
    error.includes('must not print secret-looking values'),
  ),
  'Store metadata release handoff must reject secret-looking values',
);
assert(
  getStoreMetadataReleaseHandoffOptionErrors({ platform: 'desktop', dryRun: false }).some(error =>
    error.includes('platform must be one of'),
  ),
  'Store metadata release handoff must reject unsupported platforms',
);
assert(
  getStoreMetadataReleaseHandoffOptionErrors({ platform: 'all', dryRun: 'yes' }).some(error =>
    error.includes('dryRun must be a boolean'),
  ),
  'Store metadata release handoff must reject invalid dryRun values',
);

[
  ['docs/store-metadata-readiness.md', 'Store Metadata Release Handoff'],
  ['docs/store-metadata-readiness.md', 'corepack yarn store-metadata:release-handoff:dry-run'],
  ['docs/store-metadata-readiness.md', 'External store validation: not claimed'],
  ['docs/wallet-modernization-log.md', 'BEM-37.707 - Store metadata release handoff'],
].forEach(([relativePath, expected]) => {
  const content = readFileSync(path.join(root, relativePath), 'utf8');
  assert(content.includes(expected), `${relativePath} is missing "${expected}"`);
});

console.log('Store metadata release handoff guard checks are valid.');

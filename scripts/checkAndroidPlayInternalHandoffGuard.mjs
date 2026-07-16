import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));

assert.strictEqual(
  packageJson.devDependencies['@googleapis/androidpublisher'],
  '36.0.0',
  'Use the pinned official Android Publisher API client',
);

for (const relativePath of [
  'scripts/androidPlayInternalHandoff.mjs',
  'scripts/runAndroidPlayInternalHandoff.mjs',
  'scripts/checkAndroidPlayInternalHandoffSummary.mjs',
]) {
  assert(existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
}

assert.strictEqual(
  packageJson.scripts['android:play:internal:dry-run'],
  'node scripts/runAndroidPlayInternalHandoff.mjs',
);
assert.strictEqual(
  packageJson.scripts['android:play:internal:validate-upload'],
  'node scripts/runAndroidPlayInternalHandoff.mjs --execute',
);
assert.strictEqual(
  packageJson.scripts['android:play:internal:commit'],
  'node scripts/runAndroidPlayInternalHandoff.mjs --execute --commit',
);

const runner = read('scripts/runAndroidPlayInternalHandoff.mjs');
assert(runner.includes('GOLDWALLET_PLAY_SERVICE_ACCOUNT_JSON'));
assert(runner.includes('GOLDWALLET_PLAY_COMMIT_CONFIRMATION'));
assert(runner.includes('runAndroidPlayEditWorkflow'));
assert(!runner.includes('private_key'), 'Runner must not print or parse service-account private key material');

const workflow = read('scripts/androidPlayInternalHandoff.mjs');
for (const method of ['edits.insert', 'edits.bundles.upload', 'edits.tracks.update', 'edits.validate', 'edits.commit', 'edits.delete']) {
  assert(workflow.includes(method), `Play workflow must support ${method}`);
}
assert(workflow.includes("track: 'internal'"), 'Play workflow must be restricted to the internal track');

console.log('Android Play internal handoff guard checks passed.');

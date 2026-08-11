import assert from 'assert';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { JSDOM } from 'jsdom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relativePath => JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));

const packageJson = readJson('package.json');
const jsdomManifest = readJson('node_modules/jsdom/package.json');
const jsdomTypesManifest = readJson('node_modules/@types/jsdom/package.json');

assert.strictEqual(packageJson.devDependencies['@types/jsdom'], '30.0.0');
assert.strictEqual(packageJson.devDependencies.jsdom, '30.0.1');
assert.strictEqual(packageJson.dependencies?.['@types/jsdom'], undefined);
assert.strictEqual(packageJson.dependencies?.jsdom, undefined);
assert.strictEqual(jsdomTypesManifest.version, '30.0.0');
assert.strictEqual(jsdomManifest.version, '30.0.1');
assert.strictEqual(jsdomTypesManifest.dependencies.parse5, '^8.0.0');
assert.strictEqual(jsdomTypesManifest.dependencies['undici-types'], '^8.9.0');

const dom = new JSDOM('<div id="id_pincode">123456</div>');
const pinCodeElement = dom.window.document.querySelector('#id_pincode');
assert.strictEqual(pinCodeElement?.textContent, '123456');
assert.strictEqual(dom.window.document.querySelector('#missing'), null);

const mailingHelper = readFileSync(path.join(root, 'tests/e2e/mailing/index.ts'), 'utf8');
for (const requiredSnippet of [
  "import { getCodeFromHtmlBody } from '../../helpers/parseVerificationCode';",
  'return getCodeFromHtmlBody(message.html!.body!);',
]) {
  assert(mailingHelper.includes(requiredSnippet), `E2E mailing helper is missing: ${requiredSnippet}`);
}

const packageScript = packageJson.scripts['check:jsdom-types-cohort'];
assert(packageScript.includes('scripts/checkJsdomTypesCohort.mjs'));
assert(packageScript.includes('tests/node/mailingParser.test.mts'));

console.log(
  `JSDOM type cohort is compatible (jsdom ${jsdomManifest.version}, @types/jsdom ${jsdomTypesManifest.version}).`,
);

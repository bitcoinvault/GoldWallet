import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const lodash = require('lodash');
const lodashFp = require('lodash/fp');

const expectedVersion = '4.18.1';
const errors = [];

if (packageJson.dependencies.lodash !== expectedVersion) {
  errors.push(`package.json has lodash@${packageJson.dependencies.lodash}; expected ${expectedVersion}`);
}

const installedVersion = require('lodash/package.json').version;
if (installedVersion !== expectedVersion) {
  errors.push(`node_modules has lodash@${installedVersion}; expected ${expectedVersion}`);
}

const cloned = lodash.cloneDeep({ wallets: [{ name: 'main' }] });
cloned.wallets[0].name = 'copy';
if (cloned.wallets[0].name !== 'copy') {
  errors.push('lodash.cloneDeep did not return a mutable clone');
}

const original = { wallets: [{ name: 'main' }] };
const originalClone = lodash.cloneDeep(original);
originalClone.wallets[0].name = 'copy';
if (original.wallets[0].name !== 'main') {
  errors.push('lodash.cloneDeep mutated nested source data');
}

const grouped = lodashFp.groupBy('type')([
  { type: 'incoming', id: 1 },
  { type: 'outgoing', id: 2 },
  { type: 'incoming', id: 3 },
]);
if (grouped.incoming.length !== 2 || grouped.outgoing.length !== 1) {
  errors.push('lodash/fp.groupBy produced unexpected groups');
}

const names = lodashFp.compose([lodashFp.map('name'), lodashFp.filter('enabled')])([
  { name: 'primary', enabled: true },
  { name: 'archived', enabled: false },
]);
if (names.join(',') !== 'primary') {
  errors.push(`lodash/fp.compose/filter/map produced unexpected output: ${names.join(',')}`);
}

const shuffled = lodashFp.shuffle([1, 2, 3, 4]);
if (shuffled.length !== 4 || lodash.difference([1, 2, 3, 4], shuffled).length !== 0) {
  errors.push('lodash/fp.shuffle changed collection contents');
}

if (errors.length > 0) {
  console.error('Lodash runtime audit failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Lodash runtime audit');
console.log(`lodash: ${expectedVersion}`);
console.log('lodash cloneDeep fixture: passed');
console.log('lodash/fp groupBy/compose/shuffle fixtures: passed');

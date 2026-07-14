import assert from 'assert';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = readFileSync(path.join(root, 'src', 'screens', 'ImportWalletScreen.tsx'), 'utf8');
const successMethod = source.match(
  /showSuccessImportMessageScreen\s*=\s*\(wallet\?: Wallet\)\s*=>\s*\{([\s\S]*?)\n  \};/,
);

assert.ok(successMethod, 'ImportWalletScreen must expose showSuccessImportMessageScreen.');
assert.match(successMethod[1], /this\.props\.navigation\.reset\(\{/);
assert.match(successMethod[1], /index:\s*0/);
assert.match(successMethod[1], /name:\s*Route\.MainTabStackNavigator/);
assert.match(successMethod[1], /params:\s*\{\s*screen:\s*Route\.Dashboard\s*\}/);
assert.doesNotMatch(
  successMethod[1],
  /this\.props\.navigation\.navigate\(Route\.MainTabStackNavigator/,
  'Import success must reset the stack so the protected import screen unmounts.',
);

console.log('Import-wallet success navigation guard checks passed.');

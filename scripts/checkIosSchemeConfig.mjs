import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expectedIosSchemeConfigs, getIosSchemeConfigErrors, parseIosSchemeConfig } from './iosSchemeConfigGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const schemesDir = path.join(root, 'ios', 'GoldWallet.xcodeproj', 'xcshareddata', 'xcschemes');
const actualSchemeConfigs = new Map(
  [...expectedIosSchemeConfigs.keys()].map(schemeFile => [
    schemeFile,
    parseIosSchemeConfig(readFileSync(path.join(schemesDir, schemeFile), 'utf8')),
  ]),
);
const errors = getIosSchemeConfigErrors(actualSchemeConfigs);

if (errors.length > 0) {
  console.error('iOS scheme config guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`iOS scheme env/Firebase mapping matches the guarded baseline for ${actualSchemeConfigs.size} schemes.`);

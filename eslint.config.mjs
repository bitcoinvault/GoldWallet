import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const legacyConfig = JSON.parse(readFileSync(path.join(__dirname, '.eslintrc'), 'utf8'));

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['node_modules/**', 'scripts/missing-translations/**', 'sourcemap.ios.js', 'sourcemap.android.js'],
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  ...fixupConfigRules(compat.config(legacyConfig)),
];

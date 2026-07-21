import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import prettier from 'prettier';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const eslintConfig = JSON.parse(readFileSync(path.join(root, '.eslintrc'), 'utf8'));
const prettierConfigPackage = require('eslint-config-prettier/package.json');
const prettierPluginPackage = require('eslint-plugin-prettier/package.json');
const prettierPackage = require('prettier/package.json');

const expected = {
  prettier: '3.9.6',
  'eslint-plugin-prettier': '5.5.6',
  'eslint-config-prettier': '10.1.8',
};
const errors = [];

for (const [name, version] of Object.entries(expected)) {
  if (packageJson.devDependencies[name] !== version) {
    errors.push(`package.json has ${name}@${packageJson.devDependencies[name]}; expected ${version}`);
  }
}

const installedVersions = {
  prettier: prettierPackage.version,
  'eslint-plugin-prettier': prettierPluginPackage.version,
  'eslint-config-prettier': prettierConfigPackage.version,
};

for (const [name, version] of Object.entries(expected)) {
  if (installedVersions[name] !== version) {
    errors.push(`node_modules has ${name}@${installedVersions[name]}; expected ${version}`);
  }
}

const eslintExtends = eslintConfig.extends || [];

if (!eslintExtends.includes('prettier')) {
  errors.push('.eslintrc must extend prettier');
}

if (eslintExtends.includes('prettier/react')) {
  errors.push('.eslintrc must not extend removed eslint-config-prettier entry prettier/react');
}

const resolvedConfig = await prettier.resolveConfig(path.join(root, 'src', 'App.tsx'));

if (!resolvedConfig) {
  errors.push('Prettier could not resolve .prettierrc.js for src/App.tsx');
}

const prettierBin = typeof prettierPackage.bin === 'string' ? prettierPackage.bin : prettierPackage.bin.prettier;
const cliVersion = execFileSync(
  process.execPath,
  [path.join(root, 'node_modules', 'prettier', prettierBin), '--version'],
  {
    encoding: 'utf8',
  },
).trim();

if (cliVersion !== expected.prettier) {
  errors.push(`prettier CLI reports ${cliVersion}; expected ${expected.prettier}`);
}

if (errors.length > 0) {
  console.error('Prettier tooling audit failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Prettier tooling audit');
console.log(`prettier: ${expected.prettier}`);
console.log(`eslint-plugin-prettier: ${expected['eslint-plugin-prettier']}`);
console.log(`eslint-config-prettier: ${expected['eslint-config-prettier']}`);
console.log('latest target: current');
console.log('ESLint prettier config: passed');
console.log('Prettier config resolution: passed');

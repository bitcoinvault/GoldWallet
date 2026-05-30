import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const errors = [];

const expectedDevDependencies = {
  jest: '29.7.0',
  'babel-jest': '29.7.0',
  'jest-circus': '29.7.0',
  'ts-jest': '29.4.11',
  '@types/jest': '30.0.0',
  '@react-native/jest-preset': '0.85.3',
};
const expectedInstalledPackages = {
  jest: '29.7.0',
  'babel-jest': '29.7.0',
  'jest-circus': '29.7.0',
  'jest-runtime': '29.7.0',
  'jest-mock': '29.7.0',
  'ts-jest': '29.4.11',
  '@types/jest': '30.0.0',
  '@react-native/jest-preset': '0.85.3',
};
const checkedLatest = {
  jest: '30.4.2',
  'babel-jest': '30.4.1',
  'jest-circus': '30.4.2',
};

for (const [name, version] of Object.entries(expectedDevDependencies)) {
  if (packageJson.devDependencies[name] !== version) {
    errors.push(`package.json has ${name}@${packageJson.devDependencies[name]}; expected ${version}`);
  }
}

for (const [name, version] of Object.entries(expectedInstalledPackages)) {
  const installedVersion = require(`${name}/package.json`).version;

  if (installedVersion !== version) {
    errors.push(`node_modules has ${name}@${installedVersion}; expected ${version}`);
  }
}

const reactNativeJestPreset = require('@react-native/jest-preset/package.json');

if (reactNativeJestPreset.dependencies['jest-environment-node'] !== '^29.7.0') {
  errors.push(
    `@react-native/jest-preset declares jest-environment-node@${reactNativeJestPreset.dependencies['jest-environment-node']}; expected ^29.7.0`,
  );
}

const cliVersion = execFileSync(
  process.execPath,
  [path.join(root, 'node_modules', 'jest', 'bin', 'jest.js'), '--version'],
  {
    encoding: 'utf8',
  },
).trim();

if (cliVersion !== expectedInstalledPackages.jest) {
  errors.push(`Jest CLI reports ${cliVersion}; expected ${expectedInstalledPackages.jest}`);
}

if (errors.length > 0) {
  console.error('Jest tooling audit failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Jest tooling audit');
console.log(`jest: ${expectedInstalledPackages.jest}`);
console.log(`babel-jest: ${expectedInstalledPackages['babel-jest']}`);
console.log(`jest-circus: ${expectedInstalledPackages['jest-circus']}`);
console.log(`ts-jest: ${expectedInstalledPackages['ts-jest']}`);
console.log(
  `latest target deferred: jest@${checkedLatest.jest}, babel-jest@${checkedLatest['babel-jest']}, jest-circus@${checkedLatest['jest-circus']} - @react-native/jest-preset@${reactNativeJestPreset.version} still depends on jest-environment-node@${reactNativeJestPreset.dependencies['jest-environment-node']}`,
);

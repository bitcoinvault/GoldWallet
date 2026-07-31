import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const { createSelector } = require('reselect');
const sagaEffects = require('redux-saga/effects');

const expectedVersions = {
  redux: '5.0.1',
  'react-redux': '9.3.0',
  'redux-saga': '1.5.1',
  reselect: '5.2.0',
};
const errors = [];

Object.entries(expectedVersions).forEach(([name, expectedVersion]) => {
  const configuredVersion = packageJson.dependencies[name];
  if (configuredVersion !== expectedVersion) {
    errors.push(`package.json has ${name}@${configuredVersion}; expected ${expectedVersion}`);
  }

  const installedVersion = require(`${name}/package.json`).version;
  if (installedVersion !== expectedVersion) {
    errors.push(`node_modules has ${name}@${installedVersion}; expected ${expectedVersion}`);
  }
});

['all', 'call', 'put', 'select', 'takeLatest'].forEach(effectName => {
  if (typeof sagaEffects[effectName] !== 'function') {
    errors.push(`redux-saga/effects.${effectName} is not a function`);
  }
});

const selectWallets = state => state.wallets;
const selectEnabledWalletNames = createSelector([selectWallets], wallets =>
  wallets.filter(wallet => wallet.enabled).map(wallet => wallet.name),
);
const selectedNames = selectEnabledWalletNames({
  wallets: [
    { name: 'primary', enabled: true },
    { name: 'archived', enabled: false },
  ],
});

if (selectedNames.join(',') !== 'primary') {
  errors.push(`Unexpected reselect output: ${selectedNames.join(',')}`);
}

if (errors.length > 0) {
  console.error('State runtime audit failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('State runtime audit');
Object.entries(expectedVersions).forEach(([name, expectedVersion]) => {
  console.log(`${name}: ${expectedVersion}`);
});
console.log('redux-saga effects: passed');
console.log('reselect fixture: passed');

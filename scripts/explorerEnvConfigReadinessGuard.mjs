import { existsSync, readFileSync } from 'fs';
import path from 'path';

export const expectedExplorerEnvFiles = [
  '.env.dev.testnet',
  '.env.stage.mainnet',
  '.env.prod.mainnet',
  '.env.beta.testnet',
  '.env.beta.mainnet',
  '.env.testnet',
  '.env.test',
];

export const requiredExplorerEnvKeys = [
  'APP_ID',
  'APPLICATION_NAME',
  'ENVIRONMENT',
  'BTCV_NETWORK',
  'HOSTS',
  'PORT',
  'PROTOCOL',
  'ELECTRUM_X_PROTOCOL_VERSION',
  'EXPLORER_URL',
];

export const requiredRuntimeConfigKeys = [
  'APP_ID',
  'APPLICATION_NAME',
  'BTCV_NETWORK',
  'HOSTS',
  'PORT',
  'PROTOCOL',
  'ELECTRUM_X_PROTOCOL_VERSION',
  'EXPLORER_URL',
];

export const requiredDocSnippets = [
  ['docs/explorer-env-config-readiness.md', 'Scope: `BEM-37.336`, explorer and env alignment preparation.'],
  ['docs/explorer-env-config-readiness.md', 'Do not print env values in readiness logs or docs.'],
  ['docs/explorer-env-config-readiness.md', 'Explorer changes are not visual-only changes.'],
  ['docs/explorer-env-config-readiness.md', '`EXPLORER_URL`'],
  ['docs/explorer-env-config-readiness.md', '`HOSTS`'],
  ['docs/explorer-env-config-readiness.md', '`ELECTRUM_X_PROTOCOL_VERSION`'],
  ['docs/rebranding-release-config-readiness.md', 'Explorer/env alignment'],
  ['docs/wallet-modernization-log.md', 'BEM-37.336 - Explorer env alignment readiness'],
];

export const parseEnvKeys = content => {
  const keys = new Set();

  content.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (match) {
      keys.add(match[1]);
    }
  });

  return keys;
};

export const getExplorerEnvConfigReadinessErrors = ({ root, readFile = readFileSync, fileExists = existsSync }) => {
  const errors = [];

  expectedExplorerEnvFiles.forEach(relativePath => {
    const fullPath = path.join(root, relativePath);
    if (!fileExists(fullPath)) {
      errors.push(`${relativePath} is missing`);
      return;
    }

    const keys = parseEnvKeys(readFile(fullPath, 'utf8'));
    requiredExplorerEnvKeys.forEach(key => {
      if (!keys.has(key)) {
        errors.push(`${relativePath} is missing required explorer/env key ${key}`);
      }
    });
  });

  const runtimeConfigPath = path.join(root, 'src', 'config', 'index.ts');
  const runtimeConfig = fileExists(runtimeConfigPath) ? readFile(runtimeConfigPath, 'utf8') : '';

  if (!runtimeConfig) {
    errors.push('src/config/index.ts is missing');
  } else {
    requiredRuntimeConfigKeys.forEach(key => {
      if (!runtimeConfig.includes(key)) {
        errors.push(`src/config/index.ts no longer references ${key}`);
      }
    });
  }

  requiredDocSnippets.forEach(([relativePath, snippet]) => {
    const fullPath = path.join(root, relativePath);
    const content = fileExists(fullPath) ? readFile(fullPath, 'utf8') : '';

    if (!content.includes(snippet)) {
      errors.push(`${relativePath} is missing "${snippet}"`);
    }
  });

  return errors;
};

import path from 'path';
import { getExplorerEnvConfigReadinessErrors, parseEnvKeys, requiredExplorerEnvKeys } from './explorerEnvConfigReadinessGuard.mjs';

const envFixture = requiredExplorerEnvKeys.map(key => `${key}=fixture`).join('\n');
const files = new Map([
  ['.env.dev.testnet', envFixture],
  ['.env.stage.mainnet', envFixture],
  ['.env.prod.mainnet', envFixture],
  ['.env.beta.testnet', envFixture],
  ['.env.beta.mainnet', envFixture],
  ['.env.testnet', envFixture],
  ['.env.test', envFixture],
  [
    path.join('src', 'config', 'index.ts'),
    requiredExplorerEnvKeys.map(key => `requireConfigValue('${key}')`).join('\n'),
  ],
  [
    path.join('docs', 'explorer-env-config-readiness.md'),
    [
      'Scope: `BEM-37.336`, explorer and env alignment preparation.',
      'Do not print env values in readiness logs or docs.',
      'Explorer changes are not visual-only changes.',
      '`EXPLORER_URL`',
      '`HOSTS`',
      '`ELECTRUM_X_PROTOCOL_VERSION`',
    ].join('\n'),
  ],
  [path.join('docs', 'rebranding-release-config-readiness.md'), 'Explorer/env alignment'],
  [path.join('docs', 'wallet-modernization-log.md'), 'BEM-37.336 - Explorer env alignment readiness'],
]);

const makeReadFile = sourceFiles => fullPath => {
  const relativePath = path.normalize(fullPath).replace(`${path.normalize('fixture-root')}\\`, '');
  return sourceFiles.get(relativePath) || sourceFiles.get(relativePath.replaceAll('\\', '/')) || '';
};

const makeExists = sourceFiles => fullPath => {
  const relativePath = path.normalize(fullPath).replace(`${path.normalize('fixture-root')}\\`, '');
  return sourceFiles.has(relativePath) || sourceFiles.has(relativePath.replaceAll('\\', '/'));
};

const assertAccepted = (label, sourceFiles) => {
  const errors = getExplorerEnvConfigReadinessErrors({
    root: 'fixture-root',
    readFile: makeReadFile(sourceFiles),
    fileExists: makeExists(sourceFiles),
  });

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, sourceFiles, expectedError) => {
  const errors = getExplorerEnvConfigReadinessErrors({
    root: 'fixture-root',
    readFile: makeReadFile(sourceFiles),
    fileExists: makeExists(sourceFiles),
  });

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Complete explorer/env readiness fixture', files);

const missingEnvKey = new Map(files);
missingEnvKey.set(
  '.env.dev.testnet',
  envFixture
    .split('\n')
    .filter(line => !line.startsWith('EXPLORER_URL='))
    .join('\n'),
);
assertRejected('Missing env key fixture', missingEnvKey, '.env.dev.testnet is missing required explorer/env key EXPLORER_URL');

const missingDocSnippet = new Map(files);
missingDocSnippet.set(path.join('docs', 'explorer-env-config-readiness.md'), 'Scope: `BEM-37.336`, explorer and env alignment preparation.');
assertRejected('Missing doc snippet fixture', missingDocSnippet, 'docs/explorer-env-config-readiness.md is missing');

const parsed = parseEnvKeys('APP_ID=value\n# IGNORED=value\nEXPLORER_URL=https://example.invalid\n');
if (!parsed.has('APP_ID') || !parsed.has('EXPLORER_URL') || parsed.has('IGNORED')) {
  console.error('parseEnvKeys fixture failed.');
  process.exit(1);
}

console.log('Explorer/env config readiness guard checks are valid.');

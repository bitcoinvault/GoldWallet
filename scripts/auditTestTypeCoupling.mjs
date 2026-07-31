import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));

export const expectedTestTypeCoupling = {
  typescript: '6.0.3',
  jest: '30.4.2',
  babelJest: '30.4.1',
  jestEnvironmentNode: '30.4.1',
  tsJest: '29.4.12',
  reactTestRenderer: '19.2.3',
  tsTarget: 'ES2019',
  tsJsx: 'react-native',
  tsSkipLibCheck: true,
};

export const requiredTestTypeCouplingDocs = [
  'docs/test-type-coupling-audit.md',
  'docs/react-package-coupling-audit.md',
  'docs/react19-impact-audit.md',
  'docs/react-native-upgrade-path.md',
  'docs/wallet-modernization-baseline.md',
];

export const requiredTestTypeValidationScripts = new Map([
  ['test:unit', 'node node_modules/jest/bin/jest.js tests/unit --forceExit'],
  ['test:storage', 'node node_modules/jest/bin/jest.js tests/integration/Storage.test.js --forceExit'],
  ['test:authenticator', 'node node_modules/jest/bin/jest.js tests/integration/authenticator.test.js --forceExit'],
  ['test:watchonly:offline', 'node node_modules/jest/bin/jest.js tests/integration/WatchOnlyWallet.offline.test.js --forceExit'],
  ['test:hdwallet:offline', 'node node_modules/jest/bin/jest.js tests/integration/HDWallet.offline.test.js --forceExit'],
  ['test:wallet-core:offline', 'node node_modules/jest/bin/jest.js tests/integration/App.offline.test.js --forceExit'],
]);

export const requiredTestTypeValidationFiles = [
  'tests/unit/signer.test.js',
  'tests/unit/encryption.test.js',
  'tests/integration/Storage.test.js',
  'tests/integration/authenticator.test.js',
  'tests/integration/WatchOnlyWallet.offline.test.js',
  'tests/integration/HDWallet.offline.test.js',
  'tests/integration/App.offline.test.js',
];

export const requiredTestTypeCouplingSnippets = [
  ['docs/test-type-coupling-audit.md', 'Test/type coupling audit'],
  ['docs/test-type-coupling-audit.md', 'Current TypeScript: `6.0.3`'],
  ['docs/test-type-coupling-audit.md', 'Current Jest: `30.4.2`'],
  ['docs/test-type-coupling-audit.md', 'Current babel-jest: `30.4.1`'],
  ['docs/test-type-coupling-audit.md', 'Current jest-environment-node: `30.4.1`'],
  ['docs/test-type-coupling-audit.md', 'Current ts-jest: `29.4.12`'],
  ['docs/test-type-coupling-audit.md', 'Current react-test-renderer: `19.2.3`'],
  ['docs/test-type-coupling-audit.md', 'Current TS JSX mode: `react-native`'],
  ['docs/test-type-coupling-audit.md', 'Current TS skipLibCheck: `true`'],
  ['docs/test-type-coupling-audit.md', 'Move TypeScript/Jest/React/RN baseline pieces only from dedicated branches that own type/runtime behavior and focused validation.'],
  ['docs/test-type-coupling-audit.md', 'Required focused scripts: `test:unit`, `test:storage`, `test:authenticator`, `test:watchonly:offline`, `test:hdwallet:offline`, `test:wallet-core:offline`'],
  ['docs/test-type-coupling-audit.md', 'Required focused files: `tests/unit/signer.test.js`, `tests/unit/encryption.test.js`, `tests/integration/Storage.test.js`, `tests/integration/authenticator.test.js`, `tests/integration/WatchOnlyWallet.offline.test.js`, `tests/integration/HDWallet.offline.test.js`, `tests/integration/App.offline.test.js`'],
  ['docs/test-type-coupling-audit.md', 'corepack yarn test:type-coupling:audit'],
  ['docs/react-package-coupling-audit.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
  ['docs/react19-impact-audit.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
  ['docs/react-native-upgrade-path.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
];

export const getTestTypeCouplingIssues = ({ devDependencies, scripts, tsconfig, jestConfigContent, docs, existingDocs, existingTestFiles }) => {
  const errors = [];

  if (devDependencies.typescript !== expectedTestTypeCoupling.typescript) {
    errors.push(`package.json has typescript@${devDependencies.typescript || '<missing>'}; expected ${expectedTestTypeCoupling.typescript}`);
  }

  if (devDependencies.jest !== expectedTestTypeCoupling.jest) {
    errors.push(`package.json has jest@${devDependencies.jest || '<missing>'}; expected ${expectedTestTypeCoupling.jest}`);
  }

  if (devDependencies['babel-jest'] !== expectedTestTypeCoupling.babelJest) {
    errors.push(`package.json has babel-jest@${devDependencies['babel-jest'] || '<missing>'}; expected ${expectedTestTypeCoupling.babelJest}`);
  }

  if (devDependencies['jest-environment-node'] !== expectedTestTypeCoupling.jestEnvironmentNode) {
    errors.push(
      `package.json has jest-environment-node@${devDependencies['jest-environment-node'] || '<missing>'}; expected ${
        expectedTestTypeCoupling.jestEnvironmentNode
      }`,
    );
  }

  if (devDependencies['ts-jest'] !== expectedTestTypeCoupling.tsJest) {
    errors.push(`package.json has ts-jest@${devDependencies['ts-jest'] || '<missing>'}; expected ${expectedTestTypeCoupling.tsJest}`);
  }

  if (devDependencies['react-test-renderer'] !== expectedTestTypeCoupling.reactTestRenderer) {
    errors.push(
      `package.json has react-test-renderer@${devDependencies['react-test-renderer'] || '<missing>'}; expected ${
        expectedTestTypeCoupling.reactTestRenderer
      }`,
    );
  }

  if (scripts['test:type-coupling:audit'] !== 'node scripts/auditTestTypeCoupling.mjs') {
    errors.push('package.json is missing test:type-coupling:audit script');
  }

  if (scripts['check:test-type-coupling-guard'] !== 'node scripts/checkTestTypeCouplingGuard.mjs') {
    errors.push('package.json is missing check:test-type-coupling-guard script');
  }

  requiredTestTypeValidationScripts.forEach((expectedCommand, scriptName) => {
    if (scripts[scriptName] !== expectedCommand) {
      errors.push(`package.json has ${scriptName}="${scripts[scriptName] || '<missing>'}"; expected "${expectedCommand}"`);
    }
  });

  requiredTestTypeValidationScripts.forEach((_expectedCommand, scriptName) => {
    if (!scripts.prepush?.includes(`yarn ${scriptName}`)) {
      errors.push(`package.json prepush is missing yarn ${scriptName}`);
    }
  });

  requiredTestTypeValidationFiles.forEach(relativePath => {
    if (!existingTestFiles.has(relativePath)) {
      errors.push(`${relativePath} is missing`);
    }
  });

  if (tsconfig.compilerOptions?.target !== expectedTestTypeCoupling.tsTarget) {
    errors.push(`tsconfig target is ${tsconfig.compilerOptions?.target || '<missing>'}; expected ${expectedTestTypeCoupling.tsTarget}`);
  }

  if (tsconfig.compilerOptions?.jsx !== expectedTestTypeCoupling.tsJsx) {
    errors.push(`tsconfig jsx is ${tsconfig.compilerOptions?.jsx || '<missing>'}; expected ${expectedTestTypeCoupling.tsJsx}`);
  }

  if (tsconfig.compilerOptions?.skipLibCheck !== expectedTestTypeCoupling.tsSkipLibCheck) {
    errors.push(`tsconfig skipLibCheck is ${tsconfig.compilerOptions?.skipLibCheck}; expected ${expectedTestTypeCoupling.tsSkipLibCheck}`);
  }

  if (!jestConfigContent.includes("preset: '@react-native/jest-preset'")) {
    errors.push('jest.config.js is missing @react-native/jest-preset preset');
  }

  if (!jestConfigContent.includes("'transform'") && !jestConfigContent.includes('transform:')) {
    errors.push('jest.config.js is missing transform configuration');
  }

  requiredTestTypeCouplingDocs.forEach(relativePath => {
    if (!existingDocs.has(relativePath)) {
      errors.push(`${relativePath} is missing`);
    }
  });

  requiredTestTypeCouplingSnippets.forEach(([relativePath, snippet]) => {
    const content = docs[relativePath] || '';
    if (!content.includes(snippet)) {
      errors.push(`${relativePath} is missing "${snippet}"`);
    }
  });

  return { errors };
};

const collectEnvironment = () => {
  const packageJson = JSON.parse(read('package.json'));
  const docs = {};
  const existingDocs = new Set();

  requiredTestTypeCouplingDocs.forEach(relativePath => {
    try {
      docs[relativePath] = read(relativePath);
      existingDocs.add(relativePath);
    } catch {
      docs[relativePath] = '';
    }
  });

  return {
    devDependencies: packageJson.devDependencies || {},
    scripts: packageJson.scripts || {},
    tsconfig: JSON.parse(read('tsconfig.json')),
    jestConfigContent: read('jest.config.js'),
    docs,
    existingDocs,
    existingTestFiles: new Set(requiredTestTypeValidationFiles.filter(exists)),
  };
};

const printReport = environment => {
  const { errors } = getTestTypeCouplingIssues(environment);

  console.log('Test/type coupling audit');
  console.log(`TypeScript: ${environment.devDependencies.typescript || '<missing>'}`);
  console.log(`Jest: ${environment.devDependencies.jest || '<missing>'}`);
  console.log(`babel-jest: ${environment.devDependencies['babel-jest'] || '<missing>'}`);
  console.log(`jest-environment-node: ${environment.devDependencies['jest-environment-node'] || '<missing>'}`);
  console.log(`ts-jest: ${environment.devDependencies['ts-jest'] || '<missing>'}`);
  console.log(`react-test-renderer: ${environment.devDependencies['react-test-renderer'] || '<missing>'}`);
  console.log(`TS target: ${environment.tsconfig.compilerOptions?.target || '<missing>'}`);
  console.log(`TS JSX mode: ${environment.tsconfig.compilerOptions?.jsx || '<missing>'}`);
  console.log(`TS skipLibCheck: ${environment.tsconfig.compilerOptions?.skipLibCheck}`);
  console.log(`Focused validation scripts: ${[...requiredTestTypeValidationScripts.keys()].join(', ')}`);
  console.log(`Focused validation files: ${environment.existingTestFiles.size}/${requiredTestTypeValidationFiles.length}`);

  if (errors.length > 0) {
    console.log('Test/type coupling audit is invalid:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('Test/type coupling audit matches the current TypeScript/Jest baseline.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}

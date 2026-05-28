import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const expectedTestTypeCoupling = {
  typescript: '^4.0.3',
  jest: '26.6.3',
  babelJest: '^26.6.3',
  tsJest: '^26.4.1',
  reactTestRenderer: '17.0.2',
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

export const requiredTestTypeCouplingSnippets = [
  ['docs/test-type-coupling-audit.md', 'Test/type coupling audit'],
  ['docs/test-type-coupling-audit.md', 'Current TypeScript: `^4.0.3`'],
  ['docs/test-type-coupling-audit.md', 'Current Jest: `26.6.3`'],
  ['docs/test-type-coupling-audit.md', 'Current babel-jest: `^26.6.3`'],
  ['docs/test-type-coupling-audit.md', 'Current ts-jest: `^26.4.1`'],
  ['docs/test-type-coupling-audit.md', 'Current react-test-renderer: `17.0.2`'],
  ['docs/test-type-coupling-audit.md', 'Current TS JSX mode: `react-native`'],
  ['docs/test-type-coupling-audit.md', 'Current TS skipLibCheck: `true`'],
  ['docs/test-type-coupling-audit.md', 'Do not update TypeScript/Jest separately from the React/RN baseline branch that owns type/runtime behavior.'],
  ['docs/test-type-coupling-audit.md', 'corepack yarn test:type-coupling:audit'],
  ['docs/react-package-coupling-audit.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
  ['docs/react19-impact-audit.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
  ['docs/react-native-upgrade-path.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
];

export const getTestTypeCouplingIssues = ({ devDependencies, scripts, tsconfig, jestConfigContent, docs, existingDocs }) => {
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

  if (tsconfig.compilerOptions?.target !== expectedTestTypeCoupling.tsTarget) {
    errors.push(`tsconfig target is ${tsconfig.compilerOptions?.target || '<missing>'}; expected ${expectedTestTypeCoupling.tsTarget}`);
  }

  if (tsconfig.compilerOptions?.jsx !== expectedTestTypeCoupling.tsJsx) {
    errors.push(`tsconfig jsx is ${tsconfig.compilerOptions?.jsx || '<missing>'}; expected ${expectedTestTypeCoupling.tsJsx}`);
  }

  if (tsconfig.compilerOptions?.skipLibCheck !== expectedTestTypeCoupling.tsSkipLibCheck) {
    errors.push(`tsconfig skipLibCheck is ${tsconfig.compilerOptions?.skipLibCheck}; expected ${expectedTestTypeCoupling.tsSkipLibCheck}`);
  }

  if (!jestConfigContent.includes("preset: 'react-native'")) {
    errors.push('jest.config.js is missing react-native preset');
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
  };
};

const printReport = environment => {
  const { errors } = getTestTypeCouplingIssues(environment);

  console.log('Test/type coupling audit');
  console.log(`TypeScript: ${environment.devDependencies.typescript || '<missing>'}`);
  console.log(`Jest: ${environment.devDependencies.jest || '<missing>'}`);
  console.log(`babel-jest: ${environment.devDependencies['babel-jest'] || '<missing>'}`);
  console.log(`ts-jest: ${environment.devDependencies['ts-jest'] || '<missing>'}`);
  console.log(`react-test-renderer: ${environment.devDependencies['react-test-renderer'] || '<missing>'}`);
  console.log(`TS target: ${environment.tsconfig.compilerOptions?.target || '<missing>'}`);
  console.log(`TS JSX mode: ${environment.tsconfig.compilerOptions?.jsx || '<missing>'}`);
  console.log(`TS skipLibCheck: ${environment.tsconfig.compilerOptions?.skipLibCheck}`);

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

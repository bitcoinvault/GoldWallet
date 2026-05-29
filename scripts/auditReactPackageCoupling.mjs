import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { expectedReactNativeTargetSnapshot } from './auditReactNativeTargetSnapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const expectedReactPackageCoupling = {
  react: '19.1.4',
  reactTypes: '19.2.15',
  reactNativeTypes: 'bundled',
  reactTestRenderer: '19.1.4',
  targetReactPeer: '^19.1.4',
};

export const requiredReactPackageCouplingDocs = [
  'docs/react-package-coupling-audit.md',
  'docs/react19-impact-audit.md',
  'docs/react-native-upgrade-path.md',
  'docs/wallet-modernization-baseline.md',
];

export const requiredReactPackageCouplingSnippets = [
  ['docs/react-package-coupling-audit.md', 'React package coupling audit'],
  ['docs/react-package-coupling-audit.md', 'Current React: `19.1.4`'],
  ['docs/react-package-coupling-audit.md', 'Current React types: `19.2.15`'],
  ['docs/react-package-coupling-audit.md', 'Current React Native types: bundled with `react-native@0.81.6`'],
  ['docs/react-package-coupling-audit.md', 'Current react-test-renderer: `19.1.4`'],
  ['docs/react-package-coupling-audit.md', 'Target React peer from RN target snapshot: `^19.1.4`'],
  ['docs/react-package-coupling-audit.md', 'Do not update React without updating `react-test-renderer` and `@types/react` in the same React/RN baseline branch.'],
  ['docs/react-package-coupling-audit.md', 'corepack yarn react:package-coupling:audit'],
  ['docs/react19-impact-audit.md', 'React package coupling audit is tracked in `docs/react-package-coupling-audit.md`'],
  ['docs/react-native-upgrade-path.md', 'React package coupling audit is tracked in `docs/react-package-coupling-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'React package coupling audit is tracked in `docs/react-package-coupling-audit.md`'],
];

export const getReactPackageCouplingIssues = ({ dependencies, devDependencies, scripts, docs, existingDocs }) => {
  const errors = [];

  if (dependencies.react !== expectedReactPackageCoupling.react) {
    errors.push(`package.json has react@${dependencies.react || '<missing>'}; expected current React baseline ${expectedReactPackageCoupling.react}`);
  }

  if (devDependencies['@types/react'] !== expectedReactPackageCoupling.reactTypes) {
    errors.push(
      `package.json has @types/react@${devDependencies['@types/react'] || '<missing>'}; expected current React types baseline ${
        expectedReactPackageCoupling.reactTypes
      }`,
    );
  }

  if (devDependencies['@types/react-native']) {
    errors.push(
      `package.json has @types/react-native@${devDependencies['@types/react-native']}; expected React Native types to be bundled with react-native@0.81.6`,
    );
  }

  if (devDependencies['react-test-renderer'] !== expectedReactPackageCoupling.reactTestRenderer) {
    errors.push(
      `package.json has react-test-renderer@${devDependencies['react-test-renderer'] || '<missing>'}; expected current renderer baseline ${
        expectedReactPackageCoupling.reactTestRenderer
      }`,
    );
  }

  if (expectedReactNativeTargetSnapshot.targetReactPeer !== expectedReactPackageCoupling.targetReactPeer) {
    errors.push(
      `RN target snapshot has React peer ${expectedReactNativeTargetSnapshot.targetReactPeer}; expected ${expectedReactPackageCoupling.targetReactPeer}`,
    );
  }

  if (scripts['react:package-coupling:audit'] !== 'node scripts/auditReactPackageCoupling.mjs') {
    errors.push('package.json is missing react:package-coupling:audit script');
  }

  if (scripts['check:react-package-coupling-guard'] !== 'node scripts/checkReactPackageCouplingGuard.mjs') {
    errors.push('package.json is missing check:react-package-coupling-guard script');
  }

  requiredReactPackageCouplingDocs.forEach(relativePath => {
    if (!existingDocs.has(relativePath)) {
      errors.push(`${relativePath} is missing`);
    }
  });

  requiredReactPackageCouplingSnippets.forEach(([relativePath, snippet]) => {
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

  requiredReactPackageCouplingDocs.forEach(relativePath => {
    try {
      docs[relativePath] = read(relativePath);
      existingDocs.add(relativePath);
    } catch {
      docs[relativePath] = '';
    }
  });

  return {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    scripts: packageJson.scripts || {},
    docs,
    existingDocs,
  };
};

const printReport = environment => {
  const { errors } = getReactPackageCouplingIssues(environment);

  console.log('React package coupling audit');
  console.log(`React: ${environment.dependencies.react || '<missing>'}`);
  console.log(`@types/react: ${environment.devDependencies['@types/react'] || '<missing>'}`);
  console.log(`@types/react-native: ${environment.devDependencies['@types/react-native'] || 'bundled with react-native'}`);
  console.log(`react-test-renderer: ${environment.devDependencies['react-test-renderer'] || '<missing>'}`);
  console.log(`Target React peer from RN target snapshot: ${expectedReactNativeTargetSnapshot.targetReactPeer}`);

  if (errors.length > 0) {
    console.log('React package coupling audit is invalid:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('React package coupling audit matches the current React 19 baseline and RN target snapshot.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}

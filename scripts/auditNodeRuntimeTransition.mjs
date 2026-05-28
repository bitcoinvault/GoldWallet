import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { expectedMetroDevRuntime } from './auditMetroDevRuntime.mjs';
import { expectedReactNativeTargetSnapshot } from './auditReactNativeTargetSnapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const expectedNodeRuntimeTransition = {
  currentNode: expectedMetroDevRuntime.nodeVersion,
  currentNodeMajor: expectedMetroDevRuntime.nodeMajor,
  currentReactNative: expectedMetroDevRuntime.reactNative,
  currentMetroPreset: expectedMetroDevRuntime.metroPreset,
  targetReactNative: expectedReactNativeTargetSnapshot.npmLatestReactNative,
  targetNodeEngine: expectedReactNativeTargetSnapshot.targetNodeEngine,
};

export const requiredNodeRuntimeTransitionDocs = [
  'docs/node-runtime-transition-audit.md',
  'docs/react-native-target-snapshot.md',
  'docs/react-native-upgrade-path.md',
  'docs/wallet-modernization-baseline.md',
  'docs/android-modernization-workflow.md',
];

export const requiredNodeRuntimeTransitionSnippets = [
  ['docs/node-runtime-transition-audit.md', 'Node runtime transition audit'],
  ['docs/node-runtime-transition-audit.md', 'Current Metro/dev Node runtime: `16.20.2`'],
  ['docs/node-runtime-transition-audit.md', 'Current React Native: `0.68.7`'],
  ['docs/node-runtime-transition-audit.md', 'Current Metro Babel preset: `0.67.0`'],
  ['docs/node-runtime-transition-audit.md', 'Target React Native snapshot: `0.85.3`'],
  ['docs/node-runtime-transition-audit.md', 'Target RN Node engine snapshot: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`'],
  ['docs/node-runtime-transition-audit.md', 'Do not change `.nvmrc` away from `16.20.2` until the dedicated React Native baseline branch owns the Metro/tooling migration.'],
  ['docs/node-runtime-transition-audit.md', 'corepack yarn node:runtime-transition:audit'],
  ['docs/react-native-target-snapshot.md', 'Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`'],
  ['docs/react-native-upgrade-path.md', 'Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`'],
  ['docs/android-modernization-workflow.md', 'corepack yarn node:runtime-transition:audit'],
];

export const getNodeRuntimeTransitionIssues = ({ nvmrc, dependencies, devDependencies, scripts, docs }) => {
  const errors = [];

  if (nvmrc !== expectedNodeRuntimeTransition.currentNode) {
    errors.push(`.nvmrc is ${nvmrc || '<missing>'}; expected current Metro/dev runtime ${expectedNodeRuntimeTransition.currentNode}`);
  }

  if (dependencies['react-native'] !== expectedNodeRuntimeTransition.currentReactNative) {
    errors.push(
      `package.json has react-native@${dependencies['react-native'] || '<missing>'}; expected current baseline ${
        expectedNodeRuntimeTransition.currentReactNative
      }`,
    );
  }

  if (devDependencies['metro-react-native-babel-preset'] !== expectedNodeRuntimeTransition.currentMetroPreset) {
    errors.push(
      `package.json has metro-react-native-babel-preset@${devDependencies['metro-react-native-babel-preset'] || '<missing>'}; expected current baseline ${
        expectedNodeRuntimeTransition.currentMetroPreset
      }`,
    );
  }

  if (scripts['node:runtime-transition:audit'] !== 'node scripts/auditNodeRuntimeTransition.mjs') {
    errors.push('package.json is missing node:runtime-transition:audit script');
  }

  if (scripts['check:node-runtime-transition-guard'] !== 'node scripts/checkNodeRuntimeTransitionGuard.mjs') {
    errors.push('package.json is missing check:node-runtime-transition-guard script');
  }

  requiredNodeRuntimeTransitionSnippets.forEach(([relativePath, snippet]) => {
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

  requiredNodeRuntimeTransitionDocs.forEach(relativePath => {
    try {
      docs[relativePath] = read(relativePath);
    } catch {
      docs[relativePath] = '';
    }
  });

  return {
    nvmrc: read('.nvmrc').trim(),
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    scripts: packageJson.scripts || {},
    docs,
  };
};

const printReport = environment => {
  const { errors } = getNodeRuntimeTransitionIssues(environment);

  console.log('Node runtime transition audit');
  console.log(`Current .nvmrc: ${environment.nvmrc || '<missing>'}`);
  console.log(`Current react-native: ${environment.dependencies['react-native'] || '<missing>'}`);
  console.log(`Current metro-react-native-babel-preset: ${environment.devDependencies['metro-react-native-babel-preset'] || '<missing>'}`);
  console.log(`Target React Native snapshot: ${expectedNodeRuntimeTransition.targetReactNative}`);
  console.log(`Target RN Node engine snapshot: ${expectedNodeRuntimeTransition.targetNodeEngine}`);

  if (errors.length > 0) {
    console.log('Node runtime transition audit is invalid:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('Node runtime transition audit matches the current Metro Node 16 baseline and RN target snapshot.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}

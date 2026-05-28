import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));

const requiredDocs = [
  'docs/react-native-upgrade-path.md',
  'docs/wallet-modernization-baseline.md',
  'docs/native-module-upgrade-plan.md',
  'docs/android-modernization-workflow.md',
];

const snippets = [
  ['docs/react-native-upgrade-path.md', 'React Native: `0.68.7`'],
  ['docs/react-native-upgrade-path.md', 'The current branch does not target a direct jump to the latest React Native release'],
  ['docs/react-native-upgrade-path.md', 'current supported React Native line'],
  ['docs/react-native-upgrade-path.md', 'Keep `targetSdkVersion 34` deferred'],
  ['docs/react-native-upgrade-path.md', 'Re-check the latest stable React Native release during the actual RN baseline branch'],
  ['docs/react-native-upgrade-path.md', 'corepack yarn rn:upgrade-path:audit'],
  ['docs/wallet-modernization-baseline.md', 'Continue RN stepwise from `0.68` toward newer supported lines'],
  ['docs/wallet-modernization-baseline.md', 'React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`'],
  ['docs/native-module-upgrade-plan.md', 'React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`'],
  ['docs/android-modernization-workflow.md', 'corepack yarn rn:upgrade-path:audit'],
];

const errors = [];
const dependencies = packageJson.dependencies || {};
const devDependencies = packageJson.devDependencies || {};
const scripts = packageJson.scripts || {};

if (dependencies['react-native'] !== '0.68.7') {
  errors.push(`package.json has react-native@${dependencies['react-native'] || '<missing>'}; expected current RN baseline 0.68.7`);
}

if (dependencies.react !== '17.0.2') {
  errors.push(`package.json has react@${dependencies.react || '<missing>'}; expected current React baseline 17.0.2`);
}

if (devDependencies['metro-react-native-babel-preset'] !== '0.67.0') {
  errors.push(
    `package.json has metro-react-native-babel-preset@${
      devDependencies['metro-react-native-babel-preset'] || '<missing>'
    }; expected current Metro preset baseline 0.67.0`,
  );
}

if (scripts['rn:upgrade-path:audit'] !== 'node scripts/auditReactNativeUpgradePath.mjs') {
  errors.push('package.json is missing rn:upgrade-path:audit script');
}

requiredDocs.forEach(relativePath => {
  try {
    read(relativePath);
  } catch {
    errors.push(`${relativePath} is missing`);
  }
});

snippets.forEach(([relativePath, snippet]) => {
  const content = read(relativePath);
  if (!content.includes(snippet)) {
    errors.push(`${relativePath} is missing "${snippet}"`);
  }
});

console.log('React Native upgrade path audit');
console.log(`react-native: ${dependencies['react-native'] || '<missing>'}`);
console.log(`react: ${dependencies.react || '<missing>'}`);
console.log(`metro-react-native-babel-preset: ${devDependencies['metro-react-native-babel-preset'] || '<missing>'}`);
console.log('Target direction: staged upgrades toward a current supported React Native line.');

if (errors.length > 0) {
  console.log('React Native upgrade path documentation is invalid:');
  errors.forEach(error => console.log(`- ${error}`));
  process.exit(1);
}

console.log('React Native upgrade path documentation matches the current staged baseline.');

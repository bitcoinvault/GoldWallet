import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const expectedReactNativeTargetSnapshot = {
  snapshotDate: '2026-07-10',
  currentReactNative: '0.86.0',
  currentReact: '19.2.3',
  currentNode: '24.16.0',
  npmLatestReactNative: '0.86.0',
  npmNextReactNative: '0.87.0-rc.0',
  npmNightlyReactNative: '0.88.0-nightly-20260710-102fde7b6',
  npmNextChannel: 'prerelease',
  defaultUpgradeChannel: 'latest',
  targetReactPeer: '^19.2.3',
  targetNodeEngine: '^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0',
};

export const requiredReactNativeTargetSnapshotSnippets = [
  ['docs/react-native-target-snapshot.md', 'NPM snapshot date: `2026-07-10`'],
  ['docs/react-native-target-snapshot.md', 'Current repo React Native: `0.86.0`'],
  ['docs/react-native-target-snapshot.md', 'Current repo React: `19.2.3`'],
  ['docs/react-native-target-snapshot.md', 'Current repo Metro/dev Node runtime: `24.16.0`'],
  ['docs/react-native-target-snapshot.md', 'npm `latest`: `0.86.0`'],
  ['docs/react-native-target-snapshot.md', 'npm `next`: `0.87.0-rc.0`'],
  ['docs/react-native-target-snapshot.md', 'npm `nightly`: `0.88.0-nightly-20260710-102fde7b6`'],
  ['docs/react-native-target-snapshot.md', 'npm `next` channel classification: `prerelease`'],
  ['docs/react-native-target-snapshot.md', 'Default upgrade channel: `latest`'],
  ['docs/react-native-target-snapshot.md', 'React peer for `react-native@0.86.0`: `^19.2.3`'],
  ['docs/react-native-target-snapshot.md', 'Node engine for `react-native@0.86.0`: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`'],
  ['docs/react-native-target-snapshot.md', 'This snapshot is not a direct-upgrade instruction'],
  ['docs/react-native-target-snapshot.md', 'RC/nightly builds are not treated as the wallet\'s default upgrade target'],
  ['docs/react-native-target-snapshot.md', 'Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`'],
  ['docs/react-native-target-snapshot.md', 'corepack yarn rn:target-snapshot:current'],
  ['docs/react-native-target-snapshot.md', 'corepack yarn rn:target-snapshot:check-summary'],
  ['docs/react-native-target-snapshot.md', 'corepack yarn check:rn-target-snapshot-summary-guard'],
  ['docs/react-native-upgrade-path.md', 'React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`'],
  ['docs/wallet-modernization-baseline.md', 'React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`'],
];

export const getReactNativeTargetSnapshotIssues = ({ dependencies, nvmrc, docs }) => {
  const errors = [];

  if (dependencies['react-native'] !== expectedReactNativeTargetSnapshot.currentReactNative) {
    errors.push(
      `package.json has react-native@${dependencies['react-native'] || '<missing>'}; expected current baseline ${
        expectedReactNativeTargetSnapshot.currentReactNative
      } for this snapshot`,
    );
  }

  if (dependencies.react !== expectedReactNativeTargetSnapshot.currentReact) {
    errors.push(`package.json has react@${dependencies.react || '<missing>'}; expected current baseline ${expectedReactNativeTargetSnapshot.currentReact}`);
  }

  if (nvmrc !== expectedReactNativeTargetSnapshot.currentNode) {
    errors.push(`.nvmrc is ${nvmrc || '<missing>'}; expected current Metro/dev runtime ${expectedReactNativeTargetSnapshot.currentNode}`);
  }

  requiredReactNativeTargetSnapshotSnippets.forEach(([relativePath, snippet]) => {
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

  requiredReactNativeTargetSnapshotSnippets.forEach(([relativePath]) => {
    if (!Object.prototype.hasOwnProperty.call(docs, relativePath)) {
      try {
        docs[relativePath] = read(relativePath);
      } catch {
        docs[relativePath] = '';
      }
    }
  });

  return {
    dependencies: packageJson.dependencies || {},
    nvmrc: read('.nvmrc').trim(),
    docs,
  };
};

const printReport = environment => {
  const { errors } = getReactNativeTargetSnapshotIssues(environment);

  console.log('React Native target snapshot audit');
  console.log(`Snapshot date: ${expectedReactNativeTargetSnapshot.snapshotDate}`);
  console.log(`Current react-native: ${environment.dependencies['react-native'] || '<missing>'}`);
  console.log(`Current react: ${environment.dependencies.react || '<missing>'}`);
  console.log(`Current .nvmrc: ${environment.nvmrc || '<missing>'}`);
  console.log(`npm latest snapshot: react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative}`);
  console.log(`npm next snapshot: react-native@${expectedReactNativeTargetSnapshot.npmNextReactNative}`);
  console.log(`npm nightly snapshot: react-native@${expectedReactNativeTargetSnapshot.npmNightlyReactNative}`);
  console.log(`Target React peer snapshot: ${expectedReactNativeTargetSnapshot.targetReactPeer}`);
  console.log(`Target Node engine snapshot: ${expectedReactNativeTargetSnapshot.targetNodeEngine}`);

  if (errors.length > 0) {
    console.log('React Native target snapshot documentation is invalid:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('React Native target snapshot documentation matches the recorded npm snapshot and current repo baseline.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}

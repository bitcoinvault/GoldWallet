import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const expectedReactNativeTargetSnapshot = {
  snapshotDate: '2026-08-10',
  currentReactNative: '0.86.2',
  currentReact: '19.2.3',
  currentNode: '24.16.0',
  npmLatestReactNative: '0.86.2',
  npmNextReactNative: '0.87.0-rc.4',
  npmNightlyReactNative: '0.88.0-nightly-20260810-8415753e2',
  npmNextChannel: 'prerelease',
  npmNightlyChannel: 'prerelease',
  npmNightlyTagFormat: 'valid',
  defaultUpgradeChannel: 'latest',
  targetReactPeer: '^19.2.3',
  targetNodeEngine: '^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0',
};

export const requiredReactNativeTargetSnapshotSnippets = [
  ['docs/react-native-target-snapshot.md', 'NPM snapshot date: `2026-08-10`'],
  ['docs/react-native-target-snapshot.md', 'Current repo React Native: `0.86.2`'],
  ['docs/react-native-target-snapshot.md', 'Current repo React: `19.2.3`'],
  ['docs/react-native-target-snapshot.md', 'Current repo Metro/dev Node runtime: `24.16.0`'],
  ['docs/react-native-target-snapshot.md', 'npm `latest`: `0.86.2`'],
  ['docs/react-native-target-snapshot.md', 'npm `next`: `0.87.0-rc.4`'],
  ['docs/react-native-target-snapshot.md', 'npm `nightly` last observed: `0.88.0-nightly-20260810-8415753e2`'],
  ['docs/react-native-target-snapshot.md', 'npm `next` channel classification: `prerelease`'],
  ['docs/react-native-target-snapshot.md', 'npm `nightly` tracking policy: `informational version, enforced prerelease tag format`'],
  ['docs/react-native-target-snapshot.md', 'Default upgrade channel: `latest`'],
  ['docs/react-native-target-snapshot.md', 'Latest live verification: `2026-08-10`'],
  ['docs/react-native-target-snapshot.md', 'React peer for `react-native@0.86.2`: `^19.2.3`'],
  ['docs/react-native-target-snapshot.md', 'Node engine for `react-native@0.86.2`: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`'],
  ['docs/react-native-target-snapshot.md', 'This snapshot is not a direct-upgrade instruction'],
  ['docs/react-native-target-snapshot.md', 'RC/nightly builds are not treated as the wallet\'s default upgrade target'],
  ['docs/react-native-target-snapshot.md', 'Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`'],
  ['docs/react-native-target-snapshot.md', 'corepack yarn rn:target-snapshot:current'],
  ['docs/react-native-target-snapshot.md', 'corepack yarn rn:target-snapshot:check-summary'],
  ['docs/react-native-target-snapshot.md', 'corepack yarn check:rn-target-snapshot-summary-guard'],
  ['docs/react-native-upgrade-path.md', 'React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`'],
  ['docs/react-native-upgrade-path.md', 'As of the 2026-08-10 live probe'],
  ['docs/react-native-upgrade-path.md', 'npm `latest` is `0.86.2`; `0.87.0-rc.4` remains a prerelease planning signal'],
  ['docs/react-native-upgrade-path.md', 'expired external Electrum certificate'],
  ['docs/wallet-modernization-baseline.md', 'React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`'],
  ['docs/wallet-modernization-baseline.md', '`react-native@0.86.2` latest, `0.87.0-rc.4` next'],
  ['docs/wallet-modernization-baseline.md', 'Latest live RN target snapshot check on `2026-08-10` matched the recorded `2026-08-10` snapshot'],
  ['docs/react-native-foundation-target-matrix.md', 'npm `react-native@next`: `0.87.0-rc.4`'],
  ['docs/react-native-foundation-target-matrix.md', 'npm `react-native@nightly` last observed: `0.88.0-nightly-20260810-8415753e2`'],
  ['docs/react-native-foundation-target-matrix.md', 'Snapshot recorded: `2026-08-10`'],
  ['docs/react-native-foundation-target-matrix.md', 'Latest live verification: `2026-08-10`, outcome `matched`, mismatches `0`'],
  ['docs/react-native-foundation-target-matrix.md', 'BEM-37.962 proves that RC4 can build through AsyncStorage on AGP 9.2.1'],
  ['docs/react-native-087-readiness.md', 'Checked: 2026-08-10'],
  ['docs/react-native-087-readiness.md', 'Probed next target: `react-native@0.87.0-rc.4`'],
  ['docs/react-native-087-readiness.md', 'Production upgrade decision: pending stable release and complete runtime acceptance'],
  ['docs/wallet-modernization-log.md', '### BEM-37.962 - React Native 0.87 RC4 acceptance probe'],
  ['docs/wallet-modernization-log.md', 'RN `0.86.2` as stable `latest`, `0.87.0-rc.4` as prerelease `next`'],
  ['docs/wallet-modernization-log.md', 'No RC package, AGP 9 toolchain, compatibility flag, generated APK, screenshot, or local probe artifact is included in the production diff.'],
];

const currentSnapshotFieldChecks = [
  ['docs/react-native-target-snapshot.md', 'NPM snapshot date', /^(?:- )?NPM snapshot date: `([^`]+)`$/m, '2026-08-10'],
  ['docs/react-native-target-snapshot.md', 'npm next', /^(?:- )?npm `next`: `([^`]+)`$/m, '0.87.0-rc.4'],
  ['docs/react-native-target-snapshot.md', 'latest live verification', /^(?:- )?Latest live verification: `([^`]+)`$/m, '2026-08-10'],
  ['docs/react-native-foundation-target-matrix.md', 'npm next', /^(?:- )?npm `react-native@next`: `([^`]+)`$/m, '0.87.0-rc.4'],
  ['docs/react-native-foundation-target-matrix.md', 'snapshot recorded', /^(?:- )?Snapshot recorded: `([^`]+)`$/m, '2026-08-10'],
  [
    'docs/react-native-foundation-target-matrix.md',
    'latest live verification',
    /^(?:- )?Latest live verification: `([^`]+)`, outcome `matched`, mismatches `0`$/m,
    '2026-08-10',
  ],
  ['docs/react-native-087-readiness.md', 'checked date', /^Checked: (\S+)$/m, '2026-08-10'],
  ['docs/react-native-087-readiness.md', 'probed next target', /^(?:- )?Probed next target: `react-native@([^`]+)`$/m, '0.87.0-rc.4'],
  [
    'docs/react-native-087-readiness.md',
    'production upgrade decision',
    /^(?:- )?Production upgrade decision: (.+)$/m,
    'pending stable release and complete runtime acceptance',
  ],
  ['docs/react-native-upgrade-path.md', 'live probe date', /As of the (\d{4}-\d{2}-\d{2}) live probe/, '2026-08-10'],
  [
    'docs/wallet-modernization-baseline.md',
    'latest live snapshot date',
    /Latest live RN target snapshot check on `(\d{4}-\d{2}-\d{2})` matched the recorded `2026-08-10` snapshot/,
    '2026-08-10',
  ],
];

const assertSingleCurrentField = (errors, docs, [relativePath, label, pattern, expected]) => {
  const content = docs[relativePath] || '';
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...content.matchAll(new RegExp(pattern.source, flags))];

  if (matches.length !== 1) {
    errors.push(`${relativePath} must contain exactly one current ${label} field; found ${matches.length}`);
    return;
  }

  if (matches[0][1] !== expected) {
    errors.push(`${relativePath} has ${label} "${matches[0][1]}"; expected "${expected}"`);
  }
};

const assertOnlyCurrentRc = (errors, relativePath, content) => {
  const versions = content.match(/0\.87\.0-rc\.\d+/g) || [];
  const staleVersions = [...new Set(versions.filter(version => version !== expectedReactNativeTargetSnapshot.npmNextReactNative))];

  if (staleVersions.length > 0) {
    errors.push(`${relativePath} contains stale current-snapshot RN prerelease value(s): ${staleVersions.join(', ')}`);
  }
};

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

  currentSnapshotFieldChecks.forEach(fieldCheck => assertSingleCurrentField(errors, docs, fieldCheck));

  [
    'docs/react-native-087-readiness.md',
    'docs/react-native-foundation-target-matrix.md',
    'docs/react-native-upgrade-path.md',
    'docs/wallet-modernization-baseline.md',
  ].forEach(relativePath => assertOnlyCurrentRc(errors, relativePath, docs[relativePath] || ''));

  const modernizationLog = docs['docs/wallet-modernization-log.md'] || '';
  const currentLogEntry = modernizationLog.match(
    /### BEM-37\.962 - React Native 0\.87 RC4 acceptance probe([\s\S]*?)(?=\n### |$)/,
  );

  if (!currentLogEntry) {
    errors.push('docs/wallet-modernization-log.md is missing the bounded BEM-37.962 entry.');
  } else {
    assertOnlyCurrentRc(errors, 'docs/wallet-modernization-log.md BEM-37.962 entry', currentLogEntry[1]);
  }

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
  console.log(`npm nightly last observed: react-native@${expectedReactNativeTargetSnapshot.npmNightlyReactNative}`);
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

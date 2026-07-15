import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';
import { expectedReactNativeTargetSnapshot } from './auditReactNativeTargetSnapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'rn-target-snapshot-current-summary.txt');
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);

const npmView = (pkg, field) =>
  execFileSync(npmCommand, npmArgs(['view', pkg, field, '--json']), {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();

const parseJson = value => JSON.parse(value);
const readString = (pkg, field) => {
  const parsed = parseJson(npmView(pkg, field));
  return typeof parsed === 'string' ? parsed : '';
};
const readObject = (pkg, field) => parseJson(npmView(pkg, field));
const classifyReactNativeChannel = version => (version && version.includes('-') ? 'prerelease' : 'stable');
const classifyNightlyTagFormat = version => (/^\d+\.\d+\.\d+-nightly-\d{8}-[0-9a-f]+$/.test(version) ? 'valid' : 'invalid');

export const getReactNativeTargetSnapshotCurrentIssues = ({ latest, next, nightly, reactPeer, nodeEngine }, snapshot = expectedReactNativeTargetSnapshot) => {
  const nextChannel = classifyReactNativeChannel(next);
  const nightlyChannel = classifyReactNativeChannel(nightly);
  const nightlyTagFormat = classifyNightlyTagFormat(nightly);
  const checks = [
    ['npm latest react-native', latest, snapshot.npmLatestReactNative],
    ['npm next react-native', next, snapshot.npmNextReactNative],
    ['npm nightly react-native', nightly, snapshot.npmNightlyReactNative, false],
    ['npm next channel classification', nextChannel, snapshot.npmNextChannel],
    ['npm nightly channel classification', nightlyChannel, snapshot.npmNightlyChannel],
    ['npm nightly tag format', nightlyTagFormat, snapshot.npmNightlyTagFormat],
    ['default React Native upgrade channel', snapshot.defaultUpgradeChannel, 'latest'],
    [`react-native@${snapshot.npmLatestReactNative} React peer`, reactPeer, snapshot.targetReactPeer],
    [`react-native@${snapshot.npmLatestReactNative} Node engine`, nodeEngine, snapshot.targetNodeEngine],
  ];

  const errors = checks
    .filter(([, actual, expected, enforced = true]) => enforced && actual !== expected)
    .map(([label, actual, expected]) => `${label} is ${actual || '<missing>'}; snapshot expects ${expected}`);

  if (next && latest && next === latest) {
    errors.push(`npm next react-native matches latest (${latest}); refresh the target policy before treating next as planning-only`);
  }

  if (nightly && latest && nightly === latest) {
    errors.push(`npm nightly react-native matches latest (${latest}); refresh the target policy before treating nightly as planning-only`);
  }

  return { checks, errors };
};

export const formatReactNativeTargetSnapshotCurrentSummary = ({ checks, errors, generatedAt = new Date().toISOString() }) => [
  'React Native target snapshot live npm check',
  `Generated at: ${generatedAt}`,
  `Snapshot date: ${expectedReactNativeTargetSnapshot.snapshotDate}`,
  `Live check outcome: ${errors.length > 0 ? 'stale' : 'matched'}`,
  ...checks.map(([label, actual, expected]) => `${label}: ${actual || '<missing>'} (snapshot: ${expected})`),
  `Mismatches: ${errors.length}`,
  ...errors.map(error => `- ${error}`),
  '',
].join('\n');

const writeSummary = summary => {
  const summaryDir = path.dirname(summaryPath);
  if (!existsSync(summaryDir)) {
    mkdirSync(summaryDir, { recursive: true });
  }
  writeFileSync(summaryPath, summary);
};

const collectCurrentNpmMetadata = () => {
  const latest = readString('react-native', 'version');
  const distTags = readObject('react-native', 'dist-tags');
  const peerDependencies = readObject(`react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative}`, 'peerDependencies');
  const engines = readObject(`react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative}`, 'engines');

  return {
    latest,
    next: distTags.next,
    nightly: distTags.nightly,
    reactPeer: peerDependencies.react,
    nodeEngine: engines.node,
  };
};

const printReport = current => {
  const { checks, errors } = getReactNativeTargetSnapshotCurrentIssues(current);
  writeSummary(formatReactNativeTargetSnapshotCurrentSummary({ checks, errors }));

  console.log('React Native target snapshot live npm check');
  checks.forEach(([label, actual]) => console.log(`${label}: ${actual || '<missing>'}`));
  console.log(`Summary written to ${summaryPath}`);

  if (errors.length > 0) {
    console.log('React Native target snapshot is stale against current npm metadata:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('React Native target snapshot still matches current npm metadata.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectCurrentNpmMetadata());
}

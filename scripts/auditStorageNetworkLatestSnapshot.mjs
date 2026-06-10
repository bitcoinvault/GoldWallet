import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getStorageNetworkLatestSnapshotSummaryErrors } from './storageNetworkLatestSnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'storage-network-latest-snapshot.txt');

const readJson = relativePath => JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
const packageJson = readJson('package.json');
const dependencies = packageJson.dependencies || {};

const trackedPackages = [
  '@react-native-async-storage/async-storage',
  '@react-native-community/netinfo',
  'react-native-device-info',
  'react-native-config',
  'react-native-localize',
  'react-native-get-random-values',
  'react-native-keychain',
  'react-native-secure-key-store',
  'react-native-tcp-socket',
  'react-native-webview',
];

const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);

const npmView = packageName =>
  JSON.parse(
    execFileSync(npmCommand, npmArgs(['view', packageName, 'version', 'peerDependencies', 'engines', '--json']), {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim(),
  );

const normalizeNpmMetadata = metadata =>
  typeof metadata === 'string'
    ? {
        version: metadata,
        peerDependencies: {},
        engines: {},
      }
    : metadata || {};

const getInstalledVersion = packageName => {
  const installedPackageJson = readJson(path.join('node_modules', packageName, 'package.json'));
  return installedPackageJson.version || '<missing>';
};

const formatMap = value => {
  const entries = Object.entries(value || {});
  return entries.length === 0 ? 'none' : entries.map(([name, range]) => `${name}@${range}`).join(', ');
};

const getDecision = ({ manifestVersion, installedVersion, latestVersion }) => {
  if (manifestVersion === latestVersion && installedVersion === latestVersion) {
    return 'current - latest npm package is installed and pinned for the storage/network baseline';
  }

  return 'deferred - open a dedicated storage/network compatibility branch before changing this package';
};

export const collectStorageNetworkLatestSnapshot = () =>
  trackedPackages.map(packageName => {
    const manifestVersion = dependencies[packageName] || '<missing>';
    const installedVersion = getInstalledVersion(packageName);
    const metadata = normalizeNpmMetadata(npmView(packageName));
    const latestVersion = metadata.version || '<missing>';

    return {
      packageName,
      manifestVersion,
      installedVersion,
      latestVersion,
      peerDependencies: formatMap(metadata.peerDependencies),
      engines: formatMap(metadata.engines),
      decision: getDecision({ manifestVersion, installedVersion, latestVersion }),
    };
  });

export const formatStorageNetworkLatestSnapshotSummary = (entries, generatedAt = new Date().toISOString()) => {
  const currentEntries = entries.filter(entry => entry.decision.startsWith('current')).length;
  const deferredEntries = entries.filter(entry => entry.decision.startsWith('deferred')).length;

  return [
    'Storage/network latest snapshot audit',
    `Generated at: ${generatedAt}`,
    `Node version: ${process.version}`,
    `Entries: ${entries.length}`,
    ...entries.map(
      entry =>
        `- ${entry.packageName}: package ${entry.manifestVersion}, installed ${entry.installedVersion}, latest ${entry.latestVersion}, peers ${entry.peerDependencies}, engines ${entry.engines}, decision ${entry.decision}`,
    ),
    `Current entries: ${currentEntries}`,
    `Deferred entries: ${deferredEntries}`,
    'Secret values printed: no',
    'Required action: use this snapshot before storage/network dependency branches; package changes require focused tests, Android build, and emulator smoke.',
    '',
  ].join('\n');
};

const printReport = entries => {
  const summary = formatStorageNetworkLatestSnapshotSummary(entries);
  const errors = getStorageNetworkLatestSnapshotSummaryErrors(summary);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  console.log(summary.trim());
  console.log(`Storage/network latest snapshot summary written to ${path.relative(root, summaryPath)}`);

  if (errors.length > 0) {
    console.error('Storage/network latest snapshot summary is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectStorageNetworkLatestSnapshot());
}

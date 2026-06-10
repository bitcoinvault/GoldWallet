import { spawnSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getDirectOutdatedSnapshotSummaryErrors } from './directOutdatedSnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'direct-outdated-snapshot.txt');
const expectedNodeVersion = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();

const command = process.platform === 'win32' ? 'cmd.exe' : 'corepack';
const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'corepack', 'yarn', 'outdated', '--json'] : ['yarn', 'outdated', '--json'];

const knownDecisions = new Map([
  [
    'bitcoinjs-lib',
    'exotic - BitcoinVault fork is tracked by git dependency snapshot; do not replace with upstream npm without wallet compatibility proof',
  ],
  [
    'electrum-client',
    'exotic - BitcoinVault Electrum fork is tracked by git dependency snapshot; keep network compatibility changes in a dedicated branch',
  ],
  [
    'react-native-prompt-android',
    'exotic - prompt fork remains wallet-critical for encrypted storage startup; keep Android native prompt linkage guarded',
  ],
  [
    'rn-nodeify',
    'exotic - GitHub pin is guarded by rn-nodeify shim checks and git dependency snapshot',
  ],
  [
    'react',
    'blocked - React Native renderer exact-version coupling requires React to stay aligned with the RN target snapshot',
  ],
  [
    'react-native-gesture-handler',
    'blocked - gesture runtime patch drift requires a dedicated navigation/gesture smoke branch before bumping',
  ],
  [
    'react-test-renderer',
    'blocked - React Native renderer exact-version coupling requires test renderer to stay aligned with React and RN',
  ],
  [
    'bl',
    'blocked - CommonJS transitive consumers still require the validated bl 6 resolution before the ESM/export-map v7 line',
  ],
  [
    'node-fetch',
    'blocked - ESM-only v3 remains incompatible with guarded CommonJS transitive consumers',
  ],
]);

const parseYarnOutdatedJson = stdout => {
  const tableEvent = stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .find(event => event?.type === 'table');

  return tableEvent?.data?.body || [];
};

const getDecision = packageName => knownDecisions.get(packageName) || 'review-required - new direct outdated entry needs a dedicated upgrade decision before passing baseline';

export const collectDirectOutdatedSnapshot = () => {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });

  if (![0, 1].includes(result.status)) {
    console.error(result.stderr || result.stdout || 'yarn outdated failed without output');
    process.exit(result.status || 1);
  }

  return parseYarnOutdatedJson(result.stdout).map(([name, current, wanted, latest, type]) => ({
    name,
    current,
    wanted,
    latest,
    type,
    decision: getDecision(name),
  }));
};

export const formatDirectOutdatedSnapshotSummary = (entries, generatedAt = new Date().toISOString()) => {
  const knownBlockedEntries = entries.filter(entry => entry.decision.startsWith('blocked')).length;
  const exoticEntries = entries.filter(entry => entry.decision.startsWith('exotic')).length;
  const reviewRequiredEntries = entries.filter(entry => entry.decision.startsWith('review-required')).length;

  return [
    'Direct dependency outdated snapshot audit',
    `Generated at: ${generatedAt}`,
    `Node version: ${process.version}`,
    `Expected Node version: v${expectedNodeVersion}`,
    `Entries: ${entries.length}`,
    ...entries.map(
      entry =>
        `- ${entry.name}: current ${entry.current || '<missing>'}, wanted ${entry.wanted || '<missing>'}, latest ${
          entry.latest || '<missing>'
        }, type ${entry.type || '<missing>'}, decision ${entry.decision}`,
    ),
    `Known blocked entries: ${knownBlockedEntries}`,
    `Exotic entries: ${exoticEntries}`,
    `Review-required entries: ${reviewRequiredEntries}`,
    'Secret values printed: no',
    'Required action: do not blindly bump direct outdated entries; use the recorded decision and open a dedicated compatibility branch for each blocker or new review-required package.',
    '',
  ].join('\n');
};

const printReport = entries => {
  const summary = formatDirectOutdatedSnapshotSummary(entries);
  const errors = getDirectOutdatedSnapshotSummaryErrors(summary);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  console.log(summary.trim());
  console.log(`Direct outdated snapshot summary written to ${path.relative(root, summaryPath)}`);

  if (errors.length > 0) {
    console.error('Direct outdated snapshot summary is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectDirectOutdatedSnapshot());
}

import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getGitDependencySnapshotSummaryErrors } from './gitDependencySnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'git-dependency-snapshot.txt');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const yarnLock = readFileSync(path.join(root, 'yarn.lock'), 'utf8');

const trackedDependencies = [
  {
    name: 'bitcoinjs-lib',
    source: 'dependencies',
    remote: 'https://github.com/bitcoinvault/bitcoinjs-lib.git',
    ref: 'refs/heads/master',
    walletCritical: true,
  },
  {
    name: 'electrum-client',
    source: 'dependencies',
    remote: 'https://github.com/bitcoinvault/rn-electrum-client.git',
    ref: 'refs/heads/master',
    walletCritical: true,
  },
  {
    name: 'react-native-prompt-android',
    source: 'dependencies',
    remote: 'https://github.com/marcosrdz/react-native-prompt-android.git',
    ref: 'refs/heads/master',
    walletCritical: true,
  },
  {
    name: 'rn-nodeify',
    source: 'devDependencies',
    remote: 'https://github.com/tradle/rn-nodeify.git',
    ref: 'refs/heads/master',
    walletCritical: false,
  },
];

const gitCommand = process.platform === 'win32' ? 'git.exe' : 'git';

const getRemoteHash = ({ remote, ref }) => {
  const output = execFileSync(gitCommand, ['ls-remote', remote, ref], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
  const [hash] = output.split(/\s+/);
  return hash || '';
};

const getLockHash = name => {
  const lines = yarnLock.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.startsWith(`"${name}@`) || line.startsWith(`${name}@`));

  if (startIndex === -1) {
    return '';
  }

  const bodyLines = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '') {
      break;
    }

    bodyLines.push(lines[index]);
  }

  const body = bodyLines.join('\n');
  const resolvedLine = body.split(/\r?\n/).find(line => line.trim().startsWith('resolved ')) || '';

  return resolvedLine.match(/#([a-f0-9]{40})/)?.[1] || resolvedLine.match(/tar\.gz\/([a-f0-9]{40})/)?.[1] || '';
};

export const collectGitDependencySnapshot = () =>
  trackedDependencies.map(entry => {
    const packageSpec = packageJson[entry.source]?.[entry.name] || '';
    const lockHash = getLockHash(entry.name);
    const remoteHash = getRemoteHash(entry);
    const status = lockHash && remoteHash && lockHash === remoteHash ? 'current' : 'review';

    return {
      ...entry,
      packageSpec,
      lockHash,
      remoteHash,
      status,
    };
  });

export const formatGitDependencySnapshotSummary = (entries, generatedAt = new Date().toISOString()) => {
  const mismatches = entries.filter(entry => entry.status !== 'current');
  const lines = [
    'Git dependency snapshot audit',
    `Generated at: ${generatedAt}`,
    `Entries: ${entries.length}`,
    `Mismatches: ${mismatches.length}`,
    ...entries.map(
      entry =>
        `- ${entry.name}: package spec: ${entry.packageSpec || '<missing>'}; lock hash: ${
          entry.lockHash || '<missing>'
        }; remote: ${entry.remote}; remote ref: ${entry.ref}; remote hash: ${entry.remoteHash || '<missing>'}; wallet critical: ${
          entry.walletCritical ? 'yes' : 'no'
        }; status: ${entry.status}`,
    ),
    'Secret values printed: no',
    'Required action: review the mismatched git dependency pins before changing wallet-critical fork or polyfill packages.',
    '',
  ];

  return lines.join('\n');
};

const printReport = entries => {
  const summary = formatGitDependencySnapshotSummary(entries);
  const errors = getGitDependencySnapshotSummaryErrors(summary);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  console.log(summary.trim());
  console.log(`Git dependency snapshot summary written to ${path.relative(root, summaryPath)}`);

  if (errors.length > 0) {
    console.error('Git dependency snapshot audit failed:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectGitDependencySnapshot());
}

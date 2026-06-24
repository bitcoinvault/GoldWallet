import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidToolchainTargetSummaryErrors } from './androidToolchainTargetSummaryGuard.mjs';
import { getBlResolutionSummaryErrors } from './blResolutionSummaryGuard.mjs';
import { getBabel8MigrationProbeSummaryErrors } from './babel8MigrationProbeSummaryGuard.mjs';
import { getDirectOutdatedSnapshotSummaryErrors } from './directOutdatedSnapshotSummaryGuard.mjs';
import { getGitDependencySnapshotSummaryErrors } from './gitDependencySnapshotSummaryGuard.mjs';
import { getNodeFetchResolutionSummaryErrors } from './nodeFetchResolutionSummaryGuard.mjs';
import { getReactNativeTargetSnapshotSummaryErrors } from './reactNativeTargetSnapshotSummaryGuard.mjs';
import { getStorageNetworkLatestSnapshotSummaryErrors } from './storageNetworkLatestSnapshotSummaryGuard.mjs';
import { getToolingLatestSnapshotSummaryErrors } from './toolingLatestSnapshotSummaryGuard.mjs';
import { getWalletCryptoLatestSnapshotSummaryErrors } from './walletCryptoLatestSnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const summaries = [
  {
    label: 'React Native live target snapshot',
    relativePath: 'local-docs/rn-target-snapshot-current-summary.txt',
    getErrors: getReactNativeTargetSnapshotSummaryErrors,
    requiredSnippets: ['Live check outcome: matched', 'Mismatches: 0'],
  },
  {
    label: 'direct outdated snapshot',
    relativePath: 'local-docs/direct-outdated-snapshot.txt',
    getErrors: getDirectOutdatedSnapshotSummaryErrors,
  },
  {
    label: 'Babel 8 migration probe',
    relativePath: 'local-docs/babel-8-migration-probe-summary.txt',
    getErrors: getBabel8MigrationProbeSummaryErrors,
  },
  {
    label: 'git dependency snapshot',
    relativePath: 'local-docs/git-dependency-snapshot.txt',
    getErrors: getGitDependencySnapshotSummaryErrors,
  },
  {
    label: 'wallet crypto latest snapshot',
    relativePath: 'local-docs/wallet-crypto-latest-snapshot.txt',
    getErrors: getWalletCryptoLatestSnapshotSummaryErrors,
  },
  {
    label: 'storage/network latest snapshot',
    relativePath: 'local-docs/storage-network-latest-snapshot.txt',
    getErrors: getStorageNetworkLatestSnapshotSummaryErrors,
  },
  {
    label: 'tooling latest snapshot',
    relativePath: 'local-docs/tooling-latest-snapshot.txt',
    getErrors: getToolingLatestSnapshotSummaryErrors,
  },
  {
    label: 'Android toolchain target',
    relativePath: 'local-docs/android-toolchain-target-summary.txt',
    getErrors: getAndroidToolchainTargetSummaryErrors,
  },
  {
    label: 'BL resolution readiness',
    relativePath: 'local-docs/bl-resolution-readiness-summary.txt',
    getErrors: getBlResolutionSummaryErrors,
  },
  {
    label: 'node-fetch resolution',
    relativePath: 'local-docs/node-fetch-resolution-summary.txt',
    getErrors: getNodeFetchResolutionSummaryErrors,
  },
];

const errors = [];

summaries.forEach(summary => {
  const summaryPath = path.join(root, summary.relativePath);

  if (!existsSync(summaryPath)) {
    errors.push(`${summary.label} summary artifact is missing at ${summary.relativePath}`);
    return;
  }

  const summaryContent = readFileSync(summaryPath, 'utf8');
  summary.getErrors(summaryContent).forEach(error => {
    errors.push(`${summary.label}: ${error}`);
  });

  (summary.requiredSnippets || []).forEach(snippet => {
    if (!summaryContent.includes(snippet)) {
      errors.push(`${summary.label}: missing required branch-ready evidence "${snippet}"`);
    }
  });
});

if (errors.length > 0) {
  console.error('Foundation target summary artifacts are invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Foundation target summary artifacts are valid.');

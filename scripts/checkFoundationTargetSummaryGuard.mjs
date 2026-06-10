import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const checkerPath = path.join(root, 'scripts', 'checkFoundationTargetSummaryArtifacts.mjs');
const checkerSource = readFileSync(checkerPath, 'utf8');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts || {};

const requiredCheckerSnippets = [
  "import { getReactNativeTargetSnapshotSummaryErrors } from './reactNativeTargetSnapshotSummaryGuard.mjs';",
  "import { getDirectOutdatedSnapshotSummaryErrors } from './directOutdatedSnapshotSummaryGuard.mjs';",
  "import { getGitDependencySnapshotSummaryErrors } from './gitDependencySnapshotSummaryGuard.mjs';",
  "import { getWalletCryptoLatestSnapshotSummaryErrors } from './walletCryptoLatestSnapshotSummaryGuard.mjs';",
  "import { getStorageNetworkLatestSnapshotSummaryErrors } from './storageNetworkLatestSnapshotSummaryGuard.mjs';",
  "import { getToolingLatestSnapshotSummaryErrors } from './toolingLatestSnapshotSummaryGuard.mjs';",
  "import { getAndroidToolchainTargetSummaryErrors } from './androidToolchainTargetSummaryGuard.mjs';",
  "import { getBlResolutionSummaryErrors } from './blResolutionSummaryGuard.mjs';",
  "import { getNodeFetchResolutionSummaryErrors } from './nodeFetchResolutionSummaryGuard.mjs';",
  "label: 'React Native live target snapshot'",
  "relativePath: 'local-docs/rn-target-snapshot-current-summary.txt'",
  "label: 'direct outdated snapshot'",
  "relativePath: 'local-docs/direct-outdated-snapshot.txt'",
  "label: 'git dependency snapshot'",
  "relativePath: 'local-docs/git-dependency-snapshot.txt'",
  "label: 'wallet crypto latest snapshot'",
  "relativePath: 'local-docs/wallet-crypto-latest-snapshot.txt'",
  "label: 'storage/network latest snapshot'",
  "relativePath: 'local-docs/storage-network-latest-snapshot.txt'",
  "label: 'tooling latest snapshot'",
  "relativePath: 'local-docs/tooling-latest-snapshot.txt'",
  "label: 'Android toolchain target'",
  "relativePath: 'local-docs/android-toolchain-target-summary.txt'",
  "label: 'BL resolution readiness'",
  "relativePath: 'local-docs/bl-resolution-readiness-summary.txt'",
  "label: 'node-fetch resolution'",
  "relativePath: 'local-docs/node-fetch-resolution-summary.txt'",
  'Live check outcome: matched',
  'Mismatches: 0',
  'Foundation target summary artifacts are invalid:',
  'Foundation target summary artifacts are valid.',
];

const requiredPackageScripts = {
  'foundation:target:check-summaries': 'node scripts/checkFoundationTargetSummaryArtifacts.mjs',
  'check:foundation-target-summary-guard': 'node scripts/checkFoundationTargetSummaryGuard.mjs',
};

const errors = [];

requiredCheckerSnippets.forEach(snippet => {
  if (!checkerSource.includes(snippet)) {
    errors.push(`Missing checker snippet: ${snippet}`);
  }
});

Object.entries(requiredPackageScripts).forEach(([name, expected]) => {
  if (scripts[name] !== expected) {
    errors.push(`package.json script ${name} must be "${expected}"`);
  }
});

if (!scripts['rn:baseline:preflight']?.includes('yarn check:foundation-target-summary-guard')) {
  errors.push('rn:baseline:preflight must include the foundation target summary guard');
}

if (!scripts['rn:baseline:preflight:online']?.includes('yarn foundation:target:check-summaries')) {
  errors.push('rn:baseline:preflight:online must validate the aggregate foundation target summaries');
}

if (errors.length > 0) {
  console.error('Foundation target summary aggregate guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Foundation target summary aggregate guard checks are valid.');

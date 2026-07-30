import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

const packageJson = JSON.parse(read('package.json'));

export const requiredDependencyUpgradeStrategySnippets = [
  ['docs/dependency-upgrade-strategy.md', 'Try the latest target first when the change is feasible'],
  ['docs/dependency-upgrade-strategy.md', 'If latest fails, capture the exact blocker'],
  ['docs/dependency-upgrade-strategy.md', 'Do not commit a dependency change that only passes TypeScript or Android assemble'],
  ['docs/dependency-upgrade-strategy.md', 'One branch can contain multiple packages when they belong to the same layer'],
  ['docs/dependency-upgrade-strategy.md', 'The next coding branch should continue from the foundation layer'],
  ['docs/dependency-upgrade-strategy.md', 'The current completed milestone jump is RN `0.86.2`, not every intermediate RN minor'],
  ['docs/react-native-foundation-target-matrix.md', 'Do not walk every RN minor version'],
  ['docs/react-native-foundation-target-matrix.md', 'Milestone A: RN 0.85.3 Foundation'],
  ['docs/react-native-foundation-target-matrix.md', 'Milestone B: RN 0.86.2 Latest Foundation'],
  ['docs/react-native-foundation-target-matrix.md', 'Milestone C: Future current line'],
  ['docs/react-native-upgrade-path.md', 'Prefer milestone jumps over version-by-version package work'],
  ['docs/react-native-upgrade-path.md', 'If a milestone fails, isolate the blocker before falling back to a lower milestone'],
  ['docs/wallet-modernization-baseline.md', 'Continue from RN `0.86.2` on the current supported line'],
  ['docs/android-modernization-workflow.md', 'corepack yarn upgrade:strategy:audit'],
];

export const getDependencyUpgradeStrategyIssues = ({ scripts, docs }) => {
  const errors = [];

  if (scripts['upgrade:strategy:audit'] !== 'node scripts/auditDependencyUpgradeStrategy.mjs') {
    errors.push('package.json is missing upgrade:strategy:audit script');
  }

  if (!scripts['rn:baseline:preflight']?.includes('yarn upgrade:strategy:audit')) {
    errors.push('package.json rn:baseline:preflight must include yarn upgrade:strategy:audit');
  }

  requiredDependencyUpgradeStrategySnippets.forEach(([relativePath, snippet]) => {
    const content = docs[relativePath] || '';
    if (!content.includes(snippet)) {
      errors.push(`${relativePath} is missing "${snippet}"`);
    }
  });

  return { errors };
};

const collectEnvironment = () => {
  const docs = {};

  requiredDependencyUpgradeStrategySnippets.forEach(([relativePath]) => {
    if (!Object.prototype.hasOwnProperty.call(docs, relativePath)) {
      try {
        docs[relativePath] = read(relativePath);
      } catch {
        docs[relativePath] = '';
      }
    }
  });

  return {
    scripts: packageJson.scripts || {},
    docs,
  };
};

const printReport = environment => {
  const { errors } = getDependencyUpgradeStrategyIssues(environment);

  console.log('Dependency upgrade strategy audit');
  console.log('Target approach: layered milestone jumps, not one-package or one-minor churn.');

  if (errors.length > 0) {
    console.log('Dependency upgrade strategy is invalid:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('Dependency upgrade strategy documentation and preflight wiring are valid.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}

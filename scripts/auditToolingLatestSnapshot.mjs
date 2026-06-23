import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getToolingLatestSnapshotSummaryErrors } from './toolingLatestSnapshotSummaryGuard.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'tooling-latest-snapshot.txt');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const expectedNodeVersion = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();

const trackedTooling = [
  {
    name: 'typescript',
    source: 'devDependencies',
    decision: 'current - latest TypeScript compiler verified with the RN/test baseline validation gates',
  },
  {
    name: 'jest',
    source: 'devDependencies',
    decision: 'current - latest Jest runtime verified with RN preset environment resolutions and focused suites',
  },
  {
    name: 'babel-jest',
    source: 'devDependencies',
    decision: 'current - latest Jest transformer verified with the Jest 30 runtime',
  },
  {
    name: 'jest-circus',
    source: 'devDependencies',
    decision: 'current - latest Jest runner verified with the Jest 30 runtime',
  },
  {
    name: 'jest-environment-node',
    source: 'devDependencies',
    decision: 'current - latest Jest environment required to keep the RN preset compatible with Jest 30 runtime',
  },
  {
    name: 'jest-junit',
    source: 'devDependencies',
    decision: 'current - latest report tooling verified separately from the Jest runtime',
  },
  {
    name: 'junit-report-merger',
    source: 'devDependencies',
    decision: 'current - latest JUnit report merge tooling verified with the Detox report script',
  },
  {
    name: 'babel-plugin-istanbul',
    source: 'devDependencies',
    decision: 'current - latest coverage instrumentation verified with Jest coverage',
  },
  {
    name: 'mailosaur',
    source: 'devDependencies',
    decision: 'current - latest E2E mail helper verified with TypeScript',
  },
  {
    name: 'jsdom',
    source: 'devDependencies',
    decision: 'current - latest E2E mail DOM parser verified with TypeScript and helper probe',
  },
  {
    name: 'jetifier',
    source: 'devDependencies',
    decision: 'current - latest AndroidX migration helper verified with postinstall, Android build, and emulator smoke',
  },
  {
    name: '@typescript-eslint/eslint-plugin',
    source: 'devDependencies',
    decision: 'current - parser/plugin pair verified through the ESLint 10 flat-config bridge',
  },
  {
    name: '@typescript-eslint/parser',
    source: 'devDependencies',
    decision: 'current - parser/plugin pair verified through the ESLint 10 flat-config bridge',
  },
  {
    name: 'eslint',
    source: 'devDependencies',
    decision:
      'current - latest ESLint 10 runtime verified through eslint.config.mjs while preserving the existing lint baseline',
  },
  {
    name: '@eslint/js',
    source: 'devDependencies',
    decision: 'current - latest ESLint recommended config package required by the ESLint 10 flat-config bridge',
  },
  {
    name: '@eslint/eslintrc',
    source: 'devDependencies',
    decision: 'current - latest FlatCompat package used to bridge the legacy .eslintrc baseline into ESLint 10',
  },
  {
    name: '@eslint/compat',
    source: 'devDependencies',
    decision: 'current - latest compatibility helpers used to patch legacy plugin rules for ESLint 10',
  },
  {
    name: 'jiti',
    source: 'devDependencies',
    decision: 'current - latest ESLint 10 peer dependency installed explicitly for config loading',
  },
  {
    name: 'prettier',
    source: 'devDependencies',
    decision:
      'current - latest Prettier 3 formatting runtime verified against the existing lint baseline without mass formatting',
  },
  {
    name: 'eslint-plugin-prettier',
    source: 'devDependencies',
    decision: 'current - latest Prettier ESLint plugin verified with Prettier 3 and the ESLint 10 flat-config bridge',
  },
  {
    name: 'eslint-config-prettier',
    source: 'devDependencies',
    decision: 'current - latest Prettier ESLint config verified with the ESLint 10 flat-config bridge',
  },
  {
    name: 'lint-staged',
    source: 'devDependencies',
    decision: 'current - latest lint-staged verified on the Node 24 tooling baseline',
  },
  {
    name: 'husky',
    source: 'devDependencies',
    decision: 'current - latest hook runner verified with repo-owned .husky hooks and precommit/prepush scripts',
  },
  {
    name: 'detox',
    source: 'devDependencies',
    decision: 'current - latest Detox runner version is guarded by check:detox-readiness; Android Detox build passed and iOS runtime validation remains a macOS follow-up',
  },
];

const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);
const npmViewVersion = packageName =>
  JSON.parse(
    execFileSync(npmCommand, npmArgs(['view', packageName, 'version', '--json']), {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim(),
  );

const getInstalledVersion = packageName => {
  try {
    return require(`${packageName}/package.json`).version;
  } catch {
    try {
      let packageDir = path.dirname(require.resolve(packageName));

      while (packageDir !== path.dirname(packageDir)) {
        const packagePath = path.join(packageDir, 'package.json');

        if (existsSync(packagePath)) {
          const packageVersion = JSON.parse(readFileSync(packagePath, 'utf8')).version;

          if (packageVersion) {
            return packageVersion;
          }
        }

        packageDir = path.dirname(packageDir);
      }
    } catch {
      return null;
    }

    return null;
  }
};

const getDecision = ({ name, installed, latest, decision }) => {
  if (installed === latest) {
    return decision;
  }

  if (name === '@typescript-eslint/eslint-plugin' || name === '@typescript-eslint/parser') {
    return 'blocked - TypeScript ESLint patch drift requires a dedicated lint/tooling branch with precommit, lint-staged, TypeScript, and baseline audit proof';
  }

  if (name === 'lint-staged') {
    return 'blocked - precommit tooling patch drift requires a dedicated hook/tooling branch with lint-staged, precommit, and TypeScript proof';
  }

  return 'blocked - tooling patch drift requires a dedicated tooling dependency branch before updating the baseline snapshot';
};

export const collectToolingLatestSnapshot = () =>
  trackedTooling.map(entry => {
    const current = packageJson[entry.source]?.[entry.name];
    const installed = getInstalledVersion(entry.name);
    const latest = npmViewVersion(entry.name);

    return {
      ...entry,
      current,
      installed,
      latest,
      decision: getDecision({ ...entry, installed, latest }),
    };
  });

export const formatToolingLatestSnapshotSummary = (entries, generatedAt = new Date().toISOString()) => {
  const deferredEntries = entries.filter(entry => entry.decision.startsWith('deferred'));

  return [
    'Tooling latest snapshot audit',
    `Generated at: ${generatedAt}`,
    `Node version: ${process.version}`,
    `Expected Node version: v${expectedNodeVersion}`,
    `Entries: ${entries.length}`,
    ...entries.map(
      entry =>
        `- ${entry.name}: package ${entry.current || '<missing>'}, installed ${entry.installed || '<missing>'}, latest ${entry.latest}, decision ${
          entry.decision
        }`,
    ),
    `Deferred entries: ${deferredEntries.length}`,
    'Required action: use this snapshot before tooling dependency branches; no package versions are changed by this audit.',
    '',
  ].join('\n');
};

const writeSummary = summary => {
  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
};

const printReport = entries => {
  const missing = entries.filter(entry => !entry.current);

  if (missing.length > 0) {
    console.error('Tooling latest snapshot audit failed:');
    missing.forEach(entry => console.error(`- ${entry.name} is missing from package.json ${entry.source}`));
    process.exit(1);
  }

  const summary = formatToolingLatestSnapshotSummary(entries);
  const errors = getToolingLatestSnapshotSummaryErrors(summary);

  writeSummary(summary);
  console.log(summary.trim());
  console.log(`Tooling latest snapshot summary written to ${path.relative(root, summaryPath)}`);

  if (errors.length > 0) {
    console.error('Tooling latest snapshot summary is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectToolingLatestSnapshot());
}

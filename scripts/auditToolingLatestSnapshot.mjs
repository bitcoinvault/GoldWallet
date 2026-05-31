import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'tooling-latest-snapshot.txt');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const trackedTooling = [
  {
    name: 'typescript',
    source: 'devDependencies',
    decision: 'deferred - TypeScript belongs with RN/test baseline validation',
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
    decision: 'current - parser/plugin 8.60.0 pair verified on the ESLint 8.57 baseline',
  },
  {
    name: '@typescript-eslint/parser',
    source: 'devDependencies',
    decision: 'current - parser/plugin 8.60.0 pair verified on the ESLint 8.57 baseline',
  },
  {
    name: 'eslint',
    source: 'devDependencies',
    decision: 'deferred - ESLint major config migration is a separate lint baseline branch',
  },
  {
    name: 'prettier',
    source: 'devDependencies',
    decision: 'deferred - Prettier 3 requires a separate formatting migration',
  },
  {
    name: 'eslint-plugin-prettier',
    source: 'devDependencies',
    decision: 'deferred - Prettier plugin follows the Prettier major migration',
  },
  {
    name: 'eslint-config-prettier',
    source: 'devDependencies',
    decision: 'deferred - Prettier config follows the Prettier major migration',
  },
  {
    name: 'lint-staged',
    source: 'devDependencies',
    decision: 'deferred - latest requires a newer Node baseline',
  },
  {
    name: 'husky',
    source: 'devDependencies',
    decision: 'deferred - Husky major migration changes hook installation semantics',
  },
  {
    name: 'detox',
    source: 'devDependencies',
    decision: 'deferred - Detox major migration requires dedicated Android/iOS E2E runner validation',
  },
];

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmViewVersion = packageName =>
  JSON.parse(
    execFileSync(npmCommand, ['view', packageName, 'version', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
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
      deferred: installed !== latest,
    };
  });

export const formatToolingLatestSnapshotSummary = (entries, generatedAt = new Date().toISOString()) => {
  const deferredEntries = entries.filter(entry => entry.deferred);

  return [
    'Tooling latest snapshot audit',
    `Generated at: ${generatedAt}`,
    `Node version: ${process.version}`,
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
  writeSummary(summary);
  console.log(summary.trim());
  console.log(`Tooling latest snapshot summary written to ${path.relative(root, summaryPath)}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectToolingLatestSnapshot());
}

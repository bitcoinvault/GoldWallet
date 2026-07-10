import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import semver from 'semver';
import { fileURLToPath, pathToFileURL } from 'url';

import { getTypescript7CompatibilityProbeSummaryErrors } from './typescript7CompatibilityProbeSummaryGuard.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'typescript7-compatibility-probe-summary.txt');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const expectedNodeVersion = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);

const npmViewPackage = packageName => {
  const output = execFileSync(npmCommand, npmArgs(['view', packageName, 'version', 'peerDependencies', 'engines', '--json']), {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
  const metadata = JSON.parse(output);

  if (typeof metadata === 'string') {
    return { version: metadata, peerDependencies: {}, engines: {} };
  }

  return {
    version: metadata.version || '<missing>',
    peerDependencies: metadata.peerDependencies || {},
    engines: metadata.engines || {},
  };
};

const getInstalledVersion = packageName => {
  try {
    return require(`${packageName}/package.json`).version;
  } catch {
    return null;
  }
};

const getPackageVersion = packageName => packageJson.devDependencies?.[packageName] || packageJson.dependencies?.[packageName] || '<missing>';
const isRangeSatisfied = (version, range) => {
  if (!version || !range || version === '<missing>' || range === '<missing>') {
    return false;
  }

  try {
    return semver.satisfies(version, range, { includePrerelease: true });
  } catch {
    return false;
  }
};

export const collectTypescript7CompatibilityProbe = () => {
  const targetTypescript = npmViewPackage('typescript@latest');
  const peerPackages = ['@typescript-eslint/parser', '@typescript-eslint/eslint-plugin', 'ts-jest'].map(name => {
    const metadata = npmViewPackage(`${name}@latest`);
    const peerRange = metadata.peerDependencies?.typescript || '<missing>';

    return {
      name,
      packageVersion: getPackageVersion(name),
      installed: getInstalledVersion(name) || '<missing>',
      latest: metadata.version,
      peerRange,
      targetCompatible: isRangeSatisfied(targetTypescript.version, peerRange) ? 'yes' : 'no',
    };
  });
  const compatibilityBlockers = peerPackages
    .filter(entry => entry.targetCompatible !== 'yes')
    .map(entry => `${entry.name} TypeScript peer ${entry.peerRange} does not include TypeScript ${targetTypescript.version}`);
  const nodeEngineRange = targetTypescript.engines?.node || '<missing>';

  return {
    nodeVersion: process.version,
    expectedNodeVersion: `v${expectedNodeVersion}`,
    repoTypescript: getPackageVersion('typescript'),
    targetTypescript: targetTypescript.version,
    targetTypescriptNodeEngine: nodeEngineRange,
    targetTypescriptNodeEngineSatisfied: isRangeSatisfied(process.version, nodeEngineRange) ? 'yes' : 'no',
    peerPackages,
    compatibilityBlockers,
    packageBumpAllowed: compatibilityBlockers.length === 0 ? 'yes' : 'no',
    blockerClassification: compatibilityBlockers.length === 0 ? 'none' : 'tooling-peer-range-blocker',
  };
};

export const formatTypescript7CompatibilityProbeSummary = (audit, generatedAt = new Date().toISOString()) =>
  [
    'TypeScript 7 compatibility probe',
    `Generated at: ${generatedAt}`,
    `Node version: ${audit.nodeVersion}`,
    `Expected Node version: ${audit.expectedNodeVersion}`,
    `Repo TypeScript: ${audit.repoTypescript}`,
    `Target TypeScript: ${audit.targetTypescript}`,
    `Target TypeScript Node engine: ${audit.targetTypescriptNodeEngine}`,
    `Target TypeScript Node engine satisfied: ${audit.targetTypescriptNodeEngineSatisfied}`,
    `Checked peer packages: ${audit.peerPackages.length}`,
    ...audit.peerPackages.map(
      entry =>
        `- ${entry.name}: package ${entry.packageVersion}, latest ${entry.latest}, TypeScript peer ${entry.peerRange}, target compatible ${entry.targetCompatible}`,
    ),
    `Compatibility blockers: ${audit.compatibilityBlockers.length}`,
    ...audit.compatibilityBlockers.map(blocker => `- ${blocker}`),
    `TypeScript 7 package bump allowed: ${audit.packageBumpAllowed}`,
    `Blocker classification: ${audit.blockerClassification}`,
    'Required action: keep typescript pinned to 6.0.3 until a dedicated compiler/RN/Metro branch moves TypeScript, @typescript-eslint, and Jest transform tooling together and proves TypeScript check, Jest, lint baseline, Android build, and emulator smoke.',
    '',
  ].join('\n');

const writeSummary = summary => {
  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
};

const printReport = audit => {
  const summary = formatTypescript7CompatibilityProbeSummary(audit);
  const errors = getTypescript7CompatibilityProbeSummaryErrors(summary);

  writeSummary(summary);
  console.log(summary.trim());
  console.log(`TypeScript 7 compatibility probe summary written to ${path.relative(root, summaryPath)}`);

  if (errors.length > 0) {
    console.error('TypeScript 7 compatibility probe summary is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectTypescript7CompatibilityProbe());
}

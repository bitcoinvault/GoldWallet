import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getNodeFetchResolutionSummaryErrors } from './nodeFetchResolutionSummaryGuard.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'node-fetch-resolution-summary.txt');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);
const expectedResolution = '2.7.0';
const commonJsConsumers = ['gaxios', 'isomorphic-fetch'];
const expectedTransitiveBlockerChain = [
  { packageName: 'react-native-snap-carousel', version: '3.9.1' },
  { packageName: 'react-addons-shallow-compare', version: '15.6.2' },
  { packageName: 'fbjs', version: '0.8.17' },
  { packageName: 'isomorphic-fetch', version: '2.2.1' },
  { packageName: 'node-fetch', version: '2.7.0' },
];
const consumerEvidenceFiles = [
  {
    packageName: 'gaxios',
    relativePath: 'node_modules/gaxios/build/cjs/src/gaxios.js',
    blockerSnippet: "await import('node-fetch')",
    statusWhenPresent: 'dynamic import compatible',
  },
  {
    packageName: 'isomorphic-fetch',
    relativePath: 'node_modules/isomorphic-fetch/fetch-npm-node.js',
    blockerSnippet: "require('node-fetch')",
    statusWhenPresent: 'CommonJS require blocker',
  },
];

const npmViewJson = (packageName, fields) =>
  JSON.parse(
    execFileSync(npmCommand, npmArgs(['view', packageName, ...fields, '--json']), {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }),
  );

const getInstalledNodeFetchVersion = () => {
  try {
    return require('node-fetch/package.json').version || '';
  } catch {
    return '';
  }
};

const checkConsumer = packageName => {
  try {
    require(packageName);
    return { packageName, status: 'require ok' };
  } catch (error) {
    return { packageName, status: `require failed: ${error.code || error.message}` };
  }
};

const checkConsumerEvidence = ({ packageName, relativePath, blockerSnippet, statusWhenPresent }) => {
  const absolutePath = path.join(root, relativePath);

  if (!existsSync(absolutePath)) {
    return { packageName, relativePath, status: 'missing evidence file' };
  }

  const content = readFileSync(absolutePath, 'utf8');
  const snippetPresent = content.includes(blockerSnippet);

  return {
    packageName,
    relativePath,
    status: snippetPresent ? statusWhenPresent : 'expected snippet missing',
  };
};

const getPackageVersion = packageName => {
  try {
    return require(`${packageName}/package.json`).version || '';
  } catch {
    const packageJsonPath = path.join(root, 'node_modules', ...packageName.split('/'), 'package.json');

    if (!existsSync(packageJsonPath)) {
      return '';
    }

    return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version || '';
  }
};

export const collectNodeFetchResolutionAudit = () => {
  const errors = [];
  const packageResolution = packageJson.resolutions?.['node-fetch'] || '';
  const installedVersion = getInstalledNodeFetchVersion();
  const latestMetadata = npmViewJson('node-fetch@latest', ['version', 'type', 'engines', 'dependencies', 'dist-tags', 'main', 'exports']);
  const latestExportsJson = JSON.stringify(latestMetadata.exports || {});
  const latestHasCommonJsRequireExport = latestExportsJson.includes('"require"');
  let requireType = '';
  let defaultExportPresent = false;

  try {
    const nodeFetch = require('node-fetch');
    requireType = typeof nodeFetch;
    defaultExportPresent = Boolean(nodeFetch.default);
  } catch (error) {
    errors.push(`require('node-fetch') failed: ${error.code || error.message}`);
  }

  if (packageResolution !== expectedResolution) {
    errors.push(`package.json resolutions.node-fetch is ${packageResolution || '<missing>'}; expected ${expectedResolution}`);
  }

  if (installedVersion !== expectedResolution) {
    errors.push(`installed node-fetch is ${installedVersion || '<missing>'}; expected ${expectedResolution}`);
  }

  if (requireType !== 'function') {
    errors.push(`require('node-fetch') returned ${requireType || '<missing>'}; expected function`);
  }

  if (!defaultExportPresent) {
    errors.push("node-fetch CJS default export compatibility is missing");
  }

  const consumers = commonJsConsumers.map(checkConsumer);
  const consumerEvidence = consumerEvidenceFiles.map(checkConsumerEvidence);
  const transitiveBlockerChain = expectedTransitiveBlockerChain.map(entry => ({
    packageName: entry.packageName,
    expectedVersion: entry.version,
    installedVersion: getPackageVersion(entry.packageName),
  }));
  consumers.forEach(consumer => {
    if (consumer.status !== 'require ok') {
      errors.push(`${consumer.packageName} ${consumer.status}`);
    }
  });
  consumerEvidence.forEach(evidence => {
    if (evidence.status === 'missing evidence file' || evidence.status === 'expected snippet missing') {
      errors.push(`${evidence.packageName} ${evidence.status} in ${evidence.relativePath}`);
    }
  });
  transitiveBlockerChain.forEach(entry => {
    if (entry.installedVersion !== entry.expectedVersion) {
      errors.push(
        `${entry.packageName} installed version is ${entry.installedVersion || '<missing>'}; expected ${entry.expectedVersion}`,
      );
    }
  });

  return {
    packageResolution,
    installedVersion,
    requireType,
    defaultExportPresent,
    latestVersion: latestMetadata.version || '',
    latestType: latestMetadata.type || '',
    latestMain: latestMetadata.main || '',
    latestCommonJsRequireExport: latestHasCommonJsRequireExport ? 'yes' : 'no',
    latestBlocked: latestMetadata.type === 'module',
    consumers,
    consumerEvidence,
    transitiveBlockerChain,
    errors,
  };
};

export const formatNodeFetchResolutionSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Node fetch resolution audit',
    `Generated at: ${generatedAt}`,
    `package.json resolution: ${audit.packageResolution || '<missing>'}`,
    `Installed node-fetch version: ${audit.installedVersion || '<missing>'}`,
    `require('node-fetch') type: ${audit.requireType || '<missing>'}`,
    `Default export present: ${audit.defaultExportPresent ? 'yes' : 'no'}`,
    `Latest node-fetch version: ${audit.latestVersion || '<missing>'}`,
    `Latest node-fetch package type: ${audit.latestType || '<missing>'}`,
    `Latest node-fetch main: ${audit.latestMain || '<missing>'}`,
    `Latest node-fetch CommonJS require export: ${audit.latestCommonJsRequireExport || '<missing>'}`,
    `Latest node-fetch target blocked: ${audit.latestBlocked ? 'yes' : 'no'}`,
    `CommonJS/transitive consumers: ${audit.consumers.length}`,
    ...audit.consumers.map(consumer => `- ${consumer.packageName}: ${consumer.status}`),
    `Consumer file evidence: ${audit.consumerEvidence.length}`,
    ...audit.consumerEvidence.map(evidence => `- ${evidence.packageName}: ${evidence.status} (${evidence.relativePath})`),
    `Transitive blocker chain: ${audit.transitiveBlockerChain.length}`,
    ...audit.transitiveBlockerChain.map(
      entry => `- ${entry.packageName}: ${entry.installedVersion || '<missing>'} (expected ${entry.expectedVersion})`,
    ),
    `Compatibility errors: ${audit.errors.length}`,
    ...audit.errors.map(error => `- ${error}`),
    'Secret values printed: no',
    'Required action: keep node-fetch on the CommonJS 2.7.0 resolution until all transitive consumers are proven compatible with the ESM-only node-fetch v3 package entry.',
    '',
  ];

  return lines.join('\n');
};

const printReport = audit => {
  const summary = formatNodeFetchResolutionSummary(audit);
  const summaryErrors = getNodeFetchResolutionSummaryErrors(summary);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  console.log(summary.trim());
  console.log(`Node fetch resolution summary written to ${path.relative(root, summaryPath)}`);

  if (summaryErrors.length > 0 || audit.errors.length > 0) {
    console.error('Node fetch resolution audit failed:');
    [...summaryErrors, ...audit.errors].forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!existsSync(path.join(root, 'package.json'))) {
    console.error('package.json is missing');
    process.exit(1);
  }

  printReport(collectNodeFetchResolutionAudit());
}

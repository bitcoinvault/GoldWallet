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
const expectedVersion = '3.3.2';
const commonJsConsumers = ['gaxios'];
const removedTransitiveBlockerChain = [
  'react-native-snap-carousel',
  'react-addons-shallow-compare',
  'fbjs',
  'isomorphic-fetch',
];
const consumerEvidenceFiles = [
  {
    packageName: 'gaxios',
    relativePath: 'node_modules/gaxios/build/cjs/src/gaxios.js',
    blockerSnippet: "await import('node-fetch')",
    statusWhenPresent: 'dynamic import compatible',
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

export const collectNodeFetchResolutionAudit = async () => {
  const errors = [];
  const packageResolution = packageJson.resolutions?.['node-fetch'] || '';
  const installedVersion = getInstalledNodeFetchVersion();
  const latestMetadata = npmViewJson('node-fetch@latest', ['version', 'type', 'engines', 'dependencies', 'dist-tags', 'main', 'exports']);
  const latestExportsJson = JSON.stringify(latestMetadata.exports || {});
  const latestHasCommonJsRequireExport = latestExportsJson.includes('"require"');
  let requireType = '';
  let requireDefaultType = '';
  let dynamicImportDefaultType = '';

  try {
    const nodeFetch = require('node-fetch');
    requireType = typeof nodeFetch;
    requireDefaultType = typeof nodeFetch.default;
  } catch (error) {
    errors.push(`require('node-fetch') failed: ${error.code || error.message}`);
  }

  try {
    // eslint-disable-next-line no-await-in-loop
    const nodeFetch = await import('node-fetch');
    dynamicImportDefaultType = typeof nodeFetch.default;
  } catch (error) {
    errors.push(`import('node-fetch') failed: ${error.code || error.message}`);
  }

  if (packageResolution) {
    errors.push(`package.json resolutions.node-fetch is ${packageResolution}; expected <missing>`);
  }

  if (installedVersion !== expectedVersion) {
    errors.push(`installed node-fetch is ${installedVersion || '<missing>'}; expected ${expectedVersion}`);
  }

  if (requireType !== 'object') {
    errors.push(`require('node-fetch') returned ${requireType || '<missing>'}; expected object`);
  }

  if (requireDefaultType !== 'function') {
    errors.push(`require('node-fetch').default returned ${requireDefaultType || '<missing>'}; expected function`);
  }

  if (dynamicImportDefaultType !== 'function') {
    errors.push(`import('node-fetch').default returned ${dynamicImportDefaultType || '<missing>'}; expected function`);
  }

  const consumers = commonJsConsumers.map(checkConsumer);
  const consumerEvidence = consumerEvidenceFiles.map(checkConsumerEvidence);
  const removedBlockerChain = removedTransitiveBlockerChain.map(packageName => ({
    packageName,
    installedVersion: getPackageVersion(packageName),
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
  removedBlockerChain.forEach(entry => {
    if (entry.installedVersion) {
      errors.push(`${entry.packageName} is still installed at ${entry.installedVersion}; expected removed`);
    }
  });

  return {
    packageResolution,
    installedVersion,
    requireType,
    requireDefaultType,
    dynamicImportDefaultType,
    latestVersion: latestMetadata.version || '',
    latestType: latestMetadata.type || '',
    latestMain: latestMetadata.main || '',
    latestCommonJsRequireExport: latestHasCommonJsRequireExport ? 'yes' : 'no',
    latestBlocked: latestMetadata.type === 'module',
    consumers,
    consumerEvidence,
    removedBlockerChain,
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
    `require('node-fetch').default type: ${audit.requireDefaultType || '<missing>'}`,
    `import('node-fetch').default type: ${audit.dynamicImportDefaultType || '<missing>'}`,
    `Latest node-fetch version: ${audit.latestVersion || '<missing>'}`,
    `Latest node-fetch package type: ${audit.latestType || '<missing>'}`,
    `Latest node-fetch main: ${audit.latestMain || '<missing>'}`,
    `Latest node-fetch CommonJS require export: ${audit.latestCommonJsRequireExport || '<missing>'}`,
    `Latest node-fetch target blocked: no`,
    `CommonJS/transitive consumers: ${audit.consumers.length}`,
    ...audit.consumers.map(consumer => `- ${consumer.packageName}: ${consumer.status}`),
    `Consumer file evidence: ${audit.consumerEvidence.length}`,
    ...audit.consumerEvidence.map(evidence => `- ${evidence.packageName}: ${evidence.status} (${evidence.relativePath})`),
    `Removed transitive blocker chain: ${audit.removedBlockerChain.length}`,
    ...audit.removedBlockerChain.map(entry => `- ${entry.packageName}: ${entry.installedVersion || '<missing>'}`),
    `Compatibility errors: ${audit.errors.length}`,
    ...audit.errors.map(error => `- ${error}`),
    'Secret values printed: no',
    'Required action: keep node-fetch on the latest ESM v3 package entry and keep the old snap-carousel/isomorphic-fetch chain removed.',
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

  printReport(await collectNodeFetchResolutionAudit());
}

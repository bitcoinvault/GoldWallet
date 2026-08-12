import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { expectedReactNativeTargetSnapshot } from './auditReactNativeTargetSnapshot.mjs';
import {
  getReactNativeRendererVersionIssues,
  parseReactNativeRendererVersions,
  requiredReactNativeRendererVersionDocs,
} from './auditReactNativeRendererVersion.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'react-patch-blocker-summary.txt');
const rendererDirectory = path.join(root, 'node_modules/react-native/Libraries/Renderer/implementations');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);

const npmViewJson = args =>
  JSON.parse(
    execFileSync(npmCommand, npmArgs(['view', ...args, '--json']), {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim(),
  );

const npmViewPackage = packageSpec => {
  const metadata = npmViewJson([packageSpec, 'version', 'peerDependencies', 'engines']);

  if (typeof metadata === 'string') {
    return { version: metadata, peerDependencies: {}, engines: {} };
  }

  return metadata;
};

const collectRendererFiles = () => {
  if (!existsSync(rendererDirectory)) {
    return [];
  }

  return readdirSync(rendererDirectory)
    .filter(fileName => fileName.endsWith('.js'))
    .map(fileName => ({
      relativePath: path.relative(root, path.join(rendererDirectory, fileName)),
      content: readFileSync(path.join(rendererDirectory, fileName), 'utf8'),
    }));
};

const collectRendererDocs = () => {
  const docs = {};
  const existingDocs = new Set();

  requiredReactNativeRendererVersionDocs.forEach(relativePath => {
    const absolutePath = path.join(root, relativePath);

    if (existsSync(absolutePath)) {
      docs[relativePath] = readFileSync(absolutePath, 'utf8');
      existingDocs.add(relativePath);
    } else {
      docs[relativePath] = '';
    }
  });

  return { docs, existingDocs };
};

export const collectReactPatchBlocker = () => {
  const rendererFiles = collectRendererFiles();
  const { rendererVersions, exactCheckVersions } = parseReactNativeRendererVersions(rendererFiles);
  const expectedReactFromRenderer = rendererVersions.length === 1 ? rendererVersions[0] : '<missing>';
  const latestReact = npmViewPackage('react@latest');
  const latestReactTestRenderer = npmViewPackage('react-test-renderer@latest');
  const latestReactTypes = npmViewPackage('@types/react@latest');
  const { docs, existingDocs } = collectRendererDocs();
  const candidateRendererCompatibilityErrors = getReactNativeRendererVersionIssues({
    dependencies: {
      ...(packageJson.dependencies || {}),
      react: latestReact.version || '<missing>',
    },
    devDependencies: {
      ...(packageJson.devDependencies || {}),
      '@types/react': latestReactTypes.version || '<missing>',
      'react-test-renderer': latestReactTestRenderer.version || '<missing>',
    },
    scripts: packageJson.scripts || {},
    rendererFiles,
    docs,
    existingDocs,
  }).errors;

  return {
    reactNativeVersion: packageJson.dependencies?.['react-native'] || '<missing>',
    repoReact: packageJson.dependencies?.react || '<missing>',
    repoReactTestRenderer: packageJson.devDependencies?.['react-test-renderer'] || '<missing>',
    repoReactTypes: packageJson.devDependencies?.['@types/react'] || '<missing>',
    repoReactTypesResolution: packageJson.resolutions?.['@types/react'] || '<missing>',
    targetReactPeer: expectedReactNativeTargetSnapshot.targetReactPeer,
    latestReact: latestReact.version || '<missing>',
    latestReactTestRenderer: latestReactTestRenderer.version || '<missing>',
    latestReactTestRendererPeer: latestReactTestRenderer.peerDependencies?.react || '<missing>',
    latestReactTypes: latestReactTypes.version || '<missing>',
    rendererImplementationFiles: rendererFiles.length,
    rendererVersions: rendererVersions.join(', ') || '<missing>',
    rendererExactCheckVersions: exactCheckVersions.join(', ') || '<missing>',
    expectedReactFromRenderer,
    candidateReact: latestReact.version || '<missing>',
    candidateReactTestRenderer: latestReactTestRenderer.version || '<missing>',
    candidateReactTypes: latestReactTypes.version || '<missing>',
    candidateRendererCompatibilityErrors,
    packageOnlyPatchSafe: candidateRendererCompatibilityErrors.length === 0 ? 'yes' : 'no',
    blockerClassification:
      candidateRendererCompatibilityErrors.length === 0 ? 'none' : 'React Native renderer exact-version blocker',
  };
};

export const formatReactPatchBlockerSummary = (audit, generatedAt = new Date().toISOString()) =>
  [
    'React patch blocker audit',
    `Generated at: ${generatedAt}`,
    `React Native version: ${audit.reactNativeVersion}`,
    `Repo react: ${audit.repoReact}`,
    `Repo react-test-renderer: ${audit.repoReactTestRenderer}`,
    `Repo @types/react: ${audit.repoReactTypes}`,
    `Repo @types/react resolution: ${audit.repoReactTypesResolution}`,
    `RN target React peer: ${audit.targetReactPeer}`,
    `Latest react: ${audit.latestReact}`,
    `Latest react-test-renderer: ${audit.latestReactTestRenderer}`,
    `Latest react-test-renderer React peer: ${audit.latestReactTestRendererPeer}`,
    `Latest @types/react: ${audit.latestReactTypes}`,
    `Renderer implementation files: ${audit.rendererImplementationFiles}`,
    `Renderer versions: ${audit.rendererVersions}`,
    `Renderer exact-check versions: ${audit.rendererExactCheckVersions}`,
    `Expected React from renderer: ${audit.expectedReactFromRenderer}`,
    `Candidate react patch: ${audit.candidateReact}`,
    `Candidate react-test-renderer patch: ${audit.candidateReactTestRenderer}`,
    `Candidate @types/react patch: ${audit.candidateReactTypes}`,
    `Candidate renderer compatibility errors: ${audit.candidateRendererCompatibilityErrors.length}`,
    ...audit.candidateRendererCompatibilityErrors.map(error => `- ${error}`),
    `Package-only latest React patch safe: ${audit.packageOnlyPatchSafe}`,
    `Blocker classification: ${audit.blockerClassification}`,
    'Required action: keep react and react-test-renderer pinned to 19.2.3 until a dedicated React Native renderer baseline branch moves the renderer and proves TypeScript, unit tests, Android build, and emulator smoke.',
    '',
  ].join('\n');

const audit = collectReactPatchBlocker();
const summary = formatReactPatchBlockerSummary(audit);

mkdirSync(path.dirname(summaryPath), { recursive: true });
writeFileSync(summaryPath, summary);
console.log(summary);
console.log(`React patch blocker summary written to ${path.relative(root, summaryPath)}`);

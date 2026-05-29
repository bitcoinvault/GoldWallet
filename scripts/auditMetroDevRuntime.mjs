import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));

export const expectedMetroDevRuntime = {
  nodeMajor: 22,
  nodeVersion: '22.18.0',
  reactNative: '0.81.6',
  babelPreset: '0.81.6',
  metroConfig: '0.81.6',
  startScript: 'react-native start',
};

export const requiredMetroDevRuntimeSnippets = [
  ['README.md', 'Node.js `22.18.0` is the current development runtime'],
  ['README.md', '$ yarn start --reset-cache'],
  ['docs/android-modernization-workflow.md', 'node-v22.18.0-win-x64'],
  ['docs/android-modernization-workflow.md', 'react-native start --reset-cache --port 8081'],
  ['docs/wallet-modernization-baseline.md', 'Node.js for Metro/dev runtime: Node 22 LTS-compatible runtime'],
  ['docs/wallet-modernization-baseline.md', 'corepack yarn start --reset-cache'],
];

const requireSnippet = (errors, label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

export const getMetroDevRuntimeIssues = ({ nodeVersion, nvmrc, dependencies, devDependencies, scripts, docs }) => {
  const errors = [];
  const warnings = [];
  const nodeMajor = Number((nodeVersion || '').split('.')[0]);

  if (nvmrc !== expectedMetroDevRuntime.nodeVersion) {
    errors.push(`.nvmrc is ${nvmrc}; expected ${expectedMetroDevRuntime.nodeVersion} for the current Metro/dev runtime baseline`);
  }

  if (dependencies['react-native'] !== expectedMetroDevRuntime.reactNative) {
    errors.push(
      `package.json has react-native@${dependencies['react-native'] || '<missing>'}; expected current baseline ${expectedMetroDevRuntime.reactNative}`,
    );
  }

  if (devDependencies['@react-native/babel-preset'] !== expectedMetroDevRuntime.babelPreset) {
    errors.push(
      `package.json has @react-native/babel-preset@${
        devDependencies['@react-native/babel-preset'] || '<missing>'
      }; expected current baseline ${expectedMetroDevRuntime.babelPreset}`,
    );
  }

  if (devDependencies['@react-native/metro-config'] !== expectedMetroDevRuntime.metroConfig) {
    errors.push(
      `package.json has @react-native/metro-config@${
        devDependencies['@react-native/metro-config'] || '<missing>'
      }; expected current baseline ${expectedMetroDevRuntime.metroConfig}`,
    );
  }

  if (scripts.start !== expectedMetroDevRuntime.startScript) {
    errors.push(`package.json start script is "${scripts.start || '<missing>'}"; expected "${expectedMetroDevRuntime.startScript}"`);
  }

  if (nodeMajor !== expectedMetroDevRuntime.nodeMajor) {
    warnings.push(`Current Node is ${nodeVersion}; Metro/dev runtime is documented for Node 22 (${nvmrc}).`);
  }

  requiredMetroDevRuntimeSnippets.forEach(([relativePath, snippet]) => {
    requireSnippet(errors, relativePath, docs[relativePath] || '', snippet);
  });

  return { errors, warnings };
};

const collectEnvironment = () => {
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  const scripts = packageJson.scripts || {};
  const docs = Object.fromEntries(
    [...new Set(requiredMetroDevRuntimeSnippets.map(([relativePath]) => relativePath))].map(relativePath => [relativePath, read(relativePath)]),
  );

  return {
    nodeVersion: process.versions.node,
    nvmrc: read('.nvmrc').trim(),
    dependencies,
    devDependencies,
    scripts,
    docs,
  };
};

const printReport = environment => {
  const { errors, warnings } = getMetroDevRuntimeIssues(environment);

  console.log('Metro dev runtime audit');
  console.log(`Node.js: ${environment.nodeVersion}`);
  console.log(`.nvmrc: ${environment.nvmrc}`);
  console.log(`react-native: ${environment.dependencies['react-native'] || '<missing>'}`);
  console.log(`@react-native/babel-preset: ${environment.devDependencies['@react-native/babel-preset'] || '<missing>'}`);
  console.log(`@react-native/metro-config: ${environment.devDependencies['@react-native/metro-config'] || '<missing>'}`);
  console.log(`start script: ${environment.scripts.start || '<missing>'}`);

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.log('Metro dev runtime baseline is invalid:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('Metro dev runtime baseline is documented for Node 22 and the current React Native/Metro package line.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}

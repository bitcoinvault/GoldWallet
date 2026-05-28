import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};
const devDependencies = packageJson.devDependencies || {};
const scripts = packageJson.scripts || {};
const nvmrc = read('.nvmrc').trim();
const readme = read('README.md');
const workflow = read('docs/android-modernization-workflow.md');
const baseline = read('docs/wallet-modernization-baseline.md');
const errors = [];
const warnings = [];
const nodeVersion = process.versions.node;
const nodeMajor = Number(nodeVersion.split('.')[0]);

const requireSnippet = (label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

if (nvmrc !== '16.20.2') {
  errors.push(`.nvmrc is ${nvmrc}; expected 16.20.2 for the current Metro/dev runtime baseline`);
}

if (dependencies['react-native'] !== '0.68.7') {
  errors.push(`package.json has react-native@${dependencies['react-native'] || '<missing>'}; expected current baseline 0.68.7`);
}

if (devDependencies['metro-react-native-babel-preset'] !== '0.67.0') {
  errors.push(
    `package.json has metro-react-native-babel-preset@${devDependencies['metro-react-native-babel-preset'] || '<missing>'}; expected current baseline 0.67.0`,
  );
}

if (scripts.start !== 'react-native start') {
  errors.push(`package.json start script is "${scripts.start || '<missing>'}"; expected "react-native start"`);
}

if (nodeMajor !== 16) {
  warnings.push(`Current Node is ${nodeVersion}; Metro/dev runtime is documented for Node 16 (${nvmrc}).`);
}

requireSnippet('README.md', readme, 'Node.js `16.20.2` is the current development runtime');
requireSnippet('README.md', readme, '$ yarn start --reset-cache');
requireSnippet('docs/android-modernization-workflow.md', workflow, 'node-v16.20.2-win-x64');
requireSnippet('docs/android-modernization-workflow.md', workflow, 'react-native start --reset-cache --port 8081');
requireSnippet('docs/wallet-modernization-baseline.md', baseline, 'Node.js for Metro/dev runtime: Node 16 LTS');
requireSnippet('docs/wallet-modernization-baseline.md', baseline, "corepack yarn start --reset-cache");

console.log('Metro dev runtime audit');
console.log(`Node.js: ${nodeVersion}`);
console.log(`.nvmrc: ${nvmrc}`);
console.log(`react-native: ${dependencies['react-native'] || '<missing>'}`);
console.log(`metro-react-native-babel-preset: ${devDependencies['metro-react-native-babel-preset'] || '<missing>'}`);
console.log(`start script: ${scripts.start || '<missing>'}`);

if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(warning => console.log(`- ${warning}`));
}

if (errors.length > 0) {
  console.log('Metro dev runtime baseline is invalid:');
  errors.forEach(error => console.log(`- ${error}`));
  process.exit(1);
}

console.log('Metro dev runtime baseline is documented for Node 16 and the current React Native/Metro package line.');

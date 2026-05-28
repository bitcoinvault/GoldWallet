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

const requiredPlanSnippets = [
  'react-native@0.76.9',
  'react@18.2.0',
  'react-test-renderer@18.2.0',
  '@types/react@^18.2.6',
  '@react-native/babel-preset@0.76.9',
  '@react-native/metro-config@0.76.9',
  '@react-native/gradle-plugin@0.76.9',
  'Node engine: `>=18`',
  'Unable to resolve module ./AppContainer-prod',
  'Do not repeat a package-only RN 0.76 branch',
  'feature/bem-36-rn-076-foundation',
  'corepack yarn rn:baseline:preflight',
  'corepack yarn rn:target-snapshot:current',
  'corepack yarn rn:076-foundation:audit',
  'Metro restart with Node 22 and `--reset-cache`',
];

const requiredMatrixSnippets = [
  'Milestone A: RN 0.76.9 Foundation',
  'React peer: `^18.2.0`',
  'Node engine: `>=18`',
  'Android template, Gradle, Kotlin, AGP, manifest, and native autolinking changes required by RN 0.76',
];

const errors = [];
const warnings = [];
const plan = read('docs/react-native-076-foundation-plan.md');
const matrix = read('docs/react-native-foundation-target-matrix.md');

if (dependencies['react-native'] !== '0.76.9') {
  errors.push(`package.json has react-native@${dependencies['react-native'] || '<missing>'}; expected current baseline 0.76.9`);
}

if (dependencies.react !== '18.2.0') {
  errors.push(`package.json has react@${dependencies.react || '<missing>'}; expected current baseline 18.2.0`);
}

if (devDependencies['@react-native/babel-preset'] !== '0.76.9') {
  errors.push(
    `package.json has @react-native/babel-preset@${devDependencies['@react-native/babel-preset'] || '<missing>'}; expected current baseline 0.76.9`,
  );
}

if (devDependencies['@react-native/metro-config'] !== '0.76.9') {
  errors.push(
    `package.json has @react-native/metro-config@${devDependencies['@react-native/metro-config'] || '<missing>'}; expected current baseline 0.76.9`,
  );
}

if (scripts['rn:076-foundation:audit'] !== 'node scripts/auditReactNative076FoundationPlan.mjs') {
  errors.push('package.json is missing rn:076-foundation:audit script');
}

requiredPlanSnippets.forEach(snippet => {
  if (!plan.includes(snippet)) {
    errors.push(`docs/react-native-076-foundation-plan.md is missing "${snippet}"`);
  }
});

requiredMatrixSnippets.forEach(snippet => {
  if (!matrix.includes(snippet)) {
    errors.push(`docs/react-native-foundation-target-matrix.md is missing "${snippet}"`);
  }
});

if (!plan.includes('Sentry release/source-map upgrade') || !plan.includes('react-native-camera` replacement')) {
  warnings.push('RN 0.76 plan should keep release-service and camera replacement work out of scope.');
}

console.log('React Native 0.76 foundation plan audit');
console.log(`Current react-native: ${dependencies['react-native'] || '<missing>'}`);
console.log(`Current react: ${dependencies.react || '<missing>'}`);
console.log('Target milestone: react-native@0.76.9 with React 18 and Node >=18');

if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(warning => console.log(`- ${warning}`));
}

if (errors.length > 0) {
  console.error('React Native 0.76 foundation plan is stale:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('React Native 0.76 foundation plan matches the current baseline and target scope.');

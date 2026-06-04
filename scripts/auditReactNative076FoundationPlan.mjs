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
  'react-native@0.85.3',
  'react@19.2.3',
  'react-test-renderer@19.2.3',
  '@types/react@19.2.16',
  '@react-native/babel-preset@0.85.3',
  '@react-native/metro-config@0.85.3',
  '@react-native/gradle-plugin@0.85.3',
  'Node engine: `>=20.19.4`',
  'Unable to resolve module ./AppContainer-prod',
  'Do not repeat a package-only RN 0.76 branch',
  'feature/bem-37-rn-next-baseline-proof',
  'corepack yarn rn:baseline:preflight',
  'corepack yarn rn:target-snapshot:current',
  'corepack yarn rn:076-foundation:audit',
  'Metro restart with Node 24 and `--reset-cache`',
];

const requiredMatrixSnippets = [
  'Milestone A: RN 0.85.3 Foundation',
  'React peer: `^19.2.3`',
  '`@types/react` peer: `^19.2.3`',
  'Node engine: `>=20.19.4`',
  'Android template, Gradle, Kotlin, AGP, manifest, New Architecture, and native autolinking changes required by RN 0.85',
];

const errors = [];
const warnings = [];
const plan = read('docs/react-native-076-foundation-plan.md');
const matrix = read('docs/react-native-foundation-target-matrix.md');

if (dependencies['react-native'] !== '0.85.3') {
  errors.push(`package.json has react-native@${dependencies['react-native'] || '<missing>'}; expected current baseline 0.85.3`);
}

if (dependencies.react !== '19.2.3') {
  errors.push(`package.json has react@${dependencies.react || '<missing>'}; expected current baseline 19.2.3`);
}

if (devDependencies['@react-native/babel-preset'] !== '0.85.3') {
  errors.push(
    `package.json has @react-native/babel-preset@${devDependencies['@react-native/babel-preset'] || '<missing>'}; expected current baseline 0.85.3`,
  );
}

if (devDependencies['@react-native/metro-config'] !== '0.85.3') {
  errors.push(
    `package.json has @react-native/metro-config@${devDependencies['@react-native/metro-config'] || '<missing>'}; expected current baseline 0.85.3`,
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
  warnings.push('RN 0.85.3 checkpoint should keep release-service and camera replacement work out of scope.');
}

console.log('React Native 0.85 foundation checkpoint audit');
console.log(`Current react-native: ${dependencies['react-native'] || '<missing>'}`);
console.log(`Current react: ${dependencies.react || '<missing>'}`);
console.log('Current checkpoint: react-native@0.85.3 with React 19 and Node 24');

if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(warning => console.log(`- ${warning}`));
}

if (errors.length > 0) {
  console.error('React Native 0.81 foundation checkpoint plan is stale:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('React Native 0.85 foundation checkpoint plan matches the current baseline and target scope.');

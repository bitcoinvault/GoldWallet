import { execSync } from 'child_process';
import { expectedReactNativeTargetSnapshot } from './auditReactNativeTargetSnapshot.mjs';

const npmView = (pkg, field) =>
  execSync(`npm view ${pkg} ${field} --json`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();

const parseJson = value => JSON.parse(value);
const readString = (pkg, field) => {
  const parsed = parseJson(npmView(pkg, field));
  return typeof parsed === 'string' ? parsed : '';
};
const readObject = (pkg, field) => parseJson(npmView(pkg, field));

const latest = readString('react-native', 'version');
const distTags = readObject('react-native', 'dist-tags');
const peerDependencies = readObject(`react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative}`, 'peerDependencies');
const engines = readObject(`react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative}`, 'engines');

const checks = [
  ['npm latest react-native', latest, expectedReactNativeTargetSnapshot.npmLatestReactNative],
  ['npm next react-native', distTags.next, expectedReactNativeTargetSnapshot.npmNextReactNative],
  [`react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative} React peer`, peerDependencies.react, expectedReactNativeTargetSnapshot.targetReactPeer],
  [`react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative} Node engine`, engines.node, expectedReactNativeTargetSnapshot.targetNodeEngine],
];

const errors = checks
  .filter(([, actual, expected]) => actual !== expected)
  .map(([label, actual, expected]) => `${label} is ${actual || '<missing>'}; snapshot expects ${expected}`);

console.log('React Native target snapshot live npm check');
checks.forEach(([label, actual]) => console.log(`${label}: ${actual || '<missing>'}`));

if (errors.length > 0) {
  console.log('React Native target snapshot is stale against current npm metadata:');
  errors.forEach(error => console.log(`- ${error}`));
  process.exit(1);
}

console.log('React Native target snapshot still matches current npm metadata.');

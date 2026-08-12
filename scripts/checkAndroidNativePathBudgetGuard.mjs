import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAndroidNativePathBudget,
  getAndroidNativePathBudgetError,
  nativeCodegenPathProbes,
  windowsNativePathLimit,
} from './androidNativePathBudget.mjs';
import { runAndroidGradle } from './runAndroidGradle.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const longestProbe = nativeCodegenPathProbes.reduce((longest, candidate) =>
  candidate.length > longest.length ? candidate : longest,
);
const maximumRootLength = windowsNativePathLimit - longestProbe.length - 1;
const rootWithLength = length => `D:\\${'a'.repeat(length - 3)}`;
const allPathsExist = () => true;

const boundaryBudget = getAndroidNativePathBudget({
  rootPath: rootWithLength(maximumRootLength),
  platform: 'win32',
  pathExists: allPathsExist,
});
if (!boundaryBudget.ready || boundaryBudget.longestCandidate.candidateLength !== windowsNativePathLimit) {
  console.error('Windows native path budget must accept the exact path-length boundary.');
  process.exit(1);
}

const overlongRoot = rootWithLength(maximumRootLength + 1);
const overBudget = getAndroidNativePathBudget({ rootPath: overlongRoot, platform: 'win32', pathExists: allPathsExist });
const overBudgetError = getAndroidNativePathBudgetError(overBudget);
if (
  overBudget.ready ||
  overBudget.longestCandidate.candidateLength !== windowsNativePathLimit + 1 ||
  !overBudgetError.includes('Android New Architecture build path is too long') ||
  !overBudgetError.includes(`maximum ${maximumRootLength}`) ||
  !overBudget.longestCandidate.candidateRelativePath.includes('RNFBCrashlyticsTurboModules')
) {
  console.error('Windows native path budget must reject the longest current RN Firebase source over the limit.');
  process.exit(1);
}

const staleBudget = getAndroidNativePathBudget({
  rootPath: rootWithLength(10),
  platform: 'win32',
  pathExists: candidate => !candidate.includes('crashlytics'),
});
if (staleBudget.ready || !getAndroidNativePathBudgetError(staleBudget).includes('probes are stale')) {
  console.error('Windows native path budget must fail closed when a modeled dependency source is missing.');
  process.exit(1);
}

const nonWindowsBudget = getAndroidNativePathBudget({ rootPath: '/long/path', platform: 'linux' });
if (!nonWindowsBudget.ready || nonWindowsBudget.applies) {
  console.error('Windows native path budget must not reject non-Windows builds.');
  process.exit(1);
}

let spawnCalls = 0;
const rejectedStatus = runAndroidGradle({
  args: [':app:assembleDevDebug'],
  rootPath: overlongRoot,
  platform: 'win32',
  pathExists: allPathsExist,
  spawn: () => {
    spawnCalls += 1;
    return { status: 0 };
  },
});
if (rejectedStatus !== 1 || spawnCalls !== 0) {
  console.error('Over-budget Gradle runner must return failure without spawning Java or Gradle.');
  process.exit(1);
}

let staleSpawnCalls = 0;
const staleStatus = runAndroidGradle({
  args: [':app:assembleDevDebug'],
  rootPath: rootWithLength(10),
  platform: 'win32',
  pathExists: candidate => !candidate.includes('crashlytics'),
  spawn: () => {
    staleSpawnCalls += 1;
    return { status: 0 };
  },
});
if (staleStatus !== 1 || staleSpawnCalls !== 0) {
  console.error('Missing native path probe must return failure without spawning Java or Gradle.');
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const publicRunAndroidScripts = [
  'android:dev',
  'android:stage',
  'android:prod',
  'android:beta',
  'android:dev:release',
  'android:stage:release',
  'android:prod:release',
  'android:beta:release',
];
for (const scriptName of publicRunAndroidScripts) {
  const command = packageJson.scripts[scriptName] || '';
  if (!command.startsWith('yarn android:native-path:check && react-native run-android')) {
    console.error(`${scriptName} must run the native path preflight before react-native run-android.`);
    process.exit(1);
  }
}

const currentBudget = getAndroidNativePathBudget({ rootPath: root });
if (!currentBudget.ready) {
  console.error(getAndroidNativePathBudgetError(currentBudget));
  process.exit(1);
}

console.log('Android Windows native path budget guard checks passed.');

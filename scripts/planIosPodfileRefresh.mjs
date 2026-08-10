import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { collectIosReleaseReadiness } from './auditIosReleaseReadiness.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'local-docs', 'ios-podfile-refresh-plan.txt');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const collectIosPodfileRefreshPlan = () => {
  const packageJson = JSON.parse(read('package.json'));
  const releaseReadiness = collectIosReleaseReadiness();

  return {
    platform: process.platform,
    reactNativeVersion: packageJson.dependencies['react-native'],
    rnMinIosVersion: releaseReadiness.rnMinIosVersion,
    rnMinXcodeVersion: releaseReadiness.rnMinXcodeVersion,
    firebaseAppleSdkVersion: releaseReadiness.firebaseAppleSdkVersion,
    firebaseMinXcodeVersion: releaseReadiness.firebaseMinXcodeVersion,
    effectiveMinXcodeVersion: releaseReadiness.effectiveMinXcodeVersion,
    staticReady: releaseReadiness.staticReady,
    guardedSchemeCount: releaseReadiness.schemeCount,
    podfileLockDriftIssues: releaseReadiness.podfileLockDriftIssues,
    removedPodfileLockDriftIssues: releaseReadiness.removedPodfileLockDriftIssues,
  };
};

export const formatIosPodfileRefreshPlan = (audit, generatedAt = new Date().toISOString()) => {
  const refreshRequired = audit.podfileLockDriftIssues.length > 0;

  return [
    'iOS Podfile.lock refresh plan',
    `Generated at: ${generatedAt}`,
    `Platform: ${audit.platform}`,
    `React Native version: ${audit.reactNativeVersion}`,
    `React Native minimum iOS: ${audit.rnMinIosVersion || '<unknown>'}`,
    `React Native minimum Xcode: ${audit.rnMinXcodeVersion || '<unknown>'}`,
    `Firebase Apple SDK: ${audit.firebaseAppleSdkVersion || '<unknown>'}`,
    `Firebase minimum Xcode: ${audit.firebaseMinXcodeVersion || '<unknown>'}`,
    `Effective minimum Xcode: ${audit.effectiveMinXcodeVersion || '<unknown>'}`,
    `Static iOS release files valid: ${audit.staticReady ? 'yes' : 'no'}`,
    `Guarded iOS schemes: ${audit.guardedSchemeCount}`,
    `Podfile.lock refresh required: ${refreshRequired ? 'yes' : 'no'}`,
    `Podfile.lock drift issues: ${audit.podfileLockDriftIssues.length}`,
    ...audit.podfileLockDriftIssues.map(issue => `- ${issue}`),
    `Removed Podfile.lock pod references: ${audit.removedPodfileLockDriftIssues.length}`,
    ...audit.removedPodfileLockDriftIssues.map(issue => `- ${issue}`),
    'macOS/Xcode required: yes',
    'iOS runtime delivery validation: not claimed',
    'Command plan:',
    '1. cwd=. corepack yarn ios:release:readiness:audit',
    '2. cwd=. corepack yarn ios:release:readiness:check-summary',
    '3. cwd=. corepack yarn ios:mac-validation-prereq:audit',
    '4. cwd=. corepack yarn ios:mac-validation-prereq:check-summary',
    '5. cwd=. node scripts/checkIosMacValidationPrereqSummary.mjs --require-toolchain',
    '6. cwd=ios pod install',
    '7. cwd=. corepack yarn ios:release:readiness:audit',
    '8. cwd=. corepack yarn ios:release:readiness:check-summary',
    '9. cwd=. corepack yarn ios:mac-validation:handoff --scheme "GoldWallet Dev (Debug)"',
    '10. cwd=. corepack yarn ios:mac-validation:handoff --all-schemes',
    'Secret values printed: no',
    refreshRequired
      ? 'Required action: refresh ios/Podfile.lock with pod install on macOS, commit the refreshed lockfile after review, then run iOS archive/simulator validation before claiming iOS runtime delivery; use --all-schemes for full shared-scheme release validation.'
      : 'Required action: run iOS archive/simulator validation on macOS before claiming iOS runtime delivery; use --all-schemes for full shared-scheme release validation.',
    '',
  ].join('\n');
};

const main = () => {
  const audit = collectIosPodfileRefreshPlan();
  const plan = formatIosPodfileRefreshPlan(audit);

  mkdirSync(path.dirname(planPath), { recursive: true });
  writeFileSync(planPath, plan);

  console.log('iOS Podfile.lock refresh plan');
  console.log(`Platform: ${audit.platform}`);
  console.log(`Static iOS release files valid: ${audit.staticReady ? 'yes' : 'no'}`);
  console.log(`Podfile.lock refresh required: ${audit.podfileLockDriftIssues.length > 0 ? 'yes' : 'no'}`);
  console.log(`Podfile.lock drift issues: ${audit.podfileLockDriftIssues.length}`);
  console.log('iOS runtime delivery validation: not claimed');
  console.log('Secret values printed: no');
  console.log(`iOS Podfile.lock refresh plan written to ${path.relative(root, planPath)}`);
  return audit.staticReady ? 0 : 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}

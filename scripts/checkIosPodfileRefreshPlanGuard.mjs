import { getIosPodfileRefreshPlanErrors } from './iosPodfileRefreshPlanGuard.mjs';

const validBlockedPlan = [
  'iOS Podfile.lock refresh plan',
  'Generated at: 2026-06-12T00:00:00.000Z',
  'Platform: win32',
  'React Native version: 0.86.0',
  'React Native minimum iOS: 15.1',
  'React Native minimum Xcode: 16.1',
  'Static iOS release files valid: yes',
  'Guarded iOS schemes: 8',
  'Podfile.lock refresh required: yes',
  'Podfile.lock drift issues: 2',
  '- ios/Podfile.lock has React-Core 0.65.3; package.json has react-native 0.86.0',
  '- ios/Podfile.lock has RNSentry 3.1.0; package.json has @sentry/react-native 8.15.1',
  'Removed Podfile.lock pod references: 0',
  'macOS/Xcode required: yes',
  'iOS runtime delivery validation: not claimed',
  'Command plan:',
  '1. cwd=. corepack yarn ios:release:readiness:audit',
  '2. cwd=. corepack yarn ios:release:readiness:check-summary',
  '3. cwd=ios pod install',
  '4. cwd=. corepack yarn ios:release:readiness:audit',
  '5. cwd=. corepack yarn ios:release:readiness:check-summary',
  '6. cwd=. corepack yarn ios:mac-validation:handoff --scheme "GoldWallet Dev (Debug)"',
  '7. cwd=. corepack yarn ios:mac-validation:handoff --all-schemes',
  'Secret values printed: no',
  'Required action: refresh ios/Podfile.lock with pod install on macOS, commit the refreshed lockfile after review, then run iOS archive/simulator validation before claiming iOS runtime delivery; use --all-schemes for full shared-scheme release validation.',
  '',
].join('\n');

const assertAccepted = (label, plan) => {
  const errors = getIosPodfileRefreshPlanErrors(plan);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, plan, expectedError) => {
  const errors = getIosPodfileRefreshPlanErrors(plan);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid blocked iOS Podfile.lock refresh plan fixture', validBlockedPlan);
assertRejected('Missing header fixture', validBlockedPlan.replace('iOS Podfile.lock refresh plan', 'Bad plan'), 'header');
assertRejected('Bad timestamp fixture', validBlockedPlan.replace('Generated at: 2026-06-12T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad drift count fixture', validBlockedPlan.replace('Podfile.lock drift issues: 2', 'Podfile.lock drift issues: 3'), 'listed 2');
assertRejected('Bad guarded scheme count fixture', validBlockedPlan.replace('Guarded iOS schemes: 8', 'Guarded iOS schemes: 7'), 'Guarded iOS schemes');
assertRejected('Claimed runtime fixture', validBlockedPlan.replace('iOS runtime delivery validation: not claimed', 'iOS runtime delivery validation: passed'), 'not claimed');
assertRejected('Missing pod install command fixture', validBlockedPlan.replace('3. cwd=ios pod install', '3. cwd=ios bundle install'), 'cwd=ios pod install');
assertRejected(
  'Missing all-schemes command fixture',
  validBlockedPlan.replace('7. cwd=. corepack yarn ios:mac-validation:handoff --all-schemes\n', ''),
  '--all-schemes',
);
assertRejected('Secret values fixture', validBlockedPlan.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');
assertRejected('Missing required action fixture', validBlockedPlan.replace('pod install on macOS', 'refresh on macOS'), 'pod install, archive/simulator validation, and --all-schemes');

console.log('iOS Podfile.lock refresh plan guard checks are valid.');

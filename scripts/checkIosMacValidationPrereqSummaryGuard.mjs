import assert from 'assert';
import {
  compareNumericVersions,
  getFirebaseMinimumXcodeVersion,
  parseNumericVersion,
} from './auditIosMacValidationPrereqs.mjs';
import {
  getIosMacValidationPrereqSummaryErrors,
  getIosMacValidationToolchainErrors,
} from './iosMacValidationPrereqSummaryGuard.mjs';

const validWindowsSummary = [
  'iOS macOS validation prerequisites audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'Platform: win32',
  'Ready for macOS pod/archive validation: no',
  'xcodebuild available: no',
  'xcodebuild version: <not available>',
  'xcodebuild supported: no',
  'React Native minimum Xcode: 16.1',
  'Firebase Apple SDK: 12.17.0',
  'Firebase minimum Xcode: 26.2',
  'Effective minimum Xcode: 26.2',
  'pod available: no',
  'bundle exec pod available: no',
  'Podfile.lock refresh required: yes',
  'Podfile.lock drift issues: 13',
  'iOS runtime delivery validation: not claimed',
  'Blockers: 4',
  '- Current platform is win32; iOS archive/simulator validation requires macOS with Xcode.',
  '- xcodebuild is not available; the effective iOS dependency baseline requires Xcode 26.2+ (React Native 0.86.2 minimum 16.1; Firebase Apple SDK 12.17.0 minimum 26.2).',
  '- CocoaPods is not available via pod or bundle exec pod; ios/Podfile.lock cannot be refreshed here.',
  '- ios/Podfile.lock has 13 active drift issues; run pod install on macOS before archive validation.',
  'Required action: run this prerequisite audit on macOS with Xcode and CocoaPods, refresh ios/Podfile.lock with pod install, then run iOS archive/simulator validation before claiming iOS runtime delivery.',
  '',
].join('\n');

const validMacSummary = [
  'iOS macOS validation prerequisites audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'Platform: darwin',
  'Ready for macOS pod/archive validation: yes',
  'xcodebuild available: yes',
  'xcodebuild version: Xcode 26.2; Build version 17C52',
  'xcodebuild supported: yes',
  'React Native minimum Xcode: 16.1',
  'Firebase Apple SDK: 12.17.0',
  'Firebase minimum Xcode: 26.2',
  'Effective minimum Xcode: 26.2',
  'pod available: yes',
  'bundle exec pod available: no',
  'Podfile.lock refresh required: no',
  'Podfile.lock drift issues: 0',
  'iOS runtime delivery validation: not claimed',
  'Blockers: 0',
  'Required action: run pod install, then iOS archive/simulator validation on macOS before claiming iOS runtime delivery.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getIosMacValidationPrereqSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getIosMacValidationPrereqSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertToolchainAccepted = (label, summary) => {
  const errors = getIosMacValidationToolchainErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should pass the mutating CocoaPods toolchain gate, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertToolchainRejected = (label, summary, expectedError) => {
  const errors = getIosMacValidationToolchainErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should fail the mutating CocoaPods toolchain gate with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Windows iOS macOS validation prerequisites fixture', validWindowsSummary);
assertAccepted('Valid macOS iOS macOS validation prerequisites fixture', validMacSummary);
const validMacWithPodfileDriftSummary = validMacSummary
  .replace('Ready for macOS pod/archive validation: yes', 'Ready for macOS pod/archive validation: no')
  .replace('Podfile.lock refresh required: no', 'Podfile.lock refresh required: yes')
  .replace('Podfile.lock drift issues: 0', 'Podfile.lock drift issues: 1')
  .replace('Blockers: 0', 'Blockers: 1\n- ios/Podfile.lock has 1 active drift issue; run pod install on macOS before archive validation.');
assertAccepted('Valid macOS prerequisite summary with expected Podfile.lock drift', validMacWithPodfileDriftSummary);
assertToolchainAccepted('Supported macOS toolchain with expected Podfile.lock drift', validMacWithPodfileDriftSummary);
assertToolchainRejected('Windows toolchain fixture', validWindowsSummary, 'require darwin');
assertRejected(
  'Bad header fixture',
  validWindowsSummary.replace('iOS macOS validation prerequisites audit', 'Bad header'),
  'summary header',
);
assertRejected(
  'Bad timestamp fixture',
  validWindowsSummary.replace('Generated at: 2026-06-04T00:00:00.000Z', 'Generated at: now'),
  'ISO timestamp',
);
assertRejected(
  'Missing Xcode fixture',
  validMacSummary.replace('xcodebuild available: yes', 'xcodebuild available: no'),
  'xcodebuild version',
);
assertRejected(
  'Wrong Xcode minimum fixture',
  validWindowsSummary.replace('React Native minimum Xcode: 16.1', 'React Native minimum Xcode: 15.0'),
  'React Native minimum Xcode',
);
assertRejected(
  'Unsupported installed Xcode fixture',
  validMacSummary.replace('xcodebuild version: Xcode 26.2; Build version 17C52', 'xcodebuild version: Xcode 26.1; Build version 17B55'),
  'xcodebuild supported must match',
);
assertAccepted(
  'Unsupported Xcode marked not ready fixture',
  validMacSummary
    .replace('Ready for macOS pod/archive validation: yes', 'Ready for macOS pod/archive validation: no')
    .replace('xcodebuild version: Xcode 26.2; Build version 17C52', 'xcodebuild version: Xcode 26.1; Build version 17B55')
    .replace('xcodebuild supported: yes', 'xcodebuild supported: no')
    .replace('Blockers: 0', 'Blockers: 1\n- xcodebuild reports Xcode 26.1; the effective iOS dependency baseline requires Xcode 26.2+ for Firebase Apple SDK 12.17.0.'),
);
assertToolchainRejected(
  'Unsupported Xcode toolchain fixture',
  validMacSummary
    .replace('Ready for macOS pod/archive validation: yes', 'Ready for macOS pod/archive validation: no')
    .replace('xcodebuild version: Xcode 26.2; Build version 17C52', 'xcodebuild version: Xcode 26.1; Build version 17B55')
    .replace('xcodebuild supported: yes', 'xcodebuild supported: no')
    .replace('Blockers: 0', 'Blockers: 1\n- xcodebuild reports Xcode 26.1; the effective iOS dependency baseline requires Xcode 26.2+ for Firebase Apple SDK 12.17.0.'),
  'supported Xcode version',
);
assertRejected(
  'Wrong Firebase Xcode minimum fixture',
  validWindowsSummary.replace('Firebase minimum Xcode: 26.2', 'Firebase minimum Xcode: 16.1'),
  'Firebase minimum Xcode',
);
assertRejected(
  'Bad Podfile.lock refresh fixture',
  validWindowsSummary.replace('Podfile.lock refresh required: yes', 'Podfile.lock refresh required: no'),
  'cannot be no with drift issues',
);

assert.deepStrictEqual(parseNumericVersion('Xcode 26.2\nBuild version 17C52'), [26, 2, 0]);
assert(compareNumericVersions('26.2', '26.1.1') > 0);
assert(compareNumericVersions('26.2', '26.2.0') === 0);
assert.strictEqual(getFirebaseMinimumXcodeVersion('12.11.0'), '<not stricter than React Native>');
assert.strictEqual(getFirebaseMinimumXcodeVersion('12.12.0'), '26.2');
assert.strictEqual(getFirebaseMinimumXcodeVersion('12.17.0'), '26.2');
assertRejected(
  'Claimed runtime fixture',
  validWindowsSummary.replace('iOS runtime delivery validation: not claimed', 'iOS runtime delivery validation: claimed'),
  'not claimed',
);
assertRejected(
  'Bad blocker count fixture',
  validWindowsSummary.replace('Blockers: 4', 'Blockers: 3'),
  'Blockers count',
);
assertRejected(
  'Missing archive action fixture',
  validWindowsSummary.replace(/iOS archive\/simulator validation/g, 'manual iOS check'),
  'archive/simulator validation',
);

console.log('iOS macOS validation prerequisites summary guard checks are valid.');

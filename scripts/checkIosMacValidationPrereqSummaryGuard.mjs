import { getIosMacValidationPrereqSummaryErrors } from './iosMacValidationPrereqSummaryGuard.mjs';

const validWindowsSummary = [
  'iOS macOS validation prerequisites audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'Platform: win32',
  'Ready for macOS pod/archive validation: no',
  'xcodebuild available: no',
  'xcodebuild version: <not available>',
  'React Native minimum Xcode: 16.1',
  'pod available: no',
  'bundle exec pod available: no',
  'Podfile.lock refresh required: yes',
  'Podfile.lock drift issues: 12',
  'iOS runtime delivery validation: not claimed',
  'Blockers: 4',
  '- Current platform is win32; iOS archive/simulator validation requires macOS with Xcode.',
  '- xcodebuild is not available; React Native 0.86.2 requires Xcode 16.1+.',
  '- CocoaPods is not available via pod or bundle exec pod; ios/Podfile.lock cannot be refreshed here.',
  '- ios/Podfile.lock has 12 active drift issues; run pod install on macOS before archive validation.',
  'Required action: run this prerequisite audit on macOS with Xcode and CocoaPods, refresh ios/Podfile.lock with pod install, then run iOS archive/simulator validation before claiming iOS runtime delivery.',
  '',
].join('\n');

const validMacSummary = [
  'iOS macOS validation prerequisites audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'Platform: darwin',
  'Ready for macOS pod/archive validation: yes',
  'xcodebuild available: yes',
  'xcodebuild version: Xcode 16.1; Build version 16B40',
  'React Native minimum Xcode: 16.1',
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

assertAccepted('Valid Windows iOS macOS validation prerequisites fixture', validWindowsSummary);
assertAccepted('Valid macOS iOS macOS validation prerequisites fixture', validMacSummary);
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
  'Bad Podfile.lock refresh fixture',
  validWindowsSummary.replace('Podfile.lock refresh required: yes', 'Podfile.lock refresh required: no'),
  'cannot be no with drift issues',
);
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

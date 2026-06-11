import { getIosValidationHandoffSummaryErrors } from './iosValidationHandoffSummaryGuard.mjs';

const validBlockedWindowsSummary = [
  'iOS validation handoff summary',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'Platform: win32',
  'Static iOS release files valid: yes',
  'Release readiness summary valid: yes',
  'Mac prerequisite summary valid: yes',
  'Ready for macOS archive validation: no',
  'Ready for macOS pod/archive validation: no',
  'Podfile.lock refresh required: yes',
  'Release Podfile.lock drift issues: 12',
  'Prereq Podfile.lock drift issues: 12',
  'xcodebuild available: no',
  'xcodebuild version: <not available>',
  'pod available: no',
  'bundle exec pod available: no',
  'Guarded iOS schemes: 8',
  'iOS runtime delivery validation: not claimed',
  'Implementation ready: no',
  'Blockers: 4',
  '- Current platform is win32; iOS archive/simulator validation requires macOS with Xcode.',
  '- xcodebuild is unavailable; install/run Xcode on macOS before claiming iOS validation.',
  '- CocoaPods is unavailable; install pod or run through bundle exec pod on macOS.',
  '- ios/Podfile.lock refresh is required; release drift 12, prereq drift 12.',
  'Secret values printed: no',
  'Required action: refresh ios/Podfile.lock with pod install on macOS, then run iOS archive/simulator validation before claiming iOS runtime delivery.',
  '',
].join('\n');

const validReadyMacSummary = [
  'iOS validation handoff summary',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'Platform: darwin',
  'Static iOS release files valid: yes',
  'Release readiness summary valid: yes',
  'Mac prerequisite summary valid: yes',
  'Ready for macOS archive validation: yes',
  'Ready for macOS pod/archive validation: yes',
  'Podfile.lock refresh required: no',
  'Release Podfile.lock drift issues: 0',
  'Prereq Podfile.lock drift issues: 0',
  'xcodebuild available: yes',
  'xcodebuild version: Xcode 16.1; Build version 16B40',
  'pod available: yes',
  'bundle exec pod available: no',
  'Guarded iOS schemes: 8',
  'iOS runtime delivery validation: not claimed',
  'Implementation ready: yes',
  'Blockers: 0',
  'Secret values printed: no',
  'Required action: run iOS archive/simulator validation on macOS before claiming iOS runtime delivery.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getIosValidationHandoffSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getIosValidationHandoffSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid blocked Windows iOS validation handoff fixture', validBlockedWindowsSummary);
assertAccepted('Valid ready macOS iOS validation handoff fixture', validReadyMacSummary);
assertRejected(
  'Claimed runtime validation fixture',
  validBlockedWindowsSummary.replace('iOS runtime delivery validation: not claimed', 'iOS runtime delivery validation: passed'),
  'not claimed',
);
assertRejected(
  'Invalid release summary fixture',
  validBlockedWindowsSummary.replace('Release readiness summary valid: yes', 'Release readiness summary valid: no'),
  'Release readiness summary must be valid before handoff',
);
assertRejected(
  'Invalid mac prerequisite summary fixture',
  validBlockedWindowsSummary.replace('Mac prerequisite summary valid: yes', 'Mac prerequisite summary valid: no'),
  'Mac prerequisite summary must be valid before handoff',
);
assertRejected(
  'Ready on Windows fixture',
  validReadyMacSummary.replace('Platform: darwin', 'Platform: win32'),
  'Implementation-ready iOS handoff must be produced on darwin',
);
assertRejected(
  'Drift mismatch fixture',
  validBlockedWindowsSummary.replace('Prereq Podfile.lock drift issues: 12', 'Prereq Podfile.lock drift issues: 11'),
  'drift counts must match',
);
assertRejected(
  'No blockers while not ready fixture',
  validBlockedWindowsSummary
    .replace('Blockers: 4', 'Blockers: 0')
    .replace('- Current platform is win32; iOS archive/simulator validation requires macOS with Xcode.\n', '')
    .replace('- xcodebuild is unavailable; install/run Xcode on macOS before claiming iOS validation.\n', '')
    .replace('- CocoaPods is unavailable; install pod or run through bundle exec pod on macOS.\n', '')
    .replace('- ios/Podfile.lock refresh is required; release drift 12, prereq drift 12.\n', ''),
  'Not-ready iOS handoff must list at least one blocker',
);
assertRejected(
  'Missing pod install action fixture',
  validBlockedWindowsSummary.replace('refresh ios/Podfile.lock with pod install on macOS', 'refresh ios/Podfile.lock on macOS'),
  'must require pod install',
);
assertRejected(
  'Secret printed fixture',
  validBlockedWindowsSummary.replace('Secret values printed: no', 'Secret values printed: yes'),
  'must not print secret values',
);

console.log('iOS validation handoff summary guard checks are valid.');

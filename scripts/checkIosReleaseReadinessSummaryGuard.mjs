import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';

const validWindowsSummary = [
  'iOS release static readiness audit',
  'Generated at: 2026-05-30T12:34:56.789Z',
  'Static iOS release files valid: yes',
  'Ready for macOS archive validation: no',
  'React Native version: 0.85.3',
  'React Native minimum iOS: 15.1',
  'React Native minimum Xcode: 16.1',
  'Podfile iOS platform: 15.1',
  'Xcode deployment targets: 15.1',
  'Guarded iOS schemes: 8',
  'iOS Sentry bundle/source-map phases: 4',
  'iOS Sentry dSYM upload phases: 3',
  'iOS CodePush plist placeholders: 3',
  'Podfile.lock refresh required: yes',
  'Podfile.lock drift issues: 4',
  '- ios/Podfile.lock has React-Core 0.65.3; package.json has react-native 0.85.3',
  '- ios/Podfile.lock still references removed react-native-camera; run pod install on macOS after the CameraKit migration',
  '- ios/Podfile.lock still references removed react-native-qrcode-local-image; run pod install on macOS after the QR local-image cleanup',
  '- ios/Podfile.lock still references removed RNCMaskedView; run pod install on macOS after the React Navigation 7 masked-view removal',
  'xcodebuild version: <not available on this machine>',
  'iOS runtime delivery validation: not claimed',
  'Errors: 0',
  'Warnings: 1',
  '- iOS compile/archive validation is blocked on this machine: xcodebuild requires macOS with Xcode.',
  'Required action: refresh ios/Podfile.lock with pod install on macOS, then run iOS archive/simulator validation before claiming iOS runtime delivery.',
  '',
].join('\n');

const validMacSummary = validWindowsSummary
  .replace('Ready for macOS archive validation: no', 'Ready for macOS archive validation: yes')
  .replace(
    'Podfile.lock refresh required: yes\nPodfile.lock drift issues: 4\n- ios/Podfile.lock has React-Core 0.65.3; package.json has react-native 0.85.3\n- ios/Podfile.lock still references removed react-native-camera; run pod install on macOS after the CameraKit migration\n- ios/Podfile.lock still references removed react-native-qrcode-local-image; run pod install on macOS after the QR local-image cleanup\n- ios/Podfile.lock still references removed RNCMaskedView; run pod install on macOS after the React Navigation 7 masked-view removal',
    'Podfile.lock refresh required: no\nPodfile.lock drift issues: 0',
  )
  .replace('xcodebuild version: <not available on this machine>', 'xcodebuild version: Xcode 16.1; Build version 16B40')
  .replace(
    'Warnings: 1\n- iOS compile/archive validation is blocked on this machine: xcodebuild requires macOS with Xcode.',
    'Warnings: 0',
  )
  .replace(
    'Required action: refresh ios/Podfile.lock with pod install on macOS, then run iOS archive/simulator validation before claiming iOS runtime delivery.',
    'Required action: run pod install and iOS archive/simulator validation on macOS before claiming iOS runtime delivery.',
  );

const assertAccepted = (label, summary) => {
  const errors = getIosReleaseReadinessSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getIosReleaseReadinessSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Windows iOS release readiness summary fixture', validWindowsSummary);
assertAccepted('Valid macOS iOS release readiness summary fixture', validMacSummary);
assertRejected(
  'Bad header fixture',
  validWindowsSummary.replace('iOS release static readiness audit', 'Bad header'),
  'summary header',
);
assertRejected(
  'Bad timestamp fixture',
  validWindowsSummary.replace('Generated at: 2026-05-30T12:34:56.789Z', 'Generated at: now'),
  'ISO timestamp',
);
assertRejected(
  'Not ready fixture',
  validWindowsSummary.replace('Static iOS release files valid: yes', 'Static iOS release files valid: no'),
  'Static iOS release files valid',
);
assertRejected(
  'Wrong React Native fixture',
  validWindowsSummary.replace('React Native version: 0.85.3', 'React Native version: 0.84.0'),
  'React Native version',
);
assertRejected(
  'Missing Sentry bundle phase fixture',
  validWindowsSummary.replace('iOS Sentry bundle/source-map phases: 4', 'iOS Sentry bundle/source-map phases: 3'),
  'Sentry bundle/source-map phases',
);
assertRejected(
  'Missing Sentry dSYM phase fixture',
  validWindowsSummary.replace('iOS Sentry dSYM upload phases: 3', 'iOS Sentry dSYM upload phases: 2'),
  'Sentry dSYM upload phases',
);
assertRejected(
  'Missing CodePush plist placeholder fixture',
  validWindowsSummary.replace('iOS CodePush plist placeholders: 3', 'iOS CodePush plist placeholders: 2'),
  'CodePush plist placeholders',
);
assertRejected(
  'Bad Podfile.lock drift count fixture',
  validWindowsSummary.replace('Podfile.lock drift issues: 4', 'Podfile.lock drift issues: 3'),
  'Podfile.lock drift issues count',
);
assertRejected(
  'Missing removed QR local-image pod fixture',
  validWindowsSummary.replace(
    '- ios/Podfile.lock still references removed react-native-qrcode-local-image; run pod install on macOS after the QR local-image cleanup\n',
    '',
  ).replace('Podfile.lock drift issues: 4', 'Podfile.lock drift issues: 3'),
  'removed react-native-qrcode-local-image',
);
assertRejected(
  'Missing removed masked-view pod fixture',
  validWindowsSummary.replace(
    '- ios/Podfile.lock still references removed RNCMaskedView; run pod install on macOS after the React Navigation 7 masked-view removal\n',
    '',
  ).replace('Podfile.lock drift issues: 4', 'Podfile.lock drift issues: 3'),
  'removed masked-view pod',
);
assertRejected(
  'Missing Podfile.lock refresh action fixture',
  validWindowsSummary.replace('refresh ios/Podfile.lock with pod install on macOS', 'run CocoaPods later'),
  'refreshing ios/Podfile.lock',
);
assertRejected(
  'Missing xcodebuild warning fixture',
  validWindowsSummary.replace(
    '- iOS compile/archive validation is blocked on this machine: xcodebuild requires macOS with Xcode.\n',
    '',
  ),
  'xcodebuild unavailable warning',
);
assertRejected(
  'Claimed iOS runtime delivery fixture',
  validWindowsSummary.replace('iOS runtime delivery validation: not claimed', 'iOS runtime delivery validation: claimed'),
  'not claimed',
);
assertRejected(
  'Missing required action fixture',
  validWindowsSummary.replace('iOS archive/simulator validation', 'manual check'),
  'Required action',
);

console.log('iOS release readiness summary guard checks are valid.');

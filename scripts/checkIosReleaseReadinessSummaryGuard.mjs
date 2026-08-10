import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';

const currentPodfileLockDriftLines = [
  '- ios/Podfile.lock has React-Core 0.65.3; package.json has react-native 0.86.2',
  '- ios/Podfile.lock has RNBootSplash 3.2.5; package.json has react-native-bootsplash 7.3.2',
  '- ios/Podfile.lock has react-native-config 1.4.4; package.json has react-native-config 1.6.1',
  '- ios/Podfile.lock has RNCAsyncStorage 1.15.7; package.json has @react-native-async-storage/async-storage 3.1.1',
  '- ios/Podfile.lock has RNDeviceInfo 6.2.1; package.json has react-native-device-info 15.0.2',
  '- ios/Podfile.lock has RNFastImage 8.3.7; package.json has react-native-fast-image 8.6.3',
  '- ios/Podfile.lock has RNFBApp 12.7.5; package.json has @react-native-firebase/app 26.0.0',
  '- ios/Podfile.lock has RNGestureHandler 1.10.3; package.json has react-native-gesture-handler 3.1.0',
  '- ios/Podfile.lock has RNLocalize 1.4.3; package.json has react-native-localize 3.7.0',
  '- ios/Podfile.lock has RNScreens 3.6.0; package.json has react-native-screens 4.26.2',
  '- ios/Podfile.lock has RNSentry 3.1.0; package.json has @sentry/react-native 8.22.0',
  '- ios/Podfile.lock has RNVectorIcons 6.6.0; package.json has react-native-vector-icons 10.3.0',
];

const validWindowsSummary = [
  'iOS release static readiness audit',
  'Generated at: 2026-05-30T12:34:56.789Z',
  'Static iOS release files valid: yes',
  'Ready for macOS archive validation: no',
  'React Native version: 0.86.2',
  'React Native minimum iOS: 15.1',
  'React Native minimum Xcode: 16.1',
  'Podfile iOS platform: 15.1',
  'Xcode deployment targets: 15.1',
  'Guarded iOS schemes: 8',
  'iOS Sentry bundle/source-map phases: 4',
  'iOS Sentry dSYM upload phases: 3',
  'iOS CodePush plist placeholders: 0',
  'iOS remote-notification plists: 4',
  'Podfile.lock refresh required: yes',
  'Removed Podfile.lock pod references: 0',
  `Podfile.lock drift issues: ${currentPodfileLockDriftLines.length}`,
  ...currentPodfileLockDriftLines,
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
    `Podfile.lock refresh required: yes\nRemoved Podfile.lock pod references: 0\nPodfile.lock drift issues: ${currentPodfileLockDriftLines.length}\n${currentPodfileLockDriftLines.join('\n')}`,
    'Podfile.lock refresh required: no\nRemoved Podfile.lock pod references: 0\nPodfile.lock drift issues: 0',
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

const removeDriftLine = driftLine =>
  validWindowsSummary
    .replace(`${driftLine}\n`, '')
    .replace(
      `Podfile.lock drift issues: ${currentPodfileLockDriftLines.length}`,
      `Podfile.lock drift issues: ${currentPodfileLockDriftLines.length - 1}`,
    );

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
  validWindowsSummary.replace('React Native version: 0.86.2', 'React Native version: 0.84.0'),
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
  'Unexpected CodePush plist placeholder fixture',
  validWindowsSummary.replace('iOS CodePush plist placeholders: 0', 'iOS CodePush plist placeholders: 1'),
  'CodePush plist placeholders',
);
assertRejected(
  'Missing remote-notification plist fixture',
  validWindowsSummary.replace('iOS remote-notification plists: 4', 'iOS remote-notification plists: 3'),
  'remote-notification plists',
);
assertRejected(
  'Bad Podfile.lock drift count fixture',
  validWindowsSummary.replace(
    `Podfile.lock drift issues: ${currentPodfileLockDriftLines.length}`,
    `Podfile.lock drift issues: ${currentPodfileLockDriftLines.length - 1}`,
  ),
  'Podfile.lock drift issues count',
);
assertRejected(
  'Removed pod references fixture',
  validWindowsSummary.replace(
    'Removed Podfile.lock pod references: 0',
    'Removed Podfile.lock pod references: 1\n- ios/Podfile.lock still references removed FlipperKit; run pod install on macOS after the Flipper debug stack removal',
  ),
  'Removed Podfile.lock pod references must be 0',
);
assertRejected(
  'Missing Firebase pod drift fixture',
  removeDriftLine('- ios/Podfile.lock has RNFBApp 12.7.5; package.json has @react-native-firebase/app 26.0.0'),
  'RNFBApp 12.7.5',
);
assertRejected(
  'Missing Sentry pod drift fixture',
  removeDriftLine('- ios/Podfile.lock has RNSentry 3.1.0; package.json has @sentry/react-native 8.22.0'),
  'RNSentry 3.1.0',
);
assertRejected(
  'Missing gesture-handler pod drift fixture',
  removeDriftLine('- ios/Podfile.lock has RNGestureHandler 1.10.3; package.json has react-native-gesture-handler 3.1.0'),
  'RNGestureHandler 1.10.3',
);
assertRejected(
  'Missing screens pod drift fixture',
  removeDriftLine('- ios/Podfile.lock has RNScreens 3.6.0; package.json has react-native-screens 4.26.2'),
  'RNScreens 3.6.0',
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

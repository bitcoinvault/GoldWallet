import { getCameraQrMigrationSummaryErrors } from './cameraQrMigrationSummaryGuard.mjs';

const validSummary = [
  'Camera QR migration audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'react-native-camera manifest version: <missing>',
  'react-native-camera-kit manifest version: 18.0.0',
  'QR local-image manifest version: <missing>',
  'QR renderer version: 6.3.21',
  'QR native renderer version: 15.15.5',
  'qrcode resolution: 1.5.4',
  'CameraKit latest target: react-native-camera-kit@18.0.0',
  'CameraKit peer dependency ranges: react@*, react-native@*',
  'QR renderer latest target: react-native-qrcode-svg@6.3.21',
  'QR renderer peer dependency ranges: react@*, react-native@>=0.63.4, react-native-svg@>=14.0.0',
  'QR renderer dependencies: prop-types@^15.8.0, qrcode@^1.5.4, text-encoding@^0.7.0',
  'QR native renderer latest target: react-native-svg@15.15.5',
  'QR encoder latest target: qrcode@1.5.4',
  'Live QR targets: matched',
  'Live QR target issues: 0',
  'iOS Podfile.lock refresh required: no',
  'iOS stale removed camera pods: none',
  'iOS camera Podfile.lock cleanup complete: yes',
  'iOS broader Podfile.lock refresh required: yes',
  'iOS broader Podfile.lock drift issues: 1',
  '- ios/Podfile.lock has React-Core 0.65.3; package.json has react-native 0.86.0',
  'iOS removed Podfile.lock drift issues: 0',
  'Camera QR migration wiring valid: yes',
  'Camera QR migration baseline stable: yes',
  'Warnings: 1',
  '- local Android warning audit summary still mentions react-native-camera; refresh the warning audit after migration.',
  'Readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none for Android/CameraKit scanner wiring; refresh broader ios/Podfile.lock with pod install on macOS before claiming iOS camera QR runtime validation.',
  '',
].join('\n');

const invalidSummary = [
  'Camera QR migration audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'react-native-camera manifest version: ^3.33.0',
  'react-native-camera-kit manifest version: 18.0.0',
  'QR local-image manifest version: 1.0.4',
  'QR renderer version: 6.3.21',
  'QR native renderer version: 15.15.5',
  'qrcode resolution: 1.5.4',
  'CameraKit latest target: react-native-camera-kit@18.0.0',
  'CameraKit peer dependency ranges: react@*, react-native@*',
  'QR renderer latest target: react-native-qrcode-svg@6.3.21',
  'QR renderer peer dependency ranges: react@*, react-native@>=0.63.4, react-native-svg@>=14.0.0',
  'QR renderer dependencies: prop-types@^15.8.0, qrcode@^1.5.4, text-encoding@^0.7.0',
  'QR native renderer latest target: react-native-svg@15.15.5',
  'QR encoder latest target: qrcode@1.5.4',
  'Live QR targets: stale',
  'Live QR target issues: 1',
  '- CameraKit latest live npm metadata is react-native-camera-kit@19.0.0; expected react-native-camera-kit@18.0.0',
  'iOS Podfile.lock refresh required: yes',
  'iOS stale removed camera pods: react-native-camera, react-native-qrcode-local-image',
  'iOS camera Podfile.lock cleanup complete: no',
  'iOS broader Podfile.lock refresh required: yes',
  'iOS broader Podfile.lock drift issues: 2',
  '- ios/Podfile.lock still references removed react-native-camera',
  '- ios/Podfile.lock still references removed react-native-qrcode-local-image',
  'iOS removed Podfile.lock drift issues: 2',
  '- ios/Podfile.lock still references removed react-native-camera',
  '- ios/Podfile.lock still references removed react-native-qrcode-local-image',
  'Camera QR migration wiring valid: no',
  'Camera QR migration baseline stable: no',
  'Warnings: 0',
  'Readiness issues: 1',
  '- package.json still has react-native-camera@^3.33.0; expected removal after CameraKit QR migration',
  'Wiring errors: 1',
  '- ScanQrCodeScreen.tsx is missing CameraKit',
  'Required action: restore camera QR migration baseline and refresh ios/Podfile.lock with pod install on macOS before claiming iOS camera QR migration validation.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getCameraQrMigrationSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCameraQrMigrationSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid camera QR migration summary fixture', validSummary);
assertAccepted('Invalid-baseline camera QR migration summary fixture', invalidSummary);
assertRejected('Missing header fixture', validSummary.replace('Camera QR migration audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-05-28T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad warning count fixture', validSummary.replace('Warnings: 1', 'Warnings: 0'), 'Warnings count');
assertRejected(
  'Missing iOS pod refresh fixture',
  invalidSummary.replace('iOS Podfile.lock refresh required: yes', 'iOS Podfile.lock refresh required: no'),
  'stale removed camera pods must be none',
);
assertRejected(
  'Bad iOS camera cleanup complete fixture',
  validSummary.replace('iOS camera Podfile.lock cleanup complete: yes', 'iOS camera Podfile.lock cleanup complete: no'),
  'cleanup cannot be incomplete',
);
assertRejected(
  'Bad broader iOS drift count fixture',
  validSummary.replace('iOS broader Podfile.lock drift issues: 1', 'iOS broader Podfile.lock drift issues: 2'),
  'iOS broader Podfile.lock drift issues count',
);
assertRejected(
  'Missing broader iOS pod install action fixture',
  validSummary.replace(
    'Required action: none for Android/CameraKit scanner wiring; refresh broader ios/Podfile.lock with pod install on macOS before claiming iOS camera QR runtime validation.',
    'Required action: none; camera QR migration baseline is stable after the dedicated scanner replacement branch.',
  ),
  'macOS pod install required action',
);
assertRejected(
  'Stable stale live QR target fixture',
  validSummary.replace(
    'Live QR targets: matched\nLive QR target issues: 0',
    'Live QR targets: stale\nLive QR target issues: 1\n- QR renderer latest live npm metadata is react-native-qrcode-svg@7.0.0; expected react-native-qrcode-svg@6.3.21',
  ),
  'matched live QR targets',
);
assertRejected(
  'Bad live QR target count fixture',
  validSummary.replace('Live QR target issues: 0', 'Live QR target issues: 1'),
  'Live QR target issues count',
);
assertRejected(
  'Missing QR native renderer fixture',
  validSummary.replace('QR native renderer version: 15.15.5', 'QR native renderer version: '),
  'QR native renderer version is missing',
);
assertRejected(
  'Bad QR native renderer latest fixture',
  validSummary.replace('QR native renderer latest target: react-native-svg@15.15.5', 'QR native renderer latest target: react-native-svg@15.16.0'),
  'QR native renderer latest target',
);
assertRejected(
  'Bad CameraKit peer range fixture',
  validSummary.replace('CameraKit peer dependency ranges: react@*, react-native@*', 'CameraKit peer dependency ranges: react@*, react-native@>=0.86'),
  'CameraKit peer dependency ranges',
);
assertRejected(
  'Bad QR renderer peer range fixture',
  validSummary.replace(
    'QR renderer peer dependency ranges: react@*, react-native@>=0.63.4, react-native-svg@>=14.0.0',
    'QR renderer peer dependency ranges: react@*, react-native@>=0.86.0, react-native-svg@>=15.0.0',
  ),
  'QR renderer peer dependency ranges',
);
assertRejected(
  'Bad QR renderer dependency fixture',
  validSummary.replace('QR renderer dependencies: prop-types@^15.8.0, qrcode@^1.5.4, text-encoding@^0.7.0', 'QR renderer dependencies: qrcode@^2.0.0'),
  'QR renderer dependencies',
);
assertRejected(
  'Missing iOS stale pod list fixture',
  invalidSummary.replace(
    'iOS stale removed camera pods: react-native-camera, react-native-qrcode-local-image',
    'iOS stale removed camera pods: none',
  ),
  'refresh required cannot be yes',
);
assertRejected(
  'Missing required action fixture',
  invalidSummary.replace(
    'Required action: restore camera QR migration baseline and refresh ios/Podfile.lock with pod install on macOS before claiming iOS camera QR migration validation.',
    'Required action: restore QR scanner.',
  ),
  'camera QR restoration required action',
);
assertRejected(
  'Missing iOS pod install action fixture',
  invalidSummary.replace(
    'Required action: restore camera QR migration baseline and refresh ios/Podfile.lock with pod install on macOS before claiming iOS camera QR migration validation.',
    'Required action: restore camera QR migration baseline before scanner follow-up work.',
  ),
  'pod install on macOS',
);

console.log('Camera QR migration summary guard checks are valid.');

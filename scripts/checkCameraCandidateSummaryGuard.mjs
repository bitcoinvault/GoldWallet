import { getCameraCandidateSummaryErrors } from './cameraCandidateSummaryGuard.mjs';

const validSummary = [
  'Camera candidate audit',
  'Generated at: 2026-06-12T00:00:00.000Z',
  'Metadata checked on: 2026-06-12',
  'Legacy camera latest: react-native-camera@4.2.1',
  'VisionCamera latest: react-native-vision-camera@5.0.11',
  'VisionCamera Nitro peers: yes',
  'VisionCamera required peer packages: react-native-nitro-modules, react-native-nitro-image',
  'VisionCamera peer dependency ranges: react@*, react-native@*, react-native-nitro-image@*, react-native-nitro-modules@*',
  'CameraKit latest: react-native-camera-kit@18.0.0',
  'CameraKit node engine: >=18',
  'CameraKit peer dependency ranges: react@*, react-native@*',
  'QR renderer latest: react-native-qrcode-svg@6.3.21',
  'QR renderer peer dependency ranges: react@*, react-native@>=0.63.4, react-native-svg@>=14.0.0',
  'QR renderer dependencies: prop-types@^15.8.0, qrcode@^1.5.4, text-encoding@^0.7.0',
  'QR native renderer latest: react-native-svg@15.15.5',
  'QR encoder latest: qrcode@1.5.4',
  'Live npm metadata: matched',
  'Live npm metadata issues: 0',
  'Selected proof target: CameraKit selected and installed; VisionCamera deferred because latest line requires Nitro peers',
  'Proof branch: feature/bem-37-camera-kit-qr-proof',
  'Camera candidate baseline stable: yes',
  'Warnings: 0',
  'Errors: 0',
  'Required action: none; CameraKit scanner baseline is stable after the dedicated proof branch.',
].join('\n');

const invalidSummary = validSummary
  .replace('VisionCamera Nitro peers: yes', 'VisionCamera Nitro peers: no')
  .replace('Live npm metadata: matched', 'Live npm metadata: stale')
  .replace('Live npm metadata issues: 0', 'Live npm metadata issues: 1\n- VisionCamera latest live npm metadata is react-native-vision-camera@5.1.0; expected react-native-vision-camera@5.0.11')
  .replace('Camera candidate baseline stable: yes', 'Camera candidate baseline stable: no')
  .replace(
    'Required action: none; CameraKit scanner baseline is stable after the dedicated proof branch.',
    'Required action: restore camera candidate baseline before scanner follow-up work.',
  );

const assertAccepted = (label, summary) => {
  const errors = getCameraCandidateSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCameraCandidateSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid camera candidate summary fixture', validSummary);
assertRejected('Invalid VisionCamera Nitro peer fixture', invalidSummary, 'VisionCamera Nitro peers');
assertRejected('Missing metadata date fixture', validSummary.replace('Metadata checked on: 2026-06-12', 'Metadata checked on: 2026-06-05'), 'Metadata checked on');
assertRejected(
  'Stable stale metadata fixture',
  validSummary.replace('Live npm metadata: matched', 'Live npm metadata: stale'),
  'Stale live npm metadata summary must list',
);
assertRejected(
  'Missing VisionCamera peer fixture',
  validSummary.replace(
    'VisionCamera required peer packages: react-native-nitro-modules, react-native-nitro-image',
    'VisionCamera required peer packages: react-native-nitro-modules',
  ),
  'VisionCamera required peer packages',
);
assertRejected(
  'Changed VisionCamera peer range fixture',
  validSummary.replace(
    'VisionCamera peer dependency ranges: react@*, react-native@*, react-native-nitro-image@*, react-native-nitro-modules@*',
    'VisionCamera peer dependency ranges: react@*, react-native@*, react-native-nitro-image@*, react-native-nitro-modules@^0.31.0',
  ),
  'VisionCamera peer dependency ranges',
);
assertRejected('Bad QR renderer fixture', validSummary.replace('QR renderer latest: react-native-qrcode-svg@6.3.21', 'QR renderer latest: missing'), 'QR renderer latest');
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
  'Bad QR native renderer fixture',
  validSummary.replace('QR native renderer latest: react-native-svg@15.15.5', 'QR native renderer latest: missing'),
  'QR native renderer latest',
);
assertRejected('Missing header fixture', validSummary.replace('Camera candidate audit', 'Bad header'), 'summary header');

console.log('Camera candidate summary guard checks are valid.');

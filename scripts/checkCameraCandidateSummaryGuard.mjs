import { getCameraCandidateSummaryErrors } from './cameraCandidateSummaryGuard.mjs';

const validSummary = [
  'Camera candidate audit',
  'Generated at: 2026-05-29T00:00:00.000Z',
  'Legacy camera latest: react-native-camera@4.2.1',
  'VisionCamera latest: react-native-vision-camera@5.0.11',
  'VisionCamera Nitro peers: yes',
  'CameraKit latest: react-native-camera-kit@18.0.0',
  'CameraKit node engine: >=18',
  'Selected proof target: VisionCamera proof branch first, CameraKit fallback',
  'Proof branch: feature/bem-camera-qr-scanner-migration',
  'Camera candidate baseline stable: yes',
  'Warnings: 1',
  '- react-native-camera remains installed and deprecated; this audit only records candidate selection.',
  'Errors: 0',
  'Required action: none; camera candidate baseline is stable for a dedicated scanner proof branch.',
].join('\n');

const invalidSummary = validSummary
  .replace('VisionCamera Nitro peers: yes', 'VisionCamera Nitro peers: no')
  .replace('Camera candidate baseline stable: yes', 'Camera candidate baseline stable: no')
  .replace(
    'Required action: none; camera candidate baseline is stable for a dedicated scanner proof branch.',
    'Required action: restore camera candidate baseline before starting scanner proof work.',
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
assertRejected('Missing header fixture', validSummary.replace('Camera candidate audit', 'Bad header'), 'summary header');

console.log('Camera candidate summary guard checks are valid.');

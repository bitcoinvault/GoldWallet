import { getCameraQrMigrationSummaryErrors } from './cameraQrMigrationSummaryGuard.mjs';

const validSummary = [
  'Camera QR migration audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'react-native-camera manifest version: <missing>',
  'react-native-camera-kit manifest version: 18.0.0',
  'QR renderer version: 6.1.1',
  'qrcode resolution: 1.4.4',
  'Camera QR migration wiring valid: yes',
  'Camera QR migration baseline stable: yes',
  'Warnings: 1',
  '- local Android warning audit summary still mentions react-native-camera; refresh the warning audit after migration.',
  'Readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none; camera QR migration baseline is stable for a dedicated scanner replacement branch.',
  '',
].join('\n');

const invalidSummary = [
  'Camera QR migration audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'react-native-camera manifest version: ^3.33.0',
  'react-native-camera-kit manifest version: 18.0.0',
  'QR renderer version: 6.1.1',
  'qrcode resolution: 1.4.4',
  'Camera QR migration wiring valid: no',
  'Camera QR migration baseline stable: no',
  'Warnings: 0',
  'Readiness issues: 1',
  '- package.json still has react-native-camera@^3.33.0; expected removal after CameraKit QR migration',
  'Wiring errors: 1',
  '- ScanQrCodeScreen.tsx is missing CameraKit',
  'Required action: restore camera QR migration baseline before replacing the scanner dependency.',
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
  'Missing required action fixture',
  invalidSummary.replace(
    'Required action: restore camera QR migration baseline before replacing the scanner dependency.',
    'Required action: restore QR scanner.',
  ),
  'camera QR restoration required action',
);

console.log('Camera QR migration summary guard checks are valid.');

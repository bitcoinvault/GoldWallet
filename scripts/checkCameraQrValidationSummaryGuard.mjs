import { getCameraQrValidationSummaryErrors } from './cameraQrValidationSummaryGuard.mjs';

const validSummary = [
  'Camera/QR validation summary',
  'Generated at: 2026-06-17T00:00:00.000Z',
  'CameraKit package: react-native-camera-kit@18.0.0',
  'QR renderer package: react-native-qrcode-svg@6.3.21',
  'QR native renderer package: react-native-svg@15.15.5',
  'QR encoder resolution: qrcode@1.5.4',
  'Camera candidate summary valid: yes',
  'Camera QR migration summary valid: yes',
  'Android dev smoke summary present: yes',
  'Android dev smoke summary valid: yes',
  'Android smoke artifact base: android-smoke-dev',
  'Android smoke outcome: passed',
  'Android dev QR scanner validated: yes',
  'Android release smoke summary present: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke artifact base: android-smoke-dev-release',
  'Android release smoke outcome: passed',
  'Android release QR scanner validated: yes',
  'Android release create-wallet smoke summary present: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke artifact base: android-create-wallet-smoke-dev-release',
  'Android release create-wallet smoke outcome: passed',
  'iOS camera Podfile.lock cleanup complete: yes',
  'iOS broader Podfile.lock refresh required: yes',
  'iOS broader Podfile.lock drift issues: 1',
  '- ios/Podfile.lock has React-Core 0.65.3; package.json has react-native 0.86.0',
  'iOS runtime validation claimed: no',
  'Camera candidate summary errors: 0',
  'Camera QR migration summary errors: 0',
  'Android dev smoke summary errors: 0',
  'Android release smoke summary errors: 0',
  'Android release create-wallet smoke summary errors: 0',
  'Camera/QR Android validation evidence ready: yes',
  'Android release evidence ready: yes',
  'Secret values printed: no',
  'Required action: keep Android CameraKit scanner evidence current before scanner-affecting changes; run pod install on macOS and validate iOS scanner runtime before claiming iOS Camera/QR validation.',
  '',
].join('\n');

const releaseEvidenceMissingSummary = validSummary
  .replace('Android release smoke summary present: yes', 'Android release smoke summary present: no')
  .replace('Android release smoke summary valid: yes', 'Android release smoke summary valid: no')
  .replace('Android release smoke artifact base: android-smoke-dev-release', 'Android release smoke artifact base: <missing>')
  .replace('Android release smoke outcome: passed', 'Android release smoke outcome: <missing>')
  .replace('Android release QR scanner validated: yes', 'Android release QR scanner validated: no')
  .replace('Android release create-wallet smoke summary present: yes', 'Android release create-wallet smoke summary present: no')
  .replace('Android release create-wallet smoke summary valid: yes', 'Android release create-wallet smoke summary valid: no')
  .replace(
    'Android release create-wallet smoke artifact base: android-create-wallet-smoke-dev-release',
    'Android release create-wallet smoke artifact base: <missing>',
  )
  .replace('Android release create-wallet smoke outcome: passed', 'Android release create-wallet smoke outcome: <missing>')
  .replace('Android release smoke summary errors: 0', 'Android release smoke summary errors: 1\n- missing Android release smoke summary')
  .replace(
    'Android release create-wallet smoke summary errors: 0',
    'Android release create-wallet smoke summary errors: 1\n- missing Android release create-wallet smoke summary',
  )
  .replace('Android release evidence ready: yes', 'Android release evidence ready: no');

const assertAccepted = (label, summary) => {
  const errors = getCameraQrValidationSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCameraQrValidationSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Camera/QR validation summary fixture', validSummary);
assertAccepted('Camera/QR validation summary without optional release evidence fixture', releaseEvidenceMissingSummary);
assertRejected('Missing header fixture', validSummary.replace('Camera/QR validation summary', 'Bad summary'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-06-17T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad CameraKit package fixture', validSummary.replace('react-native-camera-kit@18.0.0', 'react-native-camera-kit@17.0.0'), 'CameraKit package');
assertRejected(
  'Invalid candidate fixture',
  validSummary.replace('Camera candidate summary valid: yes', 'Camera candidate summary valid: no'),
  'Camera candidate summary must be valid',
);
assertRejected(
  'Missing Android smoke fixture',
  validSummary.replace('Android dev smoke summary present: yes', 'Android dev smoke summary present: no'),
  'Android dev smoke summary must be present',
);
assertRejected('Failed Android smoke fixture', validSummary.replace('Android smoke outcome: passed', 'Android smoke outcome: failed'), 'Android smoke outcome');
assertRejected(
  'Missing QR scanner evidence fixture',
  validSummary.replace('Android dev QR scanner validated: yes', 'Android dev QR scanner validated: no'),
  'Android dev smoke summary must prove QR scanner screen validation',
);
assertRejected(
  'Failed release QR scanner fixture',
  validSummary.replace('Android release QR scanner validated: yes', 'Android release QR scanner validated: no'),
  'Android release evidence ready must be no',
);
assertRejected(
  'Inconsistent release evidence fixture',
  validSummary.replace('Android release evidence ready: yes', 'Android release evidence ready: no'),
  'Android release evidence ready must be yes',
);
assertRejected(
  'iOS runtime claimed fixture',
  validSummary.replace('iOS runtime validation claimed: no', 'iOS runtime validation claimed: yes'),
  'iOS runtime validation must remain unclaimed',
);
assertRejected('Secret printed fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');
assertRejected(
  'Missing macOS action fixture',
  validSummary.replace('run pod install on macOS and ', ''),
  'Required action must mention pod install on macOS',
);

console.log('Camera/QR validation summary guard checks are valid.');

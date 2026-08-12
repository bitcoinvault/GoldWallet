import { getCameraQrValidationSummaryErrors } from './cameraQrValidationSummaryGuard.mjs';
import {
  getCameraQrControlledReleaseBlocker,
  parseCameraQrValidationSummaryArgs,
} from './runCameraQrValidationSummary.mjs';

const validSummary = [
  'Camera/QR validation summary',
  'Generated at: 2026-06-17T00:00:00.000Z',
  'CameraKit package: react-native-camera-kit@18.0.1',
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
  'Android release evidence variant: dev',
  'Android release smoke summary present: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke artifact base: android-smoke-dev-release',
  'Android release smoke outcome: passed',
  'Android release QR scanner validated: yes',
  'Android release create-wallet smoke summary present: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke artifact base: android-create-wallet-smoke-dev-release',
  'Android release create-wallet smoke outcome: passed',
  'Controlled release blocker summary present: no',
  'Controlled release blocker valid: no',
  'Controlled release blocker outcome: missing',
  'Controlled release blocker errors: 1',
  '- missing Android release network blocker summary',
  'Camera/QR release runtime proof state: ready',
  'iOS camera Podfile.lock cleanup complete: yes',
  'iOS broader Podfile.lock refresh required: yes',
  'iOS broader Podfile.lock drift issues: 1',
  '- ios/Podfile.lock has React-Core 0.65.3; package.json has react-native 0.87.0',
  'iOS runtime validation claimed: no',
  'Camera candidate summary errors: 0',
  'Camera QR migration summary errors: 0',
  'Android dev smoke summary errors: 0',
  'Android release smoke summary errors: 0',
  'Android release create-wallet smoke summary errors: 0',
  'Camera/QR Android validation evidence ready: yes',
  'Android release evidence ready: yes',
  'Secret values printed: no',
  'Required action: keep Android CameraKit scanner evidence current before scanner-affecting changes; rerun Camera/QR smoke for each changed Android build variant before claiming that variant; renew the dev/testnet Electrum TLS certificate before relying on dev/testnet Camera/QR proof; run pod install on macOS and validate iOS scanner runtime before claiming iOS Camera/QR validation.',
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
  .replace('Android release evidence ready: yes', 'Android release evidence ready: no')
  .replace('Camera/QR release runtime proof state: ready', 'Camera/QR release runtime proof state: not ready');

const controlledBlockedReleaseSummary = releaseEvidenceMissingSummary
  .replace('Controlled release blocker summary present: no', 'Controlled release blocker summary present: yes')
  .replace('Controlled release blocker valid: no', 'Controlled release blocker valid: yes')
  .replace('Controlled release blocker outcome: missing', 'Controlled release blocker outcome: blocked-by-electrum-certificate-expired')
  .replace('Controlled release blocker errors: 1\n- missing Android release network blocker summary', 'Controlled release blocker errors: 0')
  .replace('Camera/QR release runtime proof state: not ready', 'Camera/QR release runtime proof state: blocked-by-electrum-certificate-expired');

const notReadyAndroidSmokeSummary = validSummary
  .replace('Android dev smoke summary valid: yes', 'Android dev smoke summary valid: no')
  .replace('Android smoke outcome: passed', 'Android smoke outcome: failed')
  .replace('Android dev QR scanner validated: yes', 'Android dev QR scanner validated: no')
  .replace('Android dev smoke summary errors: 0', 'Android dev smoke summary errors: 1\n- UI hierarchy is missing expected text(s): Wallets, No wallets, Create new wallet, Import wallet');

const prodReleaseEvidenceSummary = validSummary
  .replace('Android release evidence variant: dev', 'Android release evidence variant: prod')
  .replace('android-smoke-dev-release', 'android-smoke-prod-release')
  .replace('android-create-wallet-smoke-dev-release', 'android-create-wallet-smoke-prod-release');

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
assertAccepted('Camera/QR validation summary with controlled release blocker fixture', controlledBlockedReleaseSummary);
assertAccepted('Camera/QR validation summary with not-ready Android smoke fixture', notReadyAndroidSmokeSummary);
assertAccepted('Camera/QR validation summary with production release evidence fixture', prodReleaseEvidenceSummary);
const nonDevBlocker = getCameraQrControlledReleaseBlocker('prod', {
  present: true,
  valid: true,
  outcome: 'blocked-by-electrum-certificate-expired',
  errors: [],
});
if (
  nonDevBlocker.present ||
  nonDevBlocker.valid ||
  nonDevBlocker.outcome !== 'not-applicable' ||
  nonDevBlocker.errors.length !== 0
) {
  console.error('Non-dev Camera/QR evidence must not inherit the dev/testnet controlled blocker');
  process.exit(1);
}
if (parseCameraQrValidationSummaryArgs(['--dry-run', '--variant=prod']).androidReleaseVariant !== 'prod') {
  console.error('Camera/QR summary parser must accept one supported release variant');
  process.exit(1);
}
[
  [['--varaint=prod'], 'Unknown argument'],
  [['--variant=prod', '--variant=stage'], 'Duplicate argument'],
  [['--variant'], 'Missing value'],
].forEach(([args, expectedError]) => {
  try {
    parseCameraQrValidationSummaryArgs(args);
    console.error(`Camera/QR summary parser should reject: ${args.join(' ')}`);
    process.exit(1);
  } catch (error) {
    if (!error.message.includes(expectedError)) {
      console.error(`Camera/QR summary parser should reject with ${expectedError}, but produced: ${error.message}`);
      process.exit(1);
    }
  }
});
assertRejected('Missing header fixture', validSummary.replace('Camera/QR validation summary', 'Bad summary'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-06-17T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad CameraKit package fixture', validSummary.replace('react-native-camera-kit@18.0.1', 'react-native-camera-kit@17.0.0'), 'CameraKit package');
assertRejected(
  'Unsupported release variant fixture',
  validSummary.replace('Android release evidence variant: dev', 'Android release evidence variant: unknown'),
  'Android release evidence variant',
);
assertRejected(
  'Invalid candidate fixture',
  validSummary.replace('Camera candidate summary valid: yes', 'Camera candidate summary valid: no'),
  'Camera candidate summary must be valid',
);
assertRejected(
  'Inconsistent missing Android smoke fixture',
  validSummary.replace('Android dev smoke summary present: yes', 'Android dev smoke summary present: no'),
  'Android dev smoke summary cannot be valid when it is not present',
);
assertRejected(
  'Inconsistent failed Android smoke fixture',
  validSummary.replace('Android smoke outcome: passed', 'Android smoke outcome: failed'),
  'Valid Android smoke outcome must be passed',
);
assertRejected(
  'Missing QR scanner evidence fixture',
  releaseEvidenceMissingSummary.replace('Android dev QR scanner validated: yes', 'Android dev QR scanner validated: no'),
  'Camera/QR Android validation evidence ready must be no',
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
  'Ready release proof without release evidence fixture',
  releaseEvidenceMissingSummary.replace('Camera/QR release runtime proof state: not ready', 'Camera/QR release runtime proof state: ready'),
  'Camera/QR release runtime proof state ready requires Android release evidence ready',
);
assertRejected(
  'Controlled blocker release proof without valid blocker fixture',
  releaseEvidenceMissingSummary.replace(
    'Camera/QR release runtime proof state: not ready',
    'Camera/QR release runtime proof state: blocked-by-electrum-certificate-expired',
  ),
  'valid controlled release blocker summary',
);
assertRejected(
  'Controlled blocker release proof with ready release evidence fixture',
  validSummary
    .replace('Controlled release blocker summary present: no', 'Controlled release blocker summary present: yes')
    .replace('Controlled release blocker valid: no', 'Controlled release blocker valid: yes')
    .replace('Controlled release blocker outcome: missing', 'Controlled release blocker outcome: blocked-by-electrum-certificate-expired')
    .replace('Controlled release blocker errors: 1\n- missing Android release network blocker summary', 'Controlled release blocker errors: 0')
    .replace('Camera/QR release runtime proof state: ready', 'Camera/QR release runtime proof state: blocked-by-electrum-certificate-expired'),
  'requires Android release evidence not ready',
);
assertRejected(
  'Controlled blocker release proof for production variant fixture',
  controlledBlockedReleaseSummary
    .replace('Android release evidence variant: dev', 'Android release evidence variant: prod'),
  'requires the dev evidence variant',
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
assertRejected(
  'Missing Android rerun action fixture',
  validSummary.replace('rerun Camera/QR smoke for each changed Android build variant before claiming that variant; ', ''),
  'rerunning Camera/QR smoke for each changed Android build variant',
);
assertRejected(
  'Missing Electrum blocker action fixture',
  validSummary.replace('renew the dev/testnet Electrum TLS certificate before relying on dev/testnet Camera/QR proof; ', ''),
  'Electrum TLS certificate',
);

console.log('Camera/QR validation summary guard checks are valid.');

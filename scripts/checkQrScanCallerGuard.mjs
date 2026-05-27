import { expectedQrScanCallerFiles, getQrScanCallerInventoryErrors } from './qrScanCallerGuard.mjs';

const expectedCallers = [...expectedQrScanCallerFiles];
const missingCallerFixture = expectedCallers.slice(1);
const unexpectedCallerFixture = [...expectedCallers, 'src/screens/NewQrFlowScreen.tsx'];

const assertAccepted = (label, callerFiles) => {
  const errors = getQrScanCallerInventoryErrors(callerFiles);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => {
      console.error(`${error.label}:`);
      error.files.forEach(filePath => console.error(`- ${filePath}`));
    });
    process.exit(1);
  }
};

const assertRejected = (label, callerFiles) => {
  const errors = getQrScanCallerInventoryErrors(callerFiles);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Known QR scanner caller inventory', expectedCallers);
assertRejected('Missing QR scanner caller inventory', missingCallerFixture);
assertRejected('Unexpected QR scanner caller inventory', unexpectedCallerFixture);

console.log('QR scanner caller guard checks are valid.');

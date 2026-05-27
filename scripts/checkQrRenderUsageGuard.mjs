import { expectedQrRenderUsageFiles, formatQrRenderUsageErrors, getQrRenderUsageErrors } from './qrRenderUsageGuard.mjs';

const expectedUsage = [...expectedQrRenderUsageFiles];
const missingUsageFixture = expectedUsage.slice(1);
const unexpectedUsageFixture = [...expectedUsage, 'src/screens/NewQrDisplayScreen.tsx'];

const assertAccepted = (label, usageFiles) => {
  const errors = getQrRenderUsageErrors(usageFiles);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    console.error(formatQrRenderUsageErrors(errors));
    process.exit(1);
  }
};

const assertRejected = (label, usageFiles) => {
  const errors = getQrRenderUsageErrors(usageFiles);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Known QR render usage inventory', expectedUsage);
assertRejected('Missing QR render usage inventory', missingUsageFixture);
assertRejected('Unexpected QR render usage inventory', unexpectedUsageFixture);

console.log('QR render usage guard checks are valid.');

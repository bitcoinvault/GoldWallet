import { expectedCameraUsageFiles, getCameraUsageScopeErrors } from './cameraUsageGuard.mjs';

const expectedUsage = [...expectedCameraUsageFiles];
const missingUsageFixture = [];
const unexpectedUsageFixture = [...expectedUsage, 'src/screens/NewCameraScreen.tsx'];

const assertAccepted = (label, usageFiles) => {
  const errors = getCameraUsageScopeErrors(usageFiles);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => {
      console.error(`${error.label}:`);
      error.files.forEach(filePath => console.error(`- ${filePath}`));
    });
    process.exit(1);
  }
};

const assertRejected = (label, usageFiles) => {
  const errors = getCameraUsageScopeErrors(usageFiles);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Known camera usage scope', expectedUsage);
assertRejected('Missing camera usage scope', missingUsageFixture);
assertRejected('Unexpected camera usage scope', unexpectedUsageFixture);

console.log('Camera usage guard checks are valid.');

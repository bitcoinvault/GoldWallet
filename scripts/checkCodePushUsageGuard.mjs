import {
  expectedCodePushNativeUsageFiles,
  expectedCodePushRuntimeUsageFiles,
  getCodePushNativeUsageErrors,
  getCodePushRuntimeUsageErrors,
} from './codePushUsageGuard.mjs';

const expectedRuntimeUsage = [...expectedCodePushRuntimeUsageFiles];
const expectedNativeUsage = [...expectedCodePushNativeUsageFiles];
const missingRuntimeUsageFixture = [];
const unexpectedRuntimeUsageFixture = [...expectedRuntimeUsage, 'src/services/CodePushReporter.ts'];
const missingNativeUsageFixture = expectedNativeUsage.filter(filePath => filePath !== 'ios/GoldWallet/AppDelegate.m');
const unexpectedNativeUsageFixture = [...expectedNativeUsage, 'ios/GoldWallet/CodePushExtra.m'];

const assertAccepted = (label, errors) => {
  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => {
      console.error(`${error.label}:`);
      error.files.forEach(filePath => console.error(`- ${filePath}`));
    });
    process.exit(1);
  }
};

const assertRejected = (label, errors) => {
  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Known CodePush runtime usage scope', getCodePushRuntimeUsageErrors(expectedRuntimeUsage));
assertAccepted('Known CodePush native usage scope', getCodePushNativeUsageErrors(expectedNativeUsage));
assertRejected('Missing CodePush runtime usage scope', getCodePushRuntimeUsageErrors(missingRuntimeUsageFixture));
assertRejected('Unexpected CodePush runtime usage scope', getCodePushRuntimeUsageErrors(unexpectedRuntimeUsageFixture));
assertRejected('Missing CodePush native usage scope', getCodePushNativeUsageErrors(missingNativeUsageFixture));
assertRejected('Unexpected CodePush native usage scope', getCodePushNativeUsageErrors(unexpectedNativeUsageFixture));

console.log('CodePush usage guard checks are valid.');

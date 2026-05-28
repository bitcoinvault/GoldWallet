import { getWarningSummarySourceErrors } from './androidValidationArtifactsGuard.mjs';

const validSummary = [
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Android Gradle audit log path: D:\\GoldWallet\\local-docs\\android-warning-audit.log',
  'Android Gradle audit timeout: 300000ms',
  'Android Gradle audit exit code: 0',
  'Android Gradle warning baseline guard exit code: 0',
  'Targeted Android Gradle warnings: 2',
  'Unexpected targeted Android Gradle warnings: 0',
  String.raw`- execResult: at sentry_abc$_run_closure2$_closure7.doCall(D:\GoldWallet\node_modules\@sentry\react-native\sentry.gradle:48)`,
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-camera\android\build.gradle:59)`,
].join('\n');

const zeroWarningSummary = [
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Android Gradle audit log path: D:\\GoldWallet\\local-docs\\android-warning-audit.log',
  'Android Gradle audit timeout: 300000ms',
  'Android Gradle audit exit code: 0',
  'Android Gradle warning baseline guard exit code: 0',
  'Targeted Android Gradle warnings: 0',
  'Unexpected targeted Android Gradle warnings: 0',
].join('\n');

const badCountSummary = validSummary.replace('Targeted Android Gradle warnings: 2', 'Targeted Android Gradle warnings: 1');
const unexpectedSourceSummary = validSummary.replace(
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-camera\android\build.gradle:59)`,
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\new-native-lib\android\build.gradle:59)`,
);

const assertAccepted = (label, summary) => {
  const errors = getWarningSummarySourceErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getWarningSummarySourceErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Known warning baseline summary fixture', validSummary);
assertAccepted('Zero warning target summary fixture', zeroWarningSummary);
assertRejected('Mismatched warning count fixture', badCountSummary, 'Targeted Android Gradle warnings must be 2');
assertRejected('Unexpected warning source fixture', unexpectedSourceSummary, 'Unexpected targeted Android warning source');

console.log('Android warning audit summary guard checks are valid.');

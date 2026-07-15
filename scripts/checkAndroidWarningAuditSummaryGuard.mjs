import { getWarningSummarySourceErrors } from './androidValidationArtifactsGuard.mjs';

const validSummary = [
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Android Gradle audit log path: D:\\GoldWallet\\local-docs\\android-warning-audit.log',
  'Android Gradle audit timeout: 300000ms',
  'Android Gradle audit exit code: 0',
  'Android Gradle warning baseline guard exit code: 0',
  'Targeted Android Gradle warnings: 0',
  'Unexpected targeted Android Gradle warnings: 0',
].join('\n');

const badCountSummary = `${validSummary}\n- jcenter(): unexpected warning without matching count`;
const unexpectedSourceSummary = validSummary
  .replace('Targeted Android Gradle warnings: 0', 'Targeted Android Gradle warnings: 1')
  .replace('Unexpected targeted Android Gradle warnings: 0', 'Unexpected targeted Android Gradle warnings: 1')
  .concat('\n', String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\new-native-lib\android\build.gradle:59)`);

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

assertAccepted('Zero warning target summary fixture', validSummary);
assertRejected('Mismatched warning count fixture', badCountSummary, 'Targeted Android Gradle warnings must be 1');
assertRejected('Unexpected warning source fixture', unexpectedSourceSummary, 'Unexpected targeted Android warning source');

console.log('Android warning audit summary guard checks are valid.');

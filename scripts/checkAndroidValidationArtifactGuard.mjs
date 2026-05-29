import { getWarningSummarySourceErrors } from './androidValidationArtifactsGuard.mjs';

const validSummary = [
  'Targeted Android Gradle warnings: 1',
  'Unexpected targeted Android Gradle warnings: 0',
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-secure-key-store\android\build.gradle:46)`,
].join('\n');

const zeroWarningSummary = [
  'Targeted Android Gradle warnings: 0',
  'Unexpected targeted Android Gradle warnings: 0',
].join('\n');

const mismatchedCountSummary = [
  'Targeted Android Gradle warnings: 0',
  'Unexpected targeted Android Gradle warnings: 0',
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-secure-key-store\android\build.gradle:46)`,
].join('\n');

const unexpectedSourceSummary = [
  'Targeted Android Gradle warnings: 1',
  'Unexpected targeted Android Gradle warnings: 0',
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\some-new-library\android\build.gradle:59)`,
].join('\n');

const assertNoErrors = (label, summary) => {
  const errors = getWarningSummarySourceErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(error));
    process.exit(1);
  }
};

const assertErrors = (label, summary) => {
  const errors = getWarningSummarySourceErrors(summary);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertNoErrors('Known warning sources', validSummary);
assertNoErrors('Zero warning target state', zeroWarningSummary);
assertErrors('Mismatched warning count', mismatchedCountSummary);
assertErrors('Unexpected warning source', unexpectedSourceSummary);

console.log('Android validation artifact guard checks are valid.');

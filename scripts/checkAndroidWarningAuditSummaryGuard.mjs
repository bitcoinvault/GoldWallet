import { getWarningSummarySourceErrors } from './androidValidationArtifactsGuard.mjs';

const validSummary = [
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Android Gradle audit log path: D:\\GoldWallet\\local-docs\\android-warning-audit.log',
  'Android Gradle audit timeout: 300000ms',
  'Android Gradle audit exit code: 0',
  'Android Gradle warning baseline guard exit code: 0',
  'Targeted Android Gradle warnings: 10',
  'Unexpected targeted Android Gradle warnings: 0',
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\@react-native-community\masked-view\android\build.gradle:47)`,
  String.raw`- jcenter(): at build_abc$_run_closure1$_closure2.doCall(D:\GoldWallet\node_modules\@react-native-community\slider\android\build.gradle:4)`,
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\@react-native-community\slider\android\build.gradle:34)`,
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-camera\android\build.gradle:59)`,
  String.raw`- jcenter(): at build_abc$_run_closure1$_closure2.doCall(D:\GoldWallet\node_modules\@react-native-community\toolbar-android\android\build.gradle:5)`,
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-localize\android\build.gradle:45)`,
  String.raw`- jcenter(): at build_abc$_run_closure1$_closure2.doCall(D:\GoldWallet\node_modules\react-native-exit-app\android\build.gradle:3)`,
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-vector-icons\android\build.gradle:41)`,
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-device-info\android\build.gradle:46)`,
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-secure-key-store\android\build.gradle:46)`,
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

const badCountSummary = validSummary.replace('Targeted Android Gradle warnings: 10', 'Targeted Android Gradle warnings: 9');
const unexpectedSourceSummary = validSummary.replace(
  String.raw`- jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-secure-key-store\android\build.gradle:46)`,
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
assertRejected('Mismatched warning count fixture', badCountSummary, 'Targeted Android Gradle warnings must be 10');
assertRejected('Unexpected warning source fixture', unexpectedSourceSummary, 'Unexpected targeted Android warning source');

console.log('Android warning audit summary guard checks are valid.');

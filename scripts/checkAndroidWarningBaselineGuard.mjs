import { getUnexpectedAndroidWarningFindings } from './androidWarningBaselineGuard.mjs';

const expectedFindings = [
  String.raw`execResult: at sentry_abc$_run_closure2$_closure7.doCall(D:\GoldWallet\node_modules\@sentry\react-native\sentry.gradle:48)`,
  'execResult: at sentry_abc$_run_closure2$_closure7.doCall(/home/ci/GoldWallet/node_modules/@sentry/react-native/sentry.gradle:48)',
  String.raw`jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\react-native-camera\android\build.gradle:59)`,
  'jcenter(): at build_abc$_run_closure2.doCall(/home/ci/GoldWallet/node_modules/react-native-camera/android/build.gradle:59)',
];

const unexpectedFindings = [
  String.raw`jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\some-new-library\android\build.gradle:12)`,
  'buildToolsVersion: WARNING: The specified Android SDK Build Tools version (28.0.3) is ignored',
  'manifest namespace: source AndroidManifest.xml package attribute warning present',
];

const expectedRejected = getUnexpectedAndroidWarningFindings(expectedFindings);

if (expectedRejected.length > 0) {
  console.error('Known Android warning finding(s) were rejected by the baseline guard:');
  expectedRejected.forEach(finding => console.error(`- ${finding}`));
  process.exit(1);
}

const unexpectedAccepted = unexpectedFindings.filter(
  finding => getUnexpectedAndroidWarningFindings([finding]).length === 0,
);

if (unexpectedAccepted.length > 0) {
  console.error('Unexpected Android warning finding(s) were accepted by the baseline guard:');
  unexpectedAccepted.forEach(finding => console.error(`- ${finding}`));
  process.exit(1);
}

console.log('Android warning baseline guard patterns are valid.');

import { getUnexpectedAndroidWarningFindings } from './androidWarningBaselineGuard.mjs';

const unexpectedFindings = [
  String.raw`jcenter(): at build_abc$_run_closure2.doCall$original(D:\GoldWallet\node_modules\react-native-secure-key-store\android\build.gradle:46)`,
  String.raw`jcenter(): at build_abc$_run_closure2.doCall(D:\GoldWallet\node_modules\some-new-library\android\build.gradle:12)`,
  'buildToolsVersion: WARNING: The specified Android SDK Build Tools version (28.0.3) is ignored',
  'manifest namespace: source AndroidManifest.xml package attribute warning present',
];

const unexpectedAccepted = unexpectedFindings.filter(
  finding => getUnexpectedAndroidWarningFindings([finding]).length === 0,
);

if (unexpectedAccepted.length > 0) {
  console.error('Unexpected Android warning finding(s) were accepted by the baseline guard:');
  unexpectedAccepted.forEach(finding => console.error(`- ${finding}`));
  process.exit(1);
}

console.log('Android warning baseline guard accepts no targeted warning findings.');

import { requiredSentryPropertiesFiles } from './auditSentryReleasePrerequisites.mjs';
import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';

const sentryCliPackageInstanceFixture = [
  '@sentry/cli installed package instances: 3',
  '- node_modules/@sentry/cli/package.json: 3.5.1 (direct)',
  '- node_modules/@sentry/expo-upload-sourcemaps/node_modules/@sentry/cli/package.json: 3.5.0 (nested)',
  '- node_modules/@sentry/react-native/node_modules/@sentry/cli/package.json: 3.5.0 (nested)',
  '@sentry/cli installed package versions: 3.5.1, 3.5.0',
  '@sentry/cli nested package versions: 3.5.0',
  '@sentry/cli direct package installed: yes',
  'Sentry CLI release build path uses direct package: yes',
];

const notReadySummary = [
  'Sentry release prerequisite audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release source-map prerequisites: not ready',
  '@sentry/react-native version: 8.15.1',
  '@sentry/react-native latest: 8.15.1',
  '@sentry/react-native current: yes',
  '@sentry/cli package version: 3.5.1',
  '@sentry/cli latest: 3.5.1',
  '@sentry/cli current: yes',
  ...sentryCliPackageInstanceFixture,
  'Sentry CLI binary present: yes',
  'Sentry CLI version output: sentry-cli 3.5.1',
  'Sentry CLI executable: yes',
  'Sentry release integration wired: yes',
  'Sentry release integration errors: 0',
  'sentry.properties files present: no',
  `Missing files: ${requiredSentryPropertiesFiles.length}`,
  ...requiredSentryPropertiesFiles.map(relativePath => `- ${relativePath}`),
  'Invalid files: 0',
  `Properties file readiness entries: ${requiredSentryPropertiesFiles.length}`,
  ...requiredSentryPropertiesFiles.map(relativePath => `- ${relativePath}: missing`),
  'Ready properties files: 0',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release summary errors: 0',
  'Android release APK manifest valid: yes',
  'Android release APK manifest errors: 0',
  'Android release smoke summary present: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke summary errors: 0',
  'Sentry release smoke evidence ready: yes',
  'Android release no-network smoke summary present: no',
  'Android release no-network smoke summary valid: no',
  'Android release no-network smoke summary errors: 1',
  '- Android release no-network smoke summary artifact is missing',
  'Sentry release no-network blocker evidence ready: no',
  'Android release create-wallet smoke summary present: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke summary errors: 0',
  'Sentry release create-wallet evidence ready: yes',
  'iOS release static readiness valid: yes',
  'iOS macOS archive validation ready: no',
  'iOS Sentry bundle/source-map phases: 4',
  'iOS Sentry dSYM upload phases: 3',
  'iOS Podfile.lock refresh required: yes',
  'iOS Podfile.lock drift issues: 1',
  '- ios/Podfile.lock has RNSentry 3.1.0; package.json has @sentry/react-native 8.15.1',
  'iOS macOS validation prerequisites ready: no',
  'iOS macOS validation blockers: 2',
  '- Current platform is win32; iOS archive/simulator validation requires macOS with Xcode.',
  '- ios/Podfile.lock has 1 active drift issues; run pod install on macOS before archive validation.',
  'Sentry release upload validation: not claimed',
  'create-sentry-properties.sh present: yes',
  'create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: yes',
  'create-sentry-properties.sh rejects missing SENTRY_AUTH_TOKEN: yes',
  'create-sentry-properties.sh writes root properties: yes',
  'create-sentry-properties.sh writes Android properties: yes',
  'create-sentry-properties.sh writes iOS properties: yes',
  'create-sentry-properties.sh static defaults valid: yes',
  'create-sentry-properties.sh supports SENTRY_ORG override: yes',
  'create-sentry-properties.sh supports SENTRY_PROJECT override: yes',
  'createSentryProperties.mjs present: yes',
  'createSentryProperties.mjs requires SENTRY_AUTH_TOKEN: yes',
  'createSentryProperties.mjs rejects missing SENTRY_AUTH_TOKEN: yes',
  'createSentryProperties.mjs writes root properties: yes',
  'createSentryProperties.mjs writes Android properties: yes',
  'createSentryProperties.mjs writes iOS properties: yes',
  'createSentryProperties.mjs static defaults valid: yes',
  'createSentryProperties.mjs supports SENTRY_ORG override: yes',
  'createSentryProperties.mjs supports SENTRY_PROJECT override: yes',
  'createSentryProperties.mjs supports --root override: yes',
  'sentry:release:create-properties script present: yes',
  'SENTRY_AUTH_TOKEN available in current shell: no',
  'Required action: generate sentry.properties, android/sentry.properties, and ios/sentry.properties with SENTRY_AUTH_TOKEN, refresh ios/Podfile.lock on macOS with Xcode/CocoaPods, then run iOS archive/simulator validation before claiming Sentry release validation.',
  '',
].join('\n');

const readySummary = [
  'Sentry release prerequisite audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release source-map prerequisites: ready',
  '@sentry/react-native version: 8.15.1',
  '@sentry/react-native latest: 8.15.1',
  '@sentry/react-native current: yes',
  '@sentry/cli package version: 3.5.1',
  '@sentry/cli latest: 3.5.1',
  '@sentry/cli current: yes',
  ...sentryCliPackageInstanceFixture,
  'Sentry CLI binary present: yes',
  'Sentry CLI version output: sentry-cli 3.5.1',
  'Sentry CLI executable: yes',
  'Sentry release integration wired: yes',
  'Sentry release integration errors: 0',
  'sentry.properties files present: yes',
  'Missing files: 0',
  'Invalid files: 0',
  `Properties file readiness entries: ${requiredSentryPropertiesFiles.length}`,
  ...requiredSentryPropertiesFiles.map(relativePath => `- ${relativePath}: ready`),
  `Ready properties files: ${requiredSentryPropertiesFiles.length}`,
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release summary errors: 0',
  'Android release APK manifest valid: yes',
  'Android release APK manifest errors: 0',
  'Android release smoke summary present: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke summary errors: 0',
  'Sentry release smoke evidence ready: yes',
  'Android release no-network smoke summary present: no',
  'Android release no-network smoke summary valid: no',
  'Android release no-network smoke summary errors: 1',
  '- Android release no-network smoke summary artifact is missing',
  'Sentry release no-network blocker evidence ready: no',
  'Android release create-wallet smoke summary present: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke summary errors: 0',
  'Sentry release create-wallet evidence ready: yes',
  'iOS release static readiness valid: yes',
  'iOS macOS archive validation ready: yes',
  'iOS Sentry bundle/source-map phases: 4',
  'iOS Sentry dSYM upload phases: 3',
  'iOS Podfile.lock refresh required: no',
  'iOS Podfile.lock drift issues: 0',
  'iOS macOS validation prerequisites ready: yes',
  'iOS macOS validation blockers: 0',
  'Sentry release upload validation: not claimed',
  'create-sentry-properties.sh present: yes',
  'create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: yes',
  'create-sentry-properties.sh rejects missing SENTRY_AUTH_TOKEN: yes',
  'create-sentry-properties.sh writes root properties: yes',
  'create-sentry-properties.sh writes Android properties: yes',
  'create-sentry-properties.sh writes iOS properties: yes',
  'create-sentry-properties.sh static defaults valid: yes',
  'create-sentry-properties.sh supports SENTRY_ORG override: yes',
  'create-sentry-properties.sh supports SENTRY_PROJECT override: yes',
  'createSentryProperties.mjs present: yes',
  'createSentryProperties.mjs requires SENTRY_AUTH_TOKEN: yes',
  'createSentryProperties.mjs rejects missing SENTRY_AUTH_TOKEN: yes',
  'createSentryProperties.mjs writes root properties: yes',
  'createSentryProperties.mjs writes Android properties: yes',
  'createSentryProperties.mjs writes iOS properties: yes',
  'createSentryProperties.mjs static defaults valid: yes',
  'createSentryProperties.mjs supports SENTRY_ORG override: yes',
  'createSentryProperties.mjs supports SENTRY_PROJECT override: yes',
  'createSentryProperties.mjs supports --root override: yes',
  'sentry:release:create-properties script present: yes',
  'SENTRY_AUTH_TOKEN available in current shell: yes',
  'Required action: none; release source-map prerequisites are present locally.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getSentryReleasePrereqSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getSentryReleasePrereqSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid not-ready Sentry release prerequisite summary fixture', notReadySummary);
assertAccepted('Valid ready Sentry release prerequisite summary fixture', readySummary);
assertRejected('Missing header fixture', notReadySummary.replace('Sentry release prerequisite audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', notReadySummary.replace('Generated at: 2026-05-28T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected(
  'Missing Sentry SDK version fixture',
  notReadySummary.replace('@sentry/react-native version: 8.15.1', '@sentry/react-native version: missing'),
  '@sentry/react-native version must be present',
);
assertRejected(
  'Missing Sentry SDK latest fixture',
  notReadySummary.replace('@sentry/react-native latest: 8.15.1', '@sentry/react-native latest: missing'),
  '@sentry/react-native latest must be present',
);
assertRejected(
  'Stale Sentry SDK current fixture',
  notReadySummary.replace('@sentry/react-native latest: 8.15.1', '@sentry/react-native latest: 9.0.0'),
  '@sentry/react-native current cannot be yes',
);
assertRejected(
  'Missing Sentry CLI package version fixture',
  notReadySummary.replace('@sentry/cli package version: 3.5.1', '@sentry/cli package version: missing'),
  '@sentry/cli package version must be present',
);
assertRejected(
  'Missing Sentry CLI latest fixture',
  notReadySummary.replace('@sentry/cli latest: 3.5.1', '@sentry/cli latest: missing'),
  '@sentry/cli latest must be present',
);
assertRejected(
  'Stale Sentry CLI current fixture',
  notReadySummary.replace('@sentry/cli latest: 3.5.1', '@sentry/cli latest: 4.0.0'),
  '@sentry/cli current cannot be yes',
);
assertRejected(
  'Bad Sentry CLI installation count fixture',
  notReadySummary.replace('@sentry/cli installed package instances: 3', '@sentry/cli installed package instances: 2'),
  '@sentry/cli installed package instances count',
);
assertRejected(
  'Missing Sentry CLI direct install fixture',
  notReadySummary.replace('@sentry/cli direct package installed: yes', '@sentry/cli direct package installed: no'),
  '@sentry/cli direct package installed must be yes',
);
assertRejected(
  'Sentry CLI versions missing direct package fixture',
  notReadySummary.replace('@sentry/cli installed package versions: 3.5.1, 3.5.0', '@sentry/cli installed package versions: 3.5.0'),
  '@sentry/cli installed package versions must include',
);
assertRejected(
  'Sentry release path using nested CLI fixture',
  readySummary.replace('Sentry CLI release build path uses direct package: yes', 'Sentry CLI release build path uses direct package: no'),
  'direct Sentry CLI release build path',
);
assertRejected(
  'Mismatched Sentry CLI output fixture',
  notReadySummary.replace('Sentry CLI version output: sentry-cli 3.5.1', 'Sentry CLI version output: sentry-cli 0.0.0'),
  'Sentry CLI version output must include',
);
assertRejected(
  'Ready summary without executable Sentry CLI fixture',
  readySummary.replace('Sentry CLI executable: yes', 'Sentry CLI executable: no'),
  'executable Sentry CLI',
);
assertRejected(
  'Bad release integration count fixture',
  notReadySummary.replace('Sentry release integration errors: 0', 'Sentry release integration errors: 1'),
  'Sentry release integration errors count',
);
assertRejected('Bad missing count fixture', notReadySummary.replace(`Missing files: ${requiredSentryPropertiesFiles.length}`, 'Missing files: 0'), 'Missing files count');
assertRejected(
  'Bad readiness entries count fixture',
  notReadySummary.replace(`Properties file readiness entries: ${requiredSentryPropertiesFiles.length}`, 'Properties file readiness entries: 0'),
  'Properties file readiness entries count',
);
assertRejected(
  'Bad ready properties count fixture',
  readySummary.replace(`Ready properties files: ${requiredSentryPropertiesFiles.length}`, 'Ready properties files: 0'),
  'Ready properties files count',
);
assertRejected(
  'Broken create script target fixture',
  notReadySummary.replace('create-sentry-properties.sh writes Android properties: yes', 'create-sentry-properties.sh writes Android properties: no'),
  'Present create-sentry-properties.sh',
);
assertRejected(
  'Missing create script token preflight fixture',
  notReadySummary.replace(
    'create-sentry-properties.sh rejects missing SENTRY_AUTH_TOKEN: yes',
    'create-sentry-properties.sh rejects missing SENTRY_AUTH_TOKEN: no',
  ),
  'Present create-sentry-properties.sh',
);
assertRejected(
  'Missing Sentry org override fixture',
  notReadySummary.replace(
    'create-sentry-properties.sh supports SENTRY_ORG override: yes',
    'create-sentry-properties.sh supports SENTRY_ORG override: no',
  ),
  'SENTRY_ORG/SENTRY_PROJECT overrides',
);
assertRejected(
  'Missing Sentry project override fixture',
  notReadySummary.replace(
    'create-sentry-properties.sh supports SENTRY_PROJECT override: yes',
    'create-sentry-properties.sh supports SENTRY_PROJECT override: no',
  ),
  'SENTRY_ORG/SENTRY_PROJECT overrides',
);
assertRejected(
  'Missing Node generator root override fixture',
  notReadySummary.replace('createSentryProperties.mjs supports --root override: yes', 'createSentryProperties.mjs supports --root override: no'),
  'Present createSentryProperties.mjs',
);
assertRejected(
  'Missing Node generator package script fixture',
  notReadySummary.replace('sentry:release:create-properties script present: yes', 'sentry:release:create-properties script present: no'),
  'Present createSentryProperties.mjs',
);
assertRejected(
  'Claimed Sentry upload fixture',
  notReadySummary.replace('Sentry release upload validation: not claimed', 'Sentry release upload validation: claimed'),
  'not claimed',
);
assertRejected(
  'Missing release variant fixture',
  notReadySummary.replace('Android release summary variants: dev, stage, prod, beta', 'Android release summary variants: dev, stage, prod'),
  'beta release evidence',
);
assertRejected(
  'Stale Android release inputs fixture',
  notReadySummary.replace('Android release summary current inputs covered: yes', 'Android release summary current inputs covered: no'),
  'current release inputs',
);
assertRejected(
  'Ready summary with stale Android release inputs fixture',
  readySummary.replace('Android release summary current inputs covered: yes', 'Android release summary current inputs covered: no'),
  'current Android release evidence',
);
assertRejected(
  'Invalid Android release APK manifest fixture',
  notReadySummary.replace(
    'Android release APK manifest valid: yes\nAndroid release APK manifest errors: 0',
    'Android release APK manifest valid: yes\nAndroid release APK manifest errors: 1\n- Variant stage targetSdkVersion mismatch: expected 36, received 35',
  ),
  '0 manifest errors',
);
assertRejected(
  'Missing Android release smoke fixture',
  notReadySummary.replace('Android release smoke summary present: yes', 'Android release smoke summary present: no'),
  'Android release smoke summary must be present',
);
assertRejected(
  'Invalid Android release smoke fixture',
  notReadySummary.replace('Android release smoke summary valid: yes', 'Android release smoke summary valid: no'),
  'valid full Android release smoke evidence or valid controlled no-network blocker evidence',
);
assertRejected(
  'Missing Sentry release smoke evidence fixture',
  readySummary.replace('Sentry release smoke evidence ready: yes', 'Sentry release smoke evidence ready: no'),
  'release smoke evidence',
);
assertRejected(
  'Missing Android release create-wallet smoke fixture',
  notReadySummary.replace('Android release create-wallet smoke summary present: yes', 'Android release create-wallet smoke summary present: no'),
  'Android release create-wallet smoke summary must be present',
);
assertRejected(
  'Invalid Android release create-wallet smoke fixture',
  notReadySummary.replace('Android release create-wallet smoke summary valid: yes', 'Android release create-wallet smoke summary valid: no'),
  'valid Android release create-wallet smoke summary',
);
assertRejected(
  'Missing Sentry release create-wallet evidence fixture',
  readySummary.replace('Sentry release create-wallet evidence ready: yes', 'Sentry release create-wallet evidence ready: no'),
  'release create-wallet evidence',
);
assertRejected(
  'Ready summary with stale iOS Podfile fixture',
  readySummary
    .replace('iOS Podfile.lock refresh required: no', 'iOS Podfile.lock refresh required: yes')
    .replace('iOS Podfile.lock drift issues: 0', 'iOS Podfile.lock drift issues: 1\n- ios/Podfile.lock has RNSentry 3.1.0; package.json has @sentry/react-native 8.15.1'),
  'ready iOS archive/macOS validation prerequisites',
);
assertRejected(
  'Bad iOS Podfile drift count fixture',
  notReadySummary.replace('iOS Podfile.lock drift issues: 1', 'iOS Podfile.lock drift issues: 0'),
  'iOS Podfile.lock drift issues count',
);
assertRejected(
  'Ready summary without iOS archive fixture',
  readySummary.replace('iOS macOS archive validation ready: yes', 'iOS macOS archive validation ready: no'),
  'ready iOS archive/macOS validation prerequisites',
);
assertRejected(
  'Ready summary without iOS macOS prereqs fixture',
  readySummary.replace('iOS macOS validation prerequisites ready: yes', 'iOS macOS validation prerequisites ready: no'),
  'ready iOS archive/macOS validation prerequisites',
);
assertRejected(
  'Bad iOS macOS blocker count fixture',
  notReadySummary.replace('iOS macOS validation blockers: 2', 'iOS macOS validation blockers: 0'),
  'iOS macOS validation blockers count',
);
assertRejected(
  'Missing required action fixture',
  notReadySummary.replace(
    'Required action: generate sentry.properties, android/sentry.properties, and ios/sentry.properties with SENTRY_AUTH_TOKEN, refresh ios/Podfile.lock on macOS with Xcode/CocoaPods, then run iOS archive/simulator validation before claiming Sentry release validation.',
    'Required action: generate sentry.properties before claiming Sentry release validation.',
  ),
  'SENTRY_AUTH_TOKEN, all sentry.properties paths, ios/Podfile.lock, macOS, and Xcode',
);
assertRejected(
  'Secret assignment fixture',
  notReadySummary.replace(
    'SENTRY_AUTH_TOKEN available in current shell: no',
    'SENTRY_AUTH_TOKEN available in current shell: no\nSENTRY_AUTH_TOKEN=secret',
  ),
  'must not print Sentry token assignments',
);

console.log('Sentry release prerequisite summary guard checks are valid.');

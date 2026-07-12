import { getSentryReleaseCredentialPlanErrors } from './sentryReleaseCredentialPlanGuard.mjs';

const validPlan = [
  'Sentry release credential plan',
  'Generated at: 2026-06-12T00:00:00.000Z',
  '@sentry/react-native version: 8.18.0',
  '@sentry/react-native latest: 8.18.0',
  '@sentry/react-native current: yes',
  '@sentry/cli package version: 3.6.0',
  '@sentry/cli latest: 3.6.0',
  '@sentry/cli current: yes',
  'Release source-map prerequisites: not ready',
  'SENTRY_AUTH_TOKEN available in current shell: no',
  'Properties file readiness:',
  '- sentry.properties: missing',
  '- android/sentry.properties: missing',
  '- ios/sentry.properties: missing',
  'Missing properties files: 3',
  '- missing file: sentry.properties',
  '- missing file: android/sentry.properties',
  '- missing file: ios/sentry.properties',
  'Invalid properties files: 0',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary current inputs covered: no',
  'Android release summary errors: 1',
  '- Release input fingerprint does not match current release inputs; rerun android:dev:release:validate-local',
  'Android release APK manifest valid: yes',
  'Android release APK manifest errors: 0',
  'Android release evidence ready: no',
  'Android release smoke summary present: yes',
  'Android release smoke summary valid: no',
  'Android release smoke summary errors: 1',
  '- Expected line not found: Android smoke outcome: passed',
  'Android release smoke evidence ready: no',
  'Android release no-network smoke summary present: yes',
  'Android release no-network smoke summary valid: yes',
  'Android release no-network smoke summary errors: 0',
  'Sentry release no-network blocker evidence ready: yes',
  'Android release network blocker summary present: yes',
  'Android release network blocker summary valid: yes',
  'Android release network blocker outcome: blocked-by-electrum-certificate-expired',
  'Android release network blocker summary errors: 0',
  'Sentry release network blocker classified: yes',
  'Android release create-wallet smoke summary present: yes',
  'Android release create-wallet smoke summary valid: no',
  'Android release create-wallet smoke summary errors: 1',
  '- Expected line not found: Android create-wallet smoke outcome: passed',
  'Sentry release create-wallet evidence ready: no',
  'iOS release static readiness valid: yes',
  'iOS macOS archive validation ready: no',
  'iOS Sentry bundle/source-map phases: 4',
  'iOS Sentry dSYM upload phases: 3',
  'iOS Podfile.lock refresh required: yes',
  'iOS Podfile.lock drift issues: 1',
  '- ios/Podfile.lock has RNSentry 3.1.0; package.json has @sentry/react-native 8.18.0',
  'iOS macOS validation prerequisites ready: no',
  'iOS macOS validation blockers: 1',
  '- Current platform is win32; iOS archive/simulator validation requires macOS with Xcode.',
  'Sentry release upload validation: not claimed',
  'Credential handoff steps:',
  '1. Set SENTRY_AUTH_TOKEN in the local shell or CI secret store.',
  '2. Optional: set SENTRY_ORG and SENTRY_PROJECT only when the target differs from cloudbest/goldwallet.',
  '3. Run corepack yarn sentry:release:create-properties.',
  '4. Run corepack yarn sentry:release:prereq-audit.',
  '5. Run corepack yarn sentry:release:prereq-check-summary.',
  '6. Run corepack yarn sentry:release:validation:handoff after Android release and smoke evidence are current.',
  'Review-safe evidence: file paths, env variable names, and command names only',
  'Secret values printed: no',
  'Required action: provide SENTRY_AUTH_TOKEN, generate local-only sentry.properties, android/sentry.properties, and ios/sentry.properties, refresh current Android release/full-smoke/create-wallet evidence, refresh ios/Podfile.lock on macOS with Xcode/CocoaPods, and run iOS archive/simulator validation before claiming source-map upload validation.',
  '',
].join('\n');

const assertAccepted = (label, plan) => {
  const errors = getSentryReleaseCredentialPlanErrors(plan);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, plan, expectedError) => {
  const errors = getSentryReleaseCredentialPlanErrors(plan);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Sentry release credential plan fixture', validPlan);
assertRejected('Missing header fixture', validPlan.replace('Sentry release credential plan', 'Bad plan'), 'header');
assertRejected('Bad timestamp fixture', validPlan.replace('Generated at: 2026-06-12T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Token assignment fixture', validPlan.replace('Secret values printed: no', 'SENTRY_AUTH_TOKEN=secret\nSecret values printed: no'), 'secret assignments');
assertRejected('Auth token fixture', validPlan.replace('Secret values printed: no', 'auth.token=secret\nSecret values printed: no'), 'secret assignments');
assertRejected('DSN assignment fixture', validPlan.replace('Secret values printed: no', 'SENTRY_DSN=https://example\nSecret values printed: no'), 'secret assignments');
assertRejected('Missing no-secret line fixture', validPlan.replace('Secret values printed: no', 'Secret values printed: maybe'), 'secret values');
assertRejected('Missing upload claim fixture', validPlan.replace('Sentry release upload validation: not claimed', 'Sentry release upload validation: ready'), 'unclaimed');
assertRejected('Bad missing file count fixture', validPlan.replace('Missing properties files: 3', 'Missing properties files: 2'), 'missing files');
assertRejected('Missing command fixture', validPlan.replace('3. Run corepack yarn sentry:release:create-properties.', '3. Generate files manually.'), 'sentry:release:create-properties');
assertRejected('Missing latest fixture', validPlan.replace('@sentry/react-native latest: 8.18.0\n', ''), '@sentry/react-native latest');
assertRejected('Bad Android summary count fixture', validPlan.replace('Android release summary errors: 1', 'Android release summary errors: 0'), 'Android release summary errors');
assertRejected(
  'Missing Electrum blocker classification fixture',
  validPlan.replace('Android release network blocker outcome: blocked-by-electrum-certificate-expired', 'Android release network blocker outcome: no-network'),
  'no-network blocker',
);
assertRejected('Missing iOS blocker fixture', validPlan.replace('iOS macOS validation blockers: 1', 'iOS macOS validation blockers: 0'), 'iOS macOS validation');
assertRejected(
  'Weak required action fixture',
  validPlan.replace('refresh ios/Podfile.lock on macOS with Xcode/CocoaPods, and run iOS archive/simulator validation', 'rerun validation later'),
  'required action',
);

console.log('Sentry release credential plan guard checks are valid.');

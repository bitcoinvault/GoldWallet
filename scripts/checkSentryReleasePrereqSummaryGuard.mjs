import { requiredSentryPropertiesFiles } from './auditSentryReleasePrerequisites.mjs';
import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';

const notReadySummary = [
  'Sentry release prerequisite audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release source-map prerequisites: not ready',
  '@sentry/react-native version: 8.13.0',
  '@sentry/react-native latest: 8.13.0',
  '@sentry/react-native current: yes',
  '@sentry/cli package version: 3.5.0',
  '@sentry/cli latest: 3.5.0',
  '@sentry/cli current: yes',
  'Sentry CLI binary present: yes',
  'Sentry CLI version output: sentry-cli 3.5.0',
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
  'Android release summary errors: 0',
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
  'SENTRY_AUTH_TOKEN available in current shell: no',
  'Required action: generate sentry.properties, android/sentry.properties, and ios/sentry.properties with SENTRY_AUTH_TOKEN before claiming Sentry release validation.',
  '',
].join('\n');

const readySummary = [
  'Sentry release prerequisite audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release source-map prerequisites: ready',
  '@sentry/react-native version: 8.13.0',
  '@sentry/react-native latest: 8.13.0',
  '@sentry/react-native current: yes',
  '@sentry/cli package version: 3.5.0',
  '@sentry/cli latest: 3.5.0',
  '@sentry/cli current: yes',
  'Sentry CLI binary present: yes',
  'Sentry CLI version output: sentry-cli 3.5.0',
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
  'Android release summary errors: 0',
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
  notReadySummary.replace('@sentry/react-native version: 8.13.0', '@sentry/react-native version: missing'),
  '@sentry/react-native version must be present',
);
assertRejected(
  'Missing Sentry SDK latest fixture',
  notReadySummary.replace('@sentry/react-native latest: 8.13.0', '@sentry/react-native latest: missing'),
  '@sentry/react-native latest must be present',
);
assertRejected(
  'Stale Sentry SDK current fixture',
  notReadySummary.replace('@sentry/react-native latest: 8.13.0', '@sentry/react-native latest: 9.0.0'),
  '@sentry/react-native current cannot be yes',
);
assertRejected(
  'Missing Sentry CLI package version fixture',
  notReadySummary.replace('@sentry/cli package version: 3.5.0', '@sentry/cli package version: missing'),
  '@sentry/cli package version must be present',
);
assertRejected(
  'Missing Sentry CLI latest fixture',
  notReadySummary.replace('@sentry/cli latest: 3.5.0', '@sentry/cli latest: missing'),
  '@sentry/cli latest must be present',
);
assertRejected(
  'Stale Sentry CLI current fixture',
  notReadySummary.replace('@sentry/cli latest: 3.5.0', '@sentry/cli latest: 4.0.0'),
  '@sentry/cli current cannot be yes',
);
assertRejected(
  'Mismatched Sentry CLI output fixture',
  notReadySummary.replace('Sentry CLI version output: sentry-cli 3.5.0', 'Sentry CLI version output: sentry-cli 0.0.0'),
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
  'Missing required action fixture',
  notReadySummary.replace(
    'Required action: generate sentry.properties, android/sentry.properties, and ios/sentry.properties with SENTRY_AUTH_TOKEN before claiming Sentry release validation.',
    'Required action: generate sentry.properties before claiming Sentry release validation.',
  ),
  'SENTRY_AUTH_TOKEN and all sentry.properties paths',
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

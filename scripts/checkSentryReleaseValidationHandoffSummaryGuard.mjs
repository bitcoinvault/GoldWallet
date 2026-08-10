import { getSentryReleaseValidationHandoffSummaryErrors } from './sentryReleaseValidationHandoffSummaryGuard.mjs';

const validBlockedSummary = [
  'Sentry release validation handoff summary',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'Android release evidence variant: dev',
  'Android release evidence refresh skipped: yes',
  'Android release build evidence ready: yes',
  'Android warning summary valid: yes',
  'RN bundle task compatibility summary valid: yes',
  'Release prerequisite summary valid: yes',
  'Credential plan valid: yes',
  'Release source-map prerequisites: not ready',
  'Sentry packages current: yes',
  'SENTRY_AUTH_TOKEN available: no',
  'Sentry properties files ready: no',
  'Sentry release upload validation: not claimed',
  'Sentry release smoke evidence ready: no',
  'Sentry release no-network blocker evidence ready: yes',
  'Sentry release network blocker classified: yes',
  'Sentry release create-wallet evidence ready: no',
  'Sentry release import-wallet evidence ready: no',
  'Controlled release blocker outcome: blocked-by-electrum-certificate-expired',
  'Sentry release runtime proof state: blocked-by-electrum-certificate-expired',
  'iOS macOS validation prerequisites ready: no',
  'iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming Sentry release delivery.',
  'Handoff outcome: blocked',
  'Handoff blocker type: missing-sentry-credentials',
  'Readiness errors: 4',
  '- SENTRY_AUTH_TOKEN is not available in the current shell or CI secret store.',
  '- Sentry properties files are not ready.',
  '- Full Android release runtime proof is blocked by the controlled dev/testnet Electrum certificate issue.',
  '- iOS archive/simulator validation is not ready on this Windows host.',
  'Secret values printed: no',
  'Required action: provide SENTRY_AUTH_TOKEN, generate local-only sentry.properties files, renew the dev/testnet Electrum TLS certificate, refresh full Android release smoke/create-wallet/import-wallet evidence, refresh iOS pods on macOS/Xcode, and do not claim Sentry release upload validation until credentialed release validation passes.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getSentryReleaseValidationHandoffSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getSentryReleaseValidationHandoffSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid blocked Sentry release validation handoff fixture', validBlockedSummary);
assertAccepted(
  'Valid ready Sentry release validation handoff fixture',
  validBlockedSummary
    .replace('Android release evidence variant: dev', 'Android release evidence variant: prod')
    .replace('Android release evidence refresh skipped: yes', 'Android release evidence refresh skipped: no')
    .replace('Release source-map prerequisites: not ready', 'Release source-map prerequisites: ready')
    .replace('SENTRY_AUTH_TOKEN available: no', 'SENTRY_AUTH_TOKEN available: yes')
    .replace('Sentry properties files ready: no', 'Sentry properties files ready: yes')
    .replace('Sentry release smoke evidence ready: no', 'Sentry release smoke evidence ready: yes')
    .replace('Sentry release create-wallet evidence ready: no', 'Sentry release create-wallet evidence ready: yes')
    .replace('Sentry release import-wallet evidence ready: no', 'Sentry release import-wallet evidence ready: yes')
    .replace(
      'Sentry release no-network blocker evidence ready: yes',
      'Sentry release no-network blocker evidence ready: no',
    )
    .replace('Sentry release network blocker classified: yes', 'Sentry release network blocker classified: no')
    .replace(
      'Controlled release blocker outcome: blocked-by-electrum-certificate-expired',
      'Controlled release blocker outcome: not-applicable',
    )
    .replace(
      'Sentry release runtime proof state: blocked-by-electrum-certificate-expired',
      'Sentry release runtime proof state: ready',
    )
    .replace('iOS macOS validation prerequisites ready: no', 'iOS macOS validation prerequisites ready: yes')
    .replace('Handoff outcome: blocked', 'Handoff outcome: ready-for-credentialed-upload-test')
    .replace('Handoff blocker type: missing-sentry-credentials', 'Handoff blocker type: none')
    .replace(
      [
        'Readiness errors: 4',
        '- SENTRY_AUTH_TOKEN is not available in the current shell or CI secret store.',
        '- Sentry properties files are not ready.',
        '- Full Android release runtime proof is blocked by the controlled dev/testnet Electrum certificate issue.',
        '- iOS archive/simulator validation is not ready on this Windows host.',
      ].join('\n'),
      'Readiness errors: 0',
    )
    .replace(
      'provide SENTRY_AUTH_TOKEN, generate local-only sentry.properties files, renew the dev/testnet Electrum TLS certificate, refresh full Android release smoke/create-wallet/import-wallet evidence, refresh iOS pods on macOS/Xcode, and do not claim Sentry release upload validation until credentialed release validation passes.',
      'run credentialed Android and iOS source-map/dSYM release validation and do not claim Sentry release upload validation until the upload proof passes.',
    ),
);
assertRejected(
  'Ready credentials with stale credential action fixture',
  validBlockedSummary
    .replace('SENTRY_AUTH_TOKEN available: no', 'SENTRY_AUTH_TOKEN available: yes')
    .replace('Sentry properties files ready: no', 'Sentry properties files ready: yes'),
  'must not request Sentry credentials',
);
assertRejected(
  'Missing header fixture',
  validBlockedSummary.replace('Sentry release validation handoff summary', 'Bad header'),
  'summary header',
);
assertRejected(
  'Bad timestamp fixture',
  validBlockedSummary.replace('Generated at: 2026-06-11T00:00:00.000Z', 'Generated at: now'),
  'ISO timestamp',
);
assertRejected(
  'Non-dev Electrum blocker fixture',
  validBlockedSummary.replace('Android release evidence variant: dev', 'Android release evidence variant: prod'),
  'Non-dev Sentry handoff',
);
assertRejected(
  'Claimed upload fixture',
  validBlockedSummary.replace(
    'Sentry release upload validation: not claimed',
    'Sentry release upload validation: passed',
  ),
  'not claimed',
);
assertRejected(
  'Secret assignment fixture',
  validBlockedSummary.replace('Secret values printed: no', 'SENTRY_AUTH_TOKEN=abc\nSecret values printed: no'),
  'Sentry token assignments',
);
assertRejected(
  'Missing iOS blocker fixture',
  validBlockedSummary.replace(
    'iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming Sentry release delivery.',
    'iOS runtime validation: passed',
  ),
  'iOS runtime validation',
);
assertRejected(
  'Blocked without blocker fixture',
  validBlockedSummary.replace('Handoff blocker type: missing-sentry-credentials', 'Handoff blocker type: none'),
  'Blocked Sentry release handoff',
);
assertRejected(
  'Stale Android release build evidence without action fixture',
  validBlockedSummary.replace('Android release build evidence ready: yes', 'Android release build evidence ready: no'),
  'refresh stale Android release build evidence',
);
assertRejected(
  'Runtime-ready stale Android release evidence fixture',
  validBlockedSummary
    .replace('Android release build evidence ready: yes', 'Android release build evidence ready: no')
    .replace(
      'Controlled release blocker outcome: blocked-by-electrum-certificate-expired',
      'Controlled release blocker outcome: not-applicable',
    )
    .replace(
      'Sentry release runtime proof state: blocked-by-electrum-certificate-expired',
      'Sentry release runtime proof state: ready',
    ),
  'Runtime-ready Sentry handoff requires current Android release build evidence',
);
assertRejected(
  'Bad readiness count fixture',
  validBlockedSummary.replace('Readiness errors: 4', 'Readiness errors: 3'),
  'count is 3',
);
assertRejected(
  'Electrum blocker hidden fixture',
  validBlockedSummary.replace(
    'Controlled release blocker outcome: blocked-by-electrum-certificate-expired',
    'Controlled release blocker outcome: not-applicable',
  ),
  'Controlled Electrum blocker',
);

console.log('Sentry release validation handoff summary guard checks are valid.');

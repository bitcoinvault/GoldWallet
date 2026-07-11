import { getCodePushMigrationReadinessSummaryErrors } from './codePushMigrationReadinessSummaryGuard.mjs';

const validSummary = [
  'CodePush migration readiness audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'CodePush package current: yes',
  'CodePush removed: no',
  'CodePush package latest version: 9.0.1',
  'CodePush package latest published at: 2024-12-19T14:31:05.513Z',
  'CodePush npm repository: git+https://github.com/microsoft/react-native-code-push.git',
  'CodePush upstream repository: https://github.com/microsoft/react-native-code-push',
  'App Center CodePush retirement date: 2025-03-31',
  'CodePush upstream archived: yes',
  'CodePush upstream archived date: 2025-05-20',
  'CodePush upstream New Architecture support: no',
  'CodePush upstream New Architecture unsupported RN range: >=0.76',
  'Android New Architecture enabled: yes',
  'CodePush runtime gated off by default: yes',
  'CodePush update validation: not claimed',
  'CodePush migration required: yes',
  'Current posture: temporary legacy compatibility',
  'Long-term options: remove or replace',
  'Decision document present: yes',
  'Decision document covers removal: yes',
  'Decision document covers replacement: yes',
  'Decision document rejects blind package upgrade: yes',
  'Release path summary valid: yes',
  'Release path summary errors: 0',
  'CodePush release build evidence ready: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke summary errors: 0',
  'CodePush release smoke evidence ready: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke summary errors: 0',
  'CodePush release create-wallet evidence ready: yes',
  'Controlled release blocker summary present: no',
  'Controlled release blocker valid: no',
  'Controlled release blocker outcome: missing',
  'Controlled release blocker errors: 1',
  '- missing Android release network blocker summary',
  'CodePush release runtime proof state: ready',
  'Ready CodePush environments: 2',
  'Blocked CodePush environments: 1',
  'Unconfirmed CodePush environments: 2',
  'Beta CodePush strategy confirmed: no',
  'Secret values printed: no',
  'Required action: choose remove or replace before treating OTA updates as a supported release capability.',
  '',
].join('\n');

const removedBlockedByReleaseSummary = validSummary
  .replace('CodePush removed: no', 'CodePush removed: yes')
  .replace('CodePush migration required: yes', 'CodePush migration required: no')
  .replace('Current posture: temporary legacy compatibility', 'Current posture: removed')
  .replace('Long-term options: remove or replace', 'Long-term options: removed')
  .replace(
    [
      'Android release smoke summary valid: yes',
      'Android release smoke summary errors: 0',
      'CodePush release smoke evidence ready: yes',
      'Android release create-wallet smoke summary valid: yes',
      'Android release create-wallet smoke summary errors: 0',
      'CodePush release create-wallet evidence ready: yes',
    ].join('\n'),
    [
      'Android release smoke summary valid: no',
      'Android release smoke summary errors: 8',
      '- Expected line not found: Android smoke outcome: passed',
      '- Expected line not found: Android smoke exit code: 0',
      '- Expected line not found: Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
      '- Closed first-run success must be yes. Received: no',
      '- Validated empty-dashboard CTA flow must be yes. Received: no',
      '- Validated empty-tab navigation must be yes. Received: no',
      '- Validated QR scanner screen must be yes. Received: no',
      '- Validated settings Terms WebView must be yes. Received: no',
      'CodePush release smoke evidence ready: no',
      'Android release create-wallet smoke summary valid: no',
      'Android release create-wallet smoke summary errors: 2',
      '- Source APK bytes does not match the current file size for D:\\GoldWallet\\local-docs\\android-smoke-dev-release-signed.apk',
      '- Source APK sha256 does not match the current file digest for D:\\GoldWallet\\local-docs\\android-smoke-dev-release-signed.apk',
      'CodePush release create-wallet evidence ready: no',
      'Controlled release blocker summary present: yes',
      'Controlled release blocker valid: yes',
      'Controlled release blocker outcome: blocked-by-electrum-certificate-expired',
      'Controlled release blocker errors: 0',
      'CodePush release runtime proof state: blocked-by-electrum-certificate-expired',
    ].join('\n'),
  )
  .replace('Beta CodePush strategy confirmed: no', 'Beta CodePush strategy confirmed: yes')
  .replace(
    'Required action: choose remove or replace before treating OTA updates as a supported release capability.',
    'Required action: keep CodePush removed; do not claim OTA update validation, and clean stale env keys only without exposing values.',
  );

const assertAccepted = (label, summary) => {
  const errors = getCodePushMigrationReadinessSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCodePushMigrationReadinessSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid CodePush migration readiness summary fixture', validSummary);
assertAccepted('Valid removed CodePush migration readiness summary with blocked release proof fixture', removedBlockedByReleaseSummary);
assertRejected('Missing header fixture', validSummary.replace('CodePush migration readiness audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-06-04T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Missing latest package fixture', validSummary.replace('CodePush package latest version: 9.0.1', 'CodePush package latest version: missing'), 'latest version');
assertRejected(
  'Missing published timestamp fixture',
  validSummary.replace('CodePush package latest published at: 2024-12-19T14:31:05.513Z', 'CodePush package latest published at: missing'),
  'published timestamp',
);
assertRejected(
  'Wrong npm repository fixture',
  validSummary.replace('CodePush npm repository: git+https://github.com/microsoft/react-native-code-push.git', 'CodePush npm repository: missing'),
  'npm repository',
);
assertRejected(
  'Wrong upstream repository fixture',
  validSummary.replace('CodePush upstream repository: https://github.com/microsoft/react-native-code-push', 'CodePush upstream repository: missing'),
  'upstream repository',
);
assertRejected(
  'Bad upstream archive date fixture',
  validSummary.replace('CodePush upstream archived date: 2025-05-20', 'CodePush upstream archived date: missing'),
  'archived date',
);
assertRejected(
  'Bad New Architecture unsupported range fixture',
  validSummary.replace(
    'CodePush upstream New Architecture unsupported RN range: >=0.76',
    'CodePush upstream New Architecture unsupported RN range: unknown',
  ),
  'unsupported RN range',
);
assertRejected('Runtime enabled fixture', validSummary.replace('CodePush runtime gated off by default: yes', 'CodePush runtime gated off by default: no'), 'gated off by default');
assertRejected('Claimed update validation fixture', validSummary.replace('CodePush update validation: not claimed', 'CodePush update validation: claimed'), 'not claimed');
assertRejected('Missing migration fixture', validSummary.replace('CodePush migration required: yes', 'CodePush migration required: no'), 'migration required');
assertRejected('Bad posture fixture', validSummary.replace('Current posture: temporary legacy compatibility', 'Current posture: supported OTA'), 'temporary legacy compatibility');
assertRejected('Bad options fixture', validSummary.replace('Long-term options: remove or replace', 'Long-term options: upgrade'), 'remove or replace');
assertRejected('Bad decision doc fixture', validSummary.replace('Decision document covers removal: yes', 'Decision document covers removal: no'), 'decision document');
assertRejected('Bad release path fixture', validSummary.replace('Release path summary valid: yes', 'Release path summary valid: no'), 'valid CodePush release path summary');
assertRejected(
  'Missing release build evidence fixture',
  validSummary.replace('CodePush release build evidence ready: yes', 'CodePush release build evidence ready: no'),
  'release build evidence',
);
assertRejected(
  'Invalid Android release smoke summary fixture',
  validSummary.replace('Android release smoke summary valid: yes', 'Android release smoke summary valid: no'),
  'Android release smoke summary',
);
assertRejected(
  'Missing release smoke evidence fixture',
  validSummary.replace('CodePush release smoke evidence ready: yes', 'CodePush release smoke evidence ready: no'),
  'release smoke evidence',
);
assertRejected(
  'Invalid Android release create-wallet smoke summary fixture',
  validSummary.replace('Android release create-wallet smoke summary valid: yes', 'Android release create-wallet smoke summary valid: no'),
  'Android release create-wallet smoke summary',
);
assertRejected(
  'Missing release create-wallet evidence fixture',
  validSummary.replace('CodePush release create-wallet evidence ready: yes', 'CodePush release create-wallet evidence ready: no'),
  'release create-wallet evidence',
);
assertRejected(
  'Ready runtime proof without release evidence fixture',
  validSummary.replace('CodePush release smoke evidence ready: yes', 'CodePush release smoke evidence ready: no'),
  'release smoke evidence',
);
assertRejected(
  'Controlled blocker runtime proof without blocker fixture',
  validSummary.replace('CodePush release runtime proof state: ready', 'CodePush release runtime proof state: blocked-by-electrum-certificate-expired'),
  'valid controlled release blocker summary',
);
assertRejected(
  'Bad environment count fixture',
  validSummary.replace('Blocked CodePush environments: 1', 'Blocked CodePush environments: missing'),
  'Blocked CodePush environments',
);
assertRejected(
  'Beta strategy claimed fixture',
  validSummary.replace('Beta CodePush strategy confirmed: no', 'Beta CodePush strategy confirmed: yes'),
  'Beta CodePush strategy',
);
assertRejected('Secret value leak fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');
assertRejected(
  'Missing required action fixture',
  validSummary.replace(
    'Required action: choose remove or replace before treating OTA updates as a supported release capability.',
    'Required action: continue.',
  ),
  'remove-or-replace',
);

console.log('CodePush migration readiness summary guard checks are valid.');

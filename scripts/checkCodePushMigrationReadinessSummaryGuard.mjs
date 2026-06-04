import { getCodePushMigrationReadinessSummaryErrors } from './codePushMigrationReadinessSummaryGuard.mjs';

const validSummary = [
  'CodePush migration readiness audit',
  'Generated at: 2026-06-03T00:00:00.000Z',
  'CodePush package current: yes',
  'CodePush package latest version: 9.0.1',
  'CodePush package latest published at: 2024-12-19T15:55:45.376Z',
  'CodePush npm repository: git+https://github.com/microsoft/react-native-code-push.git',
  'CodePush upstream repository: https://github.com/microsoft/react-native-code-push',
  'App Center CodePush retirement date: 2025-03-31',
  'CodePush upstream archived: yes',
  'CodePush upstream New Architecture support: no',
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
  'Ready CodePush environments: 2',
  'Blocked CodePush environments: 1',
  'Unconfirmed CodePush environments: 2',
  'Beta CodePush strategy confirmed: no',
  'Secret values printed: no',
  'Required action: choose remove or replace before treating OTA updates as a supported release capability.',
  '',
].join('\n');

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
assertRejected('Missing header fixture', validSummary.replace('CodePush migration readiness audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-06-03T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Missing latest package fixture', validSummary.replace('CodePush package latest version: 9.0.1', 'CodePush package latest version: missing'), 'latest version');
assertRejected(
  'Missing published timestamp fixture',
  validSummary.replace('CodePush package latest published at: 2024-12-19T15:55:45.376Z', 'CodePush package latest published at: missing'),
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

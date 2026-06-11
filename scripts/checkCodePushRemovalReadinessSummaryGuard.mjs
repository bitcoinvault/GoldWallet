import { getCodePushRemovalReadinessSummaryErrors } from './codePushRemovalReadinessSummaryGuard.mjs';

const validSummary = [
  'CodePush removal readiness audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'CodePush package installed: yes',
  'CodePush package latest version: 9.0.1',
  'CodePush package latest published at: 2024-12-19T14:31:05.513Z',
  'CodePush npm repository: git+https://github.com/microsoft/react-native-code-push.git',
  'CodePush upstream repository: https://github.com/microsoft/react-native-code-push',
  'CodePush upstream archived: yes',
  'CodePush upstream New Architecture support: no',
  'Android New Architecture enabled: yes',
  'CodePush migration required: yes',
  'CodePush release build evidence ready: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke summary errors: 0',
  'CodePush release smoke evidence ready: yes',
  'Runtime usage files: 1',
  '- App.tsx',
  'Native integration files: 8',
  '- android/app/build.gradle',
  '- android/app/src/main/java/io/goldwallet/wallet/MainApplication.java',
  '- android/app/src/main/res/values/strings.xml',
  '- android/settings.gradle',
  '- ios/GoldWallet/AppDelegate.m',
  '- ios/GoldWallet/Info.plist',
  '- ios/GoldWalletDev-Info.plist',
  '- ios/GoldWalletStage-Info.plist',
  'Env files carrying CodePush keys: 5',
  '- .env.dev.testnet',
  '- .env.stage.mainnet',
  '- .env.prod.mainnet',
  '- .env.beta.testnet',
  '- .env.beta.mainnet',
  'iOS plist placeholders: 3',
  'Android native integration present: yes',
  'iOS native integration present: yes',
  'CodePush runtime gated off by default: yes',
  'Removal decision available: no',
  'Replacement decision available: no',
  'Safe to remove now: no',
  'Secret values printed: no',
  'Required action: choose remove or replace before deleting CodePush runtime, native integration, plist placeholders, and env keys.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getCodePushRemovalReadinessSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCodePushRemovalReadinessSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid CodePush removal readiness summary fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('CodePush removal readiness audit', 'Bad header'), 'summary header');
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
assertRejected('Not archived fixture', validSummary.replace('CodePush upstream archived: yes', 'CodePush upstream archived: no'), 'upstream archived');
assertRejected(
  'New Architecture support claimed fixture',
  validSummary.replace('CodePush upstream New Architecture support: no', 'CodePush upstream New Architecture support: yes'),
  'New Architecture support',
);
assertRejected('Android New Architecture disabled fixture', validSummary.replace('Android New Architecture enabled: yes', 'Android New Architecture enabled: no'), 'Android New Architecture');
assertRejected('Migration not required fixture', validSummary.replace('CodePush migration required: yes', 'CodePush migration required: no'), 'migration required');
assertRejected('Release evidence missing fixture', validSummary.replace('CodePush release build evidence ready: yes', 'CodePush release build evidence ready: no'), 'release build evidence');
assertRejected(
  'Invalid Android release smoke summary fixture',
  validSummary.replace('Android release smoke summary valid: yes', 'Android release smoke summary valid: no'),
  'Android release smoke summary',
);
assertRejected(
  'Release smoke evidence missing fixture',
  validSummary.replace('CodePush release smoke evidence ready: yes', 'CodePush release smoke evidence ready: no'),
  'release smoke evidence',
);
assertRejected('Bad runtime count fixture', validSummary.replace('Runtime usage files: 1', 'Runtime usage files: 2'), 'Runtime usage files count');
assertRejected('Bad native count fixture', validSummary.replace('Native integration files: 8', 'Native integration files: 7'), 'Native integration files');
assertRejected('Missing plist fixture', validSummary.replace('iOS plist placeholders: 3', 'iOS plist placeholders: 2'), 'iOS plist placeholders');
assertRejected('Decision claimed fixture', validSummary.replace('Removal decision available: no', 'Removal decision available: yes'), 'remove/replace decision');
assertRejected('Safe removal fixture', validSummary.replace('Safe to remove now: no', 'Safe to remove now: yes'), 'safe to remove');
assertRejected('Secret leak fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');
assertRejected(
  'Missing required action fixture',
  validSummary.replace(
    'Required action: choose remove or replace before deleting CodePush runtime, native integration, plist placeholders, and env keys.',
    'Required action: continue.',
  ),
  'remove-or-replace',
);

console.log('CodePush removal readiness summary guard checks are valid.');

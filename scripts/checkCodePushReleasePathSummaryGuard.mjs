import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';

const notReadySummary = [
  'CodePush release path audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release path wiring valid: yes',
  'Release path ready for update validation: no',
  'Ready environments: 2',
  'Environment readiness entries: 5',
  '- .env.dev.testnet: blocked; blank CODEPUSH_DEPLOYMENT_KEY_ANDROID, blank CODEPUSH_DEPLOYMENT_KEY_IOS',
  '- .env.stage.mainnet: ready',
  '- .env.prod.mainnet: ready',
  '- .env.beta.testnet: unconfirmed; missing CODEPUSH_DEPLOYMENT_KEY_ANDROID, missing CODEPUSH_DEPLOYMENT_KEY_IOS',
  '- .env.beta.mainnet: unconfirmed; missing CODEPUSH_DEPLOYMENT_KEY_ANDROID, missing CODEPUSH_DEPLOYMENT_KEY_IOS',
  'CodePush package dependency version: 9.0.1',
  'CodePush package installed version: 9.0.1',
  'CodePush package latest version: 9.0.1',
  'CodePush package latest published at: 2024-12-19T14:31:05.513Z',
  'CodePush package current: yes',
  'CodePush package versions aligned: yes',
  'CodePush runtime gate present: yes',
  'CodePush runtime enabled by default: no',
  'CodePush upstream repository: https://github.com/microsoft/react-native-code-push',
  'CodePush npm repository: git+https://github.com/microsoft/react-native-code-push.git',
  'App Center CodePush retirement date: 2025-03-31',
  'CodePush upstream retired: yes',
  'CodePush upstream archived: yes',
  'CodePush upstream New Architecture support: no',
  'Android New Architecture enabled: yes',
  'CodePush migration required: yes',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary errors: 0',
  'CodePush update validation: not claimed',
  'Warnings: 2',
  '- .env.beta.testnet does not define CODEPUSH_DEPLOYMENT_KEY_ANDROID; beta release update strategy is still unconfirmed',
  '- .env.beta.testnet does not define CODEPUSH_DEPLOYMENT_KEY_IOS; beta release update strategy is still unconfirmed',
  'Readiness issues: 2',
  '- .env.dev.testnet has a blank CODEPUSH_DEPLOYMENT_KEY_ANDROID',
  '- .env.dev.testnet has a blank CODEPUSH_DEPLOYMENT_KEY_IOS',
  'Wiring errors: 0',
  'Secret values printed: no',
  'Required action: provide non-empty blocked CodePush deployment keys before claiming full release update validation; confirm beta deployment-key strategy before beta validation; migrate or replace retired App Center CodePush before treating OTA updates as a supported release capability.',
  '',
].join('\n');

const readySummary = [
  'CodePush release path audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release path wiring valid: yes',
  'Release path ready for update validation: yes',
  'Ready environments: 5',
  'Environment readiness entries: 5',
  '- .env.dev.testnet: ready',
  '- .env.stage.mainnet: ready',
  '- .env.prod.mainnet: ready',
  '- .env.beta.testnet: ready',
  '- .env.beta.mainnet: ready',
  'CodePush package dependency version: 9.0.1',
  'CodePush package installed version: 9.0.1',
  'CodePush package latest version: 9.0.1',
  'CodePush package latest published at: 2024-12-19T14:31:05.513Z',
  'CodePush package current: yes',
  'CodePush package versions aligned: yes',
  'CodePush runtime gate present: yes',
  'CodePush runtime enabled by default: no',
  'CodePush upstream repository: https://github.com/microsoft/react-native-code-push',
  'CodePush npm repository: git+https://github.com/microsoft/react-native-code-push.git',
  'App Center CodePush retirement date: 2025-03-31',
  'CodePush upstream retired: yes',
  'CodePush upstream archived: yes',
  'CodePush upstream New Architecture support: no',
  'Android New Architecture enabled: yes',
  'CodePush migration required: yes',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary errors: 0',
  'CodePush update validation: not claimed',
  'Warnings: 0',
  'Readiness issues: 0',
  'Wiring errors: 0',
  'Secret values printed: no',
  'Required action: migrate or replace retired App Center CodePush before treating OTA updates as a supported release capability.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getCodePushReleasePathSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCodePushReleasePathSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid not-ready CodePush release path summary fixture', notReadySummary);
assertAccepted('Valid ready CodePush release path summary fixture', readySummary);
assertRejected('Missing header fixture', notReadySummary.replace('CodePush release path audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', notReadySummary.replace('Generated at: 2026-05-28T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad env readiness count fixture', notReadySummary.replace('Environment readiness entries: 5', 'Environment readiness entries: 4'), 'Environment readiness entries count');
assertRejected('Bad ready env count fixture', notReadySummary.replace('Ready environments: 2', 'Ready environments: 1'), 'Ready environments count');
assertRejected('Bad warning count fixture', notReadySummary.replace('Warnings: 2', 'Warnings: 1'), 'Warnings count');
assertRejected(
  'Claimed CodePush update fixture',
  notReadySummary.replace('CodePush update validation: not claimed', 'CodePush update validation: claimed'),
  'not claimed',
);
assertRejected(
  'Mismatched package version fixture',
  notReadySummary.replace('CodePush package installed version: 9.0.1', 'CodePush package installed version: 8.0.0'),
  'does not match installed version',
);
assertRejected(
  'Missing latest package version fixture',
  notReadySummary.replace('CodePush package latest version: 9.0.1', 'CodePush package latest version: missing'),
  'CodePush package latest version must be a semver package version',
);
assertRejected(
  'Stale current package fixture',
  notReadySummary.replace('CodePush package latest version: 9.0.1', 'CodePush package latest version: 10.0.0'),
  'CodePush package current cannot be yes',
);
assertRejected(
  'Bad upstream retirement fixture',
  notReadySummary.replace('CodePush upstream retired: yes', 'CodePush upstream retired: no'),
  'retired and archived',
);
assertRejected(
  'Bad New Architecture support fixture',
  notReadySummary.replace('CodePush upstream New Architecture support: no', 'CodePush upstream New Architecture support: yes'),
  'New Architecture support must remain no',
);
assertRejected(
  'Missing migration requirement fixture',
  notReadySummary.replace('CodePush migration required: yes', 'CodePush migration required: no'),
  'migration required must be yes',
);
assertRejected(
  'Missing CodePush runtime gate fixture',
  notReadySummary.replace('CodePush runtime gate present: yes', 'CodePush runtime gate present: no'),
  'CodePush runtime gate must be present',
);
assertRejected(
  'CodePush runtime enabled by default fixture',
  notReadySummary.replace('CodePush runtime enabled by default: no', 'CodePush runtime enabled by default: yes'),
  'CodePush runtime must not be enabled by default',
);
assertRejected(
  'Missing release variant fixture',
  notReadySummary.replace('Android release summary variants: dev, stage, prod', 'Android release summary variants: dev, stage'),
  'prod release evidence',
);
assertRejected('Secret value leak fixture', notReadySummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');
assertRejected(
  'Secret assignment leak fixture',
  notReadySummary.replace('- .env.stage.mainnet: ready', '- .env.stage.mainnet: ready CODEPUSH_DEPLOYMENT_KEY_ANDROID=value'),
  'deployment key assignments',
);
assertRejected(
  'Missing required action fixture',
  notReadySummary.replace(
    'Required action: provide non-empty blocked CodePush deployment keys before claiming full release update validation; confirm beta deployment-key strategy before beta validation; migrate or replace retired App Center CodePush before treating OTA updates as a supported release capability.',
    'Required action: provide release update values before validation.',
  ),
  'CodePush deployment key required action',
);
assertRejected(
  'Missing migration action fixture',
  notReadySummary.replace(
    'Required action: provide non-empty blocked CodePush deployment keys before claiming full release update validation; confirm beta deployment-key strategy before beta validation; migrate or replace retired App Center CodePush before treating OTA updates as a supported release capability.',
    'Required action: provide non-empty blocked CodePush deployment keys before claiming full release update validation; confirm beta deployment-key strategy before beta validation.',
  ),
  'retired App Center CodePush migration',
);

console.log('CodePush release path summary guard checks are valid.');

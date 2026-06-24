import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCodePushDecisionHandoffErrors } from './codePushDecisionHandoffGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'docs', 'codepush-retirement-migration-plan.md');
const plan = readFileSync(planPath, 'utf8');

const requiredSnippets = [
  '## Decision Handoff Gate',
  'Decision owner input required before implementation:',
  '- choose `remove` if OTA updates are no longer a supported product/release capability;',
  '- choose `replace` if OTA updates remain required and a maintained/self-hosted replacement is selected;',
  '- choose `temporary legacy compatibility` only as an explicit short-term exception, with CodePush remaining gated off by default and update validation still unclaimed.',
  'Evidence that must be attached to the decision:',
  '- current `codepush:release:path-audit` and `codepush:release:path-check-summary` output;',
  '- current `codepush:migration:readiness-audit` and `codepush:migration:readiness-check-summary` output;',
  '- current `codepush:removal-readiness:audit` and `codepush:removal-readiness:check-summary` output;',
  '- current Android release build, manifest, and release-smoke evidence;',
  '- current release-services aggregate summary;',
  '- iOS macOS/Xcode/CocoaPods blocker or validation result;',
  '- explicit beta deployment-key strategy: beta has OTA keys, beta has no OTA, or beta is out of scope.',
  'Do not reintroduce a removal branch unless CodePush runtime/native integration is reintroduced.',
  'Do not start a replacement branch until the decision says `replace` and names the replacement target.',
  'Do not claim CodePush update validation until deployment keys are non-empty for the target environments and a real OTA delivery test has run.',
  'Never print or commit CodePush deployment-key values in handoff artifacts.',
  '## Remove Branch Acceptance Gate',
  '- remove `react-native-code-push` from `package.json` and `yarn.lock`;',
  '- remove runtime wrapping from `App.tsx`;',
  '- remove Android CodePush Gradle/native bundle integration;',
  '- remove iOS CodePush native integration and plist placeholders;',
  '- remove or rewrite env-key guards so missing CodePush keys are no longer release blockers;',
  '- run Android debug assemble and emulator smoke;',
  '- run Android release build, manifest check, and release smoke;',
  '- leave iOS runtime/archive validation unclaimed unless it ran on macOS/Xcode.',
  '## Replace Branch Acceptance Gate',
  '- document the selected maintained OTA provider or self-hosted server;',
  '- prove Android native integration and release update-check behavior without printing secrets;',
  '- define rollback behavior and store-policy constraints;',
  '- update env/key guards for the replacement without carrying stale CodePush keys as blockers;',
  '- run Android debug assemble and emulator smoke;',
  '- run Android release build, manifest check, and release smoke;',
  '- run iOS macOS validation or record the exact macOS/Xcode/CocoaPods blocker.',
];

const errors = requiredSnippets.filter(snippet => !plan.includes(snippet));

if (!plan.includes('Do not plan another blind CodePush package upgrade')) {
  errors.push('Decision plan must explicitly reject another blind CodePush package upgrade.');
}

if (!plan.includes('App Center CodePush was retired on 2025-03-31')) {
  errors.push('Decision plan must keep the App Center retirement date visible.');
}

if (!plan.includes('upstream Microsoft README states that React Native CodePush does not support New Architecture')) {
  errors.push('Decision plan must keep the New Architecture incompatibility visible.');
}

if (errors.length > 0) {
  console.error('CodePush decision handoff guard failed:');
  errors.forEach(error => console.error(`- Missing or invalid plan item: ${error}`));
  process.exit(1);
}

const removedDecisionWithBlockedReleaseProof = [
  'CodePush decision handoff',
  'Generated at: 2026-06-24T00:00:00.000Z',
  'Decision: remove',
  'Implementation ready: yes',
  'CodePush removed: yes',
  'Replacement target: none',
  'Beta deployment-key strategy: beta has no OTA',
  'Release path summary valid: yes',
  'Migration readiness summary valid: yes',
  'Removal readiness summary valid: yes',
  'CodePush migration required: no',
  'CodePush update validation: not claimed',
  'CodePush runtime gated off by default: yes',
  'CodePush release build evidence ready: yes',
  'CodePush release smoke evidence ready: no',
  'CodePush release create-wallet evidence ready: no',
  'iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming iOS delivery.',
  'Release path summary errors: 0',
  'Migration readiness summary errors: 0',
  'Removal readiness summary errors: 0',
  'Secret values printed: no',
  'Required action: keep CodePush removed from runtime and native integration; do not claim OTA update validation until deployment keys and a real delivery test are available.',
  '',
].join('\n');

const assertDecisionAccepted = (label, summary) => {
  const decisionErrors = getCodePushDecisionHandoffErrors(summary);

  if (decisionErrors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    decisionErrors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertDecisionRejected = (label, summary, expectedError) => {
  const decisionErrors = getCodePushDecisionHandoffErrors(summary);

  if (!decisionErrors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    decisionErrors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertDecisionAccepted('Removed CodePush decision with blocked release smoke proof fixture', removedDecisionWithBlockedReleaseProof);
assertDecisionRejected(
  'Removed CodePush decision without release build proof fixture',
  removedDecisionWithBlockedReleaseProof.replace('CodePush release build evidence ready: yes', 'CodePush release build evidence ready: no'),
  'release build evidence',
);
assertDecisionRejected(
  'Not-yet-removed CodePush decision without release smoke proof fixture',
  removedDecisionWithBlockedReleaseProof
    .replace('CodePush removed: yes', 'CodePush removed: no')
    .replace('CodePush migration required: no', 'CodePush migration required: yes'),
  'before changing CodePush state',
);

console.log('CodePush decision handoff guard checks are valid.');

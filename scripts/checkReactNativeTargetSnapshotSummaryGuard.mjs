import {
  expectedReactNativeTargetSnapshot,
} from './auditReactNativeTargetSnapshot.mjs';
import {
  getReactNativeTargetSnapshotSummaryErrors,
} from './reactNativeTargetSnapshotSummaryGuard.mjs';

const validSummary = [
  'React Native target snapshot live npm check',
  'Generated at: 2026-05-28T00:00:00.000Z',
  `Snapshot date: ${expectedReactNativeTargetSnapshot.snapshotDate}`,
  'Live check outcome: matched',
  `npm latest react-native: ${expectedReactNativeTargetSnapshot.npmLatestReactNative} (snapshot: ${expectedReactNativeTargetSnapshot.npmLatestReactNative})`,
  `npm next react-native: ${expectedReactNativeTargetSnapshot.npmNextReactNative} (snapshot: ${expectedReactNativeTargetSnapshot.npmNextReactNative})`,
  `npm next channel classification: ${expectedReactNativeTargetSnapshot.npmNextChannel} (snapshot: ${expectedReactNativeTargetSnapshot.npmNextChannel})`,
  `default React Native upgrade channel: ${expectedReactNativeTargetSnapshot.defaultUpgradeChannel} (snapshot: latest)`,
  `react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative} React peer: ${expectedReactNativeTargetSnapshot.targetReactPeer} (snapshot: ${expectedReactNativeTargetSnapshot.targetReactPeer})`,
  `react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative} Node engine: ${expectedReactNativeTargetSnapshot.targetNodeEngine} (snapshot: ${expectedReactNativeTargetSnapshot.targetNodeEngine})`,
  'Mismatches: 0',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getReactNativeTargetSnapshotSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getReactNativeTargetSnapshotSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid RN target snapshot summary fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('React Native target snapshot live npm check', 'Bad header'), 'summary header');
assertRejected('Wrong snapshot date fixture', validSummary.replace(`Snapshot date: ${expectedReactNativeTargetSnapshot.snapshotDate}`, 'Snapshot date: 2026-01-01'), 'Snapshot date');
assertRejected('Missing latest fixture', validSummary.replace(`npm latest react-native: ${expectedReactNativeTargetSnapshot.npmLatestReactNative}`, 'npm latest react-native: 0.86.0'), 'Expected summary line');
assertRejected('Matched mismatch count fixture', validSummary.replace('Mismatches: 0', 'Mismatches: 1'), 'Matched summary must have 0 mismatches');

console.log('React Native target snapshot summary guard checks are valid.');

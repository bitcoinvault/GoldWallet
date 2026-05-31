import {
  expectedReactNativeTargetSnapshot,
} from './auditReactNativeTargetSnapshot.mjs';
import {
  getReactNativeTargetSnapshotCurrentIssues,
  formatReactNativeTargetSnapshotCurrentSummary,
} from './checkReactNativeTargetSnapshotCurrent.mjs';

const validCurrent = {
  latest: expectedReactNativeTargetSnapshot.npmLatestReactNative,
  next: expectedReactNativeTargetSnapshot.npmNextReactNative,
  reactPeer: expectedReactNativeTargetSnapshot.targetReactPeer,
  nodeEngine: expectedReactNativeTargetSnapshot.targetNodeEngine,
};

const assertAccepted = (label, current) => {
  const { errors } = getReactNativeTargetSnapshotCurrentIssues(current);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, current, expectedError) => {
  const { errors } = getReactNativeTargetSnapshotCurrentIssues(current);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid live npm metadata fixture', validCurrent);
const validSummary = formatReactNativeTargetSnapshotCurrentSummary({
  ...getReactNativeTargetSnapshotCurrentIssues(validCurrent),
  generatedAt: '2026-05-28T00:00:00.000Z',
});
if (!validSummary.includes('Live check outcome: matched') || !validSummary.includes('Mismatches: 0')) {
  console.error('Valid live npm metadata fixture should produce a matched summary with zero mismatches.');
  process.exit(1);
}
assertRejected('Changed latest fixture', { ...validCurrent, latest: '0.86.0' }, 'npm latest react-native is 0.86.0');
const staleSummary = formatReactNativeTargetSnapshotCurrentSummary({
  ...getReactNativeTargetSnapshotCurrentIssues({ ...validCurrent, latest: '0.86.0' }),
  generatedAt: '2026-05-28T00:00:00.000Z',
});
if (!staleSummary.includes('Live check outcome: stale') || !staleSummary.includes('Mismatches: 1')) {
  console.error('Changed live npm metadata fixture should produce a stale summary with one mismatch.');
  process.exit(1);
}
assertRejected('Changed next fixture', { ...validCurrent, next: '0.87.0-rc.0' }, 'npm next react-native is 0.87.0-rc.0');
assertRejected('Stable next fixture', { ...validCurrent, next: '0.86.0' }, 'npm next channel classification is stable');
assertRejected(
  'Next equals latest fixture',
  { ...validCurrent, next: expectedReactNativeTargetSnapshot.npmLatestReactNative },
  'npm next react-native matches latest',
);
assertRejected('Changed React peer fixture', { ...validCurrent, reactPeer: '^20.0.0' }, 'React peer is ^20.0.0');
assertRejected('Missing Node engine fixture', { ...validCurrent, nodeEngine: '' }, 'Node engine is <missing>');

console.log('React Native target snapshot live npm guard checks are valid.');

import {
  expectedReactNativeTargetSnapshot,
} from './auditReactNativeTargetSnapshot.mjs';
import {
  getReactNativeTargetSnapshotCurrentIssues,
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
assertRejected('Changed latest fixture', { ...validCurrent, latest: '0.86.0' }, 'npm latest react-native is 0.86.0');
assertRejected('Changed next fixture', { ...validCurrent, next: '0.87.0-rc.0' }, 'npm next react-native is 0.87.0-rc.0');
assertRejected('Changed React peer fixture', { ...validCurrent, reactPeer: '^20.0.0' }, 'React peer is ^20.0.0');
assertRejected('Missing Node engine fixture', { ...validCurrent, nodeEngine: '' }, 'Node engine is <missing>');

console.log('React Native target snapshot live npm guard checks are valid.');

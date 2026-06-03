import { expectedReactNativeTargetSnapshot } from './auditReactNativeTargetSnapshot.mjs';

export const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

export const getReactNativeTargetSnapshotSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const snapshotDate = getLineValue(summary, 'Snapshot date');
  const outcome = getLineValue(summary, 'Live check outcome');
  const mismatches = getLineValue(summary, 'Mismatches');

  if (!summary.startsWith('React Native target snapshot live npm check')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (snapshotDate !== expectedReactNativeTargetSnapshot.snapshotDate) {
    errors.push(`Snapshot date is ${snapshotDate || '<missing>'}; expected ${expectedReactNativeTargetSnapshot.snapshotDate}`);
  }

  if (!['matched', 'stale'].includes(outcome)) {
    errors.push(`Live check outcome must be matched or stale. Received: ${outcome || 'missing'}`);
  }

  if (!/^\d+$/.test(mismatches)) {
    errors.push(`Mismatches must be a non-negative integer. Received: ${mismatches || 'missing'}`);
  }

  const expectedLines = [
    `npm latest react-native: ${expectedReactNativeTargetSnapshot.npmLatestReactNative} (snapshot: ${expectedReactNativeTargetSnapshot.npmLatestReactNative})`,
    `npm next react-native: ${expectedReactNativeTargetSnapshot.npmNextReactNative} (snapshot: ${expectedReactNativeTargetSnapshot.npmNextReactNative})`,
    `npm nightly react-native: ${expectedReactNativeTargetSnapshot.npmNightlyReactNative} (snapshot: ${expectedReactNativeTargetSnapshot.npmNightlyReactNative})`,
    `npm next channel classification: ${expectedReactNativeTargetSnapshot.npmNextChannel} (snapshot: ${expectedReactNativeTargetSnapshot.npmNextChannel})`,
    `default React Native upgrade channel: ${expectedReactNativeTargetSnapshot.defaultUpgradeChannel} (snapshot: latest)`,
    `react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative} React peer: ${expectedReactNativeTargetSnapshot.targetReactPeer} (snapshot: ${expectedReactNativeTargetSnapshot.targetReactPeer})`,
    `react-native@${expectedReactNativeTargetSnapshot.npmLatestReactNative} Node engine: ${expectedReactNativeTargetSnapshot.targetNodeEngine} (snapshot: ${expectedReactNativeTargetSnapshot.targetNodeEngine})`,
  ];

  expectedLines.forEach(expectedLine => {
    if (!summary.split(/\r?\n/).includes(expectedLine)) {
      errors.push(`Expected summary line not found: ${expectedLine}`);
    }
  });

  if (outcome === 'matched' && mismatches !== '0') {
    errors.push(`Matched summary must have 0 mismatches. Received: ${mismatches}`);
  }

  return errors;
};

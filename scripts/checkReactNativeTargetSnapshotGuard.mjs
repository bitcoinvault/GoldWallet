import {
  expectedReactNativeTargetSnapshot,
  getReactNativeTargetSnapshotIssues,
  requiredReactNativeTargetSnapshotSnippets,
} from './auditReactNativeTargetSnapshot.mjs';

const validDocs = requiredReactNativeTargetSnapshotSnippets.reduce((docs, [relativePath, snippet]) => {
  docs[relativePath] = docs[relativePath] ? `${docs[relativePath]}\n${snippet}` : snippet;
  return docs;
}, {});

const validEnvironment = {
  dependencies: {
    react: expectedReactNativeTargetSnapshot.currentReact,
    'react-native': expectedReactNativeTargetSnapshot.currentReactNative,
  },
  nvmrc: expectedReactNativeTargetSnapshot.currentNode,
  docs: validDocs,
};

const assertAccepted = (label, environment) => {
  const { errors } = getReactNativeTargetSnapshotIssues(environment);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, environment, expectedError) => {
  const { errors } = getReactNativeTargetSnapshotIssues(environment);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid React Native target snapshot fixture', validEnvironment);
assertRejected(
  'Wrong current React Native fixture',
  { ...validEnvironment, dependencies: { ...validEnvironment.dependencies, 'react-native': '0.81.6' } },
  'react-native@0.81.6',
);
assertRejected('Wrong current Node fixture', { ...validEnvironment, nvmrc: '20.19.4' }, '.nvmrc is 20.19.4');
assertRejected(
  'Missing latest snapshot fixture',
  {
    ...validEnvironment,
    docs: {
      ...validEnvironment.docs,
      'docs/react-native-target-snapshot.md': validEnvironment.docs['docs/react-native-target-snapshot.md'].replace('npm `latest`: `0.87.0`', ''),
    },
  },
  'npm `latest`: `0.87.0`',
);
assertRejected(
  'Contradictory current RC fixture',
  {
    ...validEnvironment,
    docs: {
      ...validEnvironment.docs,
      'docs/react-native-foundation-target-matrix.md': `${validEnvironment.docs['docs/react-native-foundation-target-matrix.md']}\n0.87.0-rc.3`,
    },
  },
  'stale current-snapshot RN prerelease value(s): 0.87.0-rc.3',
);

console.log('React Native target snapshot guard checks are valid.');

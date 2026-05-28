import {
  expectedNodeRuntimeTransition,
  getNodeRuntimeTransitionIssues,
  requiredNodeRuntimeTransitionDocs,
  requiredNodeRuntimeTransitionSnippets,
} from './auditNodeRuntimeTransition.mjs';

const validDocs = requiredNodeRuntimeTransitionSnippets.reduce((docs, [relativePath, snippet]) => {
  docs[relativePath] = docs[relativePath] ? `${docs[relativePath]}\n${snippet}` : snippet;
  return docs;
}, {});

const validEnvironment = {
  nvmrc: expectedNodeRuntimeTransition.currentNode,
  dependencies: {
    'react-native': expectedNodeRuntimeTransition.currentReactNative,
  },
  devDependencies: {
    'metro-react-native-babel-preset': expectedNodeRuntimeTransition.currentMetroPreset,
  },
  scripts: {
    'node:runtime-transition:audit': 'node scripts/auditNodeRuntimeTransition.mjs',
    'check:node-runtime-transition-guard': 'node scripts/checkNodeRuntimeTransitionGuard.mjs',
  },
  docs: validDocs,
};

const assertAccepted = (label, environment) => {
  const { errors } = getNodeRuntimeTransitionIssues(environment);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, environment, expectedError) => {
  const { errors } = getNodeRuntimeTransitionIssues(environment);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Node runtime transition fixture', validEnvironment);
assertRejected('Wrong current Node fixture', { ...validEnvironment, nvmrc: '22.18.0' }, '.nvmrc is 22.18.0');
assertRejected(
  'Wrong React Native fixture',
  { ...validEnvironment, dependencies: { ...validEnvironment.dependencies, 'react-native': expectedNodeRuntimeTransition.targetReactNative } },
  `react-native@${expectedNodeRuntimeTransition.targetReactNative}`,
);
assertRejected(
  'Wrong Metro preset fixture',
  { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, 'metro-react-native-babel-preset': '0.85.0' } },
  'metro-react-native-babel-preset@0.85.0',
);
assertRejected(
  'Missing package script fixture',
  { ...validEnvironment, scripts: { 'check:node-runtime-transition-guard': 'node scripts/checkNodeRuntimeTransitionGuard.mjs' } },
  'node:runtime-transition:audit',
);
assertRejected(
  'Missing docs fixture',
  {
    ...validEnvironment,
    docs: Object.fromEntries(Object.entries(validEnvironment.docs).filter(([relativePath]) => relativePath !== requiredNodeRuntimeTransitionDocs[0])),
  },
  'docs/node-runtime-transition-audit.md is missing',
);

console.log('Node runtime transition guard checks are valid.');

import {
  expectedMetroDevRuntime,
  getMetroDevRuntimeIssues,
  requiredMetroDevRuntimeSnippets,
} from './auditMetroDevRuntime.mjs';

const validDocs = requiredMetroDevRuntimeSnippets.reduce((docs, [relativePath, snippet]) => {
  docs[relativePath] = docs[relativePath] ? `${docs[relativePath]}\n${snippet}` : snippet;
  return docs;
}, {});

const validEnvironment = {
  nodeVersion: expectedMetroDevRuntime.nodeVersion,
  nvmrc: expectedMetroDevRuntime.nodeVersion,
  dependencies: {
    'react-native': expectedMetroDevRuntime.reactNative,
  },
  devDependencies: {
    'metro-react-native-babel-preset': expectedMetroDevRuntime.metroPreset,
  },
  scripts: {
    start: expectedMetroDevRuntime.startScript,
  },
  docs: validDocs,
};

const assertAccepted = (label, environment) => {
  const { errors } = getMetroDevRuntimeIssues(environment);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, environment, expectedError) => {
  const { errors } = getMetroDevRuntimeIssues(environment);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertWarned = (label, environment, expectedWarning) => {
  const { errors, warnings } = getMetroDevRuntimeIssues(environment);

  if (errors.length > 0 || !warnings.some(warning => warning.includes(expectedWarning))) {
    console.error(`${label} should warn with "${expectedWarning}" without errors, but produced:`);
    errors.forEach(error => console.error(`- error: ${error}`));
    warnings.forEach(warning => console.error(`- warning: ${warning}`));
    process.exit(1);
  }
};

assertAccepted('Valid Metro dev runtime fixture', validEnvironment);
assertWarned('Non-Metro Node fixture', { ...validEnvironment, nodeVersion: '22.18.0' }, 'Current Node is 22.18.0');
assertRejected('Wrong .nvmrc fixture', { ...validEnvironment, nvmrc: '18.20.0' }, '.nvmrc is 18.20.0');
assertRejected(
  'Wrong React Native fixture',
  { ...validEnvironment, dependencies: { ...validEnvironment.dependencies, 'react-native': '0.69.0' } },
  'react-native@0.69.0',
);
assertRejected(
  'Wrong Metro preset fixture',
  { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, 'metro-react-native-babel-preset': '0.68.0' } },
  'metro-react-native-babel-preset@0.68.0',
);
assertRejected(
  'Wrong start script fixture',
  { ...validEnvironment, scripts: { ...validEnvironment.scripts, start: 'react-native start --reset-cache' } },
  'expected "react-native start"',
);
assertRejected(
  'Missing docs fixture',
  { ...validEnvironment, docs: { ...validEnvironment.docs, 'README.md': '' } },
  'README.md is missing',
);

console.log('Metro dev runtime audit guard checks are valid.');

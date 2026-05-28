import {
  expectedTestTypeCoupling,
  getTestTypeCouplingIssues,
  requiredTestTypeCouplingDocs,
  requiredTestTypeCouplingSnippets,
} from './auditTestTypeCoupling.mjs';

const validDocs = requiredTestTypeCouplingSnippets.reduce((docs, [relativePath, snippet]) => {
  docs[relativePath] = docs[relativePath] ? `${docs[relativePath]}\n${snippet}` : snippet;
  return docs;
}, {});

const validEnvironment = {
  devDependencies: {
    typescript: expectedTestTypeCoupling.typescript,
    jest: expectedTestTypeCoupling.jest,
    'babel-jest': expectedTestTypeCoupling.babelJest,
    'ts-jest': expectedTestTypeCoupling.tsJest,
    'react-test-renderer': expectedTestTypeCoupling.reactTestRenderer,
  },
  scripts: {
    'test:type-coupling:audit': 'node scripts/auditTestTypeCoupling.mjs',
    'check:test-type-coupling-guard': 'node scripts/checkTestTypeCouplingGuard.mjs',
  },
  tsconfig: {
    compilerOptions: {
      target: expectedTestTypeCoupling.tsTarget,
      jsx: expectedTestTypeCoupling.tsJsx,
      skipLibCheck: expectedTestTypeCoupling.tsSkipLibCheck,
    },
  },
  jestConfigContent: "module.exports = { preset: 'react-native', transform: { '^.+\\\\.tsx?$': 'babel-jest' } };",
  docs: validDocs,
  existingDocs: new Set(requiredTestTypeCouplingDocs),
};

const assertAccepted = (label, environment) => {
  const { errors } = getTestTypeCouplingIssues(environment);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, environment, expectedError) => {
  const { errors } = getTestTypeCouplingIssues(environment);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid test/type coupling fixture', validEnvironment);
assertRejected('Wrong TypeScript fixture', { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, typescript: '^5.9.0' } }, 'typescript@^5.9.0');
assertRejected('Wrong Jest fixture', { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, jest: '30.0.0' } }, 'jest@30.0.0');
assertRejected('Wrong renderer fixture', { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, 'react-test-renderer': '19.2.3' } }, 'react-test-renderer@19.2.3');
assertRejected('Wrong JSX fixture', { ...validEnvironment, tsconfig: { compilerOptions: { ...validEnvironment.tsconfig.compilerOptions, jsx: 'react-jsx' } } }, 'jsx is react-jsx');
assertRejected('Missing Jest preset fixture', { ...validEnvironment, jestConfigContent: 'module.exports = { transform: {} };' }, 'react-native preset');
assertRejected('Missing script fixture', { ...validEnvironment, scripts: {} }, 'test:type-coupling:audit');
assertRejected(
  'Missing docs fixture',
  {
    ...validEnvironment,
    existingDocs: new Set(requiredTestTypeCouplingDocs.filter(relativePath => relativePath !== 'docs/test-type-coupling-audit.md')),
  },
  'docs/test-type-coupling-audit.md is missing',
);

console.log('Test/type coupling guard checks are valid.');

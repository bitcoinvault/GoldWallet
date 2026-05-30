import {
  expectedReactPackageCoupling,
  getReactPackageCouplingIssues,
  requiredReactPackageCouplingDocs,
  requiredReactPackageCouplingSnippets,
} from './auditReactPackageCoupling.mjs';

const validDocs = requiredReactPackageCouplingSnippets.reduce((docs, [relativePath, snippet]) => {
  docs[relativePath] = docs[relativePath] ? `${docs[relativePath]}\n${snippet}` : snippet;
  return docs;
}, {});

const validEnvironment = {
  dependencies: {
    react: expectedReactPackageCoupling.react,
  },
  devDependencies: {
    '@types/react': expectedReactPackageCoupling.reactTypes,
    'react-test-renderer': expectedReactPackageCoupling.reactTestRenderer,
  },
  scripts: {
    'react:package-coupling:audit': 'node scripts/auditReactPackageCoupling.mjs',
    'check:react-package-coupling-guard': 'node scripts/checkReactPackageCouplingGuard.mjs',
  },
  docs: validDocs,
  existingDocs: new Set(requiredReactPackageCouplingDocs),
};

const assertAccepted = (label, environment) => {
  const { errors } = getReactPackageCouplingIssues(environment);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, environment, expectedError) => {
  const { errors } = getReactPackageCouplingIssues(environment);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid React package coupling fixture', validEnvironment);
assertRejected('Wrong React fixture', { ...validEnvironment, dependencies: { react: '19.2.6' } }, 'react@19.2.6');
assertRejected('Wrong React types fixture', { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, '@types/react': '18.2.6' } }, '@types/react@18.2.6');
assertRejected(
  'External React Native types fixture',
  { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, '@types/react-native': '^0.63.37' } },
  '@types/react-native@^0.63.37',
);
assertRejected(
  'Wrong renderer fixture',
  { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, 'react-test-renderer': '19.2.6' } },
  'react-test-renderer@19.2.6',
);
assertRejected('Missing script fixture', { ...validEnvironment, scripts: {} }, 'react:package-coupling:audit');
assertRejected(
  'Missing docs fixture',
  {
    ...validEnvironment,
    existingDocs: new Set(requiredReactPackageCouplingDocs.filter(relativePath => relativePath !== 'docs/react-package-coupling-audit.md')),
  },
  'docs/react-package-coupling-audit.md is missing',
);

console.log('React package coupling guard checks are valid.');

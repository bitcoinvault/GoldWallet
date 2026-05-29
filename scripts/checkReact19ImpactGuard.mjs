import {
  getReact19ImpactIssues,
  requiredReact19ImpactDocs,
  requiredReact19ImpactSnippets,
} from './auditReact19Impact.mjs';

const validDocs = requiredReact19ImpactSnippets.reduce((docs, [relativePath, snippet]) => {
  docs[relativePath] = docs[relativePath] ? `${docs[relativePath]}\n${snippet}` : snippet;
  return docs;
}, {});

const validEnvironment = {
  dependencies: {
    react: '19.1.4',
  },
  devDependencies: {
    '@types/react': '18.2.6',
    'react-test-renderer': '19.1.4',
  },
  scripts: {
    'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
  },
  docs: validDocs,
  existingDocs: new Set(requiredReact19ImpactDocs),
  inventory: {
    classComponentFiles: ['src/screens/Example.tsx'],
    staticDefaultPropsFiles: ['src/components/Example.tsx'],
  },
};

const assertAccepted = (label, environment) => {
  const { errors } = getReact19ImpactIssues(environment);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, environment, expectedError) => {
  const { errors } = getReact19ImpactIssues(environment);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid React 19 impact fixture', validEnvironment);
assertRejected('Wrong React fixture', { ...validEnvironment, dependencies: { react: '19.2.3' } }, 'react@19.2.3');
assertRejected('Wrong React types fixture', { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, '@types/react': '^19.1.1' } }, '@types/react@^19.1.1');
assertRejected('Missing script fixture', { ...validEnvironment, scripts: {} }, 'react19:impact:audit');
assertRejected('Missing class component fixture', { ...validEnvironment, inventory: { ...validEnvironment.inventory, classComponentFiles: [] } }, 'class component surfaces');
assertRejected(
  'Missing docs fixture',
  { ...validEnvironment, existingDocs: new Set(requiredReact19ImpactDocs.filter(relativePath => relativePath !== 'docs/react19-impact-audit.md')) },
  'docs/react19-impact-audit.md is missing',
);

console.log('React 19 impact audit guard checks are valid.');

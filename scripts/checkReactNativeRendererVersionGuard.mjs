import {
  getReactNativeRendererVersionIssues,
  requiredReactNativeRendererVersionDocs,
  requiredReactNativeRendererVersionSnippets,
} from './auditReactNativeRendererVersion.mjs';

const validDocs = requiredReactNativeRendererVersionSnippets.reduce((docs, [relativePath, snippet]) => {
  docs[relativePath] = docs[relativePath] ? `${docs[relativePath]}\n${snippet}` : snippet;
  return docs;
}, {});

const rendererFixture = `
if ("19.2.3" !== isomorphicReactPackageVersion)
  throw Error('Incompatible React versions');

const rendererInfo = {
  version: "19.2.3",
  rendererPackageName: "react-native-renderer",
  reconcilerVersion: "19.2.3",
};
`;

const validEnvironment = {
  dependencies: {
    react: '19.2.3',
    'react-native': '0.85.3',
  },
  devDependencies: {
    'react-test-renderer': '19.2.3',
  },
  scripts: {
    'react:renderer-version:audit': 'node scripts/auditReactNativeRendererVersion.mjs',
    'check:react-renderer-version-guard': 'node scripts/checkReactNativeRendererVersionGuard.mjs',
  },
  rendererFiles: [{ relativePath: 'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js', content: rendererFixture }],
  docs: validDocs,
  existingDocs: new Set(requiredReactNativeRendererVersionDocs),
};

const assertAccepted = (label, environment) => {
  const { errors } = getReactNativeRendererVersionIssues(environment);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, environment, expectedError) => {
  const { errors } = getReactNativeRendererVersionIssues(environment);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid React Native renderer version fixture', validEnvironment);
assertRejected('Wrong React fixture', { ...validEnvironment, dependencies: { ...validEnvironment.dependencies, react: '19.2.7' } }, 'React package version 19.2.7');
assertRejected(
  'Wrong renderer fixture',
  {
    ...validEnvironment,
    rendererFiles: [
      {
        relativePath: 'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js',
        content: rendererFixture.replaceAll('19.2.3', '19.2.7'),
      },
    ],
  },
  'React package version 19.2.3',
);
assertRejected(
  'Wrong test renderer fixture',
  { ...validEnvironment, devDependencies: { ...validEnvironment.devDependencies, 'react-test-renderer': '19.2.7' } },
  'react-test-renderer 19.2.7',
);
assertRejected('Missing renderer files fixture', { ...validEnvironment, rendererFiles: [] }, 'No React Native renderer implementation files');
assertAccepted(
  'Missing exact check fixture',
  {
    ...validEnvironment,
    rendererFiles: [
      {
        relativePath: 'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js',
        content: rendererFixture.replace(/if \("19\.2\.3"[\s\S]*?;\n\n/, ''),
      },
    ],
  },
);
assertRejected('Missing script fixture', { ...validEnvironment, scripts: {} }, 'react:renderer-version:audit');
assertRejected(
  'Missing docs fixture',
  {
    ...validEnvironment,
    existingDocs: new Set(requiredReactNativeRendererVersionDocs.filter(relativePath => relativePath !== 'docs/react-package-coupling-audit.md')),
  },
  'docs/react-package-coupling-audit.md is missing',
);

console.log('React Native renderer exact-version guard checks are valid.');

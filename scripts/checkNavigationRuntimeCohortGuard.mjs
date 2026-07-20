import assert from 'assert';

import {
  expectedNavigationRuntimeVersions,
  getNavigationRuntimeCohortErrors,
} from './navigationRuntimeCohortGuard.mjs';

const dependencies = {
  react: '19.2.3',
  'react-native': '0.86.0',
  'react-native-safe-area-context': '5.8.0',
  ...Object.fromEntries(expectedNavigationRuntimeVersions),
};
const installedPackages = {
  '@react-navigation/bottom-tabs': {
    version: '7.18.11',
    peerDependencies: {
      '@react-navigation/native': '^7.3.11',
      react: '>=18.2.0',
      'react-native': '*',
      'react-native-safe-area-context': '>=4.0.0',
      'react-native-screens': '>=4.0.0',
    },
  },
  '@react-navigation/devtools': { version: '7.1.8', peerDependencies: { react: '>=18.2.0' } },
  '@react-navigation/native': {
    version: '7.3.11',
    peerDependencies: { react: '>=18.2.0', 'react-native': '*' },
  },
  '@react-navigation/stack': {
    version: '7.10.14',
    peerDependencies: {
      '@react-navigation/native': '^7.3.11',
      react: '>=18.2.0',
      'react-native': '*',
      'react-native-gesture-handler': '>=2.0.0',
      'react-native-safe-area-context': '>=4.0.0',
      'react-native-screens': '>=4.0.0',
    },
  },
  'react-native-gesture-handler': {
    version: '3.1.0',
    peerDependencies: { react: '*', 'react-native': '*' },
  },
  'react-native-screens': {
    version: '4.26.2',
    peerDependencies: { react: '*', 'react-native': '*' },
  },
};

assert.deepStrictEqual(getNavigationRuntimeCohortErrors({ dependencies, installedPackages }), []);
assert(
  getNavigationRuntimeCohortErrors({
    dependencies: { ...dependencies, '@react-navigation/native': '7.3.8' },
    installedPackages,
  }).some(error => error.includes('@react-navigation/native dependency must be 7.3.11')),
);
assert(
  getNavigationRuntimeCohortErrors({
    dependencies,
    installedPackages: {
      ...installedPackages,
      '@react-navigation/stack': {
        ...installedPackages['@react-navigation/stack'],
        peerDependencies: {
          ...installedPackages['@react-navigation/stack'].peerDependencies,
          'react-native-safe-area-context': '>=6.0.0',
        },
      },
    },
  }).some(error => error.includes('@react-navigation/stack peer react-native-safe-area-context range >=6.0.0 does not accept 5.8.0')),
);
assert(
  getNavigationRuntimeCohortErrors({
    dependencies,
    installedPackages: {
      ...installedPackages,
      '@react-navigation/bottom-tabs': {
        ...installedPackages['@react-navigation/bottom-tabs'],
        peerDependencies: {
          ...installedPackages['@react-navigation/bottom-tabs'].peerDependencies,
          react: undefined,
        },
      },
    },
  }).some(error => error.includes('@react-navigation/bottom-tabs must declare the react peer range')),
);
assert(
  getNavigationRuntimeCohortErrors({
    dependencies,
    installedPackages: {
      ...installedPackages,
      'react-native-screens': { ...installedPackages['react-native-screens'], version: '4.26.1' },
    },
  }).some(error => error.includes('react-native-screens installed version must be 4.26.2')),
);
assert(
  getNavigationRuntimeCohortErrors({
    dependencies,
    installedPackages: {
      ...installedPackages,
      '@react-navigation/stack': {
        ...installedPackages['@react-navigation/stack'],
        peerDependencies: {
          ...installedPackages['@react-navigation/stack'].peerDependencies,
          '@react-navigation/native': '^8.0.0',
        },
      },
    },
  }).some(error => error.includes('does not accept 7.3.11')),
);

console.log('Navigation runtime cohort guard checks are valid.');

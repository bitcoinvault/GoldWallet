import assert from 'assert';

import {
  expectedNavigationRuntimeVersions,
  getNavigationRuntimeCohortErrors,
} from './navigationRuntimeCohortGuard.mjs';

const dependencies = {
  react: '19.2.3',
  'react-native': '0.86.2',
  ...Object.fromEntries(expectedNavigationRuntimeVersions),
};
const installedPackages = {
  '@react-navigation/bottom-tabs': {
    version: '7.18.16',
    peerDependencies: {
      '@react-navigation/native': '^7.3.16',
      react: '>=18.2.0',
      'react-native': '*',
      'react-native-safe-area-context': '>=4.0.0',
      'react-native-screens': '>=4.0.0',
    },
  },
  '@react-navigation/devtools': { version: '7.1.12', peerDependencies: { react: '>=18.2.0' } },
  '@react-navigation/core': {
    version: '7.21.12',
    peerDependencies: { react: '>=18.2.0' },
  },
  '@react-navigation/elements': {
    version: '2.9.38',
    peerDependencies: {
      '@react-native-masked-view/masked-view': '>=0.2.0',
      '@react-navigation/native': '^7.3.16',
      react: '>=18.2.0',
      'react-native': '*',
      'react-native-safe-area-context': '>=4.0.0',
    },
    peerDependenciesMeta: {
      '@react-native-masked-view/masked-view': { optional: true },
    },
  },
  '@react-navigation/native': {
    version: '7.3.16',
    peerDependencies: { react: '>=18.2.0', 'react-native': '*' },
  },
  '@react-navigation/stack': {
    version: '7.10.22',
    peerDependencies: {
      '@react-navigation/native': '^7.3.16',
      react: '>=18.2.0',
      'react-native': '*',
      'react-native-gesture-handler': '>=2.0.0',
      'react-native-safe-area-context': '>=4.0.0',
      'react-native-screens': '>=4.0.0',
    },
  },
  '@react-navigation/routers': { version: '7.6.4' },
  'react-native-gesture-handler': {
    version: '3.1.0',
    peerDependencies: { react: '*', 'react-native': '*' },
  },
  'react-native-safe-area-context': {
    version: '5.8.1',
    peerDependencies: { react: '*', 'react-native': '*' },
  },
  'react-native-screens': {
    version: '4.27.0',
    peerDependencies: { react: '*', 'react-native': '*' },
  },
};

assert.deepStrictEqual(getNavigationRuntimeCohortErrors({ dependencies, installedPackages }), []);
assert(
  getNavigationRuntimeCohortErrors({
    dependencies,
    installedPackages: {
      ...installedPackages,
      'react-native-safe-area-context': {
        ...installedPackages['react-native-safe-area-context'],
        peerDependencies: { react: '*', 'react-native': '>=0.87.0' },
      },
    },
  }).some(error => error.includes('react-native-safe-area-context peer react-native range >=0.87.0 does not accept 0.86.2')),
);
assert(
  getNavigationRuntimeCohortErrors({
    dependencies,
    installedPackages: {
      ...installedPackages,
      '@react-navigation/core': { ...installedPackages['@react-navigation/core'], version: '7.21.9' },
    },
  }).some(error => error.includes('@react-navigation/core installed version must be 7.21.12')),
);
assert(
  getNavigationRuntimeCohortErrors({
    dependencies,
    installedPackages: {
      ...installedPackages,
      '@react-navigation/elements': {
        ...installedPackages['@react-navigation/elements'],
        peerDependenciesMeta: {},
      },
    },
  }).some(error => error.includes('@react-navigation/elements peer @react-native-masked-view/masked-view range >=0.2.0 does not accept <missing>')),
);
assert(
  getNavigationRuntimeCohortErrors({
    dependencies: { ...dependencies, '@react-navigation/native': '7.3.8' },
    installedPackages,
  }).some(error => error.includes('@react-navigation/native dependency must be 7.3.16')),
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
  }).some(error => error.includes('@react-navigation/stack peer react-native-safe-area-context range >=6.0.0 does not accept 5.8.1')),
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
      'react-native-screens': { ...installedPackages['react-native-screens'], version: '4.26.2' },
    },
  }).some(error => error.includes('react-native-screens installed version must be 4.27.0')),
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
  }).some(error => error.includes('does not accept 7.3.16')),
);

console.log('Navigation runtime cohort guard checks are valid.');

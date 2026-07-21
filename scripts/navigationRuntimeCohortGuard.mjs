import semver from 'semver';

export const expectedNavigationRuntimeVersions = new Map([
  ['@react-navigation/bottom-tabs', '7.18.13'],
  ['@react-navigation/devtools', '7.1.10'],
  ['@react-navigation/native', '7.3.13'],
  ['@react-navigation/stack', '7.10.16'],
  ['react-native-gesture-handler', '3.1.0'],
  ['react-native-screens', '4.26.2'],
]);

export const expectedNavigationRuntimeInstalledVersions = new Map([
  ...expectedNavigationRuntimeVersions,
  ['@react-navigation/core', '7.21.10'],
  ['@react-navigation/elements', '2.9.35'],
  ['@react-navigation/routers', '7.6.4'],
]);

const expectedPeerNames = new Map([
  ['@react-navigation/bottom-tabs', ['@react-navigation/native', 'react', 'react-native', 'react-native-safe-area-context', 'react-native-screens']],
  ['@react-navigation/core', ['react']],
  ['@react-navigation/devtools', ['react']],
  ['@react-navigation/elements', ['@react-native-masked-view/masked-view', '@react-navigation/native', 'react', 'react-native', 'react-native-safe-area-context']],
  ['@react-navigation/native', ['react', 'react-native']],
  ['@react-navigation/stack', ['@react-navigation/native', 'react', 'react-native', 'react-native-gesture-handler', 'react-native-safe-area-context', 'react-native-screens']],
  ['react-native-gesture-handler', ['react', 'react-native']],
  ['react-native-screens', ['react', 'react-native']],
]);

export const getNavigationRuntimeCohortErrors = ({ dependencies = {}, installedPackages = {} }) => {
  const errors = [];

  for (const [packageName, expectedVersion] of expectedNavigationRuntimeVersions) {
    if (dependencies[packageName] !== expectedVersion) {
      errors.push(`${packageName} dependency must be ${expectedVersion}; received ${dependencies[packageName] || '<missing>'}`);
    }
  }

  for (const [packageName, expectedVersion] of expectedNavigationRuntimeInstalledVersions) {
    const installedVersion = installedPackages[packageName]?.version;
    if (installedVersion !== expectedVersion) {
      errors.push(`${packageName} installed version must be ${expectedVersion}; received ${installedVersion || '<missing>'}`);
    }
  }

  const runtimeVersions = {
    ...dependencies,
    ...Object.fromEntries(Object.entries(installedPackages).map(([name, packageJson]) => [name, packageJson.version])),
  };
  for (const [owner, peerNames] of expectedPeerNames) {
    for (const peer of peerNames) {
      const range = installedPackages[owner]?.peerDependencies?.[peer];
      const version = runtimeVersions[peer];
      const optional = installedPackages[owner]?.peerDependenciesMeta?.[peer]?.optional === true;
      if (!range) {
        errors.push(`${owner} must declare the ${peer} peer range`);
      } else if (!version && optional) {
        continue;
      } else if (!version || !semver.satisfies(version, range, { includePrerelease: true })) {
        errors.push(`${owner} peer ${peer} range ${range} does not accept ${version || '<missing>'}`);
      }
    }
  }

  return errors;
};

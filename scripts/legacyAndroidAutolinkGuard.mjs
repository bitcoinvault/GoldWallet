export const expectedDisabledAndroidAutolinkPackages = new Set(['react-native-prompt-android']);

export const getLegacyAndroidAutolinkErrors = dependencies => {
  const errors = [];
  const dependencyConfig = dependencies || {};

  expectedDisabledAndroidAutolinkPackages.forEach(packageName => {
    const androidConfig = dependencyConfig[packageName]?.platforms?.android;

    if (androidConfig !== null) {
      errors.push(`${packageName} must keep Android autolinking disabled in react-native.config.js`);
    }
  });

  Object.entries(dependencyConfig).forEach(([packageName, config]) => {
    if (config?.platforms?.android === null && !expectedDisabledAndroidAutolinkPackages.has(packageName)) {
      errors.push(`${packageName} disables Android autolinking but is not in the guarded legacy allowlist`);
    }
  });

  return errors;
};

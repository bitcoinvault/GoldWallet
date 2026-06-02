export const expectedDisabledAndroidAutolinkPackages = new Set(['react-native-camera']);

export const getLegacyAndroidAutolinkErrors = dependencies => {
  const errors = [];
  const dependencyConfig = dependencies || {};

  const promptAndroidConfig = dependencyConfig['react-native-prompt-android']?.platforms?.android;

  if (promptAndroidConfig === null) {
    errors.push('react-native-prompt-android must keep Android autolinking enabled for encrypted-storage password prompts');
  }

  Object.entries(dependencyConfig).forEach(([packageName, config]) => {
    if (config?.platforms?.android === null && !expectedDisabledAndroidAutolinkPackages.has(packageName)) {
      errors.push(`${packageName} disables Android autolinking but is not in the guarded legacy allowlist`);
    }
  });

  return errors;
};

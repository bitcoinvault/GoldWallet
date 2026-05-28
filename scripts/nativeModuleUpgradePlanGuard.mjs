import { expectedNativeModuleDependencies } from './nativeModuleInventoryGuard.mjs';

export const getNativeModuleUpgradePlanErrors = planContent => {
  const missingPackages = [...expectedNativeModuleDependencies.keys()].filter(
    packageName => !planContent.includes(`\`${packageName}\``),
  );
  const missingVersionLines = [...expectedNativeModuleDependencies].filter(
    ([packageName, expectedVersion]) =>
      !planContent
        .split(/\r?\n/)
        .some(line => line.includes(`\`${packageName}\``) && line.includes(`\`${expectedVersion}\``)),
  );
  const errors = [];

  if (missingPackages.length > 0) {
    errors.push({
      label: 'Native module upgrade plan is missing inventory packages',
      packages: missingPackages,
    });
  }

  if (missingVersionLines.length > 0) {
    errors.push({
      label: 'Native module upgrade plan is missing inventory package versions',
      packages: missingVersionLines.map(([packageName, expectedVersion]) => `${packageName} -> ${expectedVersion}`),
    });
  }

  return errors;
};

export const formatNativeModuleUpgradePlanErrors = errors =>
  errors.map(error => `${error.label}:\n${error.packages.map(packageName => `- ${packageName}`).join('\n')}`).join('\n');

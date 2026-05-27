import { expectedNativeModuleDependencies } from './nativeModuleInventoryGuard.mjs';

export const getNativeModuleUpgradePlanErrors = planContent => {
  const missingPackages = [...expectedNativeModuleDependencies.keys()].filter(
    packageName => !planContent.includes(`\`${packageName}\``),
  );

  if (missingPackages.length === 0) {
    return [];
  }

  return [
    {
      label: 'Native module upgrade plan is missing inventory packages',
      packages: missingPackages,
    },
  ];
};

export const formatNativeModuleUpgradePlanErrors = errors =>
  errors.map(error => `${error.label}:\n${error.packages.map(packageName => `- ${packageName}`).join('\n')}`).join('\n');

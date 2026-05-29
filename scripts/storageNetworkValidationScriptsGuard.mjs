export const requiredStorageNetworkValidationScripts = new Map([
  ['test:secure-storage:unit', 'tests/unit/SecureStorageService.test.js'],
  ['test:storage', 'tests/integration/Storage.test.js'],
  ['test:authenticator', 'tests/integration/authenticator.test.js'],
  ['test:wallet-core:offline', 'tests/integration/App.offline.test.js'],
]);

export const aggregateStorageNetworkValidationScript = 'test:storage-network:focused';

export const getStorageNetworkValidationScriptErrors = scripts => {
  const errors = [];
  const scriptMap = scripts instanceof Map ? scripts : new Map(Object.entries(scripts || {}));
  const prepushScript = scriptMap.get('prepush') || '';
  const aggregateScript = scriptMap.get(aggregateStorageNetworkValidationScript) || '';

  if (!aggregateScript) {
    errors.push(`${aggregateStorageNetworkValidationScript} is missing from package scripts.`);
  }

  requiredStorageNetworkValidationScripts.forEach((requiredTestPath, scriptName) => {
    const scriptValue = scriptMap.get(scriptName);

    if (!scriptValue) {
      errors.push(`${scriptName} is missing from package scripts.`);
      return;
    }

    if (!scriptValue.includes(requiredTestPath)) {
      errors.push(`${scriptName} does not run ${requiredTestPath}.`);
    }

    if (!prepushScript.includes(`yarn ${scriptName}`)) {
      errors.push(`prepush does not run yarn ${scriptName}.`);
    }

    if (aggregateScript && !aggregateScript.includes(`yarn ${scriptName}`)) {
      errors.push(`${aggregateStorageNetworkValidationScript} does not run yarn ${scriptName}.`);
    }
  });

  return errors;
};

export const getStorageNetworkValidationFileErrors = (fileExists, root = '') => {
  const errors = [];

  requiredStorageNetworkValidationScripts.forEach(requiredTestPath => {
    if (!fileExists(requiredTestPath, root)) {
      errors.push(`${requiredTestPath} does not exist.`);
    }
  });

  return errors;
};

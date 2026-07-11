export const requiredStorageNetworkValidationScripts = new Map([
  ['test:terms-webview:unit', 'tests/unit/TermsWebViewScreens.test.tsx'],
  ['test:electrum-reconnect:unit', 'tests/unit/BlueElectrum.test.js'],
  ['test:secure-storage:unit', 'tests/unit/SecureStorageService.test.js'],
  ['test:storage', 'tests/integration/Storage.test.js'],
  ['test:authenticator', 'tests/integration/authenticator.test.js'],
  ['test:wallet-core:offline', 'tests/integration/App.offline.test.js'],
]);

export const aggregateStorageNetworkValidationScript = 'test:storage-network:focused';
export const onlineElectrumIntegrationTests = [
  'tests/integration/App.test.js',
  'tests/integration/Electrum.test.js',
  'tests/integration/HDWallet.test.js',
  'tests/integration/hd-segwit-bech32-wallet.test.js',
  'tests/integration/WatchOnlyWallet.test.js',
];

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

export const getStorageNetworkValidationRuntimeGuardErrors = readFile => {
  const errors = [];
  const read = filePath => readFile(filePath) || '';
  const blueElectrum = read('BlueElectrum.js');
  const unitBlueElectrumTest = read('tests/unit/BlueElectrum.test.js');
  const jestSetup = read('tests/setup.js');

  [
    'BLUEELECTRUM_AUTO_CONNECT',
    "process.env.NODE_ENV !== 'test'",
    'const reconnectBaseDelayMs = 1000;',
    'const reconnectMaxDelayMs = 30000;',
    'const getReconnectDelayMs = () =>',
    'Math.min(reconnectMaxDelayMs',
    'if (shouldAutoConnect)',
    'connectMain();',
    'reconnectAttempts += 1;',
    'await wait(reconnectDelayMs);',
    'mainConnected = false;',
    'reconnectAttempts = 0;',
    "typeof mainClient.close === 'function'",
  ].forEach(snippet => {
    if (!blueElectrum.includes(snippet)) {
      errors.push(`BlueElectrum.js is missing test-safe auto-connect/teardown snippet: ${snippet}`);
    }
  });

  if (blueElectrum.includes('await wait(50);')) {
    errors.push('BlueElectrum.js must not use the legacy 50ms reconnect loop.');
  }

  [
    "process.env.BLUEELECTRUM_AUTO_CONNECT = 'true'",
    'delete process.env.BLUEELECTRUM_AUTO_CONNECT',
  ].forEach(snippet => {
    if (!unitBlueElectrumTest.includes(snippet)) {
      errors.push(`tests/unit/BlueElectrum.test.js is missing explicit reconnect-test opt-in snippet: ${snippet}`);
    }
  });

  [
    "jest.mock('@sentry/react-native'",
    'addBreadcrumb: jest.fn()',
    'captureException: jest.fn()',
  ].forEach(snippet => {
    if (!jestSetup.includes(snippet)) {
      errors.push(`tests/setup.js is missing Sentry Jest mock snippet: ${snippet}`);
    }
  });

  onlineElectrumIntegrationTests.forEach(filePath => {
    const contents = read(filePath);

    if (!contents.includes("process.env.BLUEELECTRUM_AUTO_CONNECT = 'true'")) {
      errors.push(`${filePath} must opt in before using real BlueElectrum integration coverage.`);
    }
  });

  return errors;
};

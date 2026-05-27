import {
  getStorageNetworkValidationFileErrors,
  getStorageNetworkValidationScriptErrors,
  requiredStorageNetworkValidationScripts,
} from './storageNetworkValidationScriptsGuard.mjs';

const validScripts = {
  'test:storage': 'node node_modules/jest/bin/jest.js tests/integration/Storage.test.js --forceExit',
  'test:authenticator': 'node node_modules/jest/bin/jest.js tests/integration/authenticator.test.js --forceExit',
  'test:wallet-core:offline': 'node node_modules/jest/bin/jest.js tests/integration/App.offline.test.js --forceExit',
  prepush: 'yarn android:dev:check-light && yarn test:storage && yarn test:authenticator && yarn test:wallet-core:offline',
};
const missingScriptFixture = { ...validScripts };
delete missingScriptFixture['test:storage'];
const wrongTargetFixture = {
  ...validScripts,
  'test:authenticator': 'node node_modules/jest/bin/jest.js tests/integration/Other.test.js --forceExit',
};
const missingPrepushFixture = {
  ...validScripts,
  prepush: 'yarn android:dev:check-light && yarn test:storage && yarn test:wallet-core:offline',
};

const assertAccepted = (label, scripts) => {
  const errors = getStorageNetworkValidationScriptErrors(scripts);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, scripts) => {
  const errors = getStorageNetworkValidationScriptErrors(scripts);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Complete storage/network validation script fixture', validScripts);
assertRejected('Missing storage test script fixture', missingScriptFixture);
assertRejected('Wrong authenticator test target fixture', wrongTargetFixture);
assertRejected('Missing prepush validation fixture', missingPrepushFixture);

const existingFilesFixture = new Set(requiredStorageNetworkValidationScripts.values());
const missingFilesFixture = new Set(existingFilesFixture);
missingFilesFixture.delete('tests/integration/Storage.test.js');
const fileExists = fileSet => filePath => fileSet.has(filePath);

if (getStorageNetworkValidationFileErrors(fileExists(existingFilesFixture)).length > 0) {
  console.error('Complete storage/network validation file fixture should be accepted.');
  process.exit(1);
}

if (getStorageNetworkValidationFileErrors(fileExists(missingFilesFixture)).length === 0) {
  console.error('Missing storage/network validation file fixture should be rejected.');
  process.exit(1);
}

if (requiredStorageNetworkValidationScripts.size !== 3) {
  console.error(`Expected 3 storage/network validation scripts, got ${requiredStorageNetworkValidationScripts.size}.`);
  process.exit(1);
}

console.log('Storage/network validation script guard checks are valid.');

import {
  expectedAndroidEnvConfigFiles,
  getAndroidEnvConfigFilesErrors,
  parseAndroidEnvConfigFiles,
} from './androidEnvConfigFilesGuard.mjs';

const validFixture = `
project.ext.envConfigFiles = [
  devdebug: ".env.dev.testnet",
  stagedebug: ".env.stage.mainnet",
  proddebug: ".env.prod.mainnet",
  betadebug: ".env.beta.testnet",
  devrelease: ".env.dev.testnet",
  stagerelease: ".env.stage.mainnet",
  prodrelease: ".env.prod.mainnet",
  betarelease: ".env.beta.mainnet",
]
`;

const mismatchedFixture = validFixture.replace('devdebug: ".env.dev.testnet"', 'devdebug: ".env.stage.mainnet"');
const missingFixture = validFixture.replace('  betarelease: ".env.beta.mainnet",\n', '');
const unexpectedFixture = validFixture.replace(']', '  localdebug: ".env.local",\n]');

const assertAccepted = (label, gradleContent) => {
  const errors = getAndroidEnvConfigFilesErrors(parseAndroidEnvConfigFiles(gradleContent));

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, gradleContent) => {
  const errors = getAndroidEnvConfigFilesErrors(parseAndroidEnvConfigFiles(gradleContent));

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Complete Android envConfigFiles fixture', validFixture);
assertRejected('Mismatched Android envConfigFiles fixture', mismatchedFixture);
assertRejected('Missing Android envConfigFiles fixture', missingFixture);
assertRejected('Unexpected Android envConfigFiles fixture', unexpectedFixture);
assertRejected('Missing Android envConfigFiles block fixture', 'android { }');

if (expectedAndroidEnvConfigFiles.size !== 8) {
  console.error(`Expected 8 Android envConfigFiles baseline entries, got ${expectedAndroidEnvConfigFiles.size}.`);
  process.exit(1);
}

console.log('Android envConfigFiles guard checks are valid.');

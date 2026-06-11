import {
  getReleaseServiceEnvKeyErrors,
  parseEnvKeys,
  requiredReleaseServiceEnvKeys,
} from './releaseServiceEnvKeysGuard.mjs';

const fullNonBetaEnv = requiredReleaseServiceEnvKeys.map(key => `${key}=value`).join('\n');
const fullBetaEnv = requiredReleaseServiceEnvKeys.map(key => `${key}=value`).join('\n');
const missingSentryEnv = fullNonBetaEnv.replace('SENTRY_DSN_ANDROID=value\n', '');

const assertAccepted = (label, envKeyEntries) => {
  const errors = getReleaseServiceEnvKeyErrors(envKeyEntries);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, envKeyEntries) => {
  const errors = getReleaseServiceEnvKeyErrors(envKeyEntries);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Complete non-beta env fixture', [
  { envFile: '.env.dev.testnet', keys: parseEnvKeys(fullNonBetaEnv) },
]);
assertAccepted('Complete beta env fixture without CodePush keys', [
  { envFile: '.env.beta.testnet', keys: parseEnvKeys(fullBetaEnv) },
]);
assertRejected('Missing Sentry key fixture', [
  { envFile: '.env.dev.testnet', keys: parseEnvKeys(missingSentryEnv) },
]);
assertRejected('No referenced env files fixture', []);

console.log('Release-service env key guard checks are valid.');

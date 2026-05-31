export const requiredReleaseServiceEnvKeys = [
  'ENVIRONMENT',
  'APPLICATION_NAME',
  'APP_ID',
  'BTCV_NETWORK',
  'HOSTS',
  'PROTOCOL',
  'PORT',
  'ELECTRUM_X_PROTOCOL_VERSION',
  'EXPLORER_URL',
  'SENTRY_DSN_IOS',
  'SENTRY_DSN_ANDROID',
  'CODEPUSH_ENABLED',
  'EMAIL_NOTIFICATIONS_API',
];

export const codePushEnvKeys = ['CODEPUSH_DEPLOYMENT_KEY_ANDROID', 'CODEPUSH_DEPLOYMENT_KEY_IOS'];

export const parseEnvKeys = content => {
  const keys = new Set();

  content.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);

    if (match) {
      keys.add(match[1]);
    }
  });

  return keys;
};

export const getReleaseServiceEnvKeyErrors = envKeyEntries => {
  const errors = [];

  if (envKeyEntries.length === 0) {
    return ['No referenced .env files found in Android envConfigFiles or iOS schemes.'];
  }

  envKeyEntries.forEach(({ envFile, keys }) => {
    const keySet = keys instanceof Set ? keys : new Set(keys);
    const missingRequiredKeys = requiredReleaseServiceEnvKeys.filter(key => !keySet.has(key));
    const shouldRequireCodePush = !envFile.includes('.beta.');
    const missingCodePushKeys = shouldRequireCodePush ? codePushEnvKeys.filter(key => !keySet.has(key)) : [];

    [...missingRequiredKeys, ...missingCodePushKeys].forEach(key => {
      errors.push(`${envFile} is missing ${key}`);
    });
  });

  return errors;
};

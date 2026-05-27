import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidBuildGradlePath = path.join(root, 'android', 'app', 'build.gradle');
const iosSchemesDir = path.join(root, 'ios', 'GoldWallet.xcodeproj', 'xcshareddata', 'xcschemes');
const schemeFiles = [
  'GoldWallet (Debug).xcscheme',
  'GoldWallet (Release).xcscheme',
  'GoldWallet Beta (Debug).xcscheme',
  'GoldWallet Beta (Release).xcscheme',
  'GoldWallet Dev (Debug).xcscheme',
  'GoldWallet Dev (Release).xcscheme',
  'GoldWallet Stage (Debug).xcscheme',
  'GoldWallet Stage (Release).xcscheme',
];
const requiredKeys = [
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
  'EMAIL_NOTIFICATIONS_API',
];
const codePushKeys = ['CODEPUSH_DEPLOYMENT_KEY_ANDROID', 'CODEPUSH_DEPLOYMENT_KEY_IOS'];

const read = filePath => readFileSync(filePath, 'utf8');
const normalizeEnvName = envName => envName.replace(/&quot;/g, '"');

const androidEnvFiles = [
  ...read(androidBuildGradlePath).matchAll(/['"](\.env\.[A-Za-z0-9_.-]+)['"]/g),
].map(match => match[1]);
const iosEnvFiles = schemeFiles.flatMap(schemeFile => {
  const scheme = read(path.join(iosSchemesDir, schemeFile));

  return [...scheme.matchAll(/\.env\.[A-Za-z0-9_.-]+/g)].map(match => normalizeEnvName(match[0]));
});
const referencedEnvFiles = [...new Set([...androidEnvFiles, ...iosEnvFiles])].sort();

const parseEnvKeys = envFile => {
  const content = read(path.join(root, envFile));
  const keys = new Set();

  content.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);

    if (match) {
      keys.add(match[1]);
    }
  });

  return keys;
};

const errors = [];

if (referencedEnvFiles.length === 0) {
  errors.push('No referenced .env files found in Android envConfigFiles or iOS schemes.');
}

referencedEnvFiles.forEach(envFile => {
  const keys = parseEnvKeys(envFile);
  const missingRequiredKeys = requiredKeys.filter(key => !keys.has(key));
  const shouldRequireCodePush = !envFile.includes('.beta.');
  const missingCodePushKeys = shouldRequireCodePush ? codePushKeys.filter(key => !keys.has(key)) : [];

  [...missingRequiredKeys, ...missingCodePushKeys].forEach(key => {
    errors.push(`${envFile} is missing ${key}`);
  });
});

if (errors.length > 0) {
  console.error('Release-service env key guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Release-service env keys are present for ${referencedEnvFiles.length} referenced env files.`);

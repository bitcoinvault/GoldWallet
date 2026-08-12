import { readFileSync } from 'fs';

import { isSentryTimestampDeserializationError } from './androidSentryLogFindings.mjs';

const fail = message => {
  console.error(message);
  process.exit(1);
};

const positiveFixtures = [
  '08-12 20:00:00.000 100 200 E RNSentry: Error when deserializing millis timestamp format.',
  '08-12 20:00:00.001 100 200 E RNSentry: java.lang.IllegalArgumentException: timestamp is not millis format 58583-11-05T10:52:49.000Z',
];
const negativeFixtures = [
  '08-12 20:00:00.000 100 200 I RNSentry: Error when deserializing millis timestamp format.',
  '08-12 20:00:00.000 100 200 E RNSentry: unrelated transport warning',
  '08-12 20:00:00.000 100 200 E ReactNativeJS: ElectrumXConnectionError',
];

if (!positiveFixtures.every(isSentryTimestampDeserializationError)) {
  fail('Android Sentry log finding guard did not classify a known timestamp-deserialization error.');
}

if (negativeFixtures.some(isSentryTimestampDeserializationError)) {
  fail('Android Sentry log finding guard classified an unrelated line as a timestamp-deserialization error.');
}

for (const scriptPath of [
  'scripts/androidSmokeDev.mjs',
  'scripts/androidCreateWalletSmoke.mjs',
  'scripts/androidImportWalletSmoke.mjs',
]) {
  const source = readFileSync(scriptPath, 'utf8');
  if (!source.includes("from './androidSentryLogFindings.mjs'")) {
    fail(`${scriptPath} does not import the shared Sentry runtime-log classifier.`);
  }
  if (!source.includes('isSentryTimestampDeserializationError(line)')) {
    fail(`${scriptPath} does not apply the shared Sentry runtime-log classifier.`);
  }
}

const loggerSource = readFileSync('logger/index.ts', 'utf8');
if (/Sentry\.addBreadcrumb\([\s\S]*?timestamp\s*:\s*(?:new Date\(\)\.getTime\(\)|Date\.now\(\))/m.test(loggerSource)) {
  fail('GoldWallet logger still sends a millisecond breadcrumb timestamp to Sentry.');
}

console.log('Android Sentry runtime-log guard checks passed.');

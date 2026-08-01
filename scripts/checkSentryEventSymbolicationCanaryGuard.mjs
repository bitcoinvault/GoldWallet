import assert from 'assert';
import { readFileSync } from 'fs';

import {
  getExecutedGradleCanaryEvidence,
  getSentryDsnConfig,
  getSentryEventSymbolicationEvidence,
  invalidateSentryEventCanaryEvidence,
  renderSentryEventEnvelope,
  renderSentryEventSymbolicationSummary,
  selectSymbolicationMapping,
} from './sentryEventSymbolicationCanary.mjs';

const debugId = 'e8c40da4-a7b7-40ea-9647-0f8dff19ab2d';
const release = 'goldwallet-android-gradle-canary@6.5.1+14-dc406df176fd';
const gradleSummary = `
Mode: executed
Project: goldwallet-dev-android
Project ID: 5875208
Project ID/slug API binding verified: yes
Canary release: ${release}
Distribution: 14
Input identity: dc406df176fdb1521765aa1c2df4640234352dedfa53675dc42e34a8d6bc0add
Artifact bundle ID: 4e574f79-0167-512b-b664-5402b2681b40
Bundle/source-map debug ID: ${debugId}
Gradle build and upload validation: passed
`;
const canary = getExecutedGradleCanaryEvidence(gradleSummary);
assert.deepStrictEqual(canary.errors, []);
assert(getExecutedGradleCanaryEvidence(gradleSummary.replace('Mode: executed', 'Mode: dry-run')).errors.length > 0);

const mapping = selectSymbolicationMapping([
  { source: 'D:\\repo\\App.tsx', name: 'getNewKey', generatedLine: 1, generatedColumn: 10, originalLine: 33 },
  {
    source: 'D:\\repo\\App.tsx',
    name: 'getNewKey',
    generatedLine: 1,
    generatedColumn: 3366531,
    originalLine: 41,
  },
]);
assert.strictEqual(mapping.originalLine, 41);
assert.throws(() => selectSymbolicationMapping([]), /Unable to find executable/);

const dsn = getSentryDsnConfig('https://public-key@o1.ingest.sentry.io/5875208');
assert.strictEqual(dsn.projectId, '5875208');
assert.throws(() => getSentryDsnConfig('https://public-key@o1.ingest.sentry.io/5875213'), /project ID mismatch/);
assert.throws(() => getSentryDsnConfig('https://public-key@example.com/5875208'), /Sentry ingest hostname/);

const eventId = '11111111111111111111111111111111';
const envelope = renderSentryEventEnvelope({
  dsn: 'https://public-key@o1.ingest.sentry.io/5875208',
  event: { event_id: eventId, message: 'canary' },
});
assert(envelope.includes(eventId));
assert(!envelope.includes('auth-token'));

const processedEvent = {
  eventID: eventId,
  projectID: '5875208',
  release,
  dist: '14',
  user: { ipAddress: '0.0.0.0' },
  tags: [
    { key: 'environment', value: 'dev-canary' },
    { key: 'goldwallet.canary', value: 'sentry-event-symbolication' },
    { key: 'goldwallet.wallet_data', value: 'none' },
  ],
  entries: [
    {
      type: 'exception',
      data: {
        values: [
          {
            stacktrace: {
              frames: [{ filename: 'App.tsx', lineNo: 41, function: 'getNewKey' }],
            },
          },
        ],
      },
    },
  ],
};
const evidence = getSentryEventSymbolicationEvidence({
  event: processedEvent,
  expected: { eventId, projectId: '5875208', release, dist: '14', source: 'App.tsx', originalLine: 41 },
});
assert(evidence.passed);
const expected = { eventId, projectId: '5875208', release, dist: '14', source: 'App.tsx', originalLine: 41 };
const mutations = [
  { eventID: '22222222222222222222222222222222' },
  { projectID: '5875213' },
  { dist: '15' },
  { tags: processedEvent.tags.map(tag => (tag.key === 'goldwallet.canary' ? { ...tag, value: 'wrong' } : tag)) },
  { tags: processedEvent.tags.map(tag => (tag.key === 'goldwallet.wallet_data' ? { ...tag, value: 'present' } : tag)) },
  { user: { ipAddress: '203.0.113.1' } },
];
for (const mutation of mutations) {
  assert(!getSentryEventSymbolicationEvidence({ event: { ...processedEvent, ...mutation }, expected }).passed);
}
assert(
  !getSentryEventSymbolicationEvidence({ event: processedEvent, expected: { ...expected, originalLine: 42 } }).passed,
);

const removed = [];
assert.strictEqual(
  invalidateSentryEventCanaryEvidence({
    execute: true,
    summaryPath: 'executed.txt',
    dryRunSummaryPath: 'dry-run.txt',
    remove: (...args) => removed.push(args),
  }),
  'executed.txt',
);
assert.strictEqual(
  invalidateSentryEventCanaryEvidence({
    execute: false,
    summaryPath: 'executed.txt',
    dryRunSummaryPath: 'dry-run.txt',
    remove: (...args) => removed.push(args),
  }),
  'dry-run.txt',
);
assert.deepStrictEqual(
  removed.map(([file, options]) => [file, options.force]),
  [
    ['executed.txt', true],
    ['dry-run.txt', true],
  ],
);
const summary = renderSentryEventSymbolicationSummary({
  canary,
  mapping,
  executed: true,
  eventId,
  evidence,
});
assert(summary.includes('Non-production event symbolication validation: passed'));
assert(summary.includes('Production event symbolication validation: not claimed'));
assert(summary.includes('Wallet data included: no'));

const runner = readFileSync('scripts/runSentryEventSymbolicationCanary.mjs', 'utf8');
assert(runner.includes('SENTRY_ANDROID_CANARY_PROJECT'));
assert(runner.includes("read('.env.dev.testnet')"));
assert(runner.includes("type: 'sourcemap'"));
assert(runner.includes('debug_id: canary.debugId'));
const invalidationCall = runner.indexOf('const outputPath = invalidateSentryEventCanaryEvidence({');
const credentialCall = runner.indexOf('const credential = resolveSentryManagedCredential();');
assert(invalidationCall >= 0);
assert(credentialCall >= 0);
assert(invalidationCall < credentialCall);
assert(runner.includes("user: { ip_address: '0.0.0.0' }"));

console.log('Sentry event symbolication canary guard checks passed.');

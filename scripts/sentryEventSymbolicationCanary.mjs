import path from 'path';

export const SENTRY_EVENT_CANARY_ENVIRONMENT = 'dev-canary';
export const SENTRY_EVENT_CANARY_SOURCE = 'App.tsx';
export const SENTRY_EVENT_CANARY_FUNCTION = 'getNewKey';
export const SENTRY_EVENT_CANARY_TAG = 'sentry-event-symbolication';
export const SENTRY_EVENT_CANARY_WALLET_DATA_TAG = 'none';

const getSummaryValue = (summary, label) =>
  summary
    .split(/\r?\n/)
    .find(line => line.startsWith(`${label}: `))
    ?.slice(label.length + 2);

export const getExecutedGradleCanaryEvidence = summary => {
  const evidence = {
    mode: getSummaryValue(summary, 'Mode'),
    project: getSummaryValue(summary, 'Project'),
    projectId: getSummaryValue(summary, 'Project ID'),
    projectIdentityVerified: getSummaryValue(summary, 'Project ID/slug API binding verified'),
    release: getSummaryValue(summary, 'Canary release'),
    dist: getSummaryValue(summary, 'Distribution'),
    inputIdentity: getSummaryValue(summary, 'Input identity'),
    bundleId: getSummaryValue(summary, 'Artifact bundle ID'),
    debugId: getSummaryValue(summary, 'Bundle/source-map debug ID'),
    uploadValidation: getSummaryValue(summary, 'Gradle build and upload validation'),
  };
  const errors = [];
  if (evidence.mode !== 'executed') errors.push('Gradle canary evidence was not executed');
  if (evidence.project !== 'goldwallet-dev-android') errors.push('Gradle canary project is not isolated');
  if (evidence.projectId !== '5875208') errors.push('Gradle canary project ID is invalid');
  if (evidence.projectIdentityVerified !== 'yes') errors.push('Gradle canary project identity is unverified');
  if (evidence.uploadValidation !== 'passed') errors.push('Gradle upload validation did not pass');
  if (!/^[a-f0-9-]{36}$/.test(evidence.debugId || '')) errors.push('Gradle canary debug ID is invalid');
  if (!/^[a-f0-9]{64}$/.test(evidence.inputIdentity || '')) errors.push('Gradle canary input identity is invalid');
  if (!evidence.release?.startsWith('goldwallet-android-gradle-canary@')) errors.push('Canary release is invalid');
  if (!/^\d+$/.test(evidence.dist || '')) errors.push('Canary distribution is invalid');
  return { ...evidence, errors };
};

export const selectSymbolicationMapping = mappings => {
  const candidates = mappings.filter(mapping => {
    const source = (mapping.source || '').split(path.sep).join('/');
    return (
      source.endsWith(`/${SENTRY_EVENT_CANARY_SOURCE}`) &&
      mapping.name === SENTRY_EVENT_CANARY_FUNCTION &&
      mapping.generatedLine > 0 &&
      mapping.generatedColumn > 1_000_000 &&
      mapping.originalLine > 0
    );
  });
  if (candidates.length === 0) throw new Error('Unable to find executable App.tsx getNewKey source-map mapping');
  return candidates.sort((left, right) => left.generatedColumn - right.generatedColumn)[0];
};

export const getSentryDsnConfig = (dsn, expectedProjectId = '5875208') => {
  const url = new URL(dsn);
  const projectId = url.pathname.split('/').filter(Boolean).at(-1);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.sentry.io')) {
    throw new Error('Sentry event canary DSN must use HTTPS and a Sentry ingest hostname');
  }
  if (projectId !== expectedProjectId) throw new Error('Sentry event canary DSN project ID mismatch');
  if (!url.username) throw new Error('Sentry event canary DSN public key is missing');
  return {
    projectId,
    publicKey: url.username,
    envelopeEndpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
  };
};

export const renderSentryEventEnvelope = ({ dsn, event }) =>
  [
    JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString(), dsn }),
    JSON.stringify({ type: 'event', content_type: 'application/json' }),
    JSON.stringify(event),
  ].join('\n');

const getExceptionFrames = event =>
  (event?.entries || [])
    .filter(entry => entry.type === 'exception')
    .flatMap(entry => entry.data?.values || [])
    .flatMap(value => value.stacktrace?.frames || []);

const getEventTag = (event, key) => event?.tags?.find(tag => tag.key === key)?.value;

const hasIdentifyingUserData = (value, key = '') => {
  if (value == null) return false;
  if ((key === 'ipAddress' || key === 'ip_address') && value === '0.0.0.0') return false;
  if (Array.isArray(value)) return value.some(item => hasIdentifyingUserData(item));
  if (typeof value === 'object') {
    return Object.entries(value).some(([childKey, childValue]) => hasIdentifyingUserData(childValue, childKey));
  }
  return String(value).trim().length > 0;
};

export const getSentryEventSymbolicationEvidence = ({ event, expected }) => {
  const frames = getExceptionFrames(event);
  const sourceFrame = frames.find(frame => {
    const filename = frame.filename || frame.absPath || '';
    return filename.replaceAll('\\', '/').endsWith(`/${expected.source}`) || filename === expected.source;
  });
  const actualLine = Number(sourceFrame?.lineNo || sourceFrame?.lineno || 0);
  const checks = {
    eventId: (event?.eventID || event?.id) === expected.eventId,
    projectId: String(event?.projectID || event?.project?.id || '') === expected.projectId,
    release: (event?.release?.version || event?.release) === expected.release,
    distribution: String(event?.dist || getEventTag(event, 'dist') || '') === expected.dist,
    environment: (event?.environment || getEventTag(event, 'environment')) === SENTRY_EVENT_CANARY_ENVIRONMENT,
    canaryTag: getEventTag(event, 'goldwallet.canary') === SENTRY_EVENT_CANARY_TAG,
    walletDataTag: getEventTag(event, 'goldwallet.wallet_data') === SENTRY_EVENT_CANARY_WALLET_DATA_TAG,
    noIdentifyingUserData: !hasIdentifyingUserData(event?.user),
    originalSource: Boolean(sourceFrame),
    originalLine: actualLine === expected.originalLine,
    generatedFrameRemoved: !frames.some(frame =>
      String(frame.absPath || frame.filename || '').includes('index.android.bundle'),
    ),
  };
  return {
    passed: Object.values(checks).every(Boolean),
    actualSource: sourceFrame?.filename || sourceFrame?.absPath || null,
    actualLine: actualLine || null,
    actualFunction: sourceFrame?.function || sourceFrame?.originalFunction || null,
    errors: Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => `${name} missing from processed Sentry event evidence`),
  };
};

export const invalidateSentryEventCanaryEvidence = ({ execute, summaryPath, dryRunSummaryPath, remove }) => {
  const outputPath = execute ? summaryPath : dryRunSummaryPath;
  remove(outputPath, { force: true });
  return outputPath;
};

export const renderSentryEventSymbolicationSummary = ({
  canary,
  mapping,
  executed,
  eventId = null,
  evidence = null,
  generatedAt = new Date(),
}) =>
  [
    'Sentry Android non-production event symbolication canary',
    `Generated at: ${generatedAt.toISOString()}`,
    `Mode: ${executed ? 'executed' : 'dry-run'}`,
    'Organization: decentraplanet',
    'Project: goldwallet-dev-android',
    'Project ID: 5875208',
    `Canary release: ${canary.release}`,
    `Distribution: ${canary.dist}`,
    `Artifact bundle ID: ${canary.bundleId}`,
    `Debug ID: ${canary.debugId}`,
    `Synthetic event ID: ${eventId || 'not available'}`,
    `Expected original source: ${SENTRY_EVENT_CANARY_SOURCE}`,
    `Expected original line: ${mapping.originalLine}`,
    `Generated frame: index.android.bundle:${mapping.generatedLine}:${mapping.generatedColumn + 1}`,
    `Processed original source: ${evidence?.actualSource || 'not available'}`,
    `Processed original line: ${evidence?.actualLine || 'not available'}`,
    `Processed original function: ${evidence?.actualFunction || 'not available'}`,
    `Non-production event symbolication validation: ${executed && evidence?.passed ? 'passed' : 'not claimed'}`,
    'Production event symbolication validation: not claimed',
    'iOS event symbolication validation: not claimed',
    'Wallet data included: no',
    'Secret values printed: no',
    '',
  ].join('\n');

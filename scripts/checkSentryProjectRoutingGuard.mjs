import {
  collectSentryProjectRoutingAudit,
  sentryEnvProjectExpectations,
  sentryProjectIds,
} from './auditSentryProjectRouting.mjs';

const buildFixture = overrides => relativePath => {
  const expectations = sentryEnvProjectExpectations[relativePath];

  if (!expectations) {
    throw new Error(`Unexpected fixture path: ${relativePath}`);
  }

  return Object.entries(expectations)
    .map(([key, project]) => {
      const projectId = overrides?.[relativePath]?.[key] || sentryProjectIds[project];
      return `${key}=https://public@example.ingest.sentry.io/${projectId}`;
    })
    .join('\n');
};

const validAudit = collectSentryProjectRoutingAudit({ read: buildFixture() });

if (validAudit.errors.length > 0 || validAudit.routes.length !== 11) {
  console.error(`Valid Sentry project routing fixture failed:\n${validAudit.errors.join('\n')}`);
  process.exit(1);
}

const invalidAudit = collectSentryProjectRoutingAudit({
  read: buildFixture({ '.env.prod.mainnet': { SENTRY_DSN_ANDROID: sentryProjectIds['goldwallet-dev-android'] } }),
});

if (!invalidAudit.errors.some(error => error.includes('.env.prod.mainnet SENTRY_DSN_ANDROID'))) {
  console.error('Sentry project routing guard must reject a prod Android DSN targeting the dev project');
  process.exit(1);
}

const invalidHostAudit = collectSentryProjectRoutingAudit({
  read: relativePath => buildFixture()(relativePath).replaceAll('example.ingest.sentry.io', 'example.invalid'),
});

if (invalidHostAudit.errors.length !== 11) {
  console.error('Sentry project routing guard must reject DSNs outside the Sentry HTTPS endpoint');
  process.exit(1);
}

const redactedOutput = JSON.stringify(validAudit);
if (redactedOutput.includes('public@example') || redactedOutput.includes('https://')) {
  console.error('Sentry project routing audit must not retain DSN values');
  process.exit(1);
}

console.log('Sentry project routing guard checks are valid.');

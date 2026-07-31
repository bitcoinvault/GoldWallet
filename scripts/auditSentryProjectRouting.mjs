import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { sentryReleaseProfiles } from './createSentryProperties.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export const sentryProjectIds = {
  goldwallet: '5375289',
  'goldwallet-dev-android': '5875208',
  'goldwallet-dev-ios': '5875201',
  'goldwallet-prod-android': '5875213',
};

export const sentryEnvProjectExpectations = {
  '.env.beta.mainnet': {
    SENTRY_DSN_ANDROID: sentryReleaseProfiles.nonprod.android,
    SENTRY_DSN_IOS: sentryReleaseProfiles.nonprod.ios,
  },
  '.env.beta.testnet': {
    SENTRY_DSN_ANDROID: sentryReleaseProfiles.nonprod.android,
    SENTRY_DSN_IOS: sentryReleaseProfiles.nonprod.ios,
  },
  '.env.dev.testnet': {
    SENTRY_DSN_ANDROID: sentryReleaseProfiles.nonprod.android,
    SENTRY_DSN_IOS: sentryReleaseProfiles.nonprod.ios,
  },
  '.env.prod.mainnet': {
    SENTRY_DSN_ANDROID: sentryReleaseProfiles.prod.android,
    SENTRY_DSN_IOS: sentryReleaseProfiles.prod.ios,
  },
  '.env.stage.mainnet': {
    SENTRY_DSN_ANDROID: sentryReleaseProfiles.nonprod.android,
    SENTRY_DSN_IOS: sentryReleaseProfiles.nonprod.ios,
  },
  '.env.testnet': {
    SENTRY_DSN: sentryReleaseProfiles.prod.ios,
  },
};

const parseEnv = content =>
  new Map(
    content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]),
  );

const getDsnProjectId = dsn => {
  const url = new URL(dsn);

  if (url.protocol !== 'https:' || (url.hostname !== 'sentry.io' && !url.hostname.endsWith('.sentry.io'))) {
    throw new Error('DSN must use HTTPS and a Sentry hostname');
  }

  const projectId = url.pathname.split('/').filter(Boolean).at(-1);

  if (!projectId) {
    throw new Error('DSN project id is missing');
  }

  return projectId;
};

export const collectSentryProjectRoutingAudit = ({
  read = relativePath => readFileSync(path.join(root, relativePath), 'utf8'),
} = {}) => {
  const errors = [];
  const routes = [];

  Object.entries(sentryEnvProjectExpectations).forEach(([relativePath, expectations]) => {
    let env;

    try {
      env = parseEnv(read(relativePath));
    } catch {
      errors.push(`${relativePath} is missing or unreadable`);
      return;
    }

    Object.entries(expectations).forEach(([key, expectedProject]) => {
      const dsn = env.get(key);
      const expectedProjectId = sentryProjectIds[expectedProject];

      if (!dsn) {
        errors.push(`${relativePath} is missing ${key}`);
        return;
      }

      try {
        const projectId = getDsnProjectId(dsn);

        routes.push({ relativePath, key, project: expectedProject, projectId });

        if (projectId !== expectedProjectId) {
          errors.push(`${relativePath} ${key} points at project id ${projectId}; expected ${expectedProjectId}`);
        }
      } catch {
        errors.push(`${relativePath} ${key} is not a valid Sentry DSN`);
      }
    });
  });

  return { routes, errors };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSentryProjectRoutingAudit();

  console.log('Sentry project routing audit');
  console.log(`Guarded routes: ${audit.routes.length}`);
  audit.routes.forEach(route =>
    console.log(`- ${route.relativePath} ${route.key}: ${route.project} (${route.projectId})`),
  );
  console.log(`Routing errors: ${audit.errors.length}`);
  audit.errors.forEach(error => console.error(`- ${error}`));
  console.log('DSN and token values printed: no');
  process.exit(audit.errors.length > 0 ? 1 : 0);
}

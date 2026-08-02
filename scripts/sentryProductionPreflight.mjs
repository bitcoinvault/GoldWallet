export const SENTRY_PRODUCTION_ORG = 'decentraplanet';
export const SENTRY_PRODUCTION_PROJECTS = [
  { platform: 'Android', slug: 'goldwallet-prod-android', id: '5875213' },
  { platform: 'iOS', slug: 'goldwallet', id: '5375289' },
];

const getSummaryValue = (summary, label) =>
  summary
    .split(/\r?\n/)
    .find(line => line.startsWith(`${label}: `))
    ?.slice(label.length + 2);

export const getSentryProductionPreflightEnv = (env = process.env) => {
  const resolved = { ...env };
  delete resolved.SENTRY_RELEASE;
  delete resolved.SENTRY_DIST;
  return {
    ...resolved,
    SENTRY_HOST: 'https://sentry.io',
    SENTRY_URL: 'https://sentry.io',
    SENTRY_RELEASE_PROFILE: 'prod',
    SENTRY_ORG: SENTRY_PRODUCTION_ORG,
    SENTRY_ANDROID_PROJECT: SENTRY_PRODUCTION_PROJECTS[0].slug,
    SENTRY_IOS_PROJECT: SENTRY_PRODUCTION_PROJECTS[1].slug,
    SENTRY_ANDROID_RELEASE_EVIDENCE_VARIANT: 'prod',
    SENTRY_DISABLE_AUTO_UPLOAD: 'true',
  };
};

export const getSentryProductionProjectViewInvocation = (project, platform = process.platform) =>
  platform === 'win32'
    ? {
        command: 'powershell.exe',
        args: [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `sentry project view ${SENTRY_PRODUCTION_ORG}/${project.slug} --fresh --json`,
        ],
      }
    : {
        command: 'sentry',
        args: ['project', 'view', `${SENTRY_PRODUCTION_ORG}/${project.slug}`, '--fresh', '--json'],
      };

export const getSentryProductionProjectErrors = ({ response, expected }) => {
  const project = Array.isArray(response) && response.length === 1 ? response[0] : null;
  const errors = [];
  if (!project) return ['Sentry project lookup must return exactly one project'];
  if (String(project.id || '') !== expected.id) errors.push(`${expected.platform} Sentry project ID mismatch`);
  if (project.slug !== expected.slug) errors.push(`${expected.platform} Sentry project slug mismatch`);
  if (project.organization?.slug !== SENTRY_PRODUCTION_ORG) {
    errors.push(`${expected.platform} Sentry organization mismatch`);
  }
  if (project.status !== 'active') errors.push(`${expected.platform} Sentry project is not active`);
  if (project.hasAccess !== true) errors.push(`${expected.platform} Sentry project is not accessible`);
  if (!project.access?.includes('project:read'))
    errors.push(`${expected.platform} Sentry project read access is missing`);
  if (!project.access?.includes('project:releases')) {
    errors.push(`${expected.platform} Sentry release access is missing`);
  }
  return errors;
};

export const getSentryProductionPreflightSummaryErrors = summary => {
  const errors = [];
  const expected = {
    'Android release evidence variant': 'prod',
    'Android release build evidence ready': 'yes',
    'Sentry packages current': 'yes',
    'SENTRY_AUTH_TOKEN available': 'yes',
    'Sentry properties files ready': 'yes',
    'Sentry release upload validation': 'not claimed',
    'Sentry release runtime proof state': 'ready',
    'Secret values printed': 'no',
  };
  for (const [label, value] of Object.entries(expected)) {
    if (getSummaryValue(summary, label) !== value) errors.push(`${label} must be ${value}`);
  }
  const outcome = getSummaryValue(summary, 'Handoff outcome');
  const blocker = getSummaryValue(summary, 'Handoff blocker type');
  const readinessErrors = getSummaryValue(summary, 'Readiness errors');
  if (outcome === 'ready-for-credentialed-upload-test' && blocker !== 'none') {
    errors.push('Ready production preflight must not retain a blocker');
  }
  if (
    outcome !== 'ready-for-credentialed-upload-test' &&
    !(outcome === 'blocked' && blocker === 'ios-validation-not-ready')
  ) {
    errors.push('Production preflight may only be ready or blocked by iOS validation');
  }
  if (outcome === 'blocked' && blocker === 'ios-validation-not-ready' && readinessErrors !== '1') {
    errors.push('iOS-blocked production preflight must contain exactly one readiness error');
  }
  if (outcome === 'ready-for-credentialed-upload-test' && readinessErrors !== '0') {
    errors.push('Ready production preflight must contain 0 readiness errors');
  }
  return errors;
};

import { chmodSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, '..');

export const sentryPropertiesRelativePaths = [
  'sentry.properties',
  'android/sentry.properties',
  'ios/sentry.properties',
];
export const defaultSentryPropertiesValues = {
  'defaults.url': 'https://sentry.io/',
  'defaults.org': 'decentraplanet',
};
export const sentryReleaseProfiles = {
  nonprod: {
    android: 'goldwallet-dev-android',
    ios: 'goldwallet-dev-ios',
  },
  prod: {
    android: 'goldwallet-prod-android',
    ios: 'goldwallet',
  },
};

const validateSentryPropertiesValue = (key, value) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${key} is required to generate Sentry release properties`);
  }

  if (value.trim().length === 0) {
    throw new Error(`${key} must not be blank`);
  }

  if (value !== value.trim()) {
    throw new Error(`${key} must not include leading or trailing whitespace`);
  }

  if (/[\r\n]/.test(value)) {
    throw new Error(`${key} must not contain line breaks`);
  }

  return value;
};

const resolveSentryPropertiesValue = (key, value, fallback) => validateSentryPropertiesValue(key, value || fallback);

const resolveReleaseProfile = env => {
  const profile = env.SENTRY_RELEASE_PROFILE;

  if (!profile) {
    throw new Error('SENTRY_RELEASE_PROFILE is required to generate Sentry release properties');
  }

  if (!Object.hasOwn(sentryReleaseProfiles, profile)) {
    throw new Error(`SENTRY_RELEASE_PROFILE must be one of: ${Object.keys(sentryReleaseProfiles).join(', ')}`);
  }

  return sentryReleaseProfiles[profile];
};

export const buildSentryPropertiesContent = ({ env, project }) => {
  const token = env.SENTRY_AUTH_TOKEN;

  if (!token) {
    throw new Error('SENTRY_AUTH_TOKEN is required to generate Sentry release properties');
  }

  const values = {
    ...defaultSentryPropertiesValues,
    'defaults.org': resolveSentryPropertiesValue(
      'SENTRY_ORG',
      env.SENTRY_ORG,
      defaultSentryPropertiesValues['defaults.org'],
    ),
    'defaults.project': project,
    'auth.token': validateSentryPropertiesValue('SENTRY_AUTH_TOKEN', token),
  };

  return [
    `defaults.url=${values['defaults.url']}`,
    `defaults.org=${values['defaults.org']}`,
    `defaults.project=${values['defaults.project']}`,
    `auth.token=${values['auth.token']}`,
    '',
  ].join('\n');
};

export const writeSentryPropertiesFiles = ({ root = defaultRoot, env = process.env } = {}) => {
  if (!env.SENTRY_AUTH_TOKEN) {
    throw new Error('SENTRY_AUTH_TOKEN is required to generate Sentry release properties');
  }

  validateSentryPropertiesValue('SENTRY_AUTH_TOKEN', env.SENTRY_AUTH_TOKEN);
  const profile = resolveReleaseProfile(env);
  const androidProject = resolveSentryPropertiesValue(
    'SENTRY_ANDROID_PROJECT',
    env.SENTRY_ANDROID_PROJECT,
    profile.android,
  );
  const iosProject = resolveSentryPropertiesValue('SENTRY_IOS_PROJECT', env.SENTRY_IOS_PROJECT, profile.ios);
  const projectsByPath = {
    'sentry.properties': androidProject,
    'android/sentry.properties': androidProject,
    'ios/sentry.properties': iosProject,
  };

  sentryPropertiesRelativePaths.forEach(relativePath => {
    const targetPath = path.join(root, relativePath);
    const content = buildSentryPropertiesContent({ env, project: projectsByPath[relativePath] });

    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, content, { mode: 0o600 });
    chmodSync(targetPath, 0o600);
  });

  return sentryPropertiesRelativePaths.map(relativePath => path.join(root, relativePath));
};

const parseArgs = argv => {
  const args = [...argv];
  let root = defaultRoot;

  while (args.length > 0) {
    const arg = args.shift();

    if (arg === '--root') {
      const value = args.shift();

      if (!value) {
        throw new Error('--root requires a value');
      }

      root = path.resolve(value);
      continue;
    }

    throw new Error(`Unsupported argument: ${arg}`);
  }

  return { root };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const writtenFiles = writeSentryPropertiesFiles(options);

    writtenFiles.forEach(filePath => console.log(`Wrote ${path.relative(options.root, filePath)}`));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

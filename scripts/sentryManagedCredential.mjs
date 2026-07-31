import { spawnSync } from 'child_process';

const getSentryTokenInvocation = platform =>
  platform === 'win32'
    ? {
        command: 'powershell.exe',
        args: ['-NoProfile', '-NonInteractive', '-Command', 'sentry auth token'],
      }
    : { command: 'sentry', args: ['auth', 'token'] };

const validateToken = token => {
  const normalized = typeof token === 'string' ? token.trim() : '';

  if (!normalized) {
    throw new Error('Sentry auth token is unavailable');
  }

  if (/\s/.test(normalized)) {
    throw new Error('Sentry auth token has an invalid format');
  }

  return normalized;
};

export const resolveSentryManagedCredential = ({
  env = process.env,
  platform = process.platform,
  spawn = spawnSync,
} = {}) => {
  if (env.SENTRY_AUTH_TOKEN) {
    return {
      source: 'environment',
      token: validateToken(env.SENTRY_AUTH_TOKEN),
    };
  }

  const invocation = getSentryTokenInvocation(platform);
  const result = spawn(invocation.command, invocation.args, {
    encoding: 'utf8',
    env,
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    throw new Error('Unable to read the managed token from the authenticated Sentry CLI');
  }

  return {
    source: 'managed-cli',
    token: validateToken(result.stdout),
  };
};

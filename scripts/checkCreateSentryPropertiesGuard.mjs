import { execFileSync } from 'child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { sentryPropertiesRelativePaths } from './createSentryProperties.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'scripts', 'createSentryProperties.mjs');
const secret = 'dummy-token-for-guard';

const runGenerator = ({ tempRoot, env }) => {
  try {
    const stdout = execFileSync(process.execPath, [scriptPath, '--root', tempRoot], {
      cwd: root,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    return { ok: true, stdout, stderr: '' };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message,
    };
  }
};

const assertCondition = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const missingTokenRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-missing-'));
try {
  const result = runGenerator({ tempRoot: missingTokenRoot, env: { SENTRY_AUTH_TOKEN: '' } });

  assertCondition(!result.ok, 'Generator must fail when SENTRY_AUTH_TOKEN is missing');
  assertCondition(
    result.stderr.includes('SENTRY_AUTH_TOKEN is required'),
    'Missing-token failure must mention SENTRY_AUTH_TOKEN requirement',
  );
  sentryPropertiesRelativePaths.forEach(relativePath => {
    assertCondition(!existsSync(path.join(missingTokenRoot, relativePath)), `Generator wrote ${relativePath} without token`);
  });
} finally {
  rmSync(missingTokenRoot, { recursive: true, force: true });
}

const readyRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-ready-'));
try {
  const result = runGenerator({
    tempRoot: readyRoot,
    env: {
      SENTRY_AUTH_TOKEN: secret,
      SENTRY_ORG: 'custom-org',
      SENTRY_PROJECT: 'custom-project',
    },
  });

  assertCondition(result.ok, `Generator should succeed with token, received stderr: ${result.stderr}`);
  assertCondition(!result.stdout.includes(secret) && !result.stderr.includes(secret), 'Generator output must not print token values');

  sentryPropertiesRelativePaths.forEach(relativePath => {
    const filePath = path.join(readyRoot, relativePath);

    assertCondition(existsSync(filePath), `Generator did not write ${relativePath}`);

    const content = readFileSync(filePath, 'utf8');

    assertCondition(content.includes('defaults.url=https://sentry.io/'), `${relativePath} is missing defaults.url`);
    assertCondition(content.includes('defaults.org=custom-org'), `${relativePath} is missing SENTRY_ORG override`);
    assertCondition(content.includes('defaults.project=custom-project'), `${relativePath} is missing SENTRY_PROJECT override`);
    assertCondition(content.includes(`auth.token=${secret}`), `${relativePath} is missing auth.token`);
  });
} finally {
  rmSync(readyRoot, { recursive: true, force: true });
}

console.log('Sentry properties generator guard checks are valid.');

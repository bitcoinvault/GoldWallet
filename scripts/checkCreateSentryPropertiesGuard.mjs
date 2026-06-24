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

const assertNoPropertiesFiles = tempRoot => {
  sentryPropertiesRelativePaths.forEach(relativePath => {
    assertCondition(!existsSync(path.join(tempRoot, relativePath)), `Generator wrote ${relativePath} after invalid input`);
  });
};

const missingTokenRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-missing-'));
try {
  const result = runGenerator({ tempRoot: missingTokenRoot, env: { SENTRY_AUTH_TOKEN: '' } });

  assertCondition(!result.ok, 'Generator must fail when SENTRY_AUTH_TOKEN is missing');
  assertCondition(
    result.stderr.includes('SENTRY_AUTH_TOKEN is required'),
    'Missing-token failure must mention SENTRY_AUTH_TOKEN requirement',
  );
  assertNoPropertiesFiles(missingTokenRoot);
} finally {
  rmSync(missingTokenRoot, { recursive: true, force: true });
}

const whitespaceTokenRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-whitespace-token-'));
try {
  const result = runGenerator({ tempRoot: whitespaceTokenRoot, env: { SENTRY_AUTH_TOKEN: '   ' } });

  assertCondition(!result.ok, 'Generator must fail when SENTRY_AUTH_TOKEN is blank whitespace');
  assertCondition(
    result.stderr.includes('SENTRY_AUTH_TOKEN must not be blank'),
    'Whitespace-token failure must mention that SENTRY_AUTH_TOKEN must not be blank',
  );
  assertNoPropertiesFiles(whitespaceTokenRoot);
} finally {
  rmSync(whitespaceTokenRoot, { recursive: true, force: true });
}

const paddedTokenRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-padded-token-'));
try {
  const result = runGenerator({ tempRoot: paddedTokenRoot, env: { SENTRY_AUTH_TOKEN: ` ${secret}` } });

  assertCondition(!result.ok, 'Generator must fail when SENTRY_AUTH_TOKEN has leading whitespace');
  assertCondition(
    result.stderr.includes('SENTRY_AUTH_TOKEN must not include leading or trailing whitespace'),
    'Padded-token failure must mention leading or trailing whitespace',
  );
  assertCondition(!result.stdout.includes(secret) && !result.stderr.includes(secret), 'Generator output must not print invalid token values');
  assertNoPropertiesFiles(paddedTokenRoot);
} finally {
  rmSync(paddedTokenRoot, { recursive: true, force: true });
}

const newlineOrgRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-newline-org-'));
try {
  const result = runGenerator({
    tempRoot: newlineOrgRoot,
    env: {
      SENTRY_AUTH_TOKEN: secret,
      SENTRY_ORG: 'custom\norg',
    },
  });

  assertCondition(!result.ok, 'Generator must fail when SENTRY_ORG contains a line break');
  assertCondition(
    result.stderr.includes('SENTRY_ORG must not contain line breaks'),
    'Line-break org failure must mention SENTRY_ORG line breaks',
  );
  assertCondition(!result.stdout.includes(secret) && !result.stderr.includes(secret), 'Generator output must not print token values on org failure');
  assertNoPropertiesFiles(newlineOrgRoot);
} finally {
  rmSync(newlineOrgRoot, { recursive: true, force: true });
}

const paddedProjectRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-padded-project-'));
try {
  const result = runGenerator({
    tempRoot: paddedProjectRoot,
    env: {
      SENTRY_AUTH_TOKEN: secret,
      SENTRY_PROJECT: ' custom-project',
    },
  });

  assertCondition(!result.ok, 'Generator must fail when SENTRY_PROJECT has leading whitespace');
  assertCondition(
    result.stderr.includes('SENTRY_PROJECT must not include leading or trailing whitespace'),
    'Padded-project failure must mention leading or trailing whitespace',
  );
  assertCondition(!result.stdout.includes(secret) && !result.stderr.includes(secret), 'Generator output must not print token values on project failure');
  assertNoPropertiesFiles(paddedProjectRoot);
} finally {
  rmSync(paddedProjectRoot, { recursive: true, force: true });
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

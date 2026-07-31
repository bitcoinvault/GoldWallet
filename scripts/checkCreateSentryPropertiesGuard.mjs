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
const sentryInputNames = [
  'SENTRY_AUTH_TOKEN',
  'SENTRY_RELEASE_PROFILE',
  'SENTRY_ORG',
  'SENTRY_ANDROID_PROJECT',
  'SENTRY_IOS_PROJECT',
];

const runGenerator = ({ tempRoot, env }) => {
  const isolatedEnv = { ...process.env };

  sentryInputNames.forEach(name => delete isolatedEnv[name]);

  try {
    const stdout = execFileSync(process.execPath, [scriptPath, '--root', tempRoot], {
      cwd: root,
      env: { ...isolatedEnv, ...env },
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
    assertCondition(
      !existsSync(path.join(tempRoot, relativePath)),
      `Generator wrote ${relativePath} after invalid input`,
    );
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
  assertCondition(
    !result.stdout.includes(secret) && !result.stderr.includes(secret),
    'Generator output must not print invalid token values',
  );
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
      SENTRY_RELEASE_PROFILE: 'nonprod',
      SENTRY_ORG: 'custom\norg',
    },
  });

  assertCondition(!result.ok, 'Generator must fail when SENTRY_ORG contains a line break');
  assertCondition(
    result.stderr.includes('SENTRY_ORG must not contain line breaks'),
    'Line-break org failure must mention SENTRY_ORG line breaks',
  );
  assertCondition(
    !result.stdout.includes(secret) && !result.stderr.includes(secret),
    'Generator output must not print token values on org failure',
  );
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
      SENTRY_RELEASE_PROFILE: 'nonprod',
      SENTRY_ANDROID_PROJECT: ' custom-project',
    },
  });

  assertCondition(!result.ok, 'Generator must fail when SENTRY_ANDROID_PROJECT has leading whitespace');
  assertCondition(
    result.stderr.includes('SENTRY_ANDROID_PROJECT must not include leading or trailing whitespace'),
    'Padded-project failure must mention SENTRY_ANDROID_PROJECT whitespace',
  );
  assertCondition(
    !result.stdout.includes(secret) && !result.stderr.includes(secret),
    'Generator output must not print token values on project failure',
  );
  assertNoPropertiesFiles(paddedProjectRoot);
} finally {
  rmSync(paddedProjectRoot, { recursive: true, force: true });
}

const missingProfileRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-missing-profile-'));
try {
  const result = runGenerator({ tempRoot: missingProfileRoot, env: { SENTRY_AUTH_TOKEN: secret } });

  assertCondition(!result.ok, 'Generator must fail when SENTRY_RELEASE_PROFILE is missing');
  assertCondition(
    result.stderr.includes('SENTRY_RELEASE_PROFILE is required'),
    'Missing-profile failure must mention SENTRY_RELEASE_PROFILE',
  );
  assertNoPropertiesFiles(missingProfileRoot);
} finally {
  rmSync(missingProfileRoot, { recursive: true, force: true });
}

const invalidProfileRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-invalid-profile-'));
try {
  const result = runGenerator({
    tempRoot: invalidProfileRoot,
    env: { SENTRY_AUTH_TOKEN: secret, SENTRY_RELEASE_PROFILE: 'stage' },
  });

  assertCondition(!result.ok, 'Generator must reject an unsupported SENTRY_RELEASE_PROFILE');
  assertCondition(
    result.stderr.includes('SENTRY_RELEASE_PROFILE must be one of: nonprod, prod'),
    'Invalid-profile failure must list supported profiles',
  );
  assertNoPropertiesFiles(invalidProfileRoot);
} finally {
  rmSync(invalidProfileRoot, { recursive: true, force: true });
}

const readyRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-ready-'));
try {
  const result = runGenerator({
    tempRoot: readyRoot,
    env: {
      SENTRY_AUTH_TOKEN: secret,
      SENTRY_RELEASE_PROFILE: 'nonprod',
    },
  });

  assertCondition(result.ok, `Generator should succeed with token, received stderr: ${result.stderr}`);
  assertCondition(
    !result.stdout.includes(secret) && !result.stderr.includes(secret),
    'Generator output must not print token values',
  );

  const expectedProjects = {
    'sentry.properties': 'goldwallet-dev-android',
    'android/sentry.properties': 'goldwallet-dev-android',
    'ios/sentry.properties': 'goldwallet-dev-ios',
  };

  sentryPropertiesRelativePaths.forEach(relativePath => {
    const filePath = path.join(readyRoot, relativePath);

    assertCondition(existsSync(filePath), `Generator did not write ${relativePath}`);

    const content = readFileSync(filePath, 'utf8');

    assertCondition(content.includes('defaults.url=https://sentry.io/'), `${relativePath} is missing defaults.url`);
    assertCondition(
      content.includes('defaults.org=decentraplanet'),
      `${relativePath} is missing the current Sentry org`,
    );
    assertCondition(
      content.includes(`defaults.project=${expectedProjects[relativePath]}`),
      `${relativePath} has the wrong nonprod project`,
    );
    assertCondition(content.includes(`auth.token=${secret}`), `${relativePath} is missing auth.token`);
  });
} finally {
  rmSync(readyRoot, { recursive: true, force: true });
}

const prodRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-prod-'));
try {
  const result = runGenerator({
    tempRoot: prodRoot,
    env: { SENTRY_AUTH_TOKEN: secret, SENTRY_RELEASE_PROFILE: 'prod' },
  });

  assertCondition(result.ok, `Prod generator should succeed, received stderr: ${result.stderr}`);
  assertCondition(
    readFileSync(path.join(prodRoot, 'android/sentry.properties'), 'utf8').includes(
      'defaults.project=goldwallet-prod-android',
    ),
    'Prod Android properties must target goldwallet-prod-android',
  );
  assertCondition(
    readFileSync(path.join(prodRoot, 'ios/sentry.properties'), 'utf8').includes('defaults.project=goldwallet'),
    'Prod iOS properties must target goldwallet',
  );
} finally {
  rmSync(prodRoot, { recursive: true, force: true });
}

console.log('Sentry properties generator guard checks are valid.');

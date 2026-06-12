const header = 'Sentry release credential plan';
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const forbiddenSecretPatterns = [
  /SENTRY_AUTH_TOKEN\s*=/,
  /auth\.token\s*=/,
  /SENTRY_DSN\s*=/,
  /dsn\s*=/i,
];

const parseCount = (summary, label) => {
  const match = summary.match(new RegExp(`^${label}: (\\d+)$`, 'm'));
  return match ? Number(match[1]) : null;
};

export const getSentryReleaseCredentialPlanErrors = plan => {
  const errors = [];
  const lines = plan.split(/\r?\n/);

  if (lines[0] !== header) {
    errors.push('Missing Sentry release credential plan header.');
  }

  const generatedAt = lines.find(line => line.startsWith('Generated at: '));
  if (!generatedAt || !isoTimestampPattern.test(generatedAt.replace('Generated at: ', ''))) {
    errors.push('Generated at must be an ISO timestamp.');
  }

  if (!plan.includes('Secret values printed: no')) {
    errors.push('Plan must explicitly state that secret values were not printed.');
  }

  if (!plan.includes('Review-safe evidence: file paths, env variable names, and command names only')) {
    errors.push('Plan must state that review-safe evidence is limited to paths, env names, and commands.');
  }

  if (!plan.includes('Sentry release upload validation: not claimed')) {
    errors.push('Plan must keep Sentry release upload validation unclaimed.');
  }

  forbiddenSecretPatterns.forEach(pattern => {
    if (pattern.test(plan)) {
      errors.push('Plan must not contain Sentry token, DSN, or secret assignments.');
    }
  });

  ['sentry.properties', 'android/sentry.properties', 'ios/sentry.properties'].forEach(relativePath => {
    if (!plan.includes(`- ${relativePath}: `)) {
      errors.push(`Plan must include ${relativePath} readiness.`);
    }
  });

  const missingFiles = parseCount(plan, 'Missing properties files');
  const listedMissingFiles = lines.filter(line => line.startsWith('- missing file: ')).length;
  if (missingFiles === null) {
    errors.push('Missing properties files count is missing.');
  } else if (missingFiles !== listedMissingFiles) {
    errors.push(`Missing properties files count is ${missingFiles}, but ${listedMissingFiles} missing files were listed.`);
  }

  const invalidFiles = parseCount(plan, 'Invalid properties files');
  const listedInvalidFiles = lines.filter(line => line.startsWith('- invalid file: ')).length;
  if (invalidFiles === null) {
    errors.push('Invalid properties files count is missing.');
  } else if (invalidFiles !== listedInvalidFiles) {
    errors.push(`Invalid properties files count is ${invalidFiles}, but ${listedInvalidFiles} invalid files were listed.`);
  }

  [
    '1. Set SENTRY_AUTH_TOKEN in the local shell or CI secret store.',
    '2. Optional: set SENTRY_ORG and SENTRY_PROJECT only when the target differs from cloudbest/goldwallet.',
    '3. Run corepack yarn sentry:release:create-properties.',
    '4. Run corepack yarn sentry:release:prereq-audit.',
    '5. Run corepack yarn sentry:release:prereq-check-summary.',
    '6. Run corepack yarn sentry:release:validation:handoff after Android release and smoke evidence are current.',
  ].forEach(step => {
    if (!plan.includes(step)) {
      errors.push(`Plan must include required step: ${step}`);
    }
  });

  if (!plan.includes('Required action: provide credentials and generate the three local-only Sentry properties files before claiming source-map upload validation.')) {
    errors.push('Plan must include the credential handoff required action.');
  }

  return [...new Set(errors)];
};

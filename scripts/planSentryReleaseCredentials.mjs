import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { collectSentryReleasePrerequisites } from './auditSentryReleasePrerequisites.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'local-docs', 'sentry-release-credential-plan.txt');

const formatInvalidFile = file => {
  const issues = [];

  if (file.missingKeys.length > 0) {
    issues.push(`missing keys: ${file.missingKeys.join(', ')}`);
  }

  if (file.invalidStaticKeys.length > 0) {
    issues.push(`unexpected static keys: ${file.invalidStaticKeys.join(', ')}`);
  }

  if (file.hasBlankToken) {
    issues.push('blank auth.token');
  }

  return `- invalid file: ${file.relativePath} (${issues.join('; ')})`;
};

export const formatSentryReleaseCredentialPlan = (audit, generatedAt = new Date().toISOString()) => [
  'Sentry release credential plan',
  `Generated at: ${generatedAt}`,
  `@sentry/react-native version: ${audit.sentryReactNativeVersion}`,
  `@sentry/react-native latest: ${audit.sentryReactNativeLatest}`,
  `@sentry/react-native current: ${audit.sentryReactNativeCurrent ? 'yes' : 'no'}`,
  `@sentry/cli package version: ${audit.sentryCliPackageVersion}`,
  `@sentry/cli latest: ${audit.sentryCliLatest}`,
  `@sentry/cli current: ${audit.sentryCliCurrent ? 'yes' : 'no'}`,
  `Release source-map prerequisites: ${audit.ready ? 'ready' : 'not ready'}`,
  `SENTRY_AUTH_TOKEN available in current shell: ${audit.envHasToken ? 'yes' : 'no'}`,
  'Properties file readiness:',
  ...audit.propertiesFileReadiness.map(file => `- ${file.relativePath}: ${file.status}`),
  `Missing properties files: ${audit.missingFiles.length}`,
  ...audit.missingFiles.map(relativePath => `- missing file: ${relativePath}`),
  `Invalid properties files: ${audit.invalidFiles.length}`,
  ...audit.invalidFiles.map(formatInvalidFile),
  `Android release evidence ready: ${audit.androidReleaseEvidenceReady ? 'yes' : 'no'}`,
  `Android release smoke evidence ready: ${audit.androidReleaseSmokeEvidenceReady ? 'yes' : 'no'}`,
  'Sentry release upload validation: not claimed',
  'Credential handoff steps:',
  '1. Set SENTRY_AUTH_TOKEN in the local shell or CI secret store.',
  '2. Optional: set SENTRY_ORG and SENTRY_PROJECT only when the target differs from cloudbest/goldwallet.',
  '3. Run corepack yarn sentry:release:create-properties.',
  '4. Run corepack yarn sentry:release:prereq-audit.',
  '5. Run corepack yarn sentry:release:prereq-check-summary.',
  '6. Run corepack yarn sentry:release:validation:handoff after Android release and smoke evidence are current.',
  'Review-safe evidence: file paths, env variable names, and command names only',
  'Secret values printed: no',
  'Required action: provide credentials and generate the three local-only Sentry properties files before claiming source-map upload validation.',
  '',
].join('\n');

const main = () => {
  const audit = collectSentryReleasePrerequisites();
  const plan = formatSentryReleaseCredentialPlan(audit);

  mkdirSync(path.dirname(planPath), { recursive: true });
  writeFileSync(planPath, plan);

  console.log('Sentry release credential plan');
  console.log(`Release source-map prerequisites: ${audit.ready ? 'ready' : 'not ready'}`);
  console.log(`SENTRY_AUTH_TOKEN available in current shell: ${audit.envHasToken ? 'yes' : 'no'}`);
  console.log(`Missing properties files: ${audit.missingFiles.length}`);
  console.log(`Invalid properties files: ${audit.invalidFiles.length}`);
  console.log('Review-safe evidence: file paths, env variable names, and command names only');
  console.log('Secret values printed: no');
  console.log(`Sentry release credential plan written to ${path.relative(root, planPath)}`);
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}

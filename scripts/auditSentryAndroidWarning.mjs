import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'sentry-android-warning-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};
const scripts = packageJson.scripts || {};
const sentryGradlePath = 'node_modules/@sentry/react-native/sentry.gradle';

const requireSnippet = (errors, label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

export const collectSentryAndroidWarningAudit = () => {
  const sentryVersion = dependencies['@sentry/react-native'];
  const androidBuildGradle = read('android/app/build.gradle');
  const sentryGradle = exists(sentryGradlePath) ? read(sentryGradlePath) : '';
  const warningSummaryPath = 'local-docs/android-warning-audit-summary.txt';
  const warningSummary = exists(warningSummaryPath) ? read(warningSummaryPath) : '';
  const activeSentryWarning = warningSummary.includes('@sentry/react-native') || warningSummary.includes('@sentry\\react-native');
  const plan = read('docs/sentry-release-source-map-plan.md');
  const releaseServicesPlan = read('docs/release-services-native-compatibility-audit.md');
  const errors = [];
  const warnings = [];
  const readinessIssues = [];

  if (sentryVersion !== '5.36.0') {
    readinessIssues.push(`package.json has @sentry/react-native@${sentryVersion || '<missing>'}; expected current baseline 5.36.0`);
  }

  if (scripts['sentry:release:prereq-audit'] !== 'node scripts/auditSentryReleasePrerequisites.mjs') {
    errors.push('package.json is missing sentry:release:prereq-audit script');
  }

  if (scripts['sentry:release:prereq-check-summary'] !== 'node scripts/checkSentryReleasePrereqSummary.mjs') {
    errors.push('package.json is missing sentry:release:prereq-check-summary script');
  }

  if (scripts['check:sentry-release-prereq-summary-guard'] !== 'node scripts/checkSentryReleasePrereqSummaryGuard.mjs') {
    errors.push('package.json is missing check:sentry-release-prereq-summary-guard script');
  }

  if (!exists(sentryGradlePath)) {
    errors.push(`${sentryGradlePath} is missing; install dependencies before auditing the Android Sentry warning source`);
  }

  requireSnippet(errors, 'android/app/build.gradle', androidBuildGradle, 'node_modules/@sentry/react-native/sentry.gradle');
  requireSnippet(errors, 'android/app/build.gradle', androidBuildGradle, 'project.ext.sentryCli');
  requireSnippet(errors, 'sentry.gradle', sentryGradle, 'bundleTask.getProperties()');
  requireSnippet(errors, 'docs/sentry-release-source-map-plan.md', plan, 'Branch: `feature/bem-sentry-release-source-map-upgrade`');
  requireSnippet(errors, 'docs/sentry-release-source-map-plan.md', plan, 'corepack yarn sentry:release:prereq-audit');
  requireSnippet(errors, 'docs/sentry-release-source-map-plan.md', plan, 'corepack yarn sentry:release:prereq-check-summary');
  requireSnippet(errors, 'docs/sentry-release-source-map-plan.md', plan, 'corepack yarn check:sentry-release-prereq-summary-guard');
  requireSnippet(errors, 'docs/release-services-native-compatibility-audit.md', releaseServicesPlan, 'corepack yarn sentry:release:prereq-audit');
  requireSnippet(errors, 'docs/release-services-native-compatibility-audit.md', releaseServicesPlan, 'corepack yarn sentry:release:prereq-check-summary');

  const sentryGradleLines = sentryGradle.split(/\r?\n/);
  const getPropertiesLines = sentryGradleLines
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.includes('bundleTask.getProperties()'));
  const getPropertiesLineNumbers = getPropertiesLines.map(({ lineNumber }) => lineNumber);
  if (warningSummary && !activeSentryWarning) {
    warnings.push('Latest Android warning audit does not report an active Sentry execResult warning after the RN 0.76 Gradle migration.');
  }

  if (sentryVersion === '5.36.0') {
    warnings.push('Sentry remains on 5.36.0; release/source-map behavior still requires a dedicated validation branch before changing Sentry tooling.');
  }

  return {
    sentryVersion,
    getPropertiesLineNumbers,
    errors,
    readinessIssues,
    warnings,
    baselineStable: errors.length === 0 && readinessIssues.length === 0,
  };
};

export const formatSentryAndroidWarningSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Sentry Android warning audit',
    `Generated at: ${generatedAt}`,
    `@sentry/react-native manifest version: ${audit.sentryVersion || '<missing>'}`,
    `Sentry Gradle getProperties() references: ${audit.getPropertiesLineNumbers.join(', ') || '<none>'}`,
    `Sentry Android warning wiring valid: ${audit.errors.length === 0 ? 'yes' : 'no'}`,
    `Sentry Android warning baseline stable: ${audit.baselineStable ? 'yes' : 'no'}`,
    `Warnings: ${audit.warnings.length}`,
  ];

  audit.warnings.forEach(warning => lines.push(`- ${warning}`));
  lines.push(`Readiness issues: ${audit.readinessIssues.length}`);
  audit.readinessIssues.forEach(issue => lines.push(`- ${issue}`));
  lines.push(`Wiring errors: ${audit.errors.length}`);
  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push(
    audit.baselineStable
      ? 'Required action: none; Sentry Android warning baseline is stable for a dedicated release/source-map cleanup branch.'
      : 'Required action: restore Sentry Android warning baseline before changing Sentry release tooling.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Sentry Android warning audit');
  console.log(`@sentry/react-native manifest version: ${audit.sentryVersion || '<missing>'}`);
  console.log(`Sentry Gradle getProperties() references: ${audit.getPropertiesLineNumbers.join(', ') || '<none>'}`);

  if (audit.warnings.length > 0) {
    console.log('Warnings:');
    audit.warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (audit.errors.length > 0) {
    console.log('Sentry Android warning wiring is invalid:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  if (audit.readinessIssues.length > 0) {
    console.log('Sentry Android warning baseline needs review:');
    audit.readinessIssues.forEach(issue => console.log(`- ${issue}`));
  } else {
    console.log('Sentry Android warning baseline is stable for a dedicated release/source-map cleanup branch.');
  }

  console.log('Sentry Android warning source is dependency-owned; this audit intentionally does not patch node_modules or disable source-map upload.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSentryAndroidWarningAudit();
  const summary = formatSentryAndroidWarningSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Sentry Android warning summary written to ${path.relative(root, summaryPath)}`);
}

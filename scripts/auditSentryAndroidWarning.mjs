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
const sentryGradleKtsPath = 'node_modules/@sentry/react-native/sentry.gradle.kts';
const sentryDebugIdPatchPath = 'patches/@sentry+react-native+8.21.0.patch';
const sentryDebugIdScriptPath = 'node_modules/@sentry/react-native/scripts/has-sourcemap-debugid.js';
const expectedSentryReactNativeVersion = '8.21.0';

const requireSnippet = (errors, label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

export const collectSentryAndroidWarningAudit = () => {
  const sentryVersion = dependencies['@sentry/react-native'];
  const androidBuildGradle = read('android/app/build.gradle');
  const sentryGradle = [sentryGradlePath, sentryGradleKtsPath].filter(exists).map(read).join('\n');
  const warningSummaryPath = 'local-docs/android-warning-audit-summary.txt';
  const warningSummary = exists(warningSummaryPath) ? read(warningSummaryPath) : '';
  const activeSentryWarning = warningSummary.includes('@sentry/react-native') || warningSummary.includes('@sentry\\react-native');
  const plan = read('docs/sentry-release-source-map-plan.md');
  const releaseServicesPlan = read('docs/release-services-native-compatibility-audit.md');
  const errors = [];
  const warnings = [];
  const readinessIssues = [];

  if (sentryVersion !== expectedSentryReactNativeVersion) {
    readinessIssues.push(
      `package.json has @sentry/react-native@${sentryVersion || '<missing>'}; expected current baseline ${expectedSentryReactNativeVersion}`,
    );
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

  if (!exists(sentryGradlePath) || !exists(sentryGradleKtsPath)) {
    errors.push(`${sentryGradlePath} or ${sentryGradleKtsPath} is missing; install dependencies before auditing the Android Sentry warning source`);
  }

  if (!exists(sentryDebugIdPatchPath)) {
    errors.push(`${sentryDebugIdPatchPath} is missing`);
  } else {
    const sentryDebugIdPatch = read(sentryDebugIdPatchPath);
    requireSnippet(errors, sentryDebugIdPatchPath, sentryDebugIdPatch, '-  process.exist(1);');
    requireSnippet(errors, sentryDebugIdPatchPath, sentryDebugIdPatch, '+  process.exit(1);');
  }

  if (!exists(sentryDebugIdScriptPath)) {
    errors.push(`${sentryDebugIdScriptPath} is missing; install dependencies before auditing the Sentry source-map helper`);
  } else {
    const sentryDebugIdScript = read(sentryDebugIdScriptPath);
    requireSnippet(errors, sentryDebugIdScriptPath, sentryDebugIdScript, 'process.exit(1);');
    if (sentryDebugIdScript.includes('process.exist(1);')) {
      errors.push(`${sentryDebugIdScriptPath} still contains the invalid process.exist(1) call; run the repo postinstall`);
    }
  }

  requireSnippet(errors, 'android/app/build.gradle', androidBuildGradle, 'node_modules/@sentry/react-native/sentry.gradle');
  requireSnippet(errors, 'android/app/build.gradle', androidBuildGradle, 'project.ext.sentryCli');
  requireSnippet(errors, 'docs/sentry-release-source-map-plan.md', plan, 'Branch: `feature/bem-sentry-release-source-map-upgrade`');
  requireSnippet(errors, 'docs/sentry-release-source-map-plan.md', plan, 'corepack yarn sentry:release:prereq-audit');
  requireSnippet(errors, 'docs/sentry-release-source-map-plan.md', plan, 'corepack yarn sentry:release:prereq-check-summary');
  requireSnippet(errors, 'docs/sentry-release-source-map-plan.md', plan, 'corepack yarn check:sentry-release-prereq-summary-guard');
  requireSnippet(errors, 'docs/release-services-native-compatibility-audit.md', releaseServicesPlan, 'corepack yarn sentry:release:prereq-audit');
  requireSnippet(errors, 'docs/release-services-native-compatibility-audit.md', releaseServicesPlan, 'corepack yarn sentry:release:prereq-check-summary');

  const sentryGradleLines = sentryGradle.split(/\r?\n/);
  const getPropertiesLines = sentryGradleLines
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.includes('bundleTask.getProperties()') || line.includes('DefaultGroovyMethods.getProperties(bundleTask)'));
  const getPropertiesLineNumbers = getPropertiesLines.map(({ lineNumber }) => lineNumber);
  if (warningSummary && !activeSentryWarning) {
    warnings.push('Latest Android warning audit does not report an active Sentry execResult warning on the RN 0.86.2 baseline.');
  }

  if (sentryVersion === expectedSentryReactNativeVersion && exists(sentryGradleKtsPath)) {
    warnings.push(
      `Sentry ${expectedSentryReactNativeVersion} routes Android Gradle integration through sentry.gradle.kts; release source-map and dSYM behavior still require credentialed validation.`,
    );
  }

  if (sentryVersion === expectedSentryReactNativeVersion) {
    warnings.push(
      `Sentry ${expectedSentryReactNativeVersion} still performs release bundle task argument extraction; check Android release Gradle output for "Could not extract bundle task arguments" before claiming source-map upload.`,
    );
    warnings.push(`Sentry is on ${expectedSentryReactNativeVersion}; source-map and dSYM behavior still require release validation with local Sentry credentials.`);
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
      ? 'Required action: none for Android warning cleanup; keep Sentry SDK/source-map changes in a dedicated release validation branch.'
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
    console.log('Sentry Android warning baseline is stable; keep Sentry SDK/source-map changes in a dedicated release validation branch.');
  }

  console.log('Sentry Android warning source is dependency-owned; this audit verifies the committed patch without disabling source-map upload.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSentryAndroidWarningAudit();
  const summary = formatSentryAndroidWarningSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Sentry Android warning summary written to ${path.relative(root, summaryPath)}`);
}

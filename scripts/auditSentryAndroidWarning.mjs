import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};
const scripts = packageJson.scripts || {};
const sentryVersion = dependencies['@sentry/react-native'];
const sentryGradlePath = 'node_modules/@sentry/react-native/sentry.gradle';
const androidBuildGradle = read('android/app/build.gradle');
const sentryGradle = exists(sentryGradlePath) ? read(sentryGradlePath) : '';
const warningSummaryPath = 'local-docs/android-warning-audit-summary.txt';
const warningSummary = exists(warningSummaryPath) ? read(warningSummaryPath) : '';
const plan = read('docs/sentry-release-source-map-plan.md');
const releaseServicesPlan = read('docs/release-services-native-compatibility-audit.md');
const errors = [];
const warnings = [];
const readinessIssues = [];

const requireSnippet = (label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

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

requireSnippet('android/app/build.gradle', androidBuildGradle, 'node_modules/@sentry/react-native/sentry.gradle');
requireSnippet('android/app/build.gradle', androidBuildGradle, 'project.ext.sentryCli');
requireSnippet('sentry.gradle', sentryGradle, 'bundleTask.getProperties()');
requireSnippet('docs/sentry-release-source-map-plan.md', plan, 'Branch: `feature/bem-sentry-release-source-map-upgrade`');
requireSnippet('docs/sentry-release-source-map-plan.md', plan, 'corepack yarn sentry:release:prereq-audit');
requireSnippet('docs/sentry-release-source-map-plan.md', plan, 'corepack yarn sentry:release:prereq-check-summary');
requireSnippet('docs/sentry-release-source-map-plan.md', plan, 'corepack yarn check:sentry-release-prereq-summary-guard');
requireSnippet('docs/release-services-native-compatibility-audit.md', releaseServicesPlan, 'corepack yarn sentry:release:prereq-audit');
requireSnippet('docs/release-services-native-compatibility-audit.md', releaseServicesPlan, 'corepack yarn sentry:release:prereq-check-summary');

const sentryGradleLines = sentryGradle.split(/\r?\n/);
const getPropertiesLines = sentryGradleLines
  .map((line, index) => ({ line, lineNumber: index + 1 }))
  .filter(({ line }) => line.includes('bundleTask.getProperties()'));
const knownWarningLine = getPropertiesLines.find(({ lineNumber }) => lineNumber === 48);

if (!knownWarningLine) {
  readinessIssues.push('Expected Sentry Gradle warning source at sentry.gradle:48 was not found; refresh the Android warning baseline.');
}

if (warningSummary && !warningSummary.includes('@sentry') && !warningSummary.includes('Targeted Android Gradle warnings: 0')) {
  warnings.push('local Android warning audit summary does not mention Sentry or a zero-warning target state; refresh android:dev:audit-warnings before changing Sentry.');
}

if (sentryVersion === '5.36.0') {
  warnings.push('Sentry remains on 5.36.0; removing the execResult warning safely requires a dedicated release/source-map validation branch.');
}

console.log('Sentry Android warning audit');
console.log(`@sentry/react-native manifest version: ${sentryVersion || '<missing>'}`);
console.log(`Sentry Gradle getProperties() references: ${getPropertiesLines.map(({ lineNumber }) => lineNumber).join(', ') || '<none>'}`);

if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(warning => console.log(`- ${warning}`));
}

if (errors.length > 0) {
  console.log('Sentry Android warning wiring is invalid:');
  errors.forEach(error => console.log(`- ${error}`));
  process.exit(1);
}

if (readinessIssues.length > 0) {
  console.log('Sentry Android warning baseline needs review:');
  readinessIssues.forEach(issue => console.log(`- ${issue}`));
} else {
  console.log('Sentry Android warning baseline is stable for a dedicated release/source-map cleanup branch.');
}

console.log('Sentry Android warning source is dependency-owned; this audit intentionally does not patch node_modules or disable source-map upload.');

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'sentry-rn-bundle-task-compatibility-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const readJson = relativePath => JSON.parse(read(relativePath));
const exists = relativePath => existsSync(path.join(root, relativePath));

export const collectSentryRnBundleTaskCompatibility = () => {
  const packageJson = readJson('package.json');
  const sentryVersion = packageJson.dependencies?.['@sentry/react-native'] || 'missing';
  const reactNativeVersion = packageJson.dependencies?.['react-native'] || 'missing';
  const sentryGradleKtsPath = 'node_modules/@sentry/react-native/sentry.gradle.kts';
  const rnBundleTaskPath =
    'node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/src/main/kotlin/com/facebook/react/tasks/BundleHermesCTask.kt';
  const androidBuildGradle = read('android/app/build.gradle');
  const sentryGradleKts = exists(sentryGradleKtsPath) ? read(sentryGradleKtsPath) : '';
  const rnBundleTask = exists(rnBundleTaskPath) ? read(rnBundleTaskPath) : '';
  const errors = [];

  if (!sentryGradleKts) {
    errors.push(`${sentryGradleKtsPath} is missing`);
  }

  if (!rnBundleTask) {
    errors.push(`${rnBundleTaskPath} is missing`);
  }

  const sentryExpectsDirectory =
    sentryGradleKts.includes('val jsIntermediateSourceMapsDir') &&
    sentryGradleKts.includes('is org.gradle.api.file.Directory -> jsIntermediateSourceMapsDir.asFile');
  const sentryFallbackRequiresArgs =
    sentryGradleKts.includes('props["args"] as? List<String>') &&
    sentryGradleKts.includes('extractBundleTaskArgumentsLegacy(cmdArgs, project)');
  const rnUsesRegularFile =
    /abstract\s+val\s+jsIntermediateSourceMapsDir:\s+RegularFileProperty/.test(rnBundleTask);
  const rnExposesArgs = /abstract\s+val\s+args\b/.test(rnBundleTask) || /val\s+args\b/.test(rnBundleTask);
  const repoKeepsRootExtraProperty = androidBuildGradle.includes('task.ext.root = project.objects.directoryProperty()');
  const repoAttemptsDynamicArgs = androidBuildGradle.includes('task.setProperty("args"') || androidBuildGradle.includes('task.ext.args');
  const repoWorkaroundSafe = !repoAttemptsDynamicArgs;
  const ready =
    errors.length === 0 &&
    (!sentryExpectsDirectory || !rnUsesRegularFile || (sentryFallbackRequiresArgs && rnExposesArgs));

  return {
    sentryVersion,
    reactNativeVersion,
    sentryExpectsDirectory,
    sentryFallbackRequiresArgs,
    rnBundleTaskType: rnUsesRegularFile ? 'RegularFileProperty' : 'unknown',
    rnExposesArgs,
    repoKeepsRootExtraProperty,
    repoAttemptsDynamicArgs,
    repoWorkaroundSafe,
    ready,
    errors,
  };
};

export const formatSentryRnBundleTaskCompatibilitySummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Sentry RN bundle task compatibility audit',
    `Generated at: ${generatedAt}`,
    `Sentry RN bundle task compatibility ready: ${audit.ready ? 'yes' : 'no'}`,
    `@sentry/react-native version: ${audit.sentryVersion}`,
    `react-native version: ${audit.reactNativeVersion}`,
    `Sentry expects jsIntermediateSourceMapsDir Directory: ${audit.sentryExpectsDirectory ? 'yes' : 'no'}`,
    `Sentry fallback requires args property: ${audit.sentryFallbackRequiresArgs ? 'yes' : 'no'}`,
    `RN BundleHermesCTask jsIntermediateSourceMapsDir type: ${audit.rnBundleTaskType}`,
    `RN BundleHermesCTask exposes args property: ${audit.rnExposesArgs ? 'yes' : 'no'}`,
    `Repo keeps Sentry root extra property: ${audit.repoKeepsRootExtraProperty ? 'yes' : 'no'}`,
    `Repo attempts dynamic args workaround: ${audit.repoAttemptsDynamicArgs ? 'yes' : 'no'}`,
    `Repo-owned args workaround safe: ${audit.repoWorkaroundSafe ? 'yes' : 'no'}`,
    `Evidence errors: ${audit.errors.length}`,
  ];

  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push(
    audit.ready
      ? 'Required action: none'
      : 'Required action: keep Sentry source-map upload not claimed until an upstream Sentry/RN Gradle compatibility fix or credentialed release-runner proof confirms upload works.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Sentry RN bundle task compatibility audit');
  console.log(`@sentry/react-native version: ${audit.sentryVersion}`);
  console.log(`react-native version: ${audit.reactNativeVersion}`);
  console.log(`Sentry RN bundle task compatibility ready: ${audit.ready ? 'yes' : 'no'}`);
  console.log(`Sentry expects jsIntermediateSourceMapsDir Directory: ${audit.sentryExpectsDirectory ? 'yes' : 'no'}`);
  console.log(`RN BundleHermesCTask jsIntermediateSourceMapsDir type: ${audit.rnBundleTaskType}`);
  console.log(`Sentry fallback requires args property: ${audit.sentryFallbackRequiresArgs ? 'yes' : 'no'}`);
  console.log(`RN BundleHermesCTask exposes args property: ${audit.rnExposesArgs ? 'yes' : 'no'}`);
  console.log(`Repo-owned args workaround safe: ${audit.repoWorkaroundSafe ? 'yes' : 'no'}`);

  if (audit.errors.length > 0) {
    console.log('Evidence errors:');
    audit.errors.forEach(error => console.log(`- ${error}`));
  }

  if (!audit.ready) {
    console.log('Sentry source-map upload remains not claimed until an upstream Sentry/RN Gradle compatibility fix or credentialed proof is available.');
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSentryRnBundleTaskCompatibility();
  const summary = formatSentryRnBundleTaskCompatibilitySummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Sentry RN bundle task compatibility summary written to ${path.relative(root, summaryPath)}`);

  if (audit.errors.length > 0) {
    process.exitCode = 1;
  }
}

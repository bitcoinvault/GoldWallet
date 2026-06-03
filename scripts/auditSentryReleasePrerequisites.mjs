import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getSentryReleaseIntegrationErrors } from './sentryReleaseIntegrationGuard.mjs';
import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';
import { getAndroidReleaseApkManifestErrors } from './checkAndroidReleaseApkManifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'sentry-release-prereq-summary.txt');
const androidReleaseSummaryPath = path.join(root, 'local-docs', 'android-release-dev-summary.txt');
export const requiredSentryPropertiesFiles = ['sentry.properties', 'android/sentry.properties', 'ios/sentry.properties'];
export const requiredSentryPropertiesKeys = ['defaults.url', 'defaults.org', 'defaults.project', 'auth.token'];
export const requiredAndroidReleaseVariants = ['dev', 'stage', 'prod', 'beta'];
const missingAndroidReleaseSummaryError = 'Android release summary artifact is missing';
export const defaultSentryPropertiesValues = {
  'defaults.url': 'https://sentry.io/',
  'defaults.org': 'cloudbest',
  'defaults.project': 'goldwallet',
};
const createScriptPath = path.join(root, 'create-sentry-properties.sh');
const createNodeScriptPath = path.join(root, 'scripts', 'createSentryProperties.mjs');
const sentryCliPackagePath = path.join(root, 'node_modules', '@sentry', 'cli', 'package.json');
const sentryCliBinPath = path.join(root, 'node_modules', '@sentry', 'cli', 'bin', 'sentry-cli');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const readJson = relativePath => JSON.parse(read(relativePath));
const getSummaryLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};
const parseProperties = content =>
  new Map(
    content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
  );
const npmViewVersion = packageName =>
  execFileSync('npm', ['view', packageName, 'version'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    windowsHide: true,
  }).trim();

export const collectSentryReleasePrerequisites = ({ env = process.env } = {}) => {
  const packageJson = readJson('package.json');
  const scripts = packageJson.scripts || {};
  const expectedSentryPropertiesValues = {
    ...defaultSentryPropertiesValues,
    'defaults.org': env.SENTRY_ORG || defaultSentryPropertiesValues['defaults.org'],
    'defaults.project': env.SENTRY_PROJECT || defaultSentryPropertiesValues['defaults.project'],
  };
  const sentryReactNativeVersion = packageJson.dependencies?.['@sentry/react-native'] || 'missing';
  const sentryCliPackage = existsSync(sentryCliPackagePath) ? JSON.parse(readFileSync(sentryCliPackagePath, 'utf8')) : null;
  const sentryCliPackageVersion = sentryCliPackage?.version || 'missing';
  const sentryReactNativeLatest = npmViewVersion('@sentry/react-native');
  const sentryCliLatest = npmViewVersion('@sentry/cli');
  const sentryReactNativeCurrent = sentryReactNativeVersion === sentryReactNativeLatest;
  const sentryCliCurrent = sentryCliPackageVersion === sentryCliLatest;
  const sentryCliBinPresent = existsSync(sentryCliBinPath);
  let sentryCliVersionOutput = 'missing';
  let sentryCliExecutable = false;

  if (sentryCliBinPresent) {
    try {
      sentryCliVersionOutput = execFileSync(process.execPath, [sentryCliBinPath, '--version'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }).trim();
      sentryCliExecutable = sentryCliVersionOutput.includes(sentryCliPackageVersion);
    } catch (error) {
      sentryCliVersionOutput = `failed: ${error.message}`;
    }
  }

  const releaseIntegrationErrors = getSentryReleaseIntegrationErrors({
    androidBuildGradle: read('android/app/build.gradle'),
    iosProject: read('ios/GoldWallet.xcodeproj/project.pbxproj'),
  });
  const propertiesFileReadiness = [];

  requiredSentryPropertiesFiles.forEach(relativePath => {
    const absolutePath = path.join(root, relativePath);

    if (!existsSync(absolutePath)) {
      propertiesFileReadiness.push({
        relativePath,
        status: 'missing',
        missingKeys: requiredSentryPropertiesKeys,
        invalidStaticKeys: [],
        hasBlankToken: false,
      });
      return;
    }

    const content = read(relativePath);
    const properties = parseProperties(content);
    const missingKeys = requiredSentryPropertiesKeys.filter(key => !properties.has(key));
    const invalidStaticKeys = Object.entries(expectedSentryPropertiesValues)
      .filter(([key, expectedValue]) => properties.has(key) && properties.get(key) !== expectedValue)
      .map(([key]) => key);
    const hasBlankToken = properties.has('auth.token') && properties.get('auth.token') === '';
    const status = missingKeys.length === 0 && invalidStaticKeys.length === 0 && !hasBlankToken ? 'ready' : 'invalid';

    propertiesFileReadiness.push({
      relativePath,
      status,
      missingKeys,
      invalidStaticKeys,
      hasBlankToken,
    });
  });

  const missingFiles = propertiesFileReadiness
    .filter(file => file.status === 'missing')
    .map(file => file.relativePath);
  const invalidFiles = propertiesFileReadiness.filter(file => file.status === 'invalid');
  const readyPropertiesFiles = propertiesFileReadiness.filter(file => file.status === 'ready');
  const hasAndroidReleaseSummary = existsSync(androidReleaseSummaryPath);
  const androidReleaseSummary = hasAndroidReleaseSummary ? readFileSync(androidReleaseSummaryPath, 'utf8') : '';
  const androidReleaseSummaryVariants = hasAndroidReleaseSummary
    ? getSummaryLineValue(androidReleaseSummary, 'Variants')
        .split(',')
        .map(variant => variant.trim())
        .filter(Boolean)
    : [];
  const androidReleaseSummaryRequiredVariantsCovered = requiredAndroidReleaseVariants.every(variant =>
    androidReleaseSummaryVariants.includes(variant),
  );
  const androidReleaseSummaryErrors = hasAndroidReleaseSummary
    ? getAndroidReleaseSummaryErrors(androidReleaseSummary, root, { expectedVariants: androidReleaseSummaryVariants })
    : [missingAndroidReleaseSummaryError];
  const androidReleaseSummaryCurrentInputsCovered =
    hasAndroidReleaseSummary &&
    androidReleaseSummaryErrors.every(error => !error.includes('Release input fingerprint'));
  const androidReleaseApkManifestErrors = hasAndroidReleaseSummary
    ? getAndroidReleaseApkManifestErrors({ root, expectedVariants: androidReleaseSummaryVariants })
    : [missingAndroidReleaseSummaryError];

  const hasCreateScript = existsSync(createScriptPath);
  const createScript = hasCreateScript ? readFileSync(createScriptPath, 'utf8') : '';
  const createScriptUsesToken = createScript.includes('SENTRY_AUTH_TOKEN');
  const createScriptRejectsMissingToken = /SENTRY_AUTH_TOKEN:\?/.test(createScript);
  const createScriptWritesRootProperties = />\s*sentry\.properties\b/.test(createScript);
  const createScriptWritesAndroidProperties = />\s*android\/sentry\.properties\b/.test(createScript);
  const createScriptWritesIosProperties = />\s*ios\/sentry\.properties\b/.test(createScript);
  const createScriptSupportsOrgOverride = createScript.includes('SENTRY_ORG="${SENTRY_ORG:-cloudbest}"');
  const createScriptSupportsProjectOverride = createScript.includes('SENTRY_PROJECT="${SENTRY_PROJECT:-goldwallet}"');
  const createScriptStaticDefaultsValid =
    createScript.includes(`defaults.url=${defaultSentryPropertiesValues['defaults.url']}`) &&
    createScriptSupportsOrgOverride &&
    createScriptSupportsProjectOverride;
  const hasCreateNodeScript = existsSync(createNodeScriptPath);
  const createNodeScript = hasCreateNodeScript ? readFileSync(createNodeScriptPath, 'utf8') : '';
  const createNodeScriptUsesToken = createNodeScript.includes('SENTRY_AUTH_TOKEN');
  const createNodeScriptRejectsMissingToken = createNodeScript.includes('SENTRY_AUTH_TOKEN is required');
  const createNodeScriptWritesRootProperties = createNodeScript.includes("'sentry.properties'");
  const createNodeScriptWritesAndroidProperties = createNodeScript.includes("'android/sentry.properties'");
  const createNodeScriptWritesIosProperties = createNodeScript.includes("'ios/sentry.properties'");
  const createNodeScriptStaticDefaultsValid =
    createNodeScript.includes(`'defaults.url': '${defaultSentryPropertiesValues['defaults.url']}'`) &&
    createNodeScript.includes(`'defaults.org': '${defaultSentryPropertiesValues['defaults.org']}'`) &&
    createNodeScript.includes(`'defaults.project': '${defaultSentryPropertiesValues['defaults.project']}'`);
  const createNodeScriptSupportsOrgOverride = createNodeScript.includes('env.SENTRY_ORG ||');
  const createNodeScriptSupportsProjectOverride = createNodeScript.includes('env.SENTRY_PROJECT ||');
  const createNodeScriptSupportsRootOverride = createNodeScript.includes("arg === '--root'");
  const createNodePackageScriptPresent = scripts['sentry:release:create-properties'] === 'node scripts/createSentryProperties.mjs';
  const envHasToken = Boolean(env.SENTRY_AUTH_TOKEN);
  const ready = missingFiles.length === 0 && invalidFiles.length === 0 && releaseIntegrationErrors.length === 0 && sentryCliExecutable;

  return {
    sentryReactNativeVersion,
    sentryReactNativeLatest,
    sentryReactNativeCurrent,
    sentryCliPackageVersion,
    sentryCliLatest,
    sentryCliCurrent,
    sentryCliBinPresent,
    sentryCliVersionOutput,
    sentryCliExecutable,
    releaseIntegrationErrors,
    propertiesFileReadiness,
    missingFiles,
    invalidFiles,
    readyPropertiesFiles,
    hasAndroidReleaseSummary,
    androidReleaseSummaryVariants,
    androidReleaseSummaryRequiredVariantsCovered,
    androidReleaseSummaryErrors,
    androidReleaseSummaryCurrentInputsCovered,
    androidReleaseApkManifestErrors,
    hasCreateScript,
    createScriptUsesToken,
    createScriptRejectsMissingToken,
    createScriptWritesRootProperties,
    createScriptWritesAndroidProperties,
    createScriptWritesIosProperties,
    createScriptStaticDefaultsValid,
    createScriptSupportsOrgOverride,
    createScriptSupportsProjectOverride,
    hasCreateNodeScript,
    createNodeScriptUsesToken,
    createNodeScriptRejectsMissingToken,
    createNodeScriptWritesRootProperties,
    createNodeScriptWritesAndroidProperties,
    createNodeScriptWritesIosProperties,
    createNodeScriptStaticDefaultsValid,
    createNodeScriptSupportsOrgOverride,
    createNodeScriptSupportsProjectOverride,
    createNodeScriptSupportsRootOverride,
    createNodePackageScriptPresent,
    envHasToken,
    ready,
  };
};

export const formatSentryReleasePrereqSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Sentry release prerequisite audit',
    `Generated at: ${generatedAt}`,
    `Release source-map prerequisites: ${audit.ready ? 'ready' : 'not ready'}`,
    `@sentry/react-native version: ${audit.sentryReactNativeVersion}`,
    `@sentry/react-native latest: ${audit.sentryReactNativeLatest}`,
    `@sentry/react-native current: ${audit.sentryReactNativeCurrent ? 'yes' : 'no'}`,
    `@sentry/cli package version: ${audit.sentryCliPackageVersion}`,
    `@sentry/cli latest: ${audit.sentryCliLatest}`,
    `@sentry/cli current: ${audit.sentryCliCurrent ? 'yes' : 'no'}`,
    `Sentry CLI binary present: ${audit.sentryCliBinPresent ? 'yes' : 'no'}`,
    `Sentry CLI version output: ${audit.sentryCliVersionOutput}`,
    `Sentry CLI executable: ${audit.sentryCliExecutable ? 'yes' : 'no'}`,
    `Sentry release integration wired: ${audit.releaseIntegrationErrors.length === 0 ? 'yes' : 'no'}`,
    `Sentry release integration errors: ${audit.releaseIntegrationErrors.length}`,
    `sentry.properties files present: ${audit.missingFiles.length === 0 ? 'yes' : 'no'}`,
    `Missing files: ${audit.missingFiles.length}`,
  ];

  audit.releaseIntegrationErrors.forEach(error => lines.push(`- ${error}`));
  audit.missingFiles.forEach(relativePath => lines.push(`- ${relativePath}`));
  lines.push(`Invalid files: ${audit.invalidFiles.length}`);

  audit.invalidFiles.forEach(file => {
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

    lines.push(`- ${file.relativePath}: ${issues.join('; ')}`);
  });

  lines.push(`Properties file readiness entries: ${audit.propertiesFileReadiness.length}`);
  audit.propertiesFileReadiness.forEach(file => {
    lines.push(`- ${file.relativePath}: ${file.status}`);
  });
  lines.push(`Ready properties files: ${audit.readyPropertiesFiles.length}`);
  lines.push(`Android release summary present: ${audit.hasAndroidReleaseSummary ? 'yes' : 'no'}`);
  lines.push(`Android release summary variants: ${audit.androidReleaseSummaryVariants.join(', ') || 'none'}`);
  lines.push(`Android release summary required variants covered: ${audit.androidReleaseSummaryRequiredVariantsCovered ? 'yes' : 'no'}`);
  lines.push(`Android release summary valid: ${audit.androidReleaseSummaryErrors.length === 0 ? 'yes' : 'no'}`);
  lines.push(`Android release summary current inputs covered: ${audit.androidReleaseSummaryCurrentInputsCovered ? 'yes' : 'no'}`);
  lines.push(`Android release summary errors: ${audit.androidReleaseSummaryErrors.length}`);
  audit.androidReleaseSummaryErrors.forEach(error => lines.push(`- ${error}`));
  lines.push(`Android release APK manifest valid: ${audit.androidReleaseApkManifestErrors.length === 0 ? 'yes' : 'no'}`);
  lines.push(`Android release APK manifest errors: ${audit.androidReleaseApkManifestErrors.length}`);
  audit.androidReleaseApkManifestErrors.forEach(error => lines.push(`- ${error}`));
  lines.push('Sentry release upload validation: not claimed');
  lines.push(`create-sentry-properties.sh present: ${audit.hasCreateScript ? 'yes' : 'no'}`);
  lines.push(`create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: ${audit.createScriptUsesToken ? 'yes' : 'no'}`);
  lines.push(`create-sentry-properties.sh rejects missing SENTRY_AUTH_TOKEN: ${audit.createScriptRejectsMissingToken ? 'yes' : 'no'}`);
  lines.push(`create-sentry-properties.sh writes root properties: ${audit.createScriptWritesRootProperties ? 'yes' : 'no'}`);
  lines.push(`create-sentry-properties.sh writes Android properties: ${audit.createScriptWritesAndroidProperties ? 'yes' : 'no'}`);
  lines.push(`create-sentry-properties.sh writes iOS properties: ${audit.createScriptWritesIosProperties ? 'yes' : 'no'}`);
  lines.push(`create-sentry-properties.sh static defaults valid: ${audit.createScriptStaticDefaultsValid ? 'yes' : 'no'}`);
  lines.push(`create-sentry-properties.sh supports SENTRY_ORG override: ${audit.createScriptSupportsOrgOverride ? 'yes' : 'no'}`);
  lines.push(`create-sentry-properties.sh supports SENTRY_PROJECT override: ${audit.createScriptSupportsProjectOverride ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs present: ${audit.hasCreateNodeScript ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs requires SENTRY_AUTH_TOKEN: ${audit.createNodeScriptUsesToken ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs rejects missing SENTRY_AUTH_TOKEN: ${audit.createNodeScriptRejectsMissingToken ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs writes root properties: ${audit.createNodeScriptWritesRootProperties ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs writes Android properties: ${audit.createNodeScriptWritesAndroidProperties ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs writes iOS properties: ${audit.createNodeScriptWritesIosProperties ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs static defaults valid: ${audit.createNodeScriptStaticDefaultsValid ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs supports SENTRY_ORG override: ${audit.createNodeScriptSupportsOrgOverride ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs supports SENTRY_PROJECT override: ${audit.createNodeScriptSupportsProjectOverride ? 'yes' : 'no'}`);
  lines.push(`createSentryProperties.mjs supports --root override: ${audit.createNodeScriptSupportsRootOverride ? 'yes' : 'no'}`);
  lines.push(`sentry:release:create-properties script present: ${audit.createNodePackageScriptPresent ? 'yes' : 'no'}`);
  lines.push(`SENTRY_AUTH_TOKEN available in current shell: ${audit.envHasToken ? 'yes' : 'no'}`);
  lines.push(
    audit.ready
      ? 'Required action: none; release source-map prerequisites are present locally.'
      : 'Required action: generate sentry.properties, android/sentry.properties, and ios/sentry.properties with SENTRY_AUTH_TOKEN before claiming Sentry release validation.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Sentry release prerequisite audit');
  console.log(`@sentry/react-native version: ${audit.sentryReactNativeVersion}`);
  console.log(`@sentry/react-native latest: ${audit.sentryReactNativeLatest}`);
  console.log(`@sentry/react-native current: ${audit.sentryReactNativeCurrent ? 'yes' : 'no'}`);
  console.log(`@sentry/cli package version: ${audit.sentryCliPackageVersion}`);
  console.log(`@sentry/cli latest: ${audit.sentryCliLatest}`);
  console.log(`@sentry/cli current: ${audit.sentryCliCurrent ? 'yes' : 'no'}`);
  console.log(`Sentry CLI binary present: ${audit.sentryCliBinPresent ? 'yes' : 'no'}`);
  console.log(`Sentry CLI version output: ${audit.sentryCliVersionOutput}`);
  console.log(`Sentry CLI executable: ${audit.sentryCliExecutable ? 'yes' : 'no'}`);
  console.log(`Sentry release integration wired: ${audit.releaseIntegrationErrors.length === 0 ? 'yes' : 'no'}`);

  if (audit.releaseIntegrationErrors.length > 0) {
    console.log('Sentry release integration errors:');
    audit.releaseIntegrationErrors.forEach(error => console.log(`- ${error}`));
  }

  console.log(`sentry.properties files present: ${audit.missingFiles.length === 0 ? 'yes' : 'no'}`);

  if (audit.missingFiles.length > 0) {
    console.log('Missing files:');
    audit.missingFiles.forEach(relativePath => console.log(`- ${relativePath}`));
  }

  if (audit.invalidFiles.length > 0) {
    console.log('Invalid files:');
    audit.invalidFiles.forEach(file => {
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

      console.log(`- ${file.relativePath}: ${issues.join('; ')}`);
    });
  }

  console.log('Properties file readiness:');
  audit.propertiesFileReadiness.forEach(file => console.log(`- ${file.relativePath}: ${file.status}`));
  console.log(`Ready properties files: ${audit.readyPropertiesFiles.length}`);
  console.log(`Android release summary present: ${audit.hasAndroidReleaseSummary ? 'yes' : 'no'}`);
  console.log(`Android release summary variants: ${audit.androidReleaseSummaryVariants.join(', ') || 'none'}`);
  console.log(`Android release summary required variants covered: ${audit.androidReleaseSummaryRequiredVariantsCovered ? 'yes' : 'no'}`);
  console.log(`Android release summary valid: ${audit.androidReleaseSummaryErrors.length === 0 ? 'yes' : 'no'}`);
  console.log(`Android release summary current inputs covered: ${audit.androidReleaseSummaryCurrentInputsCovered ? 'yes' : 'no'}`);
  console.log(`Android release summary errors: ${audit.androidReleaseSummaryErrors.length}`);
  console.log(`Android release APK manifest valid: ${audit.androidReleaseApkManifestErrors.length === 0 ? 'yes' : 'no'}`);
  console.log(`Android release APK manifest errors: ${audit.androidReleaseApkManifestErrors.length}`);
  console.log('Sentry release upload validation: not claimed');
  console.log(`create-sentry-properties.sh present: ${audit.hasCreateScript ? 'yes' : 'no'}`);
  console.log(`create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: ${audit.createScriptUsesToken ? 'yes' : 'no'}`);
  console.log(`create-sentry-properties.sh rejects missing SENTRY_AUTH_TOKEN: ${audit.createScriptRejectsMissingToken ? 'yes' : 'no'}`);
  console.log(`create-sentry-properties.sh writes root properties: ${audit.createScriptWritesRootProperties ? 'yes' : 'no'}`);
  console.log(`create-sentry-properties.sh writes Android properties: ${audit.createScriptWritesAndroidProperties ? 'yes' : 'no'}`);
  console.log(`create-sentry-properties.sh writes iOS properties: ${audit.createScriptWritesIosProperties ? 'yes' : 'no'}`);
  console.log(`create-sentry-properties.sh static defaults valid: ${audit.createScriptStaticDefaultsValid ? 'yes' : 'no'}`);
  console.log(`create-sentry-properties.sh supports SENTRY_ORG override: ${audit.createScriptSupportsOrgOverride ? 'yes' : 'no'}`);
  console.log(`create-sentry-properties.sh supports SENTRY_PROJECT override: ${audit.createScriptSupportsProjectOverride ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs present: ${audit.hasCreateNodeScript ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs requires SENTRY_AUTH_TOKEN: ${audit.createNodeScriptUsesToken ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs rejects missing SENTRY_AUTH_TOKEN: ${audit.createNodeScriptRejectsMissingToken ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs writes root properties: ${audit.createNodeScriptWritesRootProperties ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs writes Android properties: ${audit.createNodeScriptWritesAndroidProperties ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs writes iOS properties: ${audit.createNodeScriptWritesIosProperties ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs static defaults valid: ${audit.createNodeScriptStaticDefaultsValid ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs supports SENTRY_ORG override: ${audit.createNodeScriptSupportsOrgOverride ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs supports SENTRY_PROJECT override: ${audit.createNodeScriptSupportsProjectOverride ? 'yes' : 'no'}`);
  console.log(`createSentryProperties.mjs supports --root override: ${audit.createNodeScriptSupportsRootOverride ? 'yes' : 'no'}`);
  console.log(`sentry:release:create-properties script present: ${audit.createNodePackageScriptPresent ? 'yes' : 'no'}`);
  console.log(`SENTRY_AUTH_TOKEN available in current shell: ${audit.envHasToken ? 'yes' : 'no'}`);

  if (!audit.ready) {
    console.log('Release source-map validation is not ready locally.');
    console.log(
      'Required before claiming Sentry release validation: generate sentry.properties, android/sentry.properties, and ios/sentry.properties with SENTRY_AUTH_TOKEN.',
    );
  } else {
    console.log('Release source-map prerequisites are present locally.');
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSentryReleasePrerequisites();
  const summary = formatSentryReleasePrereqSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Sentry release prerequisite summary written to ${path.relative(root, summaryPath)}`);
}

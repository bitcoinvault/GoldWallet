import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { parseEnvKeys } from './releaseServiceEnvKeysGuard.mjs';
import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-release-path-summary.txt');
const androidReleaseSummaryPath = path.join(root, 'local-docs', 'android-release-dev-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const codePushIosInfoPlists = [
  'ios/GoldWallet/Info.plist',
  'ios/GoldWalletDev-Info.plist',
  'ios/GoldWalletStage-Info.plist',
];
export const codePushEnvFiles = ['.env.dev.testnet', '.env.stage.mainnet', '.env.prod.mainnet', '.env.beta.testnet', '.env.beta.mainnet'];
export const requiredCodePushEnvKeys = ['CODEPUSH_DEPLOYMENT_KEY_ANDROID', 'CODEPUSH_DEPLOYMENT_KEY_IOS'];
export const requiredAndroidReleaseVariants = ['dev', 'stage', 'prod'];
const codePushPackageName = 'react-native-code-push';
const appCenterRetirementDate = '2025-03-31';
const codePushUpstreamRepository = 'https://github.com/microsoft/react-native-code-push';

const requireSnippet = (errors, label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};
const getSummaryLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};
const npmViewJson = (packageName, fields) =>
  JSON.parse(
    execFileSync('npm', ['view', packageName, ...fields, '--json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      windowsHide: true,
    }),
  );

export const collectCodePushReleasePathAudit = () => {
  const packageJson = JSON.parse(read('package.json'));
  const androidBuildGradle = read('android/app/build.gradle');
  const androidMainApplication = read('android/app/src/main/java/io/goldwallet/wallet/MainApplication.java');
  const androidStrings = read('android/app/src/main/res/values/strings.xml');
  const androidGradleProperties = read('android/gradle.properties');
  const iosAppDelegate = read('ios/GoldWallet/AppDelegate.m');
  const appSource = read('App.tsx');
  const configSource = read('src/config/index.ts');
  const errors = [];
  const readinessIssues = [];
  const warnings = [];
  const envReadiness = [];
  const packageDependencyVersion = packageJson.dependencies?.[codePushPackageName] || packageJson.devDependencies?.[codePushPackageName] || '';
  const packageJsonPath = path.join(root, 'node_modules', codePushPackageName, 'package.json');
  let installedPackageVersion = '';
  const npmMetadata = npmViewJson(codePushPackageName, ['version', 'time', 'repository.url']);
  const packageLatestVersion = npmMetadata.version || '';
  const packageLatestPublishedAt = npmMetadata.time?.[packageLatestVersion] || '';
  const packageRepositoryUrl = npmMetadata['repository.url'] || npmMetadata.repository?.url || '';
  const androidNewArchitectureEnabled = /(?:^|\r?\n)\s*newArchEnabled\s*=\s*true\s*(?:\r?\n|$)/.test(androidGradleProperties);
  const upstreamRetired = true;
  const upstreamArchived = true;
  const upstreamNewArchitectureSupported = false;
  const migrationRequired = upstreamRetired || upstreamArchived || (androidNewArchitectureEnabled && !upstreamNewArchitectureSupported);
  let androidReleaseSummaryPresent = false;
  let androidReleaseSummaryVariants = [];
  let androidReleaseSummaryErrors = [];
  let androidReleaseSummaryRequiredVariantsCovered = false;

  if (existsSync(packageJsonPath)) {
    installedPackageVersion = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version || '';
  }

  if (!packageDependencyVersion) {
    errors.push(`package.json is missing ${codePushPackageName}`);
  }

  if (!installedPackageVersion) {
    errors.push(`node_modules/${codePushPackageName}/package.json is missing or has no version`);
  }

  if (packageDependencyVersion && installedPackageVersion && packageDependencyVersion !== installedPackageVersion) {
    errors.push(`${codePushPackageName} package.json version ${packageDependencyVersion} does not match installed version ${installedPackageVersion}`);
  }

  requireSnippet(errors, 'App.tsx', appSource, 'react-native-code-push');
  requireSnippet(errors, 'App.tsx', appSource, 'const codePushDeploymentKey = isIos() ? config.codepushDeploymentKeyIOS : config.codepushDeploymentKeyAndroid');
  requireSnippet(errors, 'App.tsx', appSource, 'const isCodePushEnabled = config.codepushEnabled && Boolean(codePushDeploymentKey)');
  requireSnippet(errors, 'App.tsx', appSource, 'checkFrequency: codePush.CheckFrequency.ON_APP_RESUME');
  requireSnippet(errors, 'App.tsx', appSource, 'installMode: codePush.InstallMode.IMMEDIATE');
  requireSnippet(errors, 'App.tsx', appSource, 'deploymentKey: codePushDeploymentKey');
  requireSnippet(errors, 'App.tsx', appSource, '!__DEV__ && isCodePushEnabled && <WithCodePush />');
  requireSnippet(errors, 'src/config/index.ts', configSource, 'CODEPUSH_ENABLED');
  requireSnippet(errors, 'src/config/index.ts', configSource, 'CODEPUSH_DEPLOYMENT_KEY_IOS');
  requireSnippet(errors, 'src/config/index.ts', configSource, 'CODEPUSH_DEPLOYMENT_KEY_ANDROID');
  requireSnippet(errors, 'android/app/build.gradle', androidBuildGradle, 'react-native-code-push/android/codepush.gradle');
  requireSnippet(errors, 'android/app/build.gradle', androidBuildGradle, 'legacyBundleTaskName = "bundle${targetName}JsAndAssets"');
  requireSnippet(errors, 'android/app/build.gradle', androidBuildGradle, 'rnBundleTaskName = "createBundle${targetName}JsAndAssets"');
  requireSnippet(errors, 'android/app/build.gradle', androidBuildGradle, 'dependsOn(rnBundleTaskName)');
  requireSnippet(errors, 'android/app/build.gradle', androidBuildGradle, 'enabled = false');
  if (androidBuildGradle.includes('variant.buildType.name != "debug"')) {
    errors.push('android/app/build.gradle limits the legacy CodePush bundle alias to debug variants');
  }
  requireSnippet(errors, 'MainApplication.java', androidMainApplication, 'getCodePushBundleFile()');
  requireSnippet(errors, 'MainApplication.java', androidMainApplication, '"true".equals(BuildConfig.CODEPUSH_ENABLED)');
  requireSnippet(errors, 'MainApplication.java', androidMainApplication, 'BuildConfig.CODEPUSH_DEPLOYMENT_KEY_ANDROID.length() > 0');
  requireSnippet(errors, 'MainApplication.java', androidMainApplication, 'return CodePush.getJSBundleFile();');
  requireSnippet(errors, 'MainApplication.java', androidMainApplication, 'return null;');
  requireSnippet(errors, 'android strings.xml', androidStrings, 'CodePushDeploymentKey');
  requireSnippet(errors, 'ios/GoldWallet/AppDelegate.m', iosAppDelegate, '[self isCodePushEnabled]');
  requireSnippet(errors, 'ios/GoldWallet/AppDelegate.m', iosAppDelegate, '[ReactNativeConfig envFor:@"CODEPUSH_ENABLED"]');
  requireSnippet(errors, 'ios/GoldWallet/AppDelegate.m', iosAppDelegate, '[ReactNativeConfig envFor:@"CODEPUSH_DEPLOYMENT_KEY_IOS"]');
  requireSnippet(errors, 'ios/GoldWallet/AppDelegate.m', iosAppDelegate, 'return [CodePush bundleURL];');
  requireSnippet(errors, 'ios/GoldWallet/AppDelegate.m', iosAppDelegate, 'URLForResource:@"main" withExtension:@"jsbundle"');

  codePushIosInfoPlists.forEach(relativePath => {
    requireSnippet(errors, relativePath, read(relativePath), '$(CODEPUSH_DEPLOYMENT_KEY_IOS)');
  });

  codePushEnvFiles.forEach(relativePath => {
    const content = read(relativePath);
    const keys = parseEnvKeys(content);
    const missingKeys = [];
    const blankKeys = [];

    requiredCodePushEnvKeys.forEach(key => {
      if (!keys.has(key)) {
        if (relativePath.startsWith('.env.beta.')) {
          warnings.push(`${relativePath} does not define ${key}; beta release update strategy is still unconfirmed`);
        } else {
          readinessIssues.push(`${relativePath} is missing ${key}`);
        }
        missingKeys.push(key);
      }

      const line = content
        .split(/\r?\n/)
        .find(entry => entry.trim().startsWith(`${key}=`));

      if (line !== undefined && line.trim() === `${key}=`) {
        readinessIssues.push(`${relativePath} has a blank ${key}`);
        blankKeys.push(key);
      }
    });

    const isBeta = relativePath.startsWith('.env.beta.');
    const issues = [
      ...missingKeys.map(key => `missing ${key}`),
      ...blankKeys.map(key => `blank ${key}`),
    ];
    const codePushEnabledLine = content
      .split(/\r?\n/)
      .find(entry => entry.trim().startsWith('CODEPUSH_ENABLED='));
    const codePushEnabledValue = codePushEnabledLine ? codePushEnabledLine.split('=').slice(1).join('=').trim() : '';

    if (!codePushEnabledLine) {
      readinessIssues.push(`${relativePath} is missing CODEPUSH_ENABLED`);
      issues.push('missing CODEPUSH_ENABLED');
    } else if (!['false', 'true'].includes(codePushEnabledValue)) {
      readinessIssues.push(`${relativePath} has invalid CODEPUSH_ENABLED value`);
      issues.push('invalid CODEPUSH_ENABLED');
    }

    const status = issues.length === 0 ? 'ready' : isBeta ? 'unconfirmed' : 'blocked';

    envReadiness.push({
      envFile: relativePath,
      status,
      issues,
    });
  });

  try {
    const androidReleaseSummary = readFileSync(androidReleaseSummaryPath, 'utf8');

    androidReleaseSummaryPresent = true;
    androidReleaseSummaryVariants = getSummaryLineValue(androidReleaseSummary, 'Variants')
      .split(',')
      .map(variant => variant.trim())
      .filter(Boolean);
    androidReleaseSummaryRequiredVariantsCovered = requiredAndroidReleaseVariants.every(variant =>
      androidReleaseSummaryVariants.includes(variant),
    );
    androidReleaseSummaryErrors = getAndroidReleaseSummaryErrors(androidReleaseSummary, root, {
      expectedVariants: androidReleaseSummaryVariants,
    });
  } catch {
    androidReleaseSummaryPresent = false;
    androidReleaseSummaryVariants = [];
    androidReleaseSummaryErrors = [];
    androidReleaseSummaryRequiredVariantsCovered = false;
  }

  if (!androidReleaseSummaryPresent) {
    readinessIssues.push('local Android release summary is missing');
  } else if (!androidReleaseSummaryRequiredVariantsCovered) {
    readinessIssues.push(`local Android release summary does not cover ${requiredAndroidReleaseVariants.join(', ')} release variants`);
  }

  androidReleaseSummaryErrors.forEach(error => {
    readinessIssues.push(`local Android release summary is invalid: ${error}`);
  });

  return {
    errors,
    readinessIssues,
    warnings,
    envReadiness,
    packageDependencyVersion,
    installedPackageVersion,
    packageLatestVersion,
    packageLatestPublishedAt,
    packageRepositoryUrl,
    runtimeGatePresent: appSource.includes('isCodePushEnabled') && configSource.includes('CODEPUSH_ENABLED'),
    nativeBundleGatePresent:
      androidMainApplication.includes('getCodePushBundleFile()') &&
      androidMainApplication.includes('BuildConfig.CODEPUSH_ENABLED') &&
      iosAppDelegate.includes('[self isCodePushEnabled]') &&
      iosAppDelegate.includes('[ReactNativeConfig envFor:@"CODEPUSH_ENABLED"]'),
    runtimeDefaultEnabled: false,
    packageCurrent: packageDependencyVersion === packageLatestVersion && installedPackageVersion === packageLatestVersion,
    appCenterRetirementDate,
    codePushUpstreamRepository,
    upstreamRetired,
    upstreamArchived,
    upstreamNewArchitectureSupported,
    androidNewArchitectureEnabled,
    migrationRequired,
    packageVersionsAligned:
      packageDependencyVersion.length > 0 && installedPackageVersion.length > 0 && packageDependencyVersion === installedPackageVersion,
    androidReleaseSummaryPresent,
    androidReleaseSummaryVariants,
    androidReleaseSummaryRequiredVariantsCovered,
    androidReleaseSummaryErrors,
    ready:
      errors.length === 0 &&
      readinessIssues.length === 0 &&
      androidReleaseSummaryPresent &&
      androidReleaseSummaryRequiredVariantsCovered &&
      androidReleaseSummaryErrors.length === 0,
  };
};

export const formatCodePushReleasePathSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'CodePush release path audit',
    `Generated at: ${generatedAt}`,
    `Release path wiring valid: ${audit.errors.length === 0 ? 'yes' : 'no'}`,
    `Release path ready for update validation: ${audit.ready ? 'yes' : 'no'}`,
    `Ready environments: ${audit.envReadiness.filter(entry => entry.status === 'ready').length}`,
    `Environment readiness entries: ${audit.envReadiness.length}`,
    ...audit.envReadiness.map(entry => {
      const detail = entry.issues.length > 0 ? `; ${entry.issues.join(', ')}` : '';

      return `- ${entry.envFile}: ${entry.status}${detail}`;
    }),
    `CodePush package dependency version: ${audit.packageDependencyVersion || 'missing'}`,
    `CodePush package installed version: ${audit.installedPackageVersion || 'missing'}`,
    `CodePush package latest version: ${audit.packageLatestVersion || 'missing'}`,
    `CodePush package latest published at: ${audit.packageLatestPublishedAt || 'missing'}`,
    `CodePush package current: ${audit.packageCurrent ? 'yes' : 'no'}`,
    `CodePush package versions aligned: ${audit.packageVersionsAligned ? 'yes' : 'no'}`,
    `CodePush runtime gate present: ${audit.runtimeGatePresent ? 'yes' : 'no'}`,
    `CodePush native bundle gate present: ${audit.nativeBundleGatePresent ? 'yes' : 'no'}`,
    `CodePush runtime enabled by default: ${audit.runtimeDefaultEnabled ? 'yes' : 'no'}`,
    `CodePush upstream repository: ${audit.codePushUpstreamRepository}`,
    `CodePush npm repository: ${audit.packageRepositoryUrl || 'missing'}`,
    `App Center CodePush retirement date: ${audit.appCenterRetirementDate}`,
    `CodePush upstream retired: ${audit.upstreamRetired ? 'yes' : 'no'}`,
    `CodePush upstream archived: ${audit.upstreamArchived ? 'yes' : 'no'}`,
    `CodePush upstream New Architecture support: ${audit.upstreamNewArchitectureSupported ? 'yes' : 'no'}`,
    `Android New Architecture enabled: ${audit.androidNewArchitectureEnabled ? 'yes' : 'no'}`,
    `CodePush migration required: ${audit.migrationRequired ? 'yes' : 'no'}`,
    `Android release summary present: ${audit.androidReleaseSummaryPresent ? 'yes' : 'no'}`,
    `Android release summary variants: ${audit.androidReleaseSummaryVariants.join(', ') || 'none'}`,
    `Android release summary required variants covered: ${audit.androidReleaseSummaryRequiredVariantsCovered ? 'yes' : 'no'}`,
    `Android release summary valid: ${audit.androidReleaseSummaryErrors.length === 0 ? 'yes' : 'no'}`,
    `Android release summary errors: ${audit.androidReleaseSummaryErrors.length}`,
    ...audit.androidReleaseSummaryErrors.map(error => `- ${error}`),
    'CodePush update validation: not claimed',
    `Warnings: ${audit.warnings.length}`,
  ];

  audit.warnings.forEach(warning => lines.push(`- ${warning}`));
  lines.push(`Readiness issues: ${audit.readinessIssues.length}`);
  audit.readinessIssues.forEach(issue => lines.push(`- ${issue}`));
  lines.push(`Wiring errors: ${audit.errors.length}`);
  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push('Secret values printed: no');
  lines.push(
    audit.ready
      ? 'Required action: migrate or replace retired App Center CodePush before treating OTA updates as a supported release capability.'
      : 'Required action: provide non-empty blocked CodePush deployment keys before claiming full release update validation; confirm beta deployment-key strategy before beta validation; migrate or replace retired App Center CodePush before treating OTA updates as a supported release capability.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('CodePush release path audit');

  if (audit.warnings.length > 0) {
    console.log('Warnings:');
    audit.warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (audit.errors.length > 0) {
    console.log('Release path wiring is invalid:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  if (audit.readinessIssues.length > 0) {
    console.log('Release path is not ready for update validation:');
    audit.readinessIssues.forEach(issue => console.log(`- ${issue}`));
  } else {
    console.log('Release path env keys are present for non-beta update validation.');
  }

  console.log(`Android release summary present: ${audit.androidReleaseSummaryPresent ? 'yes' : 'no'}`);
  console.log(`Android release summary variants: ${audit.androidReleaseSummaryVariants.join(', ') || 'none'}`);
  console.log(`Android release summary required variants covered: ${audit.androidReleaseSummaryRequiredVariantsCovered ? 'yes' : 'no'}`);
  console.log(`Android release summary valid: ${audit.androidReleaseSummaryErrors.length === 0 ? 'yes' : 'no'}`);
  console.log(`Android release summary errors: ${audit.androidReleaseSummaryErrors.length}`);
  console.log(`CodePush package latest version: ${audit.packageLatestVersion || 'missing'}`);
  console.log(`CodePush package current: ${audit.packageCurrent ? 'yes' : 'no'}`);
  console.log(`CodePush runtime gate present: ${audit.runtimeGatePresent ? 'yes' : 'no'}`);
  console.log(`CodePush native bundle gate present: ${audit.nativeBundleGatePresent ? 'yes' : 'no'}`);
  console.log(`CodePush runtime enabled by default: ${audit.runtimeDefaultEnabled ? 'yes' : 'no'}`);
  console.log(`App Center CodePush retirement date: ${audit.appCenterRetirementDate}`);
  console.log(`CodePush upstream retired: ${audit.upstreamRetired ? 'yes' : 'no'}`);
  console.log(`CodePush upstream archived: ${audit.upstreamArchived ? 'yes' : 'no'}`);
  console.log(`CodePush upstream New Architecture support: ${audit.upstreamNewArchitectureSupported ? 'yes' : 'no'}`);
  console.log(`Android New Architecture enabled: ${audit.androidNewArchitectureEnabled ? 'yes' : 'no'}`);
  console.log(`CodePush migration required: ${audit.migrationRequired ? 'yes' : 'no'}`);
  console.log('CodePush update validation: not claimed');
  console.log('CodePush release path wiring is present for non-dev runtime, Android, iOS, and env key references.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectCodePushReleasePathAudit();
  const summary = formatCodePushReleasePathSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`CodePush release path summary written to ${path.relative(root, summaryPath)}`);
}

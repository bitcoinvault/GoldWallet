import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { parseEnvKeys } from './releaseServiceEnvKeysGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-release-path-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const codePushIosInfoPlists = [
  'ios/GoldWallet/Info.plist',
  'ios/GoldWalletDev-Info.plist',
  'ios/GoldWalletStage-Info.plist',
];
export const codePushEnvFiles = ['.env.dev.testnet', '.env.stage.mainnet', '.env.prod.mainnet', '.env.beta.testnet', '.env.beta.mainnet'];
export const requiredCodePushEnvKeys = ['CODEPUSH_DEPLOYMENT_KEY_ANDROID', 'CODEPUSH_DEPLOYMENT_KEY_IOS'];

const requireSnippet = (errors, label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

export const collectCodePushReleasePathAudit = () => {
  const androidBuildGradle = read('android/app/build.gradle');
  const androidMainApplication = read('android/app/src/main/java/io/goldwallet/wallet/MainApplication.java');
  const androidStrings = read('android/app/src/main/res/values/strings.xml');
  const appSource = read('App.tsx');
  const configSource = read('src/config/index.ts');
  const errors = [];
  const readinessIssues = [];
  const warnings = [];
  const envReadiness = [];

  requireSnippet(errors, 'App.tsx', appSource, 'react-native-code-push');
  requireSnippet(errors, 'App.tsx', appSource, 'checkFrequency: codePush.CheckFrequency.ON_APP_RESUME');
  requireSnippet(errors, 'App.tsx', appSource, 'installMode: codePush.InstallMode.IMMEDIATE');
  requireSnippet(errors, 'App.tsx', appSource, 'deploymentKey: isIos() ? config.codepushDeploymentKeyIOS : config.codepushDeploymentKeyAndroid');
  requireSnippet(errors, 'App.tsx', appSource, '!__DEV__ && <WithCodePush />');
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
  requireSnippet(errors, 'MainApplication.java', androidMainApplication, 'CodePush.getJSBundleFile()');
  requireSnippet(errors, 'android strings.xml', androidStrings, 'CodePushDeploymentKey');

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
    const status = issues.length === 0 ? 'ready' : isBeta ? 'unconfirmed' : 'blocked';

    envReadiness.push({
      envFile: relativePath,
      status,
      issues,
    });
  });

  return {
    errors,
    readinessIssues,
    warnings,
    envReadiness,
    ready: errors.length === 0 && readinessIssues.length === 0,
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
      ? 'Required action: none; non-beta CodePush release path env keys are present locally.'
      : 'Required action: provide non-empty blocked CodePush deployment keys before claiming full release update validation; confirm beta deployment-key strategy before beta validation.',
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

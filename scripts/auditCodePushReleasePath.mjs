import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseEnvKeys } from './releaseServiceEnvKeysGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

const androidBuildGradle = read('android/app/build.gradle');
const androidMainApplication = read('android/app/src/main/java/io/goldwallet/wallet/MainApplication.java');
const androidStrings = read('android/app/src/main/res/values/strings.xml');
const appSource = read('App.tsx');
const configSource = read('src/config/index.ts');
const iosInfoPlists = [
  'ios/GoldWallet/Info.plist',
  'ios/GoldWalletDev-Info.plist',
  'ios/GoldWalletStage-Info.plist',
];
const envFiles = ['.env.dev.testnet', '.env.stage.mainnet', '.env.prod.mainnet', '.env.beta.testnet', '.env.beta.mainnet'];
const requiredEnvKeys = ['CODEPUSH_DEPLOYMENT_KEY_ANDROID', 'CODEPUSH_DEPLOYMENT_KEY_IOS'];
const errors = [];
const readinessIssues = [];
const warnings = [];

const requireSnippet = (label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

requireSnippet('App.tsx', appSource, 'react-native-code-push');
requireSnippet('App.tsx', appSource, 'checkFrequency: codePush.CheckFrequency.ON_APP_RESUME');
requireSnippet('App.tsx', appSource, 'installMode: codePush.InstallMode.IMMEDIATE');
requireSnippet('App.tsx', appSource, 'deploymentKey: isIos() ? config.codepushDeploymentKeyIOS : config.codepushDeploymentKeyAndroid');
requireSnippet('App.tsx', appSource, '!__DEV__ && <WithCodePush />');
requireSnippet('src/config/index.ts', configSource, 'CODEPUSH_DEPLOYMENT_KEY_IOS');
requireSnippet('src/config/index.ts', configSource, 'CODEPUSH_DEPLOYMENT_KEY_ANDROID');
requireSnippet('android/app/build.gradle', androidBuildGradle, 'react-native-code-push/android/codepush.gradle');
requireSnippet('MainApplication.java', androidMainApplication, 'CodePush.getJSBundleFile()');
requireSnippet('android strings.xml', androidStrings, 'CodePushDeploymentKey');

iosInfoPlists.forEach(relativePath => {
  requireSnippet(relativePath, read(relativePath), '$(CODEPUSH_DEPLOYMENT_KEY_IOS)');
});

envFiles.forEach(relativePath => {
  const content = read(relativePath);
  const keys = parseEnvKeys(content);

  requiredEnvKeys.forEach(key => {
    if (!keys.has(key)) {
      if (relativePath.startsWith('.env.beta.')) {
        warnings.push(`${relativePath} does not define ${key}; beta release update strategy is still unconfirmed`);
      } else {
        readinessIssues.push(`${relativePath} is missing ${key}`);
      }
    }

    const line = content
      .split(/\r?\n/)
      .find(entry => entry.trim().startsWith(`${key}=`));

    if (line !== undefined && line.trim() === `${key}=`) {
      readinessIssues.push(`${relativePath} has a blank ${key}`);
    }
  });
});

console.log('CodePush release path audit');

if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(warning => console.log(`- ${warning}`));
}

if (errors.length > 0) {
  console.log('Release path wiring is invalid:');
  errors.forEach(error => console.log(`- ${error}`));
  process.exit(1);
}

if (readinessIssues.length > 0) {
  console.log('Release path is not ready for update validation:');
  readinessIssues.forEach(issue => console.log(`- ${issue}`));
} else {
  console.log('Release path env keys are present for non-beta update validation.');
}

console.log('CodePush release path wiring is present for non-dev runtime, Android, iOS, and env key references.');

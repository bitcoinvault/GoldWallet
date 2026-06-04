import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'push-notification-bridge-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);
export const pushNotificationInfoPlists = ['ios/GoldWallet/Info.plist', 'ios/GoldWalletDev-Info.plist', 'ios/GoldWalletStage-Info.plist'];
const packageName = '@react-native-community/push-notification-ios';

const npmViewJson = (npmPackageName, fields) =>
  JSON.parse(
    execFileSync(npmCommand, npmArgs(['view', npmPackageName, ...fields, '--json']), {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }),
  );

const requireSnippet = (errors, label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

export const collectPushNotificationBridgeAudit = () => {
  const errors = [];
  const readinessIssues = [];
  const runtimeSource = read('src/navigators/Navigator.tsx');
  const appDelegateHeader = read('ios/GoldWallet/AppDelegate.h');
  const appDelegateSource = read('ios/GoldWallet/AppDelegate.m');
  const packageJson = JSON.parse(read('package.json'));
  const dependencyVersion = packageJson.dependencies?.[packageName] || '';
  const installedPackageJsonPath = path.join(root, 'node_modules', packageName, 'package.json');
  const installedVersion = existsSync(installedPackageJsonPath) ? JSON.parse(readFileSync(installedPackageJsonPath, 'utf8')).version || '' : '';
  const npmMetadata = npmViewJson(packageName, ['version', 'time', 'repository.url']);
  const packageLatestVersion = npmMetadata.version || '';
  const packageLatestPublishedAt = npmMetadata.time?.[packageLatestVersion] || '';
  const packageRepositoryUrl = npmMetadata['repository.url'] || npmMetadata.repository?.url || '';
  const packageCurrent = dependencyVersion === packageLatestVersion && installedVersion === packageLatestVersion;

  if (!dependencyVersion) {
    errors.push(`package.json is missing ${packageName}`);
  }

  if (!installedVersion) {
    errors.push(`node_modules/${packageName}/package.json is missing or has no version`);
  }

  if (dependencyVersion && installedVersion && dependencyVersion !== installedVersion) {
    errors.push(`${packageName} package.json version ${dependencyVersion} does not match installed version ${installedVersion}`);
  }
  requireSnippet(errors, 'Navigator.tsx', runtimeSource, "from '@react-native-community/push-notification-ios'");
  requireSnippet(errors, 'Navigator.tsx', runtimeSource, 'PushNotificationIOS.setApplicationIconBadgeNumber');
  requireSnippet(errors, 'AppDelegate.h', appDelegateHeader, 'UNUserNotificationCenterDelegate');
  requireSnippet(errors, 'AppDelegate.m', appDelegateSource, '#import <RNCPushNotificationIOS.h>');
  requireSnippet(errors, 'AppDelegate.m', appDelegateSource, 'didRegisterForRemoteNotificationsWithDeviceToken');
  requireSnippet(errors, 'AppDelegate.m', appDelegateSource, 'didReceiveRemoteNotification:userInfo fetchCompletionHandler');
  requireSnippet(errors, 'AppDelegate.m', appDelegateSource, 'didFailToRegisterForRemoteNotificationsWithError');
  requireSnippet(errors, 'AppDelegate.m', appDelegateSource, 'didReceiveNotificationResponse');
  requireSnippet(errors, 'AppDelegate.m', appDelegateSource, 'UNNotificationPresentationOptionSound');
  requireSnippet(errors, 'AppDelegate.m', appDelegateSource, 'UNNotificationPresentationOptionAlert');
  requireSnippet(errors, 'AppDelegate.m', appDelegateSource, 'UNNotificationPresentationOptionBadge');

  if (!appDelegateSource.includes('center.delegate = self') && !appDelegateSource.includes('[center setDelegate:self]')) {
    readinessIssues.push('AppDelegate.m creates UNUserNotificationCenter but does not set center.delegate = self in the audited source.');
  }

  pushNotificationInfoPlists.forEach(relativePath => {
    const content = read(relativePath);

    if (!content.includes('UIBackgroundModes') || !content.includes('remote-notification')) {
      readinessIssues.push(`${relativePath} does not declare UIBackgroundModes remote-notification.`);
    }
  });

  return {
    errors,
    readinessIssues,
    dependencyVersion,
    installedVersion,
    packageLatestVersion,
    packageLatestPublishedAt,
    packageRepositoryUrl,
    packageCurrent,
    ready: errors.length === 0 && readinessIssues.length === 0,
  };
};

export const formatPushNotificationBridgeSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Push notification bridge audit',
    `Generated at: ${generatedAt}`,
    `Push notification package dependency version: ${audit.dependencyVersion || 'missing'}`,
    `Push notification package installed version: ${audit.installedVersion || 'missing'}`,
    `Push notification package latest version: ${audit.packageLatestVersion || 'missing'}`,
    `Push notification package latest published at: ${audit.packageLatestPublishedAt || 'missing'}`,
    `Push notification package npm repository: ${audit.packageRepositoryUrl || 'missing'}`,
    `Push notification package current: ${audit.packageCurrent ? 'yes' : 'no'}`,
    `Push notification bridge wiring valid: ${audit.errors.length === 0 ? 'yes' : 'no'}`,
    'Push notification runtime delivery validation: not claimed',
    `Static readiness issues: ${audit.readinessIssues.length}`,
  ];

  audit.readinessIssues.forEach(issue => lines.push(`- ${issue}`));
  lines.push(`Wiring errors: ${audit.errors.length}`);
  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push(
    audit.ready
      ? 'Required action: none; static push notification bridge wiring is present locally.'
      : 'Required action: restore push notification bridge wiring before claiming iOS push readiness.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Push notification bridge audit');
  console.log(`Push notification package dependency version: ${audit.dependencyVersion || 'missing'}`);
  console.log(`Push notification package installed version: ${audit.installedVersion || 'missing'}`);
  console.log(`Push notification package latest version: ${audit.packageLatestVersion || 'missing'}`);
  console.log(`Push notification package latest published at: ${audit.packageLatestPublishedAt || 'missing'}`);
  console.log(`Push notification package npm repository: ${audit.packageRepositoryUrl || 'missing'}`);
  console.log(`Push notification package current: ${audit.packageCurrent ? 'yes' : 'no'}`);

  if (audit.errors.length > 0) {
    console.log('Push notification bridge wiring is invalid:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  if (audit.readinessIssues.length > 0) {
    console.log('Readiness issues before claiming full iOS push validation:');
    audit.readinessIssues.forEach(issue => console.log(`- ${issue}`));
  } else {
    console.log('No static readiness issues found for iOS push notification bridge validation.');
  }

  console.log('Push notification bridge wiring is present for package manifest, runtime badge handling, AppDelegate forwarding, and foreground presentation hooks.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectPushNotificationBridgeAudit();
  const summary = formatPushNotificationBridgeSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Push notification bridge summary written to ${path.relative(root, summaryPath)}`);
}

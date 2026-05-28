import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const errors = [];
const readinessIssues = [];
const runtimeSource = read('src/navigators/Navigator.tsx');
const appDelegateHeader = read('ios/GoldWallet/AppDelegate.h');
const appDelegateSource = read('ios/GoldWallet/AppDelegate.m');
const packageJson = JSON.parse(read('package.json'));
const infoPlists = ['ios/GoldWallet/Info.plist', 'ios/GoldWalletDev-Info.plist', 'ios/GoldWalletStage-Info.plist'];

const requireSnippet = (label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

requireSnippet('package.json', JSON.stringify(packageJson.dependencies || {}), '"@react-native-community/push-notification-ios":"1.10.0"');
requireSnippet('Navigator.tsx', runtimeSource, "from '@react-native-community/push-notification-ios'");
requireSnippet('Navigator.tsx', runtimeSource, 'PushNotificationIOS.setApplicationIconBadgeNumber');
requireSnippet('AppDelegate.h', appDelegateHeader, 'UNUserNotificationCenterDelegate');
requireSnippet('AppDelegate.m', appDelegateSource, '#import <RNCPushNotificationIOS.h>');
requireSnippet('AppDelegate.m', appDelegateSource, 'didRegisterForRemoteNotificationsWithDeviceToken');
requireSnippet('AppDelegate.m', appDelegateSource, 'didReceiveRemoteNotification:userInfo fetchCompletionHandler');
requireSnippet('AppDelegate.m', appDelegateSource, 'didFailToRegisterForRemoteNotificationsWithError');
requireSnippet('AppDelegate.m', appDelegateSource, 'didReceiveNotificationResponse');
requireSnippet('AppDelegate.m', appDelegateSource, 'UNNotificationPresentationOptionSound');
requireSnippet('AppDelegate.m', appDelegateSource, 'UNNotificationPresentationOptionAlert');
requireSnippet('AppDelegate.m', appDelegateSource, 'UNNotificationPresentationOptionBadge');

if (!appDelegateSource.includes('center.delegate = self') && !appDelegateSource.includes('[center setDelegate:self]')) {
  readinessIssues.push('AppDelegate.m creates UNUserNotificationCenter but does not set center.delegate = self in the audited source.');
}

infoPlists.forEach(relativePath => {
  const content = read(relativePath);

  if (!content.includes('UIBackgroundModes') || !content.includes('remote-notification')) {
    readinessIssues.push(`${relativePath} does not declare UIBackgroundModes remote-notification.`);
  }
});

console.log('Push notification bridge audit');

if (errors.length > 0) {
  console.log('Push notification bridge wiring is invalid:');
  errors.forEach(error => console.log(`- ${error}`));
  process.exit(1);
}

if (readinessIssues.length > 0) {
  console.log('Readiness issues before claiming full iOS push validation:');
  readinessIssues.forEach(issue => console.log(`- ${issue}`));
} else {
  console.log('No static readiness issues found for iOS push notification bridge validation.');
}

console.log('Push notification bridge wiring is present for package manifest, runtime badge handling, AppDelegate forwarding, and foreground presentation hooks.');

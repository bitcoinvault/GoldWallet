import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  expectedPushNotificationIosNativeUsageFiles,
  expectedPushNotificationIosRuntimeUsageFiles,
  formatPushNotificationIosUsageErrors,
  getPushNotificationIosNativeUsageErrors,
  getPushNotificationIosRuntimeUsageErrors,
} from './pushNotificationIosUsageGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const runtimeRoots = ['App.tsx', 'Main.tsx', 'src'].map(entry => path.join(root, entry));
const nativeRoot = path.join(root, 'ios');
const ignoredDirs = new Set(['ios/Pods']);
const runtimeExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const nativeExtensions = new Set(['.h', '.m', '.mm', '.plist']);
const runtimePattern =
  /from ['"]@react-native-community\/push-notification-ios['"]|require\(['"]@react-native-community\/push-notification-ios['"]\)|import\(['"]@react-native-community\/push-notification-ios['"]\)/;
const nativePattern = /RNCPushNotificationIOS|UNUserNotificationCenterDelegate|remote-notification/;

const normalize = filePath => path.relative(root, filePath).replace(/\\/g, '/');

const isIgnoredDir = dir => ignoredDirs.has(normalize(dir));

const getSourceFiles = dir => {
  const files = [];

  if (!statSync(dir).isDirectory()) {
    return [dir];
  }

  readdirSync(dir).forEach(entry => {
    const entryPath = path.join(dir, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      if (!isIgnoredDir(entryPath)) {
        files.push(...getSourceFiles(entryPath));
      }
      return;
    }

    if (stats.isFile()) {
      files.push(entryPath);
    }
  });

  return files;
};

const runtimeUsageFiles = new Set(
  runtimeRoots
    .flatMap(getSourceFiles)
    .filter(filePath => runtimeExtensions.has(path.extname(filePath)))
    .filter(filePath => runtimePattern.test(readFileSync(filePath, 'utf8')))
    .map(normalize),
);
const nativeUsageFiles = new Set(
  getSourceFiles(nativeRoot)
    .filter(filePath => nativeExtensions.has(path.extname(filePath)))
    .filter(filePath => nativePattern.test(readFileSync(filePath, 'utf8')))
    .map(normalize),
);
const usageErrors = [
  ...getPushNotificationIosRuntimeUsageErrors(runtimeUsageFiles),
  ...getPushNotificationIosNativeUsageErrors(nativeUsageFiles),
];

if (usageErrors.length > 0) {
  console.error(formatPushNotificationIosUsageErrors(usageErrors));
  process.exit(1);
}

console.log(
  `iOS push notification usage is scoped to ${expectedPushNotificationIosRuntimeUsageFiles.size} runtime file and ${expectedPushNotificationIosNativeUsageFiles.size} native integration files.`,
);

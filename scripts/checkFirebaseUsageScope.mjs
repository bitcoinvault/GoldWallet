import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  expectedFirebaseNativeUsageFiles,
  expectedFirebaseRuntimeUsageFiles,
  formatFirebaseUsageErrors,
  getFirebaseNativeUsageErrors,
  getFirebaseRuntimeUsageErrors,
} from './firebaseUsageGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const runtimeRoots = ['App.tsx', 'Main.tsx', 'src'].map(entry => path.join(root, entry));
const nativeRoots = ['android', 'ios'].map(entry => path.join(root, entry));
const ignoredDirs = new Set(['android/app/build', 'ios/Pods']);
const runtimeExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const nativeExtensions = new Set(['.gradle', '.java', '.json', '.plist', '.pbxproj', '.xcscheme']);
const runtimePattern =
  /from ['"]@react-native-firebase\/[^'"]+['"]|require\(['"]@react-native-firebase\/[^'"]+['"]\)|import\(['"]@react-native-firebase\/[^'"]+['"]\)/;
const nativePattern =
  /com\.google\.firebase|com\.google\.gms\.google-services|firebase-bom|firebaseVersion|GoogleService-Info|google-services|RNFB|FIREBASE_CONFIG_FILE|firebase_url|project_info|mobilesdk_app_id|GOOGLE_APP_ID|GCM_SENDER_ID/;

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
  nativeRoots
    .flatMap(getSourceFiles)
    .filter(filePath => nativeExtensions.has(path.extname(filePath)))
    .filter(filePath => nativePattern.test(readFileSync(filePath, 'utf8')))
    .map(normalize),
);
const usageErrors = [
  ...getFirebaseRuntimeUsageErrors(runtimeUsageFiles),
  ...getFirebaseNativeUsageErrors(nativeUsageFiles),
];

if (usageErrors.length > 0) {
  console.error(formatFirebaseUsageErrors(usageErrors));
  process.exit(1);
}

console.log(
  `Firebase usage is scoped to ${expectedFirebaseRuntimeUsageFiles.size} runtime files and ${expectedFirebaseNativeUsageFiles.size} native integration files.`,
);

import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  expectedCodePushNativeUsageFiles,
  expectedCodePushRuntimeUsageFiles,
  formatCodePushUsageErrors,
  getCodePushNativeUsageErrors,
  getCodePushRuntimeUsageErrors,
} from './codePushUsageGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const ignoredDirs = new Set(['.git', 'android/app/build', 'coverage', 'docs', 'ios/Pods', 'local-docs', 'node_modules']);
const runtimeExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const nativeExtensions = new Set(['.gradle', '.java', '.m', '.mm', '.plist', '.xml']);
const runtimePattern =
  /from ['"]react-native-code-push['"]|require\(['"]react-native-code-push['"]\)|import\(['"]react-native-code-push['"]\)/;
const nativePattern = /CodePush|react-native-code-push|CODEPUSH_DEPLOYMENT_KEY|CodePushDeploymentKey/;

const normalize = filePath => path.relative(root, filePath).replace(/\\/g, '/');

const isIgnoredDir = dir => ignoredDirs.has(normalize(dir));

const getSourceFiles = dir => {
  const files = [];

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
      const extension = path.extname(entryPath);

      if (runtimeExtensions.has(extension) || nativeExtensions.has(extension)) {
        files.push(entryPath);
      }
    }
  });

  return files;
};

const sourceFiles = getSourceFiles(root);
const runtimeUsageFiles = new Set(
  sourceFiles
    .filter(filePath => runtimeExtensions.has(path.extname(filePath)))
    .filter(filePath => runtimePattern.test(readFileSync(filePath, 'utf8')))
    .map(normalize),
);
const nativeUsageFiles = new Set(
  sourceFiles
    .filter(filePath => nativeExtensions.has(path.extname(filePath)))
    .filter(filePath => nativePattern.test(readFileSync(filePath, 'utf8')))
    .map(normalize),
);
const usageErrors = [
  ...getCodePushRuntimeUsageErrors(runtimeUsageFiles),
  ...getCodePushNativeUsageErrors(nativeUsageFiles),
];

if (usageErrors.length > 0) {
  console.error(formatCodePushUsageErrors(usageErrors));
  process.exit(1);
}

console.log(
  `CodePush usage is scoped to ${expectedCodePushRuntimeUsageFiles.size} runtime file and ${expectedCodePushNativeUsageFiles.size} native integration files.`,
);

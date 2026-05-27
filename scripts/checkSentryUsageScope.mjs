import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expectedSentryUsageFiles, getSentryUsageScopeErrors } from './sentryUsageGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const ignoredDirs = new Set([
  '.git',
  'android/app/build',
  'coverage',
  'docs',
  'ios/Pods',
  'local-docs',
  'node_modules',
]);
const usagePattern =
  /from ['"]@sentry\/react-native['"]|require\(['"]@sentry\/react-native['"]\)|import\(['"]@sentry\/react-native['"]\)/;
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);

const normalize = filePath => path.relative(root, filePath).replace(/\\/g, '/');

const isIgnoredDir = dir => {
  const relativeDir = normalize(dir);
  return ignoredDirs.has(relativeDir);
};

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

    if (stats.isFile() && extensions.has(path.extname(entryPath))) {
      files.push(entryPath);
    }
  });

  return files;
};

const usageFiles = new Set(
  getSourceFiles(root)
    .filter(filePath => usagePattern.test(readFileSync(filePath, 'utf8')))
    .map(normalize),
);
const usageErrors = getSentryUsageScopeErrors(usageFiles);

if (usageErrors.length > 0) {
  usageErrors.forEach(error => {
    console.error(`${error.label}:`);
    error.files.forEach(filePath => console.error(`- ${filePath}`));
  });

  process.exit(1);
}

console.log(`@sentry/react-native runtime usage is scoped to ${[...expectedSentryUsageFiles].join(', ')}.`);

import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const allowedRuntimeFiles = new Set([
  path.join(root, 'App.tsx'),
  path.join(root, 'Main.tsx'),
  path.join(root, 'logger', 'index.ts'),
]);
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

const unexpectedFiles = getSourceFiles(root)
  .filter(filePath => !allowedRuntimeFiles.has(filePath))
  .filter(filePath => usagePattern.test(readFileSync(filePath, 'utf8')));

const missingAllowedUsage = [...allowedRuntimeFiles].filter(filePath => {
  try {
    return !usagePattern.test(readFileSync(filePath, 'utf8'));
  } catch (error) {
    return true;
  }
});

if (unexpectedFiles.length > 0 || missingAllowedUsage.length > 0) {
  if (unexpectedFiles.length > 0) {
    console.error('Unexpected @sentry/react-native runtime usage found:');
    unexpectedFiles.forEach(filePath => console.error(`- ${normalize(filePath)}`));
  }

  if (missingAllowedUsage.length > 0) {
    console.error('Expected @sentry/react-native runtime usage is missing:');
    missingAllowedUsage.forEach(filePath => console.error(`- ${normalize(filePath)}`));
  }

  process.exit(1);
}

console.log('@sentry/react-native runtime usage is scoped to App.tsx, Main.tsx, and logger/index.ts.');

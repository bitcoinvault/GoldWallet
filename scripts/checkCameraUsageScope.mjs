import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expectedCameraUsageFiles, getCameraUsageScopeErrors } from './cameraUsageGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const usagePattern =
  /from ['"]react-native-camera['"]|require\(['"]react-native-camera['"]\)|import\(['"]react-native-camera['"]\)|\bRNCamera\b|\bBarCodeReadEvent\b/;
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);

const getSourceFiles = dir => {
  const files = [];

  readdirSync(dir).forEach(entry => {
    const entryPath = path.join(dir, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      files.push(...getSourceFiles(entryPath));
      return;
    }

    if (stats.isFile() && extensions.has(path.extname(entryPath))) {
      files.push(entryPath);
    }
  });

  return files;
};

const relative = filePath => path.relative(root, filePath).replace(/\\/g, '/');
const usageFiles = new Set(
  getSourceFiles(srcDir)
    .filter(filePath => usagePattern.test(readFileSync(filePath, 'utf8')))
    .map(relative),
);
const usageErrors = getCameraUsageScopeErrors(usageFiles);

if (usageErrors.length > 0) {
  usageErrors.forEach(error => {
    console.error(`${error.label}:`);
    error.files.forEach(filePath => console.error(`- ${filePath}`));
  });

  process.exit(1);
}

console.log(`react-native-camera runtime usage is scoped to ${[...expectedCameraUsageFiles].join(', ')}.`);

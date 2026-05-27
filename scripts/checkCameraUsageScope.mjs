import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const allowedRuntimeFiles = new Set([path.join(srcDir, 'screens', 'ScanQrCodeScreen.tsx')]);
const usagePattern = /from ['"]react-native-camera['"]|\bRNCamera\b|\bBarCodeReadEvent\b/;
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
const unexpectedFiles = getSourceFiles(srcDir)
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
    console.error('Unexpected react-native-camera runtime usage found:');
    unexpectedFiles.forEach(filePath => console.error(`- ${relative(filePath)}`));
  }

  if (missingAllowedUsage.length > 0) {
    console.error('Expected react-native-camera runtime usage is missing:');
    missingAllowedUsage.forEach(filePath => console.error(`- ${relative(filePath)}`));
  }

  process.exit(1);
}

console.log('react-native-camera runtime usage is scoped to ScanQrCodeScreen.');

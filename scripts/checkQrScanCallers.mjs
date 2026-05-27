import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expectedQrScanCallerFiles, getQrScanCallerInventoryErrors } from './qrScanCallerGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const navigatePattern = /\bnavigate\(\s*Route\.ScanQrCode\b/g;

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
const callerFiles = new Set();

getSourceFiles(srcDir).forEach(filePath => {
  const content = readFileSync(filePath, 'utf8');

  if (navigatePattern.test(content)) {
    callerFiles.add(relative(filePath));
  }

  navigatePattern.lastIndex = 0;
});

const inventoryErrors = getQrScanCallerInventoryErrors(callerFiles);

if (inventoryErrors.length > 0) {
  inventoryErrors.forEach(error => {
    console.error(`${error.label}:`);
    error.files.forEach(filePath => console.error(`- ${filePath}`));
  });

  process.exit(1);
}

console.log(`QR scanner caller inventory is stable (${expectedQrScanCallerFiles.size} callers).`);

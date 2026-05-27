import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expectedQrRenderUsageFiles, formatQrRenderUsageErrors, getQrRenderUsageErrors } from './qrRenderUsageGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const usagePattern =
  /from ['"]react-native-qrcode-svg['"]|require\(['"]react-native-qrcode-svg['"]\)|import\(['"]react-native-qrcode-svg['"]\)/;

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
const usageErrors = getQrRenderUsageErrors(usageFiles);

if (usageErrors.length > 0) {
  console.error(formatQrRenderUsageErrors(usageErrors));
  process.exit(1);
}

console.log(`QR render usage inventory is stable (${expectedQrRenderUsageFiles.size} screens).`);

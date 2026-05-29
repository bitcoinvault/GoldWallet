import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  expectedStorageNetworkUsage,
  formatStorageNetworkUsageErrors,
  getStorageNetworkUsageErrors,
} from './storageNetworkUsageGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceRoots = ['src', 'class', 'tests', 'App.tsx', 'Main.tsx', 'logger'];
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const normalize = filePath => path.relative(root, filePath).replace(/\\/g, '/');

const getSourceFiles = entryPath => {
  if (!existsSync(entryPath)) {
    return [];
  }

  const stats = statSync(entryPath);

  if (stats.isFile()) {
    return extensions.has(path.extname(entryPath)) ? [entryPath] : [];
  }

  return readdirSync(entryPath).flatMap(entry => getSourceFiles(path.join(entryPath, entry)));
};

const sourceFiles = sourceRoots.flatMap(entry => getSourceFiles(path.join(root, entry)));
const usageByPackage = new Map([...expectedStorageNetworkUsage.keys()].map(packageName => [packageName, new Set()]));

sourceFiles.forEach(filePath => {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = normalize(filePath);

  expectedStorageNetworkUsage.forEach((_, packageName) => {
    const escapedPackageName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const usagePattern = new RegExp(
      `from ['"]${escapedPackageName}(?:/[^'"]*)?['"]|require\\(['"]${escapedPackageName}(?:/[^'"]*)?['"]\\)|import\\(['"]${escapedPackageName}(?:/[^'"]*)?['"]\\)|jest\\.mock\\(['"]${escapedPackageName}(?:/[^'"]*)?['"]`,
    );

    if (usagePattern.test(content)) {
      usageByPackage.get(packageName).add(relativePath);
    }
  });
});

const errors = getStorageNetworkUsageErrors(usageByPackage);

if (errors.length > 0) {
  console.error('Storage/network usage guard failed:');
  console.error(formatStorageNetworkUsageErrors(errors));
  process.exit(1);
}

console.log(`Storage/network usage is scoped for ${expectedStorageNetworkUsage.size} tracked packages.`);

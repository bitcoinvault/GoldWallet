import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const navigatePattern = /\bnavigate\(\s*Route\.ScanQrCode\b/g;
const expectedCallerFiles = new Set([
  'src/screens/AuthenticatorList/AuthenticatorListScreen.tsx',
  'src/screens/CreateContactScreen.tsx',
  'src/screens/ImportAuthenticator/ImportAuthenticatorScreen.tsx',
  'src/screens/ImportWalletScreen.tsx',
  'src/screens/IntegrateKeyScreen.tsx',
  'src/screens/RecoverySeed/RecoverySeedScreen.tsx',
  'src/screens/RecoverySend/RecoverySendScreen.tsx',
  'src/screens/SendCoinsScreen.tsx',
]);

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

const missingCallers = [...expectedCallerFiles].filter(filePath => !callerFiles.has(filePath));
const unexpectedCallers = [...callerFiles].filter(filePath => !expectedCallerFiles.has(filePath));

if (missingCallers.length > 0 || unexpectedCallers.length > 0) {
  if (missingCallers.length > 0) {
    console.error('Expected QR scanner caller(s) are missing:');
    missingCallers.forEach(filePath => console.error(`- ${filePath}`));
  }

  if (unexpectedCallers.length > 0) {
    console.error('Unexpected QR scanner caller(s) found:');
    unexpectedCallers.forEach(filePath => console.error(`- ${filePath}`));
  }

  process.exit(1);
}

console.log(`QR scanner caller inventory is stable (${callerFiles.size} callers).`);

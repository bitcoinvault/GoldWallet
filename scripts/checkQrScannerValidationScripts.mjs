import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const testPath = 'tests/unit/ScanQrCodeScreen.test.tsx';
const testScript = 'node node_modules/jest/bin/jest.js tests/unit/ScanQrCodeScreen.test.tsx --forceExit';
const errors = [];

if (scripts['test:qr-scanner:unit'] !== testScript) {
  errors.push(`package.json test:qr-scanner:unit must be "${testScript}"`);
}

if (!scripts['android:dev:check-light']?.includes('yarn check:qr-scanner-validation-scripts')) {
  errors.push('android:dev:check-light must include check:qr-scanner-validation-scripts');
}

if (!scripts.prepush?.includes('yarn test:qr-scanner:unit')) {
  errors.push('prepush must include test:qr-scanner:unit');
}

if (!existsSync(path.join(root, testPath))) {
  errors.push(`${testPath} is missing`);
} else {
  const testSource = read(testPath);
  [
    "jest.mock('react-native-camera-kit'",
    "testID: 'camera-kit'",
    'requests Android camera permission before rendering CameraKit scanner',
    'keeps CameraKit scanner hidden when Android camera permission is denied',
    'passes a non-empty QR value to the caller once and returns to the previous screen',
    'ignores an empty QR value without blocking the next valid scan',
    'allowedBarcodeTypes).toEqual([\'qr\'])',
    "onBarCodeScan).toHaveBeenCalledWith('bitcoin:BTcvExample')",
  ].forEach(snippet => {
    if (!testSource.includes(snippet)) {
      errors.push(`${testPath} is missing "${snippet}"`);
    }
  });
}

if (errors.length > 0) {
  console.error('QR scanner validation scripts guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('QR scanner validation scripts are guarded.');

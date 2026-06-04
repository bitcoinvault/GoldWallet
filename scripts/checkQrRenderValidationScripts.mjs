import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const testPath = 'tests/unit/QrRenderScreens.test.tsx';
const testScript = 'node node_modules/jest/bin/jest.js tests/unit/QrRenderScreens.test.tsx --forceExit';
const errors = [];

if (scripts['test:qr-render:unit'] !== testScript) {
  errors.push(`package.json test:qr-render:unit must be "${testScript}"`);
}

if (!scripts['android:dev:check-light']?.includes('yarn check:qr-render-validation-scripts')) {
  errors.push('android:dev:check-light must include check:qr-render-validation-scripts');
}

if (!scripts.prepush?.includes('yarn test:qr-render:unit')) {
  errors.push('prepush must include test:qr-render:unit');
}

if (!existsSync(path.join(root, testPath))) {
  errors.push(`${testPath} is missing`);
} else {
  const testSource = read(testPath);
  [
    "jest.mock('react-native-qrcode-svg'",
    "import ContactQRCodeScreen from 'app/screens/ContactQRCodeScreen'",
    "import { ExportWalletScreen } from 'app/screens/ExportWalletScreen'",
    "import { ExportWalletXpubScreen } from 'app/screens/ExportWalletXpubScreen'",
    "import { OptionsAuthenticatorScreen } from 'app/screens/OptionsAuthenticator/OptionsAuthenticatorScreen'",
    "import { ReceiveCoinsScreen } from 'app/screens/ReceiveCoinsScreen'",
    'renders Receive QR from the selected wallet transaction address',
    'renders Contact QR from the contact address',
    'renders wallet secret QR on the wallet export screen',
    'renders xpub QR on the xpub export screen',
    'renders authenticator QR from the authenticator QRCode payload',
    "expectQr('bitcoin:BTcvReceiveAddress?amount=0')",
    "expectQr('BTcvContactAddress')",
    "expectQr('wallet-secret-seed')",
    "expectQr('xpub-wallet-value')",
    "expectQr('authenticator-qr-payload')",
  ].forEach(snippet => {
    if (!testSource.includes(snippet)) {
      errors.push(`${testPath} is missing "${snippet}"`);
    }
  });
}

if (errors.length > 0) {
  console.error('QR render validation scripts guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('QR render validation scripts are guarded.');

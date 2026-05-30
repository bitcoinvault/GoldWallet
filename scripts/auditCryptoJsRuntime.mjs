import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const CryptoJS = require('crypto-js');
const sha256 = require('crypto-js/sha256');

const expectedVersion = '4.2.0';
const errors = [];

if (packageJson.dependencies['crypto-js'] !== expectedVersion) {
  errors.push(`package.json has crypto-js@${packageJson.dependencies['crypto-js']}; expected ${expectedVersion}`);
}

const secureStorageSource = readFileSync(path.join(root, 'src', 'services', 'SecureStorageService.ts'), 'utf8');
const walletHelperSource = readFileSync(path.join(root, 'src', 'helpers', 'wallets.ts'), 'utf8');
const decodeSource = readFileSync(path.join(root, 'src', 'helpers', 'decode.ts'), 'utf8');

[
  ['SecureStorageService.ts', secureStorageSource, "from 'crypto-js/sha256'"],
  ['wallets.ts', walletHelperSource, "from 'crypto-js/sha256'"],
  ['decode.ts', decodeSource, "from 'crypto-js'"],
  ['decode.ts', decodeSource, 'CryptoJS.AES.decrypt'],
  ['decode.ts', decodeSource, 'CryptoJS.enc.Base64.parse'],
].forEach(([label, source, snippet]) => {
  if (!source.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
});

const hash = sha256('GoldWallet').toString();
if (hash !== '61a3ee0b5d8dd6559f320b594d03e747c680619b4a0ef91947d71b2ed8274579') {
  errors.push(`Unexpected sha256 output: ${hash}`);
}

const encrypted = CryptoJS.AES.encrypt('1234', 'password').toString();
const decrypted = CryptoJS.AES.decrypt(encrypted, 'password').toString(CryptoJS.enc.Utf8);

if (decrypted !== '1234') {
  errors.push(`Unexpected AES decrypt output: ${decrypted || '<empty>'}`);
}

if (errors.length > 0) {
  console.error('CryptoJS runtime audit failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CryptoJS runtime audit');
console.log(`crypto-js: ${packageJson.dependencies['crypto-js']}`);
console.log(`sha256 fixture: ${hash}`);
console.log('AES encrypt/decrypt fixture: passed');

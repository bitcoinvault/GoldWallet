import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRnNodeifyShimErrors, requiredRnNodeifyShims } from './rnNodeifyShimGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const shimContents = new Map();

for (const patch of requiredRnNodeifyShims) {
  const absolutePath = path.join(root, ...patch.file.split('/'));

  if (!fs.existsSync(absolutePath)) {
    continue;
  }

  shimContents.set(patch.file, fs.readFileSync(absolutePath, 'utf8'));
}

const shimErrors = getRnNodeifyShimErrors(shimContents);

if (shimErrors.length > 0) {
  console.error('React Native node polyfill shims are not applied.');
  console.error('Run: yarn postinstall');
  console.error(shimErrors.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log('React Native node polyfill shims are applied.');

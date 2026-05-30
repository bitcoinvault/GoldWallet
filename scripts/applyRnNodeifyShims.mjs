import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRnNodeifyShimErrors, requiredRnNodeifyShims } from './rnNodeifyShimGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const replacements = [
  {
    from: "var Stream = require('stream');",
    to: "var Stream = global.StreamModule || require('stream');",
  },
  {
    from: "var Stream = require('stream')",
    to: "var Stream = global.StreamModule || require('stream')",
  },
];

const readShimContents = () => {
  const shimContents = new Map();

  for (const shim of requiredRnNodeifyShims) {
    const absolutePath = path.join(root, ...shim.file.split('/'));

    if (fs.existsSync(absolutePath)) {
      shimContents.set(shim.file, fs.readFileSync(absolutePath, 'utf8'));
    }
  }

  return shimContents;
};

for (const shim of requiredRnNodeifyShims) {
  const absolutePath = path.join(root, ...shim.file.split('/'));

  if (!fs.existsSync(absolutePath)) {
    continue;
  }

  const originalContent = fs.readFileSync(absolutePath, 'utf8');

  if (originalContent.includes(shim.marker)) {
    continue;
  }

  const replacement = replacements.find(candidate => originalContent.includes(candidate.from));

  if (!replacement) {
    continue;
  }

  fs.writeFileSync(absolutePath, originalContent.replace(replacement.from, replacement.to));
  console.log(`Applied rn-nodeify shim marker to ${shim.file}`);
}

const shimErrors = getRnNodeifyShimErrors(readShimContents());

if (shimErrors.length > 0) {
  console.error('React Native node polyfill shims are not applied.');
  console.error(shimErrors.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

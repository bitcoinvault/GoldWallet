import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const requiredPatches = [
  {
    file: 'node_modules/stream-browserify/node_modules/readable-stream/readable.js',
    marker: 'global.StreamModule || require',
  },
  {
    file: 'node_modules/readable-stream/readable.js',
    marker: 'global.StreamModule || require',
  },
];

const missing = [];

for (const patch of requiredPatches) {
  const absolutePath = path.join(root, ...patch.file.split('/'));

  if (!fs.existsSync(absolutePath)) {
    missing.push(`${patch.file} is missing`);
    continue;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');

  if (!content.includes(patch.marker)) {
    missing.push(`${patch.file} is missing rn-nodeify marker: ${patch.marker}`);
  }
}

if (missing.length > 0) {
  console.error('React Native node polyfill shims are not applied.');
  console.error('Run: yarn postinstall');
  console.error(missing.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log('React Native node polyfill shims are applied.');

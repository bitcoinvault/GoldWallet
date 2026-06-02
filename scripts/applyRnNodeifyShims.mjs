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

const readableStreamV4Aliases = {
  _stream_transform: 'readable-stream/lib/_stream_transform',
  _stream_readable: 'readable-stream/lib/_stream_readable',
  _stream_writable: 'readable-stream/lib/_stream_writable',
  _stream_duplex: 'readable-stream/lib/_stream_duplex',
  _stream_passthrough: 'readable-stream/lib/_stream_passthrough',
};

const applyReadableStreamV4Aliases = () => {
  const packagePath = path.join(root, 'node_modules', 'readable-stream', 'package.json');

  if (!fs.existsSync(packagePath)) {
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  let changed = false;

  for (const field of ['browser', 'react-native']) {
    if (!packageJson[field]) {
      packageJson[field] = {};
    }

    for (const [alias, target] of Object.entries(readableStreamV4Aliases)) {
      if (packageJson[field][alias] !== target) {
        packageJson[field][alias] = target;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log('Applied readable-stream v4 React Native aliases.');
  }
};

const applyRootReadableStreamV4Aliases = () => {
  const packagePath = path.join(root, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  let changed = false;

  for (const field of ['browser', 'react-native']) {
    if (!packageJson[field]) {
      packageJson[field] = {};
    }

    for (const [alias, target] of Object.entries(readableStreamV4Aliases)) {
      if (packageJson[field][alias] !== target) {
        packageJson[field][alias] = target;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log('Restored root readable-stream v4 aliases.');
  }
};

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

applyReadableStreamV4Aliases();
applyRootReadableStreamV4Aliases();

const shimErrors = getRnNodeifyShimErrors(readShimContents());

if (shimErrors.length > 0) {
  console.error('React Native node polyfill shims are not applied.');
  console.error(shimErrors.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

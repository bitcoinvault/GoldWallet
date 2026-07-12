import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const yarnLock = readFileSync(path.join(root, 'yarn.lock'), 'utf8');

const requiredResolutions = new Map([
  ['braces', '3.0.3'],
  ['cipher-base', '1.0.7'],
  ['elliptic', '6.6.1'],
  ['form-data', '4.0.6'],
  ['joi', '17.13.4'],
  ['launch-editor', '2.14.1'],
  ['minimist', '1.2.8'],
  ['moment', '2.30.1'],
  ['micromatch', '4.0.8'],
  ['plist', '3.1.1'],
  ['protobufjs', '7.6.5'],
  ['qs', '6.15.3'],
  ['sha.js', '2.4.12'],
  ['shell-quote', '1.10.0'],
  ['simple-plist', '1.3.1'],
  ['tiny-secp256k1', '2.2.4'],
  ['tmpl', '1.0.5'],
  ['tmp', '0.2.7'],
  ['word-wrap', '1.2.5'],
  ['@sentry/**/undici', '6.27.0'],
]);

const vulnerableLockEntries = [
  ['ansi-regex', '3.0.0'],
  ['ansi-regex', '4.1.0'],
  ['ansi-regex', '5.0.0'],
  ['base-x', '3.0.8'],
  ['brace-expansion', '1.1.11'],
  ['braces', '3.0.2'],
  ['cipher-base', '1.0.4'],
  ['elliptic', '6.5.4'],
  ['form-data', '4.0.5'],
  ['joi', '17.13.3'],
  ['js-yaml', '3.14.1'],
  ['js-yaml', '4.1.1'],
  ['jws', '4.0.0'],
  ['launch-editor', '2.14.0'],
  ['lodash', '4.17.21'],
  ['minimist', '1.2.5'],
  ['minimatch', '3.0.4'],
  ['micromatch', '4.0.4'],
  ['moment', '2.29.1'],
  ['picomatch', '2.3.0'],
  ['plist', '3.0.4'],
  ['protobufjs', '7.6.1'],
  ['protobufjs', '7.6.2'],
  ['qs', '6.10.1'],
  ['sha.js', '2.4.11'],
  ['shell-quote', '1.7.2'],
  ['simple-plist', '1.1.1'],
  ['tmpl', '1.0.4'],
  ['tiny-secp256k1', '1.1.6'],
  ['tmp', '0.0.33'],
  ['undici', '6.26.0'],
  ['word-wrap', '1.2.3'],
  ['ws', '7.5.4'],
  ['yaml', '1.10.2'],
];

const expectedLockVersions = new Map([
  ['ansi-regex', ['3.0.1', '4.1.1', '5.0.1', '6.2.2']],
  ['base-x', ['3.0.11', '5.0.1']],
  ['brace-expansion', ['1.1.16', '2.1.2', '5.0.7']],
  ['braces', ['3.0.3']],
  ['cipher-base', ['1.0.7']],
  ['elliptic', ['6.6.1']],
  ['form-data', ['4.0.6']],
  ['joi', ['17.13.4']],
  ['js-yaml', ['3.15.0', '4.3.0']],
  ['jws', ['4.0.1']],
  ['launch-editor', ['2.14.1']],
  ['lodash', ['4.18.1']],
  ['minimist', ['1.2.8']],
  ['minimatch', ['3.1.5', '5.1.9', '8.0.7', '9.0.9', '10.2.5']],
  ['micromatch', ['4.0.8']],
  ['moment', ['2.30.1']],
  ['picomatch', ['2.3.2', '4.0.4']],
  ['plist', ['3.1.1']],
  ['protobufjs', ['7.6.5']],
  ['qs', ['6.15.3']],
  ['sha.js', ['2.4.12']],
  ['shell-quote', ['1.10.0']],
  ['simple-plist', ['1.3.1']],
  ['tmpl', ['1.0.5']],
  ['tiny-secp256k1', ['2.2.4']],
  ['tmp', ['0.2.7']],
  ['undici', ['6.27.0', '7.28.0']],
  ['word-wrap', ['1.2.5']],
  ['ws', ['6.2.4', '7.5.11']],
  ['yaml', ['1.10.3', '2.9.0']],
]);

const normalizeLockKey = key => key.replace(/^"|"$/g, '');

const packageNameFromLockKey = key => {
  const normalized = normalizeLockKey(key);
  if (normalized.startsWith('@')) {
    const parts = normalized.split('@');
    return `@${parts[1]}`;
  }

  return normalized.split('@')[0];
};

const collectLockVersions = lockContent => {
  const versionsByPackage = new Map();
  let currentPackages = [];

  for (const line of lockContent.split(/\r?\n/)) {
    if (line && !line.startsWith(' ') && line.endsWith(':')) {
      currentPackages = line
        .slice(0, -1)
        .split(/,\s*/)
        .map(packageNameFromLockKey);
      continue;
    }

    const versionMatch = line.match(/^\s+version "([^"]+)"/);
    if (!versionMatch) {
      continue;
    }

    for (const packageName of currentPackages) {
      const versions = versionsByPackage.get(packageName) || new Set();
      versions.add(versionMatch[1]);
      versionsByPackage.set(packageName, versions);
    }
  }

  return versionsByPackage;
};

const errors = [];
const resolutions = packageJson.resolutions || {};
const lockVersions = collectLockVersions(yarnLock);

for (const [name, version] of requiredResolutions) {
  if (resolutions[name] !== version) {
    errors.push(`package.json resolutions.${name} must be ${version}`);
  }
}

for (const [name, vulnerableVersion] of vulnerableLockEntries) {
  if (lockVersions.get(name)?.has(vulnerableVersion)) {
    errors.push(`yarn.lock still contains vulnerable ${name}@${vulnerableVersion}`);
  }
}

for (const [name, allowedVersions] of expectedLockVersions) {
  const actualVersions = [...(lockVersions.get(name) || [])].sort();
  const unexpectedVersions = actualVersions.filter(version => !allowedVersions.includes(version));

  if (actualVersions.length === 0) {
    errors.push(`yarn.lock does not contain ${name}`);
  }

  if (unexpectedVersions.length > 0) {
    errors.push(`${name} lock versions must stay within ${allowedVersions.join(', ')}; found ${actualVersions.join(', ')}`);
  }
}

if (errors.length > 0) {
  console.error('Security resolution baseline check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Security resolution baselines are pinned to patched versions.');

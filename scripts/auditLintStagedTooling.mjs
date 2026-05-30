import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const lintStagedPackage = require('lint-staged/package.json');

const expectedVersion = '16.4.0';
const blockedLatestVersion = '17.0.6';
const blockedLatestNodeEngine = '>=22.22.1';
const errors = [];

const compareVersions = (left, right) => {
  const leftParts = left.replace(/^v/, '').split('.').map(Number);
  const rightParts = right.replace(/^v/, '').split('.').map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] || 0;
    const rightPart = rightParts[index] || 0;
    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
};

if (packageJson.devDependencies['lint-staged'] !== expectedVersion) {
  errors.push(`package.json has lint-staged@${packageJson.devDependencies['lint-staged']}; expected ${expectedVersion}`);
}

if (lintStagedPackage.version !== expectedVersion) {
  errors.push(`node_modules has lint-staged@${lintStagedPackage.version}; expected ${expectedVersion}`);
}

if (!packageJson['lint-staged']?.['./**/*.{ts,tsx,js,jsx}']?.includes('eslint --fix')) {
  errors.push('package.json lint-staged config must keep eslint --fix for ./**/*.{ts,tsx,js,jsx}');
}

if (packageJson.scripts.precommit !== 'yarn lint-staged && yarn typescript:check') {
  errors.push('package.json precommit script must run lint-staged before typescript:check');
}

const cliVersion = execFileSync(process.execPath, [path.join(root, 'node_modules', 'lint-staged', 'bin', 'lint-staged.js'), '--version'], {
  encoding: 'utf8',
}).trim();

if (cliVersion !== expectedVersion) {
  errors.push(`lint-staged CLI reports ${cliVersion}; expected ${expectedVersion}`);
}

if (compareVersions(process.version, '22.22.1') >= 0) {
  errors.push(`Current Node ${process.version} can run lint-staged@${blockedLatestVersion}; re-check the latest target instead of keeping ${expectedVersion}`);
}

if (errors.length > 0) {
  console.error('lint-staged tooling audit failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('lint-staged tooling audit');
console.log(`lint-staged: ${expectedVersion}`);
console.log(`lint-staged latest blocked: ${blockedLatestVersion} requires Node ${blockedLatestNodeEngine}`);
console.log(`current Node: ${process.version}`);
console.log('precommit lint-staged wiring: passed');

import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8').trim();
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const expectedVersion = '9.1.7';
const expectedHooks = {
  '.husky/pre-commit': 'yarn precommit',
  '.husky/pre-push': 'yarn prepush',
};
const errors = [];

const huskyPackagePath = path.join(path.dirname(require.resolve('husky')), 'package.json');
const huskyPackage = JSON.parse(readFileSync(huskyPackagePath, 'utf8'));

if (packageJson.devDependencies.husky !== expectedVersion) {
  errors.push(`package.json has husky@${packageJson.devDependencies.husky || '<missing>'}; expected ${expectedVersion}`);
}

if (huskyPackage.version !== expectedVersion) {
  errors.push(`node_modules has husky@${huskyPackage.version}; expected ${expectedVersion}`);
}

if (packageJson.scripts.prepare !== 'husky') {
  errors.push(`package.json prepare script is "${packageJson.scripts.prepare || '<missing>'}"; expected "husky"`);
}

if (packageJson.husky) {
  errors.push('package.json still has legacy Husky v4 "husky" configuration');
}

if (packageJson.scripts.precommit !== 'yarn check:node-runtime-version && yarn lint-staged:tooling:audit && yarn lint-staged && yarn typescript:check') {
  errors.push('package.json precommit script must run Node runtime, lint-staged tooling, lint-staged, and TypeScript checks in order');
}

if (!packageJson.scripts.prepush?.startsWith('yarn check:node-runtime-version && yarn android:dev:check-light')) {
  errors.push('package.json prepush script must start with check:node-runtime-version and android:dev:check-light');
}

for (const [relativePath, expectedCommand] of Object.entries(expectedHooks)) {
  const absolutePath = path.join(root, relativePath);

  if (!existsSync(absolutePath)) {
    errors.push(`${relativePath} is missing`);
    continue;
  }

  if (read(relativePath) !== expectedCommand) {
    errors.push(`${relativePath} must contain exactly "${expectedCommand}"`);
  }
}

let hooksPath = '';
try {
  hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
} catch {
  errors.push('git core.hooksPath is not configured; run "corepack yarn husky" after install');
}

if (hooksPath && hooksPath.replace(/\\/g, '/') !== '.husky/_') {
  errors.push(`git core.hooksPath is "${hooksPath}"; expected ".husky/_"`);
}

if (!existsSync(path.join(root, '.husky', '_', 'h'))) {
  errors.push('.husky/_/h is missing; run "corepack yarn husky" to install local hook shims');
}

if (errors.length > 0) {
  console.error('Husky tooling audit failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Husky tooling audit');
console.log(`husky: ${expectedVersion}`);
console.log('prepare script: husky');
console.log(`core.hooksPath: ${hooksPath}`);
Object.entries(expectedHooks).forEach(([relativePath, expectedCommand]) => {
  console.log(`${relativePath}: ${expectedCommand}`);
});

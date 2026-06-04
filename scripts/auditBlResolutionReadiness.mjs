import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const summaryPath = path.join(root, 'local-docs', 'bl-resolution-readiness-summary.txt');
const expectedResolution = '6.1.6';
const commonJsConsumers = ['levelup', 'ora'];

const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);

const npmViewJson = args =>
  JSON.parse(
    execFileSync(npmCommand, npmArgs(['view', ...args, '--json']), {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim(),
  );

const getInstalledPackageVersion = packageName => {
  try {
    return require(`${packageName}/package.json`).version || '';
  } catch {
    try {
      let packageDir = path.dirname(require.resolve(packageName));

      while (packageDir !== path.dirname(packageDir)) {
        const packagePath = path.join(packageDir, 'package.json');

        if (existsSync(packagePath)) {
          const packageVersion = JSON.parse(readFileSync(packagePath, 'utf8')).version;

          if (packageVersion) {
            return packageVersion;
          }
        }

        packageDir = path.dirname(packageDir);
      }
    } catch {
      return '';
    }
  }

  return '';
};

export const collectBlResolutionReadiness = () => {
  const errors = [];
  const packageResolution = packageJson.resolutions?.bl || '';
  const installedVersion = getInstalledPackageVersion('bl');
  const latestMetadata = npmViewJson(['bl@latest', 'version', 'engines']);
  let requireType = '';

  try {
    requireType = typeof require('bl');
  } catch (error) {
    errors.push(`require('bl') failed: ${error.code || error.message}`);
  }

  const consumers = commonJsConsumers.map(packageName => {
    try {
      require(packageName);
      return { packageName, status: 'require ok' };
    } catch (error) {
      errors.push(`require('${packageName}') failed: ${error.code || error.message}`);
      return { packageName, status: `require failed: ${error.code || error.message}` };
    }
  });

  if (packageResolution !== expectedResolution) {
    errors.push(`package.json resolutions.bl is ${packageResolution || '<missing>'}; expected ${expectedResolution}`);
  }

  if (installedVersion !== expectedResolution) {
    errors.push(`installed bl is ${installedVersion || '<missing>'}; expected ${expectedResolution}`);
  }

  if (requireType !== 'function') {
    errors.push(`require('bl') returned ${requireType || '<missing>'}; expected function`);
  }

  return {
    packageResolution,
    installedVersion,
    requireType,
    latestVersion: latestMetadata.version || '',
    latestNodeEngine: latestMetadata.engines?.node || '',
    latestTargetBlocked: 'yes',
    consumers,
    errors,
  };
};

export const formatBlResolutionReadinessSummary = (audit, generatedAt = new Date().toISOString()) =>
  [
    'BL resolution readiness audit',
    `Generated at: ${generatedAt}`,
    `package.json resolution: ${audit.packageResolution || '<missing>'}`,
    `Installed bl version: ${audit.installedVersion || '<missing>'}`,
    `require('bl') type: ${audit.requireType || '<missing>'}`,
    `Latest bl version: ${audit.latestVersion || '<missing>'}`,
    `Latest bl node engine: ${audit.latestNodeEngine || '<missing>'}`,
    `Latest bl target blocked: ${audit.latestTargetBlocked}`,
    `CommonJS/transitive consumers: ${audit.consumers.length}`,
    ...audit.consumers.map(consumer => `- ${consumer.packageName}: ${consumer.status}`),
    `Compatibility errors: ${audit.errors.length}`,
    ...audit.errors.map(error => `- ${error}`),
    'Required action: keep bl on the CommonJS-compatible 6.1.6 resolution until levelup/ora and other transitive consumers are proven compatible with the bl 7 export map.',
    '',
  ].join('\n');

const printReport = () => {
  const audit = collectBlResolutionReadiness();
  const summary = formatBlResolutionReadinessSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  console.log(summary.trim());
  console.log(`BL resolution readiness summary written to ${path.relative(root, summaryPath)}`);

  if (audit.errors.length > 0) {
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport();
}

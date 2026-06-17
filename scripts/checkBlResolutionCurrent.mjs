import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const expectedResolution = '6.1.6';
const commonJsConsumers = ['levelup', 'ora'];

const readJson = relativePath => JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));

const getInstalledPackageVersion = packageName => {
  try {
    return require(`${packageName}/package.json`).version || '';
  } catch {
    try {
      let packageDir = path.dirname(require.resolve(packageName));

      while (packageDir !== path.dirname(packageDir)) {
        const packageJsonPath = path.join(packageDir, 'package.json');

        if (existsSync(packageJsonPath)) {
          const packageVersion = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;

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

export const collectBlResolutionCurrentState = () => {
  const packageJson = readJson('package.json');
  const errors = [];
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
      const status = `require failed: ${error.code || error.message}`;
      errors.push(`${packageName} ${status}`);
      return { packageName, status };
    }
  });

  const packageResolution = packageJson.resolutions?.bl || '';
  const installedVersion = getInstalledPackageVersion('bl');

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
    consumers,
    errors,
  };
};

const printReport = audit => {
  console.log('BL current resolution check');
  console.log(`package.json resolution: ${audit.packageResolution || '<missing>'}`);
  console.log(`Installed bl version: ${audit.installedVersion || '<missing>'}`);
  console.log(`require('bl') type: ${audit.requireType || '<missing>'}`);
  console.log(`CommonJS/transitive consumers: ${audit.consumers.length}`);
  audit.consumers.forEach(consumer => console.log(`- ${consumer.packageName}: ${consumer.status}`));

  if (audit.errors.length > 0) {
    console.log('BL current resolution check failed:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('BL current resolution matches the CommonJS-compatible 6.1.6 baseline.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectBlResolutionCurrentState());
}

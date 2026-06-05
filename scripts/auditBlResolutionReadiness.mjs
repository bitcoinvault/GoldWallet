import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { tmpdir } from 'os';
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

const probeLatestBlPackage = latestVersion => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'goldwallet-bl-latest-'));
  const result = {
    packageJsonSubpathExport: 'unknown',
    packageJsonSubpathError: '',
    bareCjsRequire: 'unknown',
    bareCjsRequireType: '',
    bareCjsRequireKeys: '',
    bareCjsRequireDefaultType: '',
    bareCjsRequireError: '',
    bareEsmImport: 'unknown',
    bareEsmImportDefaultType: '',
    bareEsmImportKeys: '',
    bareEsmImportError: '',
  };

  try {
    execFileSync(
      npmCommand,
      npmArgs(['install', '--prefix', tempDir, '--ignore-scripts', '--no-audit', '--no-fund', `bl@${latestVersion || 'latest'}`]),
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      },
    );

    const probeRequire = createRequire(path.join(tempDir, 'package.json'));

    try {
      probeRequire.resolve('bl/package.json');
      result.packageJsonSubpathExport = 'yes';
    } catch (error) {
      result.packageJsonSubpathExport = 'no';
      result.packageJsonSubpathError = error.code || error.message;
    }

    try {
      const required = probeRequire('bl');
      result.bareCjsRequire = 'ok';
      result.bareCjsRequireType = typeof required;
      result.bareCjsRequireKeys = Object.keys(required).join(',') || 'none';
      result.bareCjsRequireDefaultType = typeof required.default;
    } catch (error) {
      result.bareCjsRequire = 'failed';
      result.bareCjsRequireError = error.code || error.message;
    }

    const esmProbePath = path.join(tempDir, 'probe-bl-import.mjs');
    writeFileSync(
      esmProbePath,
      [
        "import * as blModule from 'bl';",
        'console.log(JSON.stringify({',
        "  status: 'ok',",
        '  keys: Object.keys(blModule),',
        '  defaultType: typeof blModule.default,',
        '}));',
        '',
      ].join('\n'),
    );

    try {
      const importOutput = execFileSync(process.execPath, [esmProbePath], {
        cwd: tempDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }).trim();
      const importResult = JSON.parse(importOutput);

      result.bareEsmImport = importResult.status || 'unknown';
      result.bareEsmImportDefaultType = importResult.defaultType || '';
      result.bareEsmImportKeys = (importResult.keys || []).join(',') || 'none';
    } catch (error) {
      result.bareEsmImport = 'failed';
      result.bareEsmImportError = error.code || error.message;
    }
  } finally {
    if (tempDir.startsWith(tmpdir())) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  return result;
};

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
  const latestMetadata = npmViewJson(['bl@latest', 'version', 'engines', 'type', 'exports']);
  const latestExports = latestMetadata.exports || {};
  const latestExportsJson = JSON.stringify(latestExports);
  const latestHasCommonJsRequireExport = latestExportsJson.includes('"require"');
  const latestProbe = probeLatestBlPackage(latestMetadata.version || 'latest');
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
    latestPackageType: latestMetadata.type || '',
    latestCommonJsRequireExport: latestHasCommonJsRequireExport ? 'yes' : 'no',
    latestPackageJsonSubpathExport: latestProbe.packageJsonSubpathExport,
    latestPackageJsonSubpathError: latestProbe.packageJsonSubpathError,
    latestBareCjsRequire: latestProbe.bareCjsRequire,
    latestBareCjsRequireType: latestProbe.bareCjsRequireType,
    latestBareCjsRequireKeys: latestProbe.bareCjsRequireKeys,
    latestBareCjsRequireDefaultType: latestProbe.bareCjsRequireDefaultType,
    latestBareCjsRequireError: latestProbe.bareCjsRequireError,
    latestBareEsmImport: latestProbe.bareEsmImport,
    latestBareEsmImportDefaultType: latestProbe.bareEsmImportDefaultType,
    latestBareEsmImportKeys: latestProbe.bareEsmImportKeys,
    latestBareEsmImportError: latestProbe.bareEsmImportError,
    latestTargetBlocked: latestHasCommonJsRequireExport || latestProbe.bareCjsRequire === 'ok' ? 'no' : 'yes',
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
    `Latest bl package type: ${audit.latestPackageType || '<missing>'}`,
    `Latest bl CommonJS require export: ${audit.latestCommonJsRequireExport || '<missing>'}`,
    `Latest bl package.json subpath export: ${audit.latestPackageJsonSubpathExport || '<missing>'}`,
    `Latest bl package.json subpath error: ${audit.latestPackageJsonSubpathError || 'none'}`,
    `Latest bl bare CJS require: ${audit.latestBareCjsRequire || '<missing>'}`,
    `Latest bl bare CJS require type: ${audit.latestBareCjsRequireType || 'none'}`,
    `Latest bl bare CJS require keys: ${audit.latestBareCjsRequireKeys || 'none'}`,
    `Latest bl bare CJS require default type: ${audit.latestBareCjsRequireDefaultType || 'none'}`,
    `Latest bl bare CJS require error: ${audit.latestBareCjsRequireError || 'none'}`,
    `Latest bl bare ESM import: ${audit.latestBareEsmImport || '<missing>'}`,
    `Latest bl bare ESM import default type: ${audit.latestBareEsmImportDefaultType || 'none'}`,
    `Latest bl bare ESM import keys: ${audit.latestBareEsmImportKeys || 'none'}`,
    `Latest bl bare ESM import error: ${audit.latestBareEsmImportError || 'none'}`,
    `Latest bl target blocked: ${audit.latestTargetBlocked}`,
    `CommonJS/transitive consumers: ${audit.consumers.length}`,
    ...audit.consumers.map(consumer => `- ${consumer.packageName}: ${consumer.status}`),
    `Compatibility errors: ${audit.errors.length}`,
    ...audit.errors.map(error => `- ${error}`),
    'Required action: keep bl on the CommonJS-compatible 6.1.6 resolution until levelup/ora and other transitive consumers are proven compatible with the bl 7 ESM/import-only export map and missing bare CJS/package.json exports.',
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

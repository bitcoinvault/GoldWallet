import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const summaryPath = path.join(root, 'local-docs', 'plist-major-compatibility-summary.txt');

const expectedPlistResolution = '3.1.1';
const expectedSimplePlistResolution = '1.3.1';
const expectedXcodeVersion = '3.0.1';
const ownerPath = 'react-native-bootsplash > @expo/config-plugins > xcode > simple-plist > plist';

const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);
const corepackCommand = process.platform === 'win32' ? 'cmd.exe' : 'corepack';
const corepackArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'corepack', ...args] : args);

const run = (command, args, options = {}) =>
  spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    ...options,
  });

const npmViewJson = args => {
  const result = run(npmCommand, npmArgs(['view', ...args, '--json']));

  if (result.status !== 0) {
    throw new Error(`npm view ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }

  return JSON.parse(result.stdout.trim());
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

const normalizeError = error => {
  if (!error) {
    return '';
  }

  return String(error)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
};

const runCurrentOwnerPathProbe = () => {
  const result = {
    plistParseType: '',
    plistBuildType: '',
    simplePlistReadFileSyncType: '',
    xcodeProjectType: '',
    infoPlistParse: 'failed',
    simplePlistInfoRead: 'failed',
    xcodeProjectParse: 'failed',
    displayName: '',
    errors: [],
  };

  try {
    const plist = require('plist');
    const simplePlist = require('simple-plist');
    const xcode = require('xcode');
    const infoPlistPath = path.join(root, 'ios', 'GoldWallet', 'Info.plist');
    const xcodeProjectPath = path.join(root, 'ios', 'GoldWallet.xcodeproj', 'project.pbxproj');

    result.plistParseType = typeof plist.parse;
    result.plistBuildType = typeof plist.build;
    result.simplePlistReadFileSyncType = typeof simplePlist.readFileSync;
    result.xcodeProjectType = typeof xcode.project;

    const parsedInfoPlist = plist.parse(readFileSync(infoPlistPath, 'utf8'));
    result.infoPlistParse = 'ok';
    result.displayName = parsedInfoPlist.CFBundleDisplayName || '';

    const simpleParsedInfoPlist = simplePlist.readFileSync(infoPlistPath);
    result.simplePlistInfoRead = simpleParsedInfoPlist.CFBundleDisplayName ? 'ok' : 'failed';

    xcode.project(xcodeProjectPath).parseSync();
    result.xcodeProjectParse = 'ok';
  } catch (error) {
    result.errors.push(`current owner path probe failed: ${error.code || error.message}`);
  }

  return result;
};

const probeLatestPlistOwnerPath = latestVersion => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'goldwallet-plist-latest-'));
  const result = {
    installStatus: '',
    installError: '',
    simplePlistRequire: 'unknown',
    simplePlistRequireError: '',
    xcodeRequire: 'unknown',
    xcodeRequireError: '',
    plistRequire: 'unknown',
    plistRequireError: '',
    plistImport: 'unknown',
    plistImportKeys: '',
    plistImportParseType: '',
    plistImportBuildType: '',
    plistImportError: '',
  };

  try {
    writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(
        {
          private: true,
          dependencies: {
            'simple-plist': expectedSimplePlistResolution,
            xcode: expectedXcodeVersion,
          },
          resolutions: {
            plist: latestVersion || 'latest',
          },
        },
        null,
        2,
      ),
    );

    const install = run(corepackCommand, corepackArgs(['yarn', 'install', '--silent']), { cwd: tempDir });
    result.installStatus = String(install.status ?? 'unknown');
    result.installError = install.status === 0 ? '' : normalizeError(install.stderr || install.stdout);

    if (install.status !== 0) {
      return result;
    }

    const probeCode = `
      (async () => {
        const output = {};
        const probeRequire = (packageName, prefix) => {
          try {
            const required = require(packageName);
            output[prefix + 'Require'] = 'ok';
            output[prefix + 'RequireType'] = typeof required;
            output[prefix + 'RequireKeys'] = Object.keys(required).join(',') || 'none';
          } catch (error) {
            output[prefix + 'Require'] = 'failed';
            output[prefix + 'RequireError'] = error.code || error.message;
          }
        };

        probeRequire('simple-plist', 'simplePlist');
        probeRequire('xcode', 'xcode');
        probeRequire('plist', 'plist');

        try {
          const plistModule = await import('plist');
          output.plistImport = 'ok';
          output.plistImportKeys = Object.keys(plistModule).join(',') || 'none';
          output.plistImportParseType = typeof plistModule.parse;
          output.plistImportBuildType = typeof plistModule.build;
        } catch (error) {
          output.plistImport = 'failed';
          output.plistImportError = error.code || error.message;
        }

        console.log(JSON.stringify(output));
      })().catch(error => {
        console.error(error);
        process.exit(1);
      });
    `;
    const probe = run(process.execPath, ['-e', probeCode], { cwd: tempDir });

    if (probe.status !== 0) {
      result.plistImportError = normalizeError(probe.stderr || probe.stdout);
      return result;
    }

    Object.assign(result, JSON.parse(probe.stdout.trim()));
  } finally {
    if (tempDir.startsWith(tmpdir())) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  return result;
};

export const collectPlistMajorCompatibility = () => {
  const errors = [];
  const packagePlistResolution = packageJson.resolutions?.plist || '';
  const packageSimplePlistResolution = packageJson.resolutions?.['simple-plist'] || '';
  const installedPlistVersion = getInstalledPackageVersion('plist');
  const installedSimplePlistVersion = getInstalledPackageVersion('simple-plist');
  const installedXcodeVersion = getInstalledPackageVersion('xcode');
  const currentProbe = runCurrentOwnerPathProbe();
  const latestMetadata = npmViewJson(['plist@latest', 'version', 'engines', 'type', 'exports']);
  const latestExportsJson = JSON.stringify(latestMetadata.exports || {});
  const latestImportExportPresent = latestExportsJson.includes('"import"') ? 'yes' : 'no';
  const latestRequireExportPresent = latestExportsJson.includes('"require"') ? 'yes' : 'no';
  const latestProbe = probeLatestPlistOwnerPath(latestMetadata.version || 'latest');

  if (packagePlistResolution !== expectedPlistResolution) {
    errors.push(`package.json resolutions.plist is ${packagePlistResolution || '<missing>'}; expected ${expectedPlistResolution}`);
  }

  if (packageSimplePlistResolution !== expectedSimplePlistResolution) {
    errors.push(
      `package.json resolutions.simple-plist is ${packageSimplePlistResolution || '<missing>'}; expected ${expectedSimplePlistResolution}`,
    );
  }

  if (installedPlistVersion !== expectedPlistResolution) {
    errors.push(`installed plist is ${installedPlistVersion || '<missing>'}; expected ${expectedPlistResolution}`);
  }

  if (installedSimplePlistVersion !== expectedSimplePlistResolution) {
    errors.push(`installed simple-plist is ${installedSimplePlistVersion || '<missing>'}; expected ${expectedSimplePlistResolution}`);
  }

  if (installedXcodeVersion !== expectedXcodeVersion) {
    errors.push(`installed xcode is ${installedXcodeVersion || '<missing>'}; expected ${expectedXcodeVersion}`);
  }

  if (currentProbe.plistParseType !== 'function') {
    errors.push(`current plist.parse type is ${currentProbe.plistParseType || '<missing>'}; expected function`);
  }

  if (currentProbe.plistBuildType !== 'function') {
    errors.push(`current plist.build type is ${currentProbe.plistBuildType || '<missing>'}; expected function`);
  }

  if (currentProbe.simplePlistReadFileSyncType !== 'function') {
    errors.push(`current simple-plist readFileSync type is ${currentProbe.simplePlistReadFileSyncType || '<missing>'}; expected function`);
  }

  if (currentProbe.xcodeProjectType !== 'function') {
    errors.push(`current xcode project type is ${currentProbe.xcodeProjectType || '<missing>'}; expected function`);
  }

  ['infoPlistParse', 'simplePlistInfoRead', 'xcodeProjectParse'].forEach(field => {
    if (currentProbe[field] !== 'ok') {
      errors.push(`current ${field} is ${currentProbe[field] || '<missing>'}; expected ok`);
    }
  });

  currentProbe.errors.forEach(error => errors.push(error));

  return {
    packagePlistResolution,
    packageSimplePlistResolution,
    installedPlistVersion,
    installedSimplePlistVersion,
    installedXcodeVersion,
    currentProbe,
    latestVersion: latestMetadata.version || '',
    latestNodeEngine: latestMetadata.engines?.node || '',
    latestPackageType: latestMetadata.type || '',
    latestImportExportPresent,
    latestRequireExportPresent,
    latestProbe,
    latestTargetBlocked:
      latestProbe.simplePlistRequire === 'ok' && latestProbe.xcodeRequire === 'ok' && latestProbe.plistRequire === 'ok' ? 'no' : 'yes',
    ownerPath,
    secretValuesPrinted: 'no',
    errors,
  };
};

export const formatPlistMajorCompatibilitySummary = (audit, generatedAt = new Date().toISOString()) =>
  [
    'Plist major compatibility audit',
    `Generated at: ${generatedAt}`,
    `package.json plist resolution: ${audit.packagePlistResolution || '<missing>'}`,
    `package.json simple-plist resolution: ${audit.packageSimplePlistResolution || '<missing>'}`,
    `Installed plist version: ${audit.installedPlistVersion || '<missing>'}`,
    `Installed simple-plist version: ${audit.installedSimplePlistVersion || '<missing>'}`,
    `Installed xcode version: ${audit.installedXcodeVersion || '<missing>'}`,
    `Current plist parse type: ${audit.currentProbe.plistParseType || '<missing>'}`,
    `Current plist build type: ${audit.currentProbe.plistBuildType || '<missing>'}`,
    `Current simple-plist readFileSync type: ${audit.currentProbe.simplePlistReadFileSyncType || '<missing>'}`,
    `Current xcode project type: ${audit.currentProbe.xcodeProjectType || '<missing>'}`,
    `Current Info.plist parse: ${audit.currentProbe.infoPlistParse || '<missing>'}`,
    `Current simple-plist Info.plist read: ${audit.currentProbe.simplePlistInfoRead || '<missing>'}`,
    `Current xcode project parse: ${audit.currentProbe.xcodeProjectParse || '<missing>'}`,
    `Current Info.plist display name: ${audit.currentProbe.displayName || '<missing>'}`,
    `Latest plist version: ${audit.latestVersion || '<missing>'}`,
    `Latest plist node engine: ${audit.latestNodeEngine || '<missing>'}`,
    `Latest plist package type: ${audit.latestPackageType || '<missing>'}`,
    `Latest plist import export present: ${audit.latestImportExportPresent || '<missing>'}`,
    `Latest plist require export present: ${audit.latestRequireExportPresent || '<missing>'}`,
    `Latest plist forced resolution install status: ${audit.latestProbe.installStatus || '<missing>'}`,
    `Latest simple-plist CJS require: ${audit.latestProbe.simplePlistRequire || '<missing>'}`,
    `Latest simple-plist CJS require error: ${audit.latestProbe.simplePlistRequireError || 'none'}`,
    `Latest xcode CJS require: ${audit.latestProbe.xcodeRequire || '<missing>'}`,
    `Latest xcode CJS require error: ${audit.latestProbe.xcodeRequireError || 'none'}`,
    `Latest plist CJS require: ${audit.latestProbe.plistRequire || '<missing>'}`,
    `Latest plist CJS require error: ${audit.latestProbe.plistRequireError || 'none'}`,
    `Latest plist ESM import: ${audit.latestProbe.plistImport || '<missing>'}`,
    `Latest plist ESM import keys: ${audit.latestProbe.plistImportKeys || 'none'}`,
    `Latest plist ESM import parse type: ${audit.latestProbe.plistImportParseType || 'none'}`,
    `Latest plist ESM import build type: ${audit.latestProbe.plistImportBuildType || 'none'}`,
    `Latest plist ESM import error: ${audit.latestProbe.plistImportError || 'none'}`,
    `Latest plist target blocked: ${audit.latestTargetBlocked}`,
    `Owner path: ${audit.ownerPath}`,
    `Secret values printed: ${audit.secretValuesPrinted}`,
    `Compatibility errors: ${audit.errors.length}`,
    ...audit.errors.map(error => `- ${error}`),
    "Required action: keep plist on the CommonJS-compatible 3.1.1 resolution and simple-plist on 1.3.1 until the xcode/simple-plist owner path supports plist 5's ESM/import-only export map.",
    '',
  ].join('\n');

const printReport = () => {
  const audit = collectPlistMajorCompatibility();
  const summary = formatPlistMajorCompatibilitySummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  console.log(summary.trim());
  console.log(`Plist major compatibility summary written to ${path.relative(root, summaryPath)}`);

  if (audit.errors.length > 0) {
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport();
}

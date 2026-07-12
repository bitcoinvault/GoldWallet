const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getBulletLinesAfter = (content, label) => {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.startsWith(`${label}: `));
  const bulletLines = [];

  if (startIndex === -1) {
    return bulletLines;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (!lines[index].startsWith('- ')) {
      break;
    }

    bulletLines.push(lines[index].slice(2));
  }

  return bulletLines;
};

export const getPlistMajorCompatibilitySummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const packagePlistResolution = getLineValue(summary, 'package.json plist resolution');
  const packageSimplePlistResolution = getLineValue(summary, 'package.json simple-plist resolution');
  const installedPlistVersion = getLineValue(summary, 'Installed plist version');
  const installedSimplePlistVersion = getLineValue(summary, 'Installed simple-plist version');
  const installedXcodeVersion = getLineValue(summary, 'Installed xcode version');
  const currentPlistParseType = getLineValue(summary, 'Current plist parse type');
  const currentPlistBuildType = getLineValue(summary, 'Current plist build type');
  const currentSimplePlistReadFileSyncType = getLineValue(summary, 'Current simple-plist readFileSync type');
  const currentXcodeProjectType = getLineValue(summary, 'Current xcode project type');
  const currentInfoPlistParse = getLineValue(summary, 'Current Info.plist parse');
  const currentSimplePlistInfoRead = getLineValue(summary, 'Current simple-plist Info.plist read');
  const currentXcodeProjectParse = getLineValue(summary, 'Current xcode project parse');
  const currentDisplayName = getLineValue(summary, 'Current Info.plist display name');
  const latestVersion = getLineValue(summary, 'Latest plist version');
  const latestNodeEngine = getLineValue(summary, 'Latest plist node engine');
  const latestPackageType = getLineValue(summary, 'Latest plist package type');
  const latestImportExportPresent = getLineValue(summary, 'Latest plist import export present');
  const latestRequireExportPresent = getLineValue(summary, 'Latest plist require export present');
  const latestInstallStatus = getLineValue(summary, 'Latest plist forced resolution install status');
  const latestSimplePlistRequire = getLineValue(summary, 'Latest simple-plist CJS require');
  const latestSimplePlistRequireError = getLineValue(summary, 'Latest simple-plist CJS require error');
  const latestXcodeRequire = getLineValue(summary, 'Latest xcode CJS require');
  const latestXcodeRequireError = getLineValue(summary, 'Latest xcode CJS require error');
  const latestPlistRequire = getLineValue(summary, 'Latest plist CJS require');
  const latestPlistRequireError = getLineValue(summary, 'Latest plist CJS require error');
  const latestPlistImport = getLineValue(summary, 'Latest plist ESM import');
  const latestPlistImportKeys = getLineValue(summary, 'Latest plist ESM import keys');
  const latestPlistImportParseType = getLineValue(summary, 'Latest plist ESM import parse type');
  const latestPlistImportBuildType = getLineValue(summary, 'Latest plist ESM import build type');
  const latestPlistImportError = getLineValue(summary, 'Latest plist ESM import error');
  const latestTargetBlocked = getLineValue(summary, 'Latest plist target blocked');
  const ownerPath = getLineValue(summary, 'Owner path');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const errorsCount = getLineValue(summary, 'Compatibility errors');
  const errorLines = getBulletLinesAfter(summary, 'Compatibility errors');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Plist major compatibility audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (packagePlistResolution !== '3.1.1') {
    errors.push(`package.json plist resolution must remain 3.1.1. Received: ${packagePlistResolution || 'missing'}`);
  }

  if (packageSimplePlistResolution !== '1.3.1') {
    errors.push(`package.json simple-plist resolution must remain 1.3.1. Received: ${packageSimplePlistResolution || 'missing'}`);
  }

  if (installedPlistVersion !== '3.1.1') {
    errors.push(`Installed plist version must be 3.1.1. Received: ${installedPlistVersion || 'missing'}`);
  }

  if (installedSimplePlistVersion !== '1.3.1') {
    errors.push(`Installed simple-plist version must be 1.3.1. Received: ${installedSimplePlistVersion || 'missing'}`);
  }

  if (installedXcodeVersion !== '3.0.1') {
    errors.push(`Installed xcode version must be 3.0.1. Received: ${installedXcodeVersion || 'missing'}`);
  }

  [
    ['Current plist parse type', currentPlistParseType],
    ['Current plist build type', currentPlistBuildType],
    ['Current simple-plist readFileSync type', currentSimplePlistReadFileSyncType],
    ['Current xcode project type', currentXcodeProjectType],
  ].forEach(([label, value]) => {
    if (value !== 'function') {
      errors.push(`${label} must be function. Received: ${value || 'missing'}`);
    }
  });

  [
    ['Current Info.plist parse', currentInfoPlistParse],
    ['Current simple-plist Info.plist read', currentSimplePlistInfoRead],
    ['Current xcode project parse', currentXcodeProjectParse],
  ].forEach(([label, value]) => {
    if (value !== 'ok') {
      errors.push(`${label} must be ok. Received: ${value || 'missing'}`);
    }
  });

  if (currentDisplayName !== 'GoldWallet') {
    errors.push(`Current Info.plist display name must remain GoldWallet. Received: ${currentDisplayName || 'missing'}`);
  }

  if (!/^\d+\.\d+\.\d+$/.test(latestVersion)) {
    errors.push(`Latest plist version must be semver. Received: ${latestVersion || 'missing'}`);
  }

  if (!latestNodeEngine.includes('>=18')) {
    errors.push(`Latest plist node engine must document Node >=18. Received: ${latestNodeEngine || 'missing'}`);
  }

  if (latestPackageType !== 'module') {
    errors.push(`Latest plist package type must document the ESM-only line. Received: ${latestPackageType || 'missing'}`);
  }

  if (latestImportExportPresent !== 'yes') {
    errors.push(`Latest plist import export present must be yes. Received: ${latestImportExportPresent || 'missing'}`);
  }

  if (latestRequireExportPresent !== 'no') {
    errors.push(`Latest plist require export present must be no until CJS consumers are migrated. Received: ${latestRequireExportPresent || 'missing'}`);
  }

  if (latestInstallStatus !== '0') {
    errors.push(`Latest plist forced resolution install status must be 0. Received: ${latestInstallStatus || 'missing'}`);
  }

  [
    ['Latest simple-plist CJS require', latestSimplePlistRequire],
    ['Latest xcode CJS require', latestXcodeRequire],
    ['Latest plist CJS require', latestPlistRequire],
  ].forEach(([label, value]) => {
    if (value !== 'failed') {
      errors.push(`${label} must fail while plist 5 remains incompatible with the CJS owner path. Received: ${value || 'missing'}`);
    }
  });

  [
    ['Latest simple-plist CJS require error', latestSimplePlistRequireError],
    ['Latest xcode CJS require error', latestXcodeRequireError],
    ['Latest plist CJS require error', latestPlistRequireError],
  ].forEach(([label, value]) => {
    if (!value.includes('ERR_PACKAGE_PATH_NOT_EXPORTED')) {
      errors.push(`${label} must document ERR_PACKAGE_PATH_NOT_EXPORTED. Received: ${value || 'missing'}`);
    }
  });

  if (latestPlistImport !== 'ok') {
    errors.push(`Latest plist ESM import must work so the blocker stays scoped to CommonJS/export-map consumers. Received: ${latestPlistImport || 'missing'}`);
  }

  ['parse', 'build'].forEach(expectedKey => {
    if (!latestPlistImportKeys.split(',').includes(expectedKey)) {
      errors.push(`Latest plist ESM import keys must include ${expectedKey}. Received: ${latestPlistImportKeys || 'missing'}`);
    }
  });

  if (latestPlistImportParseType !== 'function') {
    errors.push(`Latest plist ESM import parse type must be function. Received: ${latestPlistImportParseType || 'missing'}`);
  }

  if (latestPlistImportBuildType !== 'function') {
    errors.push(`Latest plist ESM import build type must be function. Received: ${latestPlistImportBuildType || 'missing'}`);
  }

  if (latestPlistImportError !== 'none') {
    errors.push(`Latest plist ESM import error must be none. Received: ${latestPlistImportError || 'missing'}`);
  }

  if (latestTargetBlocked !== 'yes') {
    errors.push(`Latest plist target must stay blocked until the CJS owner path is migrated. Received: ${latestTargetBlocked || 'missing'}`);
  }

  if (ownerPath !== 'react-native-bootsplash > @expo/config-plugins > xcode > simple-plist > plist') {
    errors.push(`Owner path must name the current transitive chain. Received: ${ownerPath || 'missing'}`);
  }

  if (secretValuesPrinted !== 'no') {
    errors.push(`Secret values printed must be no. Received: ${secretValuesPrinted || 'missing'}`);
  }

  if (!/^\d+$/.test(errorsCount)) {
    errors.push(`Compatibility errors must be a count. Received: ${errorsCount || 'missing'}`);
  } else if (Number(errorsCount) !== errorLines.length) {
    errors.push(`Compatibility errors count is ${errorsCount}, but listed ${errorLines.length}`);
  }

  if (errorsCount !== '0') {
    errors.push('Plist major compatibility audit must have 0 current compatibility errors');
  }

  if (!requiredAction.includes('keep plist on the CommonJS-compatible 3.1.1 resolution')) {
    errors.push('Required action must name the CommonJS-compatible 3.1.1 plist decision');
  }

  if (!requiredAction.includes('simple-plist on 1.3.1')) {
    errors.push('Required action must name the simple-plist 1.3.1 owner-path decision');
  }

  if (!requiredAction.includes("plist 5's ESM/import-only export map")) {
    errors.push("Required action must name plist 5's ESM/import-only export-map blocker");
  }

  return errors;
};

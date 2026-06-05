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

export const getBlResolutionSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const packageResolution = getLineValue(summary, 'package.json resolution');
  const installedVersion = getLineValue(summary, 'Installed bl version');
  const requireType = getLineValue(summary, "require('bl') type");
  const latestVersion = getLineValue(summary, 'Latest bl version');
  const latestNodeEngine = getLineValue(summary, 'Latest bl node engine');
  const latestPackageType = getLineValue(summary, 'Latest bl package type');
  const latestCommonJsRequireExport = getLineValue(summary, 'Latest bl CommonJS require export');
  const latestPackageJsonSubpathExport = getLineValue(summary, 'Latest bl package.json subpath export');
  const latestPackageJsonSubpathError = getLineValue(summary, 'Latest bl package.json subpath error');
  const latestBareCjsRequire = getLineValue(summary, 'Latest bl bare CJS require');
  const latestBareCjsRequireType = getLineValue(summary, 'Latest bl bare CJS require type');
  const latestBareCjsRequireKeys = getLineValue(summary, 'Latest bl bare CJS require keys');
  const latestBareCjsRequireDefaultType = getLineValue(summary, 'Latest bl bare CJS require default type');
  const latestBareCjsRequireError = getLineValue(summary, 'Latest bl bare CJS require error');
  const latestBareEsmImport = getLineValue(summary, 'Latest bl bare ESM import');
  const latestBareEsmImportDefaultType = getLineValue(summary, 'Latest bl bare ESM import default type');
  const latestBareEsmImportKeys = getLineValue(summary, 'Latest bl bare ESM import keys');
  const latestBareEsmImportError = getLineValue(summary, 'Latest bl bare ESM import error');
  const latestTargetBlocked = getLineValue(summary, 'Latest bl target blocked');
  const consumerCount = getLineValue(summary, 'CommonJS/transitive consumers');
  const consumerLines = getBulletLinesAfter(summary, 'CommonJS/transitive consumers');
  const errorsCount = getLineValue(summary, 'Compatibility errors');
  const errorLines = getBulletLinesAfter(summary, 'Compatibility errors');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('BL resolution readiness audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (packageResolution !== '6.1.6') {
    errors.push(`package.json resolution must remain 6.1.6. Received: ${packageResolution || 'missing'}`);
  }

  if (installedVersion !== '6.1.6') {
    errors.push(`Installed bl version must be 6.1.6. Received: ${installedVersion || 'missing'}`);
  }

  if (requireType !== 'function') {
    errors.push(`require('bl') must return a function for current CommonJS consumers. Received: ${requireType || 'missing'}`);
  }

  if (!/^\d+\.\d+\.\d+$/.test(latestVersion)) {
    errors.push(`Latest bl version must be semver. Received: ${latestVersion || 'missing'}`);
  }

  if (!latestNodeEngine.includes('>=20')) {
    errors.push(`Latest bl node engine must document the Node >=20 line. Received: ${latestNodeEngine || 'missing'}`);
  }

  if (latestPackageType !== 'module') {
    errors.push(`Latest bl package type must document the ESM-only line. Received: ${latestPackageType || 'missing'}`);
  }

  if (latestCommonJsRequireExport !== 'no') {
    errors.push(`Latest bl CommonJS require export must stay no until CommonJS consumers are migrated. Received: ${latestCommonJsRequireExport || 'missing'}`);
  }

  if (latestPackageJsonSubpathExport !== 'no') {
    errors.push(`Latest bl package.json subpath export must stay no until export-map compatibility changes. Received: ${latestPackageJsonSubpathExport || 'missing'}`);
  }

  if (!latestPackageJsonSubpathError.includes('ERR_PACKAGE_PATH_NOT_EXPORTED')) {
    errors.push(`Latest bl package.json subpath error must document ERR_PACKAGE_PATH_NOT_EXPORTED. Received: ${latestPackageJsonSubpathError || 'missing'}`);
  }

  if (latestBareCjsRequire !== 'failed') {
    errors.push(`Latest bl bare CJS require must fail until CommonJS consumers are migrated. Received: ${latestBareCjsRequire || 'missing'}`);
  }

  if (latestBareCjsRequireType !== 'none') {
    errors.push(`Latest bl bare CJS require type must be none while require fails. Received: ${latestBareCjsRequireType || 'missing'}`);
  }

  if (latestBareCjsRequireKeys !== 'none') {
    errors.push(`Latest bl bare CJS require keys must be none while require fails. Received: ${latestBareCjsRequireKeys || 'missing'}`);
  }

  if (latestBareCjsRequireDefaultType !== 'none') {
    errors.push(`Latest bl bare CJS require default type must be none while require fails. Received: ${latestBareCjsRequireDefaultType || 'missing'}`);
  }

  if (!latestBareCjsRequireError.includes('ERR_PACKAGE_PATH_NOT_EXPORTED')) {
    errors.push(`Latest bl bare CJS require error must document ERR_PACKAGE_PATH_NOT_EXPORTED. Received: ${latestBareCjsRequireError || 'missing'}`);
  }

  if (latestBareEsmImport !== 'ok') {
    errors.push(`Latest bl bare ESM import must work so the blocker stays scoped to CommonJS/export-map consumers. Received: ${latestBareEsmImport || 'missing'}`);
  }

  if (latestBareEsmImportDefaultType !== 'function') {
    errors.push(`Latest bl bare ESM import default type must be function. Received: ${latestBareEsmImportDefaultType || 'missing'}`);
  }

  ['BufferList', 'BufferListStream', 'default', 'isBufferList'].forEach(expectedKey => {
    if (!latestBareEsmImportKeys.split(',').includes(expectedKey)) {
      errors.push(`Latest bl bare ESM import keys must include ${expectedKey}. Received: ${latestBareEsmImportKeys || 'missing'}`);
    }
  });

  if (latestBareEsmImportError !== 'none') {
    errors.push(`Latest bl bare ESM import error must be none. Received: ${latestBareEsmImportError || 'missing'}`);
  }

  if (latestTargetBlocked !== 'yes') {
    errors.push(`Latest bl target must stay blocked until CommonJS consumers are migrated. Received: ${latestTargetBlocked || 'missing'}`);
  }

  if (!/^\d+$/.test(consumerCount)) {
    errors.push(`CommonJS/transitive consumers must be a count. Received: ${consumerCount || 'missing'}`);
  } else if (Number(consumerCount) !== consumerLines.length) {
    errors.push(`CommonJS/transitive consumers count is ${consumerCount}, but listed ${consumerLines.length}`);
  }

  ['levelup', 'ora'].forEach(packageName => {
    if (!consumerLines.some(line => line.startsWith(`${packageName}: require ok`))) {
      errors.push(`${packageName} must remain a require-ok consumer`);
    }
  });

  if (!/^\d+$/.test(errorsCount)) {
    errors.push(`Compatibility errors must be a count. Received: ${errorsCount || 'missing'}`);
  } else if (Number(errorsCount) !== errorLines.length) {
    errors.push(`Compatibility errors count is ${errorsCount}, but listed ${errorLines.length}`);
  }

  if (errorsCount !== '0') {
    errors.push('BL resolution readiness must have 0 compatibility errors');
  }

  if (!requiredAction.includes('keep bl on the CommonJS-compatible 6.1.6 resolution')) {
    errors.push('Required action must name the CommonJS-compatible 6.1.6 resolution decision');
  }

  if (!requiredAction.includes('ESM/import-only export map')) {
    errors.push('Required action must name the latest BL ESM/import-only export-map blocker');
  }

  if (!requiredAction.includes('missing bare CJS/package.json exports')) {
    errors.push('Required action must name the missing bare CJS/package.json export-map blocker');
  }

  return errors;
};

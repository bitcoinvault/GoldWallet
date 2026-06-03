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

export const getNodeFetchResolutionSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const packageResolution = getLineValue(summary, 'package.json resolution');
  const installedVersion = getLineValue(summary, 'Installed node-fetch version');
  const requireType = getLineValue(summary, "require('node-fetch') type");
  const defaultExportPresent = getLineValue(summary, 'Default export present');
  const latestVersion = getLineValue(summary, 'Latest node-fetch version');
  const latestType = getLineValue(summary, 'Latest node-fetch package type');
  const latestBlocked = getLineValue(summary, 'Latest node-fetch target blocked');
  const consumerCount = getLineValue(summary, 'CommonJS/transitive consumers');
  const consumerLines = getBulletLinesAfter(summary, 'CommonJS/transitive consumers');
  const errorsCount = getLineValue(summary, 'Compatibility errors');
  const errorLines = getBulletLinesAfter(summary, 'Compatibility errors');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Node fetch resolution audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (packageResolution !== '2.7.0') {
    errors.push(`package.json resolution must remain 2.7.0. Received: ${packageResolution || 'missing'}`);
  }

  if (installedVersion !== '2.7.0') {
    errors.push(`Installed node-fetch version must be 2.7.0. Received: ${installedVersion || 'missing'}`);
  }

  if (requireType !== 'function') {
    errors.push(`require('node-fetch') must return a function for CJS consumers. Received: ${requireType || 'missing'}`);
  }

  if (defaultExportPresent !== 'yes') {
    errors.push(`node-fetch CJS default export compatibility must be present. Received: ${defaultExportPresent || 'missing'}`);
  }

  if (!/^\d+\.\d+\.\d+$/.test(latestVersion)) {
    errors.push(`Latest node-fetch version must be semver. Received: ${latestVersion || 'missing'}`);
  }

  if (latestType !== 'module') {
    errors.push(`Latest node-fetch package type must be module while v3 is ESM-only. Received: ${latestType || 'missing'}`);
  }

  if (latestBlocked !== 'yes') {
    errors.push(`Latest node-fetch target must stay blocked for this CJS resolution guard. Received: ${latestBlocked || 'missing'}`);
  }

  if (!/^\d+$/.test(consumerCount)) {
    errors.push(`CommonJS/transitive consumers must be a count. Received: ${consumerCount || 'missing'}`);
  } else if (Number(consumerCount) !== consumerLines.length) {
    errors.push(`CommonJS/transitive consumers count is ${consumerCount}, but listed ${consumerLines.length}`);
  }

  ['gaxios', 'isomorphic-fetch'].forEach(packageName => {
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
    errors.push('Node fetch resolution must have 0 compatibility errors');
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('Node fetch resolution summary must not print secret values');
  }

  if (!requiredAction.includes('keep node-fetch on the CommonJS 2.7.0 resolution')) {
    errors.push('Required action must name the CommonJS 2.7.0 resolution decision');
  }

  return errors;
};

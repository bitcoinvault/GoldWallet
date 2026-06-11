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
  const requireDefaultType = getLineValue(summary, "require('node-fetch').default type");
  const dynamicImportDefaultType = getLineValue(summary, "import('node-fetch').default type");
  const latestVersion = getLineValue(summary, 'Latest node-fetch version');
  const latestType = getLineValue(summary, 'Latest node-fetch package type');
  const latestMain = getLineValue(summary, 'Latest node-fetch main');
  const latestCommonJsRequireExport = getLineValue(summary, 'Latest node-fetch CommonJS require export');
  const latestBlocked = getLineValue(summary, 'Latest node-fetch target blocked');
  const consumerCount = getLineValue(summary, 'CommonJS/transitive consumers');
  const consumerLines = getBulletLinesAfter(summary, 'CommonJS/transitive consumers');
  const consumerEvidenceCount = getLineValue(summary, 'Consumer file evidence');
  const consumerEvidenceLines = getBulletLinesAfter(summary, 'Consumer file evidence');
  const removedBlockerCount = getLineValue(summary, 'Removed transitive blocker chain');
  const removedBlockerLines = getBulletLinesAfter(summary, 'Removed transitive blocker chain');
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

  if (packageResolution !== '<missing>') {
    errors.push(`package.json resolution must be removed. Received: ${packageResolution || 'missing'}`);
  }

  if (installedVersion !== '3.3.2') {
    errors.push(`Installed node-fetch version must be 3.3.2. Received: ${installedVersion || 'missing'}`);
  }

  if (requireType !== 'object') {
    errors.push(`require('node-fetch') must return the Node 24 module namespace object. Received: ${requireType || 'missing'}`);
  }

  if (requireDefaultType !== 'function') {
    errors.push(`require('node-fetch').default must return a function. Received: ${requireDefaultType || 'missing'}`);
  }

  if (dynamicImportDefaultType !== 'function') {
    errors.push(`import('node-fetch').default must return a function. Received: ${dynamicImportDefaultType || 'missing'}`);
  }

  if (!/^\d+\.\d+\.\d+$/.test(latestVersion)) {
    errors.push(`Latest node-fetch version must be semver. Received: ${latestVersion || 'missing'}`);
  }

  if (latestType !== 'module') {
    errors.push(`Latest node-fetch package type must be module while v3 is ESM-only. Received: ${latestType || 'missing'}`);
  }

  if (!latestMain.endsWith('/src/index.js') && latestMain !== './src/index.js') {
    errors.push(`Latest node-fetch main must document the ESM package entry. Received: ${latestMain || 'missing'}`);
  }

  if (latestCommonJsRequireExport !== 'no') {
    errors.push(`Latest node-fetch CommonJS require export must remain no for the ESM v3 package. Received: ${latestCommonJsRequireExport || 'missing'}`);
  }

  if (latestBlocked !== 'no') {
    errors.push(`Latest node-fetch target must be unblocked after snap-carousel removal. Received: ${latestBlocked || 'missing'}`);
  }

  if (!/^\d+$/.test(consumerCount)) {
    errors.push(`CommonJS/transitive consumers must be a count. Received: ${consumerCount || 'missing'}`);
  } else if (Number(consumerCount) !== consumerLines.length) {
    errors.push(`CommonJS/transitive consumers count is ${consumerCount}, but listed ${consumerLines.length}`);
  }

  if (!consumerLines.some(line => line.startsWith('gaxios: require ok'))) {
    errors.push('gaxios must remain a require-ok consumer');
  }

  if (consumerLines.some(line => line.startsWith('isomorphic-fetch: '))) {
    errors.push('isomorphic-fetch must not remain a node-fetch consumer after snap-carousel removal');
  }

  if (!/^\d+$/.test(consumerEvidenceCount)) {
    errors.push(`Consumer file evidence must be a count. Received: ${consumerEvidenceCount || 'missing'}`);
  } else if (Number(consumerEvidenceCount) !== consumerEvidenceLines.length) {
    errors.push(`Consumer file evidence count is ${consumerEvidenceCount}, but listed ${consumerEvidenceLines.length}`);
  }

  if (!consumerEvidenceLines.some(line => line === 'gaxios: dynamic import compatible (node_modules/gaxios/build/cjs/src/gaxios.js)')) {
    errors.push('gaxios must remain documented as dynamic-import compatible with node-fetch v3');
  }

  if (consumerEvidenceLines.some(line => line.startsWith('isomorphic-fetch: '))) {
    errors.push('isomorphic-fetch blocker evidence must be removed after snap-carousel removal');
  }

  if (!/^\d+$/.test(removedBlockerCount)) {
    errors.push(`Removed transitive blocker chain must be a count. Received: ${removedBlockerCount || 'missing'}`);
  } else if (Number(removedBlockerCount) !== removedBlockerLines.length) {
    errors.push(`Removed transitive blocker chain count is ${removedBlockerCount}, but listed ${removedBlockerLines.length}`);
  }

  [
    'react-native-snap-carousel: <missing>',
    'react-addons-shallow-compare: <missing>',
    'fbjs: <missing>',
    'isomorphic-fetch: <missing>',
  ].forEach(requiredLine => {
    if (!removedBlockerLines.includes(requiredLine)) {
      errors.push(`Removed transitive blocker chain must include ${requiredLine}`);
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

  if (!requiredAction.includes('keep node-fetch on the latest ESM v3 package entry')) {
    errors.push('Required action must name the latest ESM v3 package-entry decision');
  }

  if (!requiredAction.includes('snap-carousel/isomorphic-fetch chain removed')) {
    errors.push('Required action must name the removed snap-carousel/isomorphic-fetch chain');
  }

  return errors;
};

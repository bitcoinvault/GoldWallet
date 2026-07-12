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

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isSemver = value => /^\d+\.\d+\.\d+$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value);
const requiredPeerPackages = ['@typescript-eslint/parser', '@typescript-eslint/eslint-plugin', 'ts-jest'];

const parsePeerPackageLine = line => {
  const match =
    /^(?<name>.+?): package (?<packageVersion>.*?), latest (?<latest>.*?), TypeScript peer (?<peerRange>.*?), target compatible (?<targetCompatible>yes|no)$/.exec(
      line,
    );

  return match?.groups || null;
};

const parseIsolatedPeerPackageLine = line => {
  const match = /^(?<name>.+?): installed (?<installed>.*?), TypeScript peer (?<peerRange>.*?), target compatible (?<targetCompatible>yes|no)$/.exec(
    line,
  );

  return match?.groups || null;
};

export const getTypescript7CompatibilityProbeSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const nodeVersion = getLineValue(summary, 'Node version');
  const expectedNodeVersion = getLineValue(summary, 'Expected Node version');
  const repoTypescript = getLineValue(summary, 'Repo TypeScript');
  const targetTypescript = getLineValue(summary, 'Target TypeScript');
  const targetTypescriptNodeEngine = getLineValue(summary, 'Target TypeScript Node engine');
  const targetTypescriptNodeEngineSatisfied = getLineValue(summary, 'Target TypeScript Node engine satisfied');
  const checkedPeerPackages = getLineValue(summary, 'Checked peer packages');
  const peerPackageLines = getBulletLinesAfter(summary, 'Checked peer packages');
  const isolatedLatestInstallStatus = getLineValue(summary, 'Isolated latest install status');
  const isolatedLatestInstallError = getLineValue(summary, 'Isolated latest install error');
  const isolatedLegacyPeerInstallStatus = getLineValue(summary, 'Isolated legacy-peer install status');
  const isolatedLegacyPeerInstallError = getLineValue(summary, 'Isolated legacy-peer install error');
  const isolatedInstalledTypescript = getLineValue(summary, 'Isolated installed TypeScript');
  const isolatedCheckedPeerPackages = getLineValue(summary, 'Isolated checked peer packages');
  const isolatedPeerPackageLines = getBulletLinesAfter(summary, 'Isolated checked peer packages');
  const isolatedInstallBlockers = getLineValue(summary, 'Isolated install blockers');
  const isolatedInstallBlockerLines = getBulletLinesAfter(summary, 'Isolated install blockers');
  const compatibilityBlockers = getLineValue(summary, 'Compatibility blockers');
  const compatibilityBlockerLines = getBulletLinesAfter(summary, 'Compatibility blockers');
  const packageBumpAllowed = getLineValue(summary, 'TypeScript 7 package bump allowed');
  const blockerClassification = getLineValue(summary, 'Blocker classification');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('TypeScript 7 compatibility probe')) {
    errors.push('summary header is missing or invalid');
  }

  if (!isIsoTimestamp(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!/^v\d+\.\d+\.\d+/.test(nodeVersion)) {
    errors.push(`Node version must be recorded. Received: ${nodeVersion || 'missing'}`);
  }

  if (!/^v\d+\.\d+\.\d+/.test(expectedNodeVersion)) {
    errors.push(`Expected Node version must be recorded. Received: ${expectedNodeVersion || 'missing'}`);
  } else if (nodeVersion !== expectedNodeVersion) {
    errors.push(`Node version must match the repo .nvmrc baseline. Received: ${nodeVersion || 'missing'}, expected: ${expectedNodeVersion}`);
  }

  if (repoTypescript !== '6.0.3') {
    errors.push(`Repo TypeScript must stay 6.0.3 for this guarded baseline. Received: ${repoTypescript || 'missing'}`);
  }

  if (!isSemver(targetTypescript)) {
    errors.push(`Target TypeScript must be semver. Received: ${targetTypescript || 'missing'}`);
  } else if (Number(targetTypescript.split('.')[0]) < 7) {
    errors.push(`Target TypeScript must check the TypeScript 7 line or newer. Received: ${targetTypescript}`);
  }

  if (!targetTypescriptNodeEngine || targetTypescriptNodeEngine === '<missing>') {
    errors.push('Target TypeScript Node engine must be recorded');
  }

  if (targetTypescriptNodeEngineSatisfied !== 'yes') {
    errors.push(`Target TypeScript Node engine satisfied must be yes. Received: ${targetTypescriptNodeEngineSatisfied || 'missing'}`);
  }

  if (!isNonNegativeInteger(checkedPeerPackages)) {
    errors.push(`Checked peer packages must be a non-negative integer. Received: ${checkedPeerPackages || 'missing'}`);
  } else if (Number(checkedPeerPackages) !== peerPackageLines.length) {
    errors.push(`Checked peer packages count is ${checkedPeerPackages}, but listed ${peerPackageLines.length}`);
  } else if (Number(checkedPeerPackages) !== requiredPeerPackages.length) {
    errors.push(`Checked peer packages must cover exactly ${requiredPeerPackages.length} packages. Received: ${checkedPeerPackages}`);
  }

  const parsedPeerPackages = peerPackageLines.map(parsePeerPackageLine);
  parsedPeerPackages.forEach((entry, index) => {
    if (!entry) {
      errors.push(`Peer package line is invalid: ${peerPackageLines[index]}`);
    }
  });

  const peerPackageNames = parsedPeerPackages.filter(Boolean).map(entry => entry.name);
  const duplicatePeerPackageNames = peerPackageNames.filter((name, index) => peerPackageNames.indexOf(name) !== index);
  duplicatePeerPackageNames.forEach(name => {
    errors.push(`Duplicate TypeScript 7 peer package entry for ${name}`);
  });

  peerPackageNames.forEach(name => {
    if (!requiredPeerPackages.includes(name)) {
      errors.push(`Unexpected TypeScript 7 peer package entry for ${name}`);
    }
  });

  requiredPeerPackages.forEach(name => {
    if (!peerPackageNames.includes(name)) {
      errors.push(`Missing TypeScript 7 peer package entry for ${name}`);
    }
  });

  parsedPeerPackages.filter(Boolean).forEach(entry => {
    if (!isSemver(entry.latest)) {
      errors.push(`${entry.name} latest must be semver. Received: ${entry.latest || 'missing'}`);
    }

    if (entry.targetCompatible !== 'no') {
      errors.push(`${entry.name} must remain incompatible with the TypeScript 7 target for this blocker probe`);
    }
  });

  const parserEntry = parsedPeerPackages.find(entry => entry?.name === '@typescript-eslint/parser');
  const pluginEntry = parsedPeerPackages.find(entry => entry?.name === '@typescript-eslint/eslint-plugin');
  const tsJestEntry = parsedPeerPackages.find(entry => entry?.name === 'ts-jest');

  if (!parserEntry?.peerRange.includes('<6.1.0')) {
    errors.push('@typescript-eslint/parser peer range must record the current <6.1.0 TypeScript ceiling');
  }

  if (!pluginEntry?.peerRange.includes('<6.1.0')) {
    errors.push('@typescript-eslint/eslint-plugin peer range must record the current <6.1.0 TypeScript ceiling');
  }

  if (!tsJestEntry?.peerRange.includes('<7')) {
    errors.push('ts-jest peer range must record the current <7 TypeScript ceiling');
  }

  if (isolatedLatestInstallStatus !== 'failed') {
    errors.push(`Isolated latest install status must be failed on the current tooling baseline. Received: ${isolatedLatestInstallStatus || 'missing'}`);
  }

  if (isolatedLatestInstallError !== 'ERESOLVE') {
    errors.push(`Isolated latest install error must record ERESOLVE. Received: ${isolatedLatestInstallError || 'missing'}`);
  }

  if (isolatedLegacyPeerInstallStatus !== 'ok') {
    errors.push(`Isolated legacy-peer install status must be ok for metadata inspection. Received: ${isolatedLegacyPeerInstallStatus || 'missing'}`);
  }

  if (isolatedLegacyPeerInstallError !== 'none') {
    errors.push(`Isolated legacy-peer install error must be none. Received: ${isolatedLegacyPeerInstallError || 'missing'}`);
  }

  if (isolatedInstalledTypescript !== targetTypescript) {
    errors.push(
      `Isolated installed TypeScript must match the target TypeScript. Received: ${isolatedInstalledTypescript || 'missing'}, expected: ${
        targetTypescript || 'missing'
      }`,
    );
  }

  if (!isNonNegativeInteger(isolatedCheckedPeerPackages)) {
    errors.push(`Isolated checked peer packages must be a non-negative integer. Received: ${isolatedCheckedPeerPackages || 'missing'}`);
  } else if (Number(isolatedCheckedPeerPackages) !== isolatedPeerPackageLines.length) {
    errors.push(`Isolated checked peer packages count is ${isolatedCheckedPeerPackages}, but listed ${isolatedPeerPackageLines.length}`);
  } else if (Number(isolatedCheckedPeerPackages) !== requiredPeerPackages.length) {
    errors.push(`Isolated checked peer packages must cover exactly ${requiredPeerPackages.length} packages. Received: ${isolatedCheckedPeerPackages}`);
  }

  const parsedIsolatedPeerPackages = isolatedPeerPackageLines.map(parseIsolatedPeerPackageLine);
  parsedIsolatedPeerPackages.forEach((entry, index) => {
    if (!entry) {
      errors.push(`Isolated peer package line is invalid: ${isolatedPeerPackageLines[index]}`);
    }
  });

  const isolatedPeerPackageNames = parsedIsolatedPeerPackages.filter(Boolean).map(entry => entry.name);
  requiredPeerPackages.forEach(name => {
    if (!isolatedPeerPackageNames.includes(name)) {
      errors.push(`Missing isolated TypeScript 7 peer package entry for ${name}`);
    }
  });

  parsedIsolatedPeerPackages.filter(Boolean).forEach(entry => {
    if (!isSemver(entry.installed)) {
      errors.push(`${entry.name} isolated installed version must be semver. Received: ${entry.installed || 'missing'}`);
    }

    if (entry.targetCompatible !== 'no') {
      errors.push(`${entry.name} isolated install must remain incompatible with the TypeScript 7 target for this blocker probe`);
    }
  });

  const isolatedParserEntry = parsedIsolatedPeerPackages.find(entry => entry?.name === '@typescript-eslint/parser');
  const isolatedPluginEntry = parsedIsolatedPeerPackages.find(entry => entry?.name === '@typescript-eslint/eslint-plugin');
  const isolatedTsJestEntry = parsedIsolatedPeerPackages.find(entry => entry?.name === 'ts-jest');

  if (!isolatedParserEntry?.peerRange.includes('<6.1.0')) {
    errors.push('isolated @typescript-eslint/parser peer range must record the current <6.1.0 TypeScript ceiling');
  }

  if (!isolatedPluginEntry?.peerRange.includes('<6.1.0')) {
    errors.push('isolated @typescript-eslint/eslint-plugin peer range must record the current <6.1.0 TypeScript ceiling');
  }

  if (!isolatedTsJestEntry?.peerRange.includes('<7')) {
    errors.push('isolated ts-jest peer range must record the current <7 TypeScript ceiling');
  }

  if (!isNonNegativeInteger(isolatedInstallBlockers)) {
    errors.push(`Isolated install blockers must be a non-negative integer. Received: ${isolatedInstallBlockers || 'missing'}`);
  } else if (Number(isolatedInstallBlockers) !== isolatedInstallBlockerLines.length) {
    errors.push(`Isolated install blockers count is ${isolatedInstallBlockers}, but listed ${isolatedInstallBlockerLines.length}`);
  } else if (Number(isolatedInstallBlockers) < 1) {
    errors.push('TypeScript 7 compatibility probe must report an isolated npm install blocker on the current tooling baseline');
  }

  if (!isolatedInstallBlockerLines.some(line => line.includes('normal npm install') && line.includes('ERESOLVE'))) {
    errors.push('Isolated install blockers must include the normal npm install ERESOLVE failure');
  }

  if (!isNonNegativeInteger(compatibilityBlockers)) {
    errors.push(`Compatibility blockers must be a non-negative integer. Received: ${compatibilityBlockers || 'missing'}`);
  } else if (Number(compatibilityBlockers) !== compatibilityBlockerLines.length) {
    errors.push(`Compatibility blockers count is ${compatibilityBlockers}, but listed ${compatibilityBlockerLines.length}`);
  }

  if (compatibilityBlockers === '0') {
    errors.push('TypeScript 7 compatibility probe must not report zero blockers on the current tooling baseline');
  }

  requiredPeerPackages.forEach(name => {
    if (!compatibilityBlockerLines.some(line => line.includes(name) && line.includes(`TypeScript ${targetTypescript}`))) {
      errors.push(`Compatibility blockers must include ${name} versus TypeScript ${targetTypescript || '<missing>'}`);
    }
  });

  if (packageBumpAllowed !== 'no') {
    errors.push(`TypeScript 7 package bump allowed must be no. Received: ${packageBumpAllowed || 'missing'}`);
  }

  if (blockerClassification !== 'tooling-peer-range-blocker') {
    errors.push(`Blocker classification is stale. Received: ${blockerClassification || 'missing'}`);
  }

  if (!requiredAction.includes('keep typescript pinned to 6.0.3')) {
    errors.push('Required action must keep typescript pinned to 6.0.3');
  }

  if (!requiredAction.includes('dedicated compiler/RN/Metro branch')) {
    errors.push('Required action must require a dedicated compiler/RN/Metro branch');
  }

  if (!requiredAction.includes('TypeScript check') || !requiredAction.includes('Jest') || !requiredAction.includes('lint baseline')) {
    errors.push('Required action must mention TypeScript, Jest, and lint baseline proof');
  }

  if (!requiredAction.includes('Android build') || !requiredAction.includes('emulator smoke')) {
    errors.push('Required action must mention Android build and emulator smoke proof');
  }

  return errors;
};

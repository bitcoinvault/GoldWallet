const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};

const isSemver = value => /^\d+\.\d+\.\d+$/.test(value);
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);

export const getBabel8MigrationProbeSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const reactNativeVersion = getLineValue(summary, 'React Native version');
  const rnBabelPresetVersion = getLineValue(summary, 'React Native Babel preset version');
  const repoNodeVersion = getLineValue(summary, 'Repo Node version');
  const expectedNodeVersion = getLineValue(summary, 'Expected Node version');
  const repoBabelCore = getLineValue(summary, 'Repo @babel/core');
  const repoBabelRuntime = getLineValue(summary, 'Repo @babel/runtime');
  const latestBabelCore = getLineValue(summary, 'Latest @babel/core');
  const latestBabelCli = getLineValue(summary, 'Latest @babel/cli');
  const latestBabelRuntime = getLineValue(summary, 'Latest @babel/runtime');
  const latestFlowStripTypes = getLineValue(summary, 'Latest @babel/plugin-transform-flow-strip-types');
  const latestPolyfillRegenerator = getLineValue(summary, 'Latest babel-plugin-polyfill-regenerator');
  const babel8NodeEngine = getLineValue(summary, 'Babel 8 node engine');
  const nodeEngineSatisfied = getLineValue(summary, 'Node engine satisfied');
  const rnPresetFlowStripTypesRange = getLineValue(summary, 'RN preset flow-strip-types dependency range');
  const isolatedInstallCompleted = getLineValue(summary, 'Isolated install completed');
  const transformProbeOutcome = getLineValue(summary, 'Transform probe outcome');
  const transformErrorCode = getLineValue(summary, 'Transform error code');
  const transformErrorMessage = getLineValue(summary, 'Transform error message');
  const firstPluginPath = getLineValue(summary, 'First plugin path');
  const blockerClassification = getLineValue(summary, 'Blocker classification');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Babel 8 migration probe audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!isIsoTimestamp(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (reactNativeVersion !== '0.86.0') {
    errors.push(`React Native version must stay 0.86.0 for this blocker evidence. Received: ${reactNativeVersion || 'missing'}`);
  }

  if (rnBabelPresetVersion !== '0.86.0') {
    errors.push(
      `React Native Babel preset version must stay 0.86.0 for this blocker evidence. Received: ${rnBabelPresetVersion || 'missing'}`,
    );
  }

  if (!/^v\d+\.\d+\.\d+/.test(repoNodeVersion)) {
    errors.push(`Repo Node version must be recorded. Received: ${repoNodeVersion || 'missing'}`);
  }

  if (!/^v\d+\.\d+\.\d+/.test(expectedNodeVersion)) {
    errors.push(`Expected Node version must be recorded. Received: ${expectedNodeVersion || 'missing'}`);
  } else if (repoNodeVersion !== expectedNodeVersion) {
    errors.push(
      `Repo Node version must match the repo .nvmrc baseline. Received: ${repoNodeVersion || 'missing'}, expected: ${expectedNodeVersion}`,
    );
  }

  [
    ['Repo @babel/core', repoBabelCore, '7.29.7'],
    ['Repo @babel/runtime', repoBabelRuntime, '7.29.7'],
  ].forEach(([label, actual, expected]) => {
    if (actual !== expected) {
      errors.push(`${label} must stay ${expected} while the Babel 8 blocker is active. Received: ${actual || 'missing'}`);
    }
  });

  [
    ['Latest @babel/core', latestBabelCore],
    ['Latest @babel/cli', latestBabelCli],
    ['Latest @babel/runtime', latestBabelRuntime],
    ['Latest @babel/plugin-transform-flow-strip-types', latestFlowStripTypes],
    ['Latest babel-plugin-polyfill-regenerator', latestPolyfillRegenerator],
  ].forEach(([label, actual]) => {
    if (!isSemver(actual)) {
      errors.push(`${label} must be semver. Received: ${actual || 'missing'}`);
    }
  });

  if (!latestBabelCore.startsWith('8.')) {
    errors.push(`Latest @babel/core must remain a Babel 8 target. Received: ${latestBabelCore || 'missing'}`);
  }

  if (!latestFlowStripTypes.startsWith('8.')) {
    errors.push(`Latest @babel/plugin-transform-flow-strip-types must remain a Babel 8 target. Received: ${latestFlowStripTypes || 'missing'}`);
  }

  if (!babel8NodeEngine.includes('^22.18.0') || !babel8NodeEngine.includes('>=24.11.0')) {
    errors.push(`Babel 8 node engine must document the current engine range. Received: ${babel8NodeEngine || 'missing'}`);
  }

  if (nodeEngineSatisfied !== 'yes') {
    errors.push(`Node engine satisfied must be yes so this is not misclassified as a Node blocker. Received: ${nodeEngineSatisfied || 'missing'}`);
  }

  if (!rnPresetFlowStripTypesRange.startsWith('^7.')) {
    errors.push(
      `RN preset flow-strip-types dependency range must still be Babel 7 while this blocker is active. Received: ${
        rnPresetFlowStripTypesRange || 'missing'
      }`,
    );
  }

  if (isolatedInstallCompleted !== 'yes') {
    errors.push(`Isolated install completed must be yes. Received: ${isolatedInstallCompleted || 'missing'}`);
  }

  if (transformProbeOutcome !== 'failed') {
    errors.push(`Transform probe outcome must remain failed until Babel 8 is supported. Received: ${transformProbeOutcome || 'missing'}`);
  }

  if (transformErrorCode !== 'BABEL_VERSION_UNSUPPORTED') {
    errors.push(`Transform error code must be BABEL_VERSION_UNSUPPORTED. Received: ${transformErrorCode || 'missing'}`);
  }

  if (!transformErrorMessage.includes('Requires Babel "^7.0.0-0"')) {
    errors.push(`Transform error message must include the Babel 7 requirement. Received: ${transformErrorMessage || 'missing'}`);
  }

  if (firstPluginPath !== '@babel/plugin-transform-flow-strip-types') {
    errors.push(`First plugin path must be @babel/plugin-transform-flow-strip-types. Received: ${firstPluginPath || 'missing'}`);
  }

  if (blockerClassification !== 'React Native Babel preset plugin-stack blocker') {
    errors.push(`Blocker classification is stale. Received: ${blockerClassification || 'missing'}`);
  }

  if (!requiredAction.includes('keep Babel 8 blocked on RN 0.86.0')) {
    errors.push('Required action must keep Babel 8 blocked on RN 0.86.0');
  }

  if (!requiredAction.includes('dedicated RN/Metro/Babel branch')) {
    errors.push('Required action must require a dedicated RN/Metro/Babel branch');
  }

  return errors;
};

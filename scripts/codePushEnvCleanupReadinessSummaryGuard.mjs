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

const yesNoLabels = ['CodePush removed', 'Cleanup safe through normal text diff', 'Secret values printed'];

export const getCodePushEnvCleanupReadinessSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const codePushRemoved = getLineValue(summary, 'CodePush removed');
  const trackedEnvFiles = getLineValue(summary, 'Tracked env files scanned');
  const filesWithKeys = getLineValue(summary, 'Env files carrying CodePush keys');
  const keyEntries = getLineValue(summary, 'CodePush env key entries');
  const nonEmptyDeploymentKeys = getLineValue(summary, 'Non-empty deployment key entries');
  const blankDeploymentKeys = getLineValue(summary, 'Blank deployment key entries');
  const enabledFlagEntries = getLineValue(summary, 'Enabled flag entries');
  const filesWithNonEmptyDeploymentKeys = getLineValue(summary, 'Files with non-empty deployment keys');
  const cleanupSafeThroughNormalDiff = getLineValue(summary, 'Cleanup safe through normal text diff');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const envFileLines = getBulletLinesAfter(summary, 'Env files carrying CodePush keys');
  const nonEmptyDeploymentFileLines = getBulletLinesAfter(summary, 'Files with non-empty deployment keys');

  if (!summary.startsWith('CodePush env cleanup readiness audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  yesNoLabels.forEach(label => {
    const value = getLineValue(summary, label);
    if (!['yes', 'no'].includes(value)) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  [
    ['Tracked env files scanned', trackedEnvFiles],
    ['Env files carrying CodePush keys', filesWithKeys],
    ['CodePush env key entries', keyEntries],
    ['Non-empty deployment key entries', nonEmptyDeploymentKeys],
    ['Blank deployment key entries', blankDeploymentKeys],
    ['Enabled flag entries', enabledFlagEntries],
    ['Files with non-empty deployment keys', filesWithNonEmptyDeploymentKeys],
  ].forEach(([label, value]) => {
    if (!/^\d+$/.test(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    }
  });

  if (/^\d+$/.test(filesWithKeys) && Number(filesWithKeys) !== envFileLines.length) {
    errors.push(`Env files carrying CodePush keys count is ${filesWithKeys}, but listed ${envFileLines.length}`);
  }

  if (/^\d+$/.test(filesWithNonEmptyDeploymentKeys) && Number(filesWithNonEmptyDeploymentKeys) !== nonEmptyDeploymentFileLines.length) {
    errors.push(`Files with non-empty deployment keys count is ${filesWithNonEmptyDeploymentKeys}, but listed ${nonEmptyDeploymentFileLines.length}`);
  }

  if (codePushRemoved !== 'yes') {
    errors.push('CodePush env cleanup readiness is only valid after CodePush runtime/native removal');
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('CodePush env cleanup readiness summary must not print secret values');
  }

  if (/CODEPUSH_[A-Z_]+=/.test(summary)) {
    errors.push('CodePush env cleanup readiness summary must not print key assignments');
  }

  if (Number(nonEmptyDeploymentKeys || 0) > 0 && cleanupSafeThroughNormalDiff !== 'no') {
    errors.push('Normal text diff cleanup must be no while non-empty deployment keys are still present');
  }

  if (Number(nonEmptyDeploymentKeys || 0) > 0 && !requiredAction.includes('secrets-safe cleanup')) {
    errors.push('Required action must mention secrets-safe cleanup when non-empty deployment keys are present');
  }

  if (!requiredAction.includes('do not expose historical deployment-key values') && !requiredAction.includes('does not expose historical deployment-key values')) {
    errors.push('Required action must prohibit exposing historical deployment-key values');
  }

  return errors;
};

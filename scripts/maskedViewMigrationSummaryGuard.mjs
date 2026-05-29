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

export const getMaskedViewMigrationSummaryErrors = summary => {
  const errors = [];
  const currentPackage = getLineValue(summary, 'Current masked-view package');
  const replacementPackage = getLineValue(summary, 'Replacement masked-view package');
  const navigationStackVersion = getLineValue(summary, '@react-navigation/stack version');
  const navigationRequiresCommunityPath = getLineValue(summary, 'Navigation requires community masked-view path');
  const warningBaselineMentionsMaskedView = getLineValue(summary, 'Warning baseline mentions masked-view');
  const baselineStable = getLineValue(summary, 'Masked-view migration baseline stable');
  const warningCount = getLineValue(summary, 'Warnings');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const requiredAction = summary
    .split('\n')
    .find(line => line.startsWith('Required action:'));

  if (!summary.startsWith('Masked-view migration audit')) {
    errors.push('Masked-view migration summary header is missing');
  }

  if (currentPackage !== '@react-native-community/masked-view@0.1.11') {
    errors.push(`Current masked-view package must be @react-native-community/masked-view@0.1.11. Received: ${currentPackage || 'missing'}`);
  }

  if (replacementPackage !== '@react-native-masked-view/masked-view@0.3.2') {
    errors.push(`Replacement masked-view package must be @react-native-masked-view/masked-view@0.3.2. Received: ${replacementPackage || 'missing'}`);
  }

  if (!navigationStackVersion) {
    errors.push('@react-navigation/stack version is missing');
  }

  if (!['yes', 'no'].includes(navigationRequiresCommunityPath || '')) {
    errors.push(`Navigation requires community masked-view path must be yes or no. Received: ${navigationRequiresCommunityPath || 'missing'}`);
  }

  if (!['yes', 'no'].includes(warningBaselineMentionsMaskedView || '')) {
    errors.push(`Warning baseline mentions masked-view must be yes or no. Received: ${warningBaselineMentionsMaskedView || 'missing'}`);
  }

  if (!['yes', 'no'].includes(baselineStable || '')) {
    errors.push(`Masked-view migration baseline stable must be yes or no. Received: ${baselineStable || 'missing'}`);
  }

  if (Number(warningCount) !== warningLines.length) {
    errors.push(`Warnings count must be ${warningLines.length}. Received: ${warningCount || 'missing'}`);
  }

  if (baselineStable === 'yes' && !requiredAction?.includes('none; masked-view migration baseline is stable')) {
    errors.push('Stable baseline summary must include the no-action masked-view required action');
  }

  if (baselineStable === 'no' && !requiredAction?.includes('restore masked-view migration baseline')) {
    errors.push('Unstable baseline summary must include the masked-view restoration required action');
  }

  return errors;
};

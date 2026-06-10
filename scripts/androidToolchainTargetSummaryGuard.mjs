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

export const getAndroidToolchainTargetSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const currentAgp = getLineValue(summary, 'Current Android Gradle Plugin');
  const latestStableAgp = getLineValue(summary, 'Latest stable Android Gradle Plugin');
  const currentGradle = getLineValue(summary, 'Current Gradle wrapper');
  const latestGradle = getLineValue(summary, 'Latest Gradle current');
  const minimumAgp9Gradle = getLineValue(summary, 'AGP 9 minimum Gradle wrapper');
  const currentKotlin = getLineValue(summary, 'Current Kotlin Gradle Plugin');
  const latestKotlin = getLineValue(summary, 'Latest Kotlin Gradle Plugin');
  const rnGradlePlugin = getLineValue(summary, 'React Native Gradle plugin');
  const targetBlocked = getLineValue(summary, 'Latest Android toolchain target blocked');
  const blockerCount = getLineValue(summary, 'Blockers');
  const blockerLines = getBulletLinesAfter(summary, 'Blockers');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Android toolchain target audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  [
    ['Current Android Gradle Plugin', currentAgp],
    ['Latest stable Android Gradle Plugin', latestStableAgp],
    ['Current Gradle wrapper', currentGradle],
    ['Latest Gradle current', latestGradle],
    ['AGP 9 minimum Gradle wrapper', minimumAgp9Gradle],
    ['Current Kotlin Gradle Plugin', currentKotlin],
    ['Latest Kotlin Gradle Plugin', latestKotlin],
    ['React Native Gradle plugin', rnGradlePlugin],
  ].forEach(([label, value]) => {
    if (!/^\d+\.\d+(?:\.\d+)?/.test(value)) {
      errors.push(`${label} must be a semver-like version. Received: ${value || 'missing'}`);
    }
  });

  if (currentAgp !== '8.13.2') {
    errors.push(`Current Android Gradle Plugin must remain 8.13.2 until the AGP 9 blocker is cleared. Received: ${currentAgp || 'missing'}`);
  }

  if (currentGradle !== '8.13') {
    errors.push(`Current Gradle wrapper must remain 8.13 until the AGP 9 blocker is cleared. Received: ${currentGradle || 'missing'}`);
  }

  if (currentKotlin !== '2.1.20') {
    errors.push(`Current Kotlin Gradle Plugin must remain 2.1.20 until the AGP 9 blocker is cleared. Received: ${currentKotlin || 'missing'}`);
  }

  if (rnGradlePlugin !== '0.86.0') {
    errors.push(`React Native Gradle plugin must match the RN 0.86.0 baseline. Received: ${rnGradlePlugin || 'missing'}`);
  }

  if (targetBlocked !== 'yes') {
    errors.push(`Latest Android toolchain target must stay blocked for this RN 0.86.0 baseline. Received: ${targetBlocked || 'missing'}`);
  }

  if (!/^\d+$/.test(blockerCount)) {
    errors.push(`Blockers must be a non-negative integer. Received: ${blockerCount || 'missing'}`);
  } else if (Number(blockerCount) !== blockerLines.length) {
    errors.push(`Blockers count is ${blockerCount}, but listed ${blockerLines.length}`);
  }

  if (!blockerLines.some(line => line.includes('Kotlin') && line.includes('metadata') && line.includes('React Native Gradle plugin'))) {
    errors.push('Blockers must mention the React Native Gradle plugin Kotlin metadata incompatibility');
  }

  if (!requiredAction.includes('React Native Gradle plugin') || !requiredAction.includes('AGP 9')) {
    errors.push('Required action must mention React Native Gradle plugin and AGP 9');
  }

  return errors;
};

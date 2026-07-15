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
  const kotlinMetadataRelease = getLineValue(summary, 'Latest Kotlin metadata release');
  const kotlinMetadataReleasePrerelease = getLineValue(summary, 'Latest Kotlin metadata release prerelease');
  const rnGradlePlugin = getLineValue(summary, 'React Native Gradle plugin');
  const directProbeAgp = getLineValue(summary, 'Direct AGP 9 probe Android Gradle Plugin');
  const directProbeGradle = getLineValue(summary, 'Direct AGP 9 probe Gradle wrapper');
  const directProbeKotlin = getLineValue(summary, 'Direct AGP 9 probe Kotlin Gradle Plugin');
  const directProbeJdk = getLineValue(summary, 'Direct AGP 9 probe JDK');
  const directProbeStatus = getLineValue(summary, 'Direct AGP 9 probe status');
  const directProbeTask = getLineValue(summary, 'Direct AGP 9 probe task');
  const directProbeSource = getLineValue(summary, 'Direct AGP 9 probe source');
  const directProbeKotlinRuntimeMetadata = getLineValue(summary, 'Direct AGP 9 probe Kotlin runtime metadata');
  const rnKotlinMetadataCeiling = getLineValue(summary, 'React Native Gradle plugin Kotlin metadata ceiling');
  const directProbeEvidence = getLineValue(summary, 'Direct AGP 9 probe evidence');
  const directProbeEvidenceStatus = getLineValue(summary, 'Direct AGP 9 probe evidence status');
  const directProbeEvidenceRequiredSnippets = getLineValue(summary, 'Direct AGP 9 probe evidence required snippets');
  const directProbeEvidenceRequiredSnippetLines = getBulletLinesAfter(summary, 'Direct AGP 9 probe evidence required snippets');
  const directProbeEvidenceMissingSnippets = getLineValue(summary, 'Direct AGP 9 probe evidence missing snippets');
  const directProbeEvidenceMissingSnippetLines = getBulletLinesAfter(summary, 'Direct AGP 9 probe evidence missing snippets');
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
    ['Direct AGP 9 probe Android Gradle Plugin', directProbeAgp],
    ['Direct AGP 9 probe Gradle wrapper', directProbeGradle],
    ['Direct AGP 9 probe Kotlin Gradle Plugin', directProbeKotlin],
  ].forEach(([label, value]) => {
    if (!/^\d+\.\d+(?:\.\d+)?/.test(value)) {
      errors.push(`${label} must be a semver-like version. Received: ${value || 'missing'}`);
    }
  });

  if (!/^\d+\.\d+(?:\.\d+)?/.test(kotlinMetadataRelease)) {
    errors.push(`Latest Kotlin metadata release must be a semver-like version. Received: ${kotlinMetadataRelease || 'missing'}`);
  }

  if (/[A-Za-z]/.test(latestKotlin)) {
    errors.push(`Latest Kotlin Gradle Plugin must be the latest stable target, not a prerelease. Received: ${latestKotlin || 'missing'}`);
  }

  if (!['yes', 'no'].includes(kotlinMetadataReleasePrerelease)) {
    errors.push(`Latest Kotlin metadata release prerelease must be yes or no. Received: ${kotlinMetadataReleasePrerelease || 'missing'}`);
  }

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

  if (directProbeAgp !== latestStableAgp) {
    errors.push(`Direct AGP 9 probe must cover the latest stable AGP value. Expected ${latestStableAgp || 'missing'}, received ${directProbeAgp || 'missing'}`);
  }

  if (directProbeGradle !== latestGradle) {
    errors.push(`Direct AGP 9 probe must cover the current latest Gradle value. Expected ${latestGradle || 'missing'}, received ${directProbeGradle || 'missing'}`);
  }

  if (directProbeKotlin !== latestKotlin) {
    errors.push(`Direct AGP 9 probe must cover the latest stable Kotlin target. Expected ${latestKotlin || 'missing'}, received ${directProbeKotlin || 'missing'}`);
  }

  if (directProbeJdk !== '17') {
    errors.push(`Direct AGP 9 probe must use JDK 17. Received: ${directProbeJdk || 'missing'}`);
  }

  if (directProbeStatus !== 'blocked') {
    errors.push(`Direct AGP 9 probe status must be blocked. Received: ${directProbeStatus || 'missing'}`);
  }

  if (!directProbeTask.includes(':gradle-plugin:settings-plugin:compileKotlin')) {
    errors.push(`Direct AGP 9 probe task must identify the RN Gradle plugin compileKotlin failure. Received: ${directProbeTask || 'missing'}`);
  }

  if (!directProbeSource.includes('@react-native/gradle-plugin') || !directProbeSource.endsWith('ReactSettingsExtension.kt')) {
    errors.push(`Direct AGP 9 probe source must identify ReactSettingsExtension.kt in the RN Gradle plugin. Received: ${directProbeSource || 'missing'}`);
  }

  if (!/^\d+\.\d+(?:\.\d+)?/.test(directProbeKotlinRuntimeMetadata)) {
    errors.push(`Direct AGP 9 probe Kotlin runtime metadata must be a semver-like version. Received: ${directProbeKotlinRuntimeMetadata || 'missing'}`);
  }

  if (!/^\d+\.\d+(?:\.\d+)?/.test(rnKotlinMetadataCeiling)) {
    errors.push(`React Native Gradle plugin Kotlin metadata ceiling must be a semver-like version. Received: ${rnKotlinMetadataCeiling || 'missing'}`);
  }

  if (!directProbeEvidence.includes('docs/wallet-modernization-log.md') || !directProbeEvidence.includes('BEM-37.900')) {
    errors.push(`Direct AGP 9 probe evidence must point to the committed BEM-37.900 log entry. Received: ${directProbeEvidence || 'missing'}`);
  }

  if (directProbeEvidenceStatus !== 'committed') {
    errors.push(`Direct AGP 9 probe evidence status must be committed. Received: ${directProbeEvidenceStatus || 'missing'}`);
  }

  if (!/^\d+$/.test(directProbeEvidenceRequiredSnippets)) {
    errors.push(`Direct AGP 9 probe evidence required snippets must be a non-negative integer. Received: ${directProbeEvidenceRequiredSnippets || 'missing'}`);
  } else if (Number(directProbeEvidenceRequiredSnippets) !== directProbeEvidenceRequiredSnippetLines.length) {
    errors.push(
      `Direct AGP 9 probe evidence required snippets count is ${directProbeEvidenceRequiredSnippets}, but listed ${directProbeEvidenceRequiredSnippetLines.length}`,
    );
  } else if (Number(directProbeEvidenceRequiredSnippets) < 8) {
    errors.push('Direct AGP 9 probe evidence must require the live tuple, failure task, metadata mismatch, and current baseline snippets');
  }

  if (!/^\d+$/.test(directProbeEvidenceMissingSnippets)) {
    errors.push(`Direct AGP 9 probe evidence missing snippets must be a non-negative integer. Received: ${directProbeEvidenceMissingSnippets || 'missing'}`);
  } else if (Number(directProbeEvidenceMissingSnippets) !== directProbeEvidenceMissingSnippetLines.length) {
    errors.push(
      `Direct AGP 9 probe evidence missing snippets count is ${directProbeEvidenceMissingSnippets}, but listed ${directProbeEvidenceMissingSnippetLines.length}`,
    );
  } else if (Number(directProbeEvidenceMissingSnippets) !== 0) {
    errors.push('Direct AGP 9 probe evidence must not have missing snippets');
  }

  [
    `AGP \`${directProbeAgp}\``,
    `Gradle \`${directProbeGradle}\``,
    `Kotlin \`${directProbeKotlin}\``,
    directProbeTask,
    'Kotlin metadata `2.3.0`',
    'up to `2.2.0`',
    `AGP \`${currentAgp}\`, Gradle \`${currentGradle}\`, and Kotlin \`${currentKotlin}\``,
  ].forEach(snippet => {
    if (!directProbeEvidenceRequiredSnippetLines.includes(snippet)) {
      errors.push(`Direct AGP 9 probe evidence required snippets must include "${snippet}"`);
    }
  });

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

  if (!blockerLines.some(line => line.startsWith(`AGP ${latestStableAgp} requires Gradle ${minimumAgp9Gradle}`))) {
    errors.push('Blockers must tie the latest stable AGP value to the AGP 9 minimum Gradle wrapper');
  }

  if (
    !blockerLines.some(
      line =>
        line.includes(`Gradle ${minimumAgp9Gradle}`) &&
        line.includes(directProbeGradle) &&
        line.includes(`React Native Gradle plugin ${rnGradlePlugin}`),
    )
  ) {
    errors.push('Blockers must tie the current latest Gradle value to the React Native Gradle plugin blocker');
  }

  if (!blockerLines.some(line => line.includes(`AGP ${currentAgp}`) && line.includes(`Gradle ${currentGradle}`) && line.includes(`Kotlin ${currentKotlin}`))) {
    errors.push('Blockers must state the validated current AGP, Gradle, and Kotlin baseline');
  }

  if (
    !blockerLines.some(
      line =>
        line.includes(directProbeTask) &&
        line.includes(directProbeSource) &&
        line.includes(`metadata ${directProbeKotlinRuntimeMetadata}`) &&
        line.includes(`metadata ${rnKotlinMetadataCeiling}`),
    )
  ) {
    errors.push('Blockers must include the direct AGP 9 probe failure task, source, and Kotlin metadata evidence');
  }

  if (!requiredAction.includes('React Native Gradle plugin') || !requiredAction.includes('AGP 9')) {
    errors.push('Required action must mention React Native Gradle plugin and AGP 9');
  }

  return errors;
};

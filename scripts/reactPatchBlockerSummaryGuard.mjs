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

const isSemver = value => /^\d+\.\d+\.\d+$/.test(value);
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);

export const getReactPatchBlockerSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const reactNativeVersion = getLineValue(summary, 'React Native version');
  const repoReact = getLineValue(summary, 'Repo react');
  const repoReactTestRenderer = getLineValue(summary, 'Repo react-test-renderer');
  const repoReactTypes = getLineValue(summary, 'Repo @types/react');
  const targetReactPeer = getLineValue(summary, 'RN target React peer');
  const latestReact = getLineValue(summary, 'Latest react');
  const latestReactTestRenderer = getLineValue(summary, 'Latest react-test-renderer');
  const latestReactTestRendererPeer = getLineValue(summary, 'Latest react-test-renderer React peer');
  const latestReactTypes = getLineValue(summary, 'Latest @types/react');
  const rendererImplementationFiles = getLineValue(summary, 'Renderer implementation files');
  const rendererVersions = getLineValue(summary, 'Renderer versions');
  const rendererExactCheckVersions = getLineValue(summary, 'Renderer exact-check versions');
  const expectedReactFromRenderer = getLineValue(summary, 'Expected React from renderer');
  const candidateReact = getLineValue(summary, 'Candidate react patch');
  const candidateReactTestRenderer = getLineValue(summary, 'Candidate react-test-renderer patch');
  const candidateReactTypes = getLineValue(summary, 'Candidate @types/react patch');
  const candidateRendererCompatibilityErrors = getLineValue(summary, 'Candidate renderer compatibility errors');
  const candidateRendererCompatibilityErrorLines = getBulletLinesAfter(summary, 'Candidate renderer compatibility errors');
  const packageOnlyPatchSafe = getLineValue(summary, 'Package-only latest React patch safe');
  const blockerClassification = getLineValue(summary, 'Blocker classification');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('React patch blocker audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!isIsoTimestamp(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  [
    ['React Native version', reactNativeVersion, '0.87.0'],
    ['Repo react', repoReact, '19.2.3'],
    ['Repo react-test-renderer', repoReactTestRenderer, '19.2.3'],
    ['Repo @types/react', repoReactTypes, '19.2.17'],
    ['RN target React peer', targetReactPeer, '^19.2.3'],
    ['Expected React from renderer', expectedReactFromRenderer, '19.2.3'],
  ].forEach(([label, actual, expected]) => {
    if (actual !== expected) {
      errors.push(`${label} must stay ${expected} for this RN renderer baseline. Received: ${actual || 'missing'}`);
    }
  });

  [
    ['Latest react', latestReact],
    ['Latest react-test-renderer', latestReactTestRenderer],
    ['Latest @types/react', latestReactTypes],
  ].forEach(([label, actual]) => {
    if (!isSemver(actual)) {
      errors.push(`${label} must be semver. Received: ${actual || 'missing'}`);
    }
  });

  if (!latestReact.startsWith('19.2.') || latestReact === repoReact) {
    errors.push(`Latest react must remain a blocked 19.2.x patch above ${repoReact}. Received: ${latestReact || 'missing'}`);
  }

  if (latestReactTestRenderer !== latestReact) {
    errors.push(`Latest react-test-renderer must match latest react. Received: ${latestReactTestRenderer || 'missing'} vs ${latestReact || 'missing'}`);
  }

  if (!latestReactTestRendererPeer.includes(latestReact)) {
    errors.push(
      `Latest react-test-renderer React peer must reference latest react ${latestReact || 'missing'}. Received: ${
        latestReactTestRendererPeer || 'missing'
      }`,
    );
  }

  if (!/^\d+$/.test(rendererImplementationFiles) || Number(rendererImplementationFiles) <= 0) {
    errors.push(`Renderer implementation files must be a positive integer. Received: ${rendererImplementationFiles || 'missing'}`);
  }

  if (rendererVersions !== '19.2.3') {
    errors.push(`Renderer versions must stay 19.2.3. Received: ${rendererVersions || 'missing'}`);
  }

  if (rendererExactCheckVersions !== '<missing>' && rendererExactCheckVersions !== '19.2.3') {
    errors.push(`Renderer exact-check versions must be missing or 19.2.3. Received: ${rendererExactCheckVersions || 'missing'}`);
  }

  if (candidateReact !== latestReact) {
    errors.push(`Candidate react patch must match latest react. Received: ${candidateReact || 'missing'} vs ${latestReact || 'missing'}`);
  }

  if (candidateReactTestRenderer !== latestReactTestRenderer) {
    errors.push(
      `Candidate react-test-renderer patch must match latest react-test-renderer. Received: ${
        candidateReactTestRenderer || 'missing'
      } vs ${latestReactTestRenderer || 'missing'}`,
    );
  }

  if (candidateReactTypes !== latestReactTypes) {
    errors.push(`Candidate @types/react patch must match latest @types/react. Received: ${candidateReactTypes || 'missing'} vs ${latestReactTypes || 'missing'}`);
  }

  if (!/^\d+$/.test(candidateRendererCompatibilityErrors)) {
    errors.push(`Candidate renderer compatibility errors must be a non-negative integer. Received: ${candidateRendererCompatibilityErrors || 'missing'}`);
  } else if (Number(candidateRendererCompatibilityErrors) !== candidateRendererCompatibilityErrorLines.length) {
    errors.push(
      `Candidate renderer compatibility errors count is ${candidateRendererCompatibilityErrors}, but listed ${candidateRendererCompatibilityErrorLines.length}`,
    );
  }

  if (packageOnlyPatchSafe !== 'no') {
    errors.push(`Package-only latest React patch safe must be no. Received: ${packageOnlyPatchSafe || 'missing'}`);
  }

  if (packageOnlyPatchSafe === 'no' && Number(candidateRendererCompatibilityErrors) === 0) {
    errors.push('Blocked package-only React patch summary must list at least one candidate renderer compatibility error');
  }

  if (
    packageOnlyPatchSafe === 'no' &&
    !candidateRendererCompatibilityErrorLines.some(line => line.includes(`React package version ${latestReact}`) && line.includes('React Native renderer exact version 19.2.3'))
  ) {
    errors.push('Candidate renderer compatibility errors must include the latest React versus RN renderer exact-version mismatch');
  }

  if (blockerClassification !== 'React Native renderer exact-version blocker') {
    errors.push(`Blocker classification is stale. Received: ${blockerClassification || 'missing'}`);
  }

  if (!requiredAction.includes('keep react and react-test-renderer pinned to 19.2.3')) {
    errors.push('Required action must keep react and react-test-renderer pinned to 19.2.3');
  }

  if (!requiredAction.includes('dedicated React Native renderer baseline branch')) {
    errors.push('Required action must require a dedicated React Native renderer baseline branch');
  }

  return errors;
};

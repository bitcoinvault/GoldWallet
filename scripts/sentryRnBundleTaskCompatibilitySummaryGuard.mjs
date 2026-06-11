const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

export const getSentryRnBundleTaskCompatibilitySummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const compatibilityReady = getLineValue(summary, 'Sentry RN bundle task compatibility ready');
  const sentryVersion = getLineValue(summary, '@sentry/react-native version');
  const reactNativeVersion = getLineValue(summary, 'react-native version');
  const sentryExpectsDirectory = getLineValue(summary, 'Sentry expects jsIntermediateSourceMapsDir Directory');
  const rnUsesRegularFile = getLineValue(summary, 'RN BundleHermesCTask jsIntermediateSourceMapsDir type');
  const sentryFallbackRequiresArgs = getLineValue(summary, 'Sentry fallback requires args property');
  const rnExposesArgs = getLineValue(summary, 'RN BundleHermesCTask exposes args property');
  const repoSetsLegacyArgsShim = getLineValue(summary, 'Repo sets legacy args shim');
  const repoWorkaroundSafe = getLineValue(summary, 'Repo-owned args workaround safe');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Sentry RN bundle task compatibility audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!sentryVersion) {
    errors.push('@sentry/react-native version is missing');
  }

  if (!reactNativeVersion) {
    errors.push('react-native version is missing');
  }

  [
    ['Sentry RN bundle task compatibility ready', compatibilityReady],
    ['Sentry expects jsIntermediateSourceMapsDir Directory', sentryExpectsDirectory],
    ['Sentry fallback requires args property', sentryFallbackRequiresArgs],
    ['RN BundleHermesCTask exposes args property', rnExposesArgs],
    ['Repo sets legacy args shim', repoSetsLegacyArgsShim],
    ['Repo-owned args workaround safe', repoWorkaroundSafe],
  ].forEach(([label, value]) => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  if (rnUsesRegularFile !== 'RegularFileProperty') {
    errors.push(`RN BundleHermesCTask jsIntermediateSourceMapsDir type must be RegularFileProperty. Received: ${rnUsesRegularFile || 'missing'}`);
  }

  if (compatibilityReady === 'yes' && requiredAction !== 'none') {
    errors.push('Ready compatibility summary must have Required action: none');
  }

  if (compatibilityReady === 'yes' && rnExposesArgs !== 'yes' && repoSetsLegacyArgsShim !== 'yes') {
    errors.push('Ready compatibility summary must prove RN exposes args or the repo sets the legacy args shim');
  }

  if (compatibilityReady === 'no' && !requiredAction.includes('upstream Sentry/RN Gradle compatibility fix')) {
    errors.push('Not-ready compatibility summary must require an upstream Sentry/RN Gradle compatibility fix or credentialed proof');
  }

  return errors;
};

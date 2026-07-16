const artifactMarkers = [
  'appcenter-config.json',
  'appCenterCrashes_whenToSendCrashes',
  'appCenterAnalytics_whenToEnableAnalytics',
  'com.microsoft.appcenter',
];

export const getAppCenterReleaseArtifactErrors = variantArtifacts => {
  const errors = [];

  for (const [variant, artifact] of Object.entries(variantArtifacts)) {
    const combinedOutput = `${artifact.files || ''}\n${artifact.resources || ''}`;
    const markers = artifactMarkers.filter(marker => combinedOutput.toLowerCase().includes(marker.toLowerCase()));
    if (markers.length > 0) {
      errors.push(`Variant ${variant} release APK contains retired App Center artifact marker(s): ${markers.join(', ')}`);
    }
  }

  return errors;
};

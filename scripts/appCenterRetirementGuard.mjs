const forbiddenDependencyPattern = /(?:^|[-/])appcenter(?:$|[-/])|^react-native-code-push$/i;
const forbiddenPaths = ['appcenter-config.json', 'appcenter-config.plist'];
const forbiddenContentMarkers = [
  'appCenterCrashes_whenToSendCrashes',
  'appCenterAnalytics_whenToEnableAnalytics',
  'AppCenter-Config.plist',
  'appcenter-config.json',
  '"app_secret"',
  '<key>AppSecret</key>',
];

export const getAppCenterRetirementErrors = ({ dependencyNames, trackedFiles, trackedFileContents }) => {
  const errors = [];

  for (const dependencyName of dependencyNames) {
    if (forbiddenDependencyPattern.test(dependencyName)) {
      errors.push(`Retired App Center dependency remains: ${dependencyName}`);
    }
  }

  for (const trackedFile of trackedFiles) {
    const normalizedPath = trackedFile.replace(/\\/g, '/').toLowerCase();
    const forbiddenPath = forbiddenPaths.find(candidate => normalizedPath.endsWith(candidate));
    if (forbiddenPath) {
      errors.push(`Retired App Center configuration remains tracked: ${trackedFile} (${forbiddenPath})`);
    }
  }

  for (const [filePath, content] of Object.entries(trackedFileContents)) {
    const markers = forbiddenContentMarkers.filter(marker => content.includes(marker));
    if (markers.length > 0) {
      errors.push(`Retired App Center marker(s) remain in ${filePath}: ${markers.join(', ')}`);
    }
  }

  return errors;
};

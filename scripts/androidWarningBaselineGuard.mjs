export const expectedFindingPatterns = [
  {
    label: 'Sentry execResult',
    pattern: /^execResult: .*node_modules[\\/]@sentry[\\/]react-native[\\/]sentry\.gradle:48\)/,
  },
  {
    label: 'react-native-camera jcenter',
    pattern: /^jcenter\(\): .*node_modules[\\/]react-native-camera[\\/]android[\\/]build\.gradle:59\)/,
  },
];

export const isExpectedAndroidWarningFinding = finding =>
  expectedFindingPatterns.some(({ pattern }) => pattern.test(finding));

export const getUnexpectedAndroidWarningFindings = findings =>
  findings.filter(finding => !isExpectedAndroidWarningFinding(finding));

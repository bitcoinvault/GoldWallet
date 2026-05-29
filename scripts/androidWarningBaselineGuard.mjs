export const expectedFindingPatterns = [
  {
    label: 'react-native-secure-key-store jcenter',
    pattern: /^jcenter\(\): .*node_modules[\\/]react-native-secure-key-store[\\/]android[\\/]build\.gradle:46\)/,
  },
];

export const isExpectedAndroidWarningFinding = finding =>
  expectedFindingPatterns.some(({ pattern }) => pattern.test(finding));

export const getUnexpectedAndroidWarningFindings = findings =>
  findings.filter(finding => !isExpectedAndroidWarningFinding(finding));

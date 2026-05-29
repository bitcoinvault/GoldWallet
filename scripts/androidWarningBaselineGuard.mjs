export const expectedFindingPatterns = [
  {
    label: '@react-native-community/masked-view jcenter',
    pattern: /^jcenter\(\): .*node_modules[\\/]@react-native-community[\\/]masked-view[\\/]android[\\/]build\.gradle:47\)/,
  },
  {
    label: '@react-native-community/slider jcenter root',
    pattern: /^jcenter\(\): .*node_modules[\\/]@react-native-community[\\/]slider[\\/]android[\\/]build\.gradle:4\)/,
  },
  {
    label: '@react-native-community/slider jcenter buildscript',
    pattern: /^jcenter\(\): .*node_modules[\\/]@react-native-community[\\/]slider[\\/]android[\\/]build\.gradle:34\)/,
  },
  {
    label: 'react-native-camera jcenter',
    pattern: /^jcenter\(\): .*node_modules[\\/]react-native-camera[\\/]android[\\/]build\.gradle:59\)/,
  },
  {
    label: '@react-native-community/toolbar-android jcenter',
    pattern: /^jcenter\(\): .*node_modules[\\/]@react-native-community[\\/]toolbar-android[\\/]android[\\/]build\.gradle:5\)/,
  },
  {
    label: 'react-native-localize jcenter',
    pattern: /^jcenter\(\): .*node_modules[\\/]react-native-localize[\\/]android[\\/]build\.gradle:45\)/,
  },
  {
    label: 'react-native-vector-icons jcenter',
    pattern: /^jcenter\(\): .*node_modules[\\/]react-native-vector-icons[\\/]android[\\/]build\.gradle:41\)/,
  },
  {
    label: 'react-native-device-info jcenter',
    pattern: /^jcenter\(\): .*node_modules[\\/]react-native-device-info[\\/]android[\\/]build\.gradle:46\)/,
  },
  {
    label: 'react-native-secure-key-store jcenter',
    pattern: /^jcenter\(\): .*node_modules[\\/]react-native-secure-key-store[\\/]android[\\/]build\.gradle:46\)/,
  },
];

export const isExpectedAndroidWarningFinding = finding =>
  expectedFindingPatterns.some(({ pattern }) => pattern.test(finding));

export const getUnexpectedAndroidWarningFindings = findings =>
  findings.filter(finding => !isExpectedAndroidWarningFinding(finding));

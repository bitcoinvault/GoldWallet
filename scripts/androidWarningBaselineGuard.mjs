export const expectedFindingPatterns = [];

export const isExpectedAndroidWarningFinding = finding =>
  expectedFindingPatterns.some(({ pattern }) => pattern.test(finding));

export const getUnexpectedAndroidWarningFindings = findings =>
  findings.filter(finding => !isExpectedAndroidWarningFinding(finding));

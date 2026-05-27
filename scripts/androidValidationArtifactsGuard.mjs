import { getUnexpectedAndroidWarningFindings } from './androidWarningBaselineGuard.mjs';

export const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

export const getWarningFindingsFromSummary = warningSummary =>
  warningSummary
    .split(/\r?\n/)
    .filter(line => line.startsWith('- '))
    .map(line => line.slice(2));

export const getWarningSummarySourceErrors = warningSummary => {
  const warningFindings = getWarningFindingsFromSummary(warningSummary);
  const targetedWarningCount = getLineValue(warningSummary, 'Targeted Android Gradle warnings');
  const errors = [];

  if (!/^\d+$/.test(targetedWarningCount)) {
    errors.push(`Targeted Android Gradle warnings must be a non-negative integer. Received: ${targetedWarningCount || 'missing'}`);
  } else if (Number(targetedWarningCount) !== warningFindings.length) {
    errors.push(`Targeted Android Gradle warnings must be ${warningFindings.length}. Received: ${targetedWarningCount}`);
  }

  const unexpectedWarningFindings = getUnexpectedAndroidWarningFindings(warningFindings);

  if (unexpectedWarningFindings.length > 0) {
    errors.push(
      `Unexpected targeted Android warning source(s) in validation summary:\n${unexpectedWarningFindings
        .map(finding => `- ${finding}`)
        .join('\n')}`,
    );
  }

  return errors;
};

export const assertWarningSummarySources = warningSummary => {
  const errors = getWarningSummarySourceErrors(warningSummary);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
};

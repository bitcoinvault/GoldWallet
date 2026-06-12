const header = 'CodePush env cleanup plan';
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const codePushAssignmentPattern = /^CODEPUSH_[A-Z_]+=.+/m;

const parseCount = (summary, label) => {
  const match = summary.match(new RegExp(`^${label}: (\\d+)$`, 'm'));
  return match ? Number(match[1]) : null;
};

export const getCodePushEnvCleanupPlanErrors = plan => {
  const errors = [];
  const lines = plan.split(/\r?\n/);

  if (lines[0] !== header) {
    errors.push('Missing CodePush env cleanup plan header.');
  }

  const generatedAt = lines.find(line => line.startsWith('Generated at: '));
  if (!generatedAt || !isoTimestampPattern.test(generatedAt.replace('Generated at: ', ''))) {
    errors.push('Generated at must be an ISO timestamp.');
  }

  if (!plan.includes('CodePush removed: yes')) {
    errors.push('Plan is only valid after CodePush runtime/native removal.');
  }

  if (!plan.includes('Secret values printed: no')) {
    errors.push('Plan must explicitly state that secret values were not printed.');
  }

  if (codePushAssignmentPattern.test(plan)) {
    errors.push('Plan must not contain CODEPUSH key assignments or secret values.');
  }

  const filesNeedingCleanup = parseCount(plan, 'Files needing cleanup');
  const listedFiles = lines.filter(line => line.startsWith('File: ')).length;
  if (filesNeedingCleanup === null) {
    errors.push('Files needing cleanup count is missing.');
  } else if (filesNeedingCleanup !== listedFiles) {
    errors.push(`Files needing cleanup count is ${filesNeedingCleanup}, but ${listedFiles} file sections were listed.`);
  }

  const nonEmptyDeploymentKeys = parseCount(plan, 'Non-empty deployment key entries');
  if (nonEmptyDeploymentKeys === null) {
    errors.push('Non-empty deployment key entries count is missing.');
  } else if (
    nonEmptyDeploymentKeys > 0 &&
    !plan.includes('Secure env regeneration required: yes') &&
    !plan.includes('secrets-safe cleanup or secure env regeneration')
  ) {
    errors.push('Plans with non-empty deployment keys must require secrets-safe cleanup or secure env regeneration.');
  }

  if (!plan.includes('Normal text diff cleanup allowed: no') && !plan.includes('Normal text diff cleanup allowed: yes')) {
    errors.push('Normal text diff cleanup decision is missing.');
  }

  if (!plan.includes('Review-safe evidence: file paths and key names only')) {
    errors.push('Plan must state that review-safe evidence is limited to file paths and key names.');
  }

  return errors;
};

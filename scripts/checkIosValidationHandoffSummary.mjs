import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getIosValidationHandoffSummaryErrors } from './iosValidationHandoffSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const relativeSummaryPath = path.join('local-docs', 'ios-validation-handoff-summary.txt');

export const getIosValidationHandoffSummaryArtifactErrors = ({ rootPath = root } = {}) => {
  const summaryPath = path.join(rootPath, relativeSummaryPath);

  if (!existsSync(summaryPath)) {
    return [`iOS validation handoff summary artifact is missing at ${relativeSummaryPath}`];
  }

  return getIosValidationHandoffSummaryErrors(readFileSync(summaryPath, 'utf8'));
};

const main = () => {
  const errors = getIosValidationHandoffSummaryArtifactErrors();

  if (errors.length > 0) {
    console.error('iOS validation handoff summary artifact is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  console.log('iOS validation handoff summary artifact is valid.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}

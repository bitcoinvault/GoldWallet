import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidNativePathBudget, getAndroidNativePathBudgetError } from './androidNativePathBudget.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const budget = getAndroidNativePathBudget({ rootPath: root });
const error = getAndroidNativePathBudgetError(budget);

if (error) {
  console.error(error);
  process.exit(1);
}

if (budget.applies) {
  console.log(
    `Android Windows native path budget passed (${budget.longestCandidate.candidateLength}/${budget.pathLimit} characters; checkout root ${budget.rootLength}/${budget.maximumRootLength}).`,
  );
}

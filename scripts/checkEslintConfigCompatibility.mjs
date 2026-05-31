import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const eslintConfig = JSON.parse(readFileSync(path.join(root, '.eslintrc'), 'utf8'));
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const rules = eslintConfig.rules || {};
const devDependencies = packageJson.devDependencies || {};
const errors = [];

const requireRuleValue = (ruleName, expectedValue) => {
  if (rules[ruleName] !== expectedValue) {
    errors.push(`${ruleName} must be ${JSON.stringify(expectedValue)} for the current lint baseline`);
  }
};

if (devDependencies['@typescript-eslint/eslint-plugin'] !== '8.60.0') {
  errors.push(
    `@typescript-eslint/eslint-plugin must stay on 8.60.0 for this compatibility guard. Found ${
      devDependencies['@typescript-eslint/eslint-plugin'] || '<missing>'
    }`,
  );
}

if (devDependencies['@typescript-eslint/parser'] !== '8.60.0') {
  errors.push(
    `@typescript-eslint/parser must stay on 8.60.0 for this compatibility guard. Found ${devDependencies['@typescript-eslint/parser'] || '<missing>'}`,
  );
}

if (Object.prototype.hasOwnProperty.call(rules, '@typescript-eslint/ban-types')) {
  errors.push('@typescript-eslint/ban-types was removed in typescript-eslint v8 and must not be configured');
}

requireRuleValue('@typescript-eslint/no-require-imports', 'off');
requireRuleValue('no-unused-expressions', 'off');
requireRuleValue('@typescript-eslint/no-unused-expressions', 'off');
requireRuleValue('no-unused-vars', 'off');
requireRuleValue('@typescript-eslint/no-unused-vars', 'off');
requireRuleValue('@typescript-eslint/no-unsafe-function-type', 'warn');

if (errors.length > 0) {
  console.error('ESLint config compatibility check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('ESLint config compatibility matches the typescript-eslint 8 baseline.');

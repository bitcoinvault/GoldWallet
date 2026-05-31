import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const eslintConfig = JSON.parse(readFileSync(path.join(root, '.eslintrc'), 'utf8'));
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const extendsEntries = Array.isArray(eslintConfig.extends)
  ? eslintConfig.extends
  : [eslintConfig.extends].filter(Boolean);
const rules = eslintConfig.rules || {};
const devDependencies = packageJson.devDependencies || {};
const errors = [];
const eslintFlatConfigPath = path.join(root, 'eslint.config.mjs');
const eslintIgnorePath = path.join(root, '.eslintignore');

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

if (devDependencies.eslint !== '10.4.1') {
  errors.push(`eslint must stay on 10.4.1 for the flat-config bridge. Found ${devDependencies.eslint || '<missing>'}`);
}

if (devDependencies['@eslint/js'] !== '10.0.1') {
  errors.push(
    `@eslint/js must stay on 10.0.1 for the ESLint 10 flat-config bridge. Found ${devDependencies['@eslint/js'] || '<missing>'}`,
  );
}

if (devDependencies['@eslint/eslintrc'] !== '3.3.5') {
  errors.push(
    `@eslint/eslintrc must stay on 3.3.5 for the ESLint 10 flat-config bridge. Found ${devDependencies['@eslint/eslintrc'] || '<missing>'}`,
  );
}

if (devDependencies['@eslint/compat'] !== '2.1.0') {
  errors.push(
    `@eslint/compat must stay on 2.1.0 for the ESLint 10 flat-config bridge. Found ${devDependencies['@eslint/compat'] || '<missing>'}`,
  );
}

if (devDependencies.jiti !== '2.7.0') {
  errors.push(
    `jiti must stay on 2.7.0 for the ESLint 10 peer dependency. Found ${devDependencies.jiti || '<missing>'}`,
  );
}

if (Object.prototype.hasOwnProperty.call(devDependencies, 'globals')) {
  errors.push('globals is not used directly by eslint.config.mjs and must not be a direct devDependency');
}

if (!existsSync(eslintFlatConfigPath)) {
  errors.push('eslint.config.mjs must exist so ESLint 10 can load the legacy .eslintrc baseline through FlatCompat');
}

if (existsSync(eslintIgnorePath)) {
  errors.push('.eslintignore must not return; ESLint 10 ignores are owned by eslint.config.mjs');
}

if (Object.prototype.hasOwnProperty.call(devDependencies, '@react-native-community/eslint-config')) {
  errors.push('@react-native-community/eslint-config is not used by .eslintrc and must not be a direct devDependency');
}

if (Object.prototype.hasOwnProperty.call(devDependencies, 'babel-eslint')) {
  errors.push(
    'babel-eslint is deprecated and unused by .eslintrc; @typescript-eslint/parser owns parsing for this baseline',
  );
}

if (
  extendsEntries.includes('@react-native-community') ||
  extendsEntries.includes('@react-native-community/eslint-config')
) {
  errors.push('Do not re-enable @react-native-community/eslint-config without a dedicated lint baseline migration');
}

if (eslintConfig.parser === 'babel-eslint') {
  errors.push('Do not restore babel-eslint as the parser; it is deprecated and not part of the current baseline');
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

console.log('ESLint config compatibility matches the ESLint 10 flat-config bridge baseline.');

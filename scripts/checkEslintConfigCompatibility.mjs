import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import semver from 'semver';

import { ESLint } from 'eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
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

const expectedVersions = {
  '@typescript-eslint/eslint-plugin': '8.67.0',
  '@typescript-eslint/parser': '8.67.0',
  eslint: '10.8.1',
};
const installedPackages = Object.fromEntries(
  Object.keys(expectedVersions).map(packageName => [packageName, require(`${packageName}/package.json`)]),
);

if (devDependencies['@typescript-eslint/eslint-plugin'] !== expectedVersions['@typescript-eslint/eslint-plugin']) {
  errors.push(
    `@typescript-eslint/eslint-plugin must stay on ${expectedVersions['@typescript-eslint/eslint-plugin']} for this compatibility guard. Found ${
      devDependencies['@typescript-eslint/eslint-plugin'] || '<missing>'
    }`,
  );
}

if (devDependencies['@typescript-eslint/parser'] !== expectedVersions['@typescript-eslint/parser']) {
  errors.push(
    `@typescript-eslint/parser must stay on ${expectedVersions['@typescript-eslint/parser']} for this compatibility guard. Found ${devDependencies['@typescript-eslint/parser'] || '<missing>'}`,
  );
}

if (devDependencies.eslint !== expectedVersions.eslint) {
  errors.push(`eslint must stay on ${expectedVersions.eslint} for the flat-config bridge. Found ${devDependencies.eslint || '<missing>'}`);
}

Object.entries(expectedVersions).forEach(([packageName, expectedVersion]) => {
  if (installedPackages[packageName].version !== expectedVersion) {
    errors.push(
      `node_modules has ${packageName}@${installedPackages[packageName].version}; expected ${expectedVersion}`,
    );
  }
});

const parserPackage = installedPackages['@typescript-eslint/parser'];
const pluginPackage = installedPackages['@typescript-eslint/eslint-plugin'];
const eslintPackage = installedPackages.eslint;
const typescriptVersion = devDependencies.typescript;

if (parserPackage.version !== pluginPackage.version) {
  errors.push(`@typescript-eslint parser/plugin versions must match. Found ${parserPackage.version} and ${pluginPackage.version}`);
}

[
  ['parser ESLint', eslintPackage.version, parserPackage.peerDependencies?.eslint],
  ['parser TypeScript', typescriptVersion, parserPackage.peerDependencies?.typescript],
  ['plugin ESLint', eslintPackage.version, pluginPackage.peerDependencies?.eslint],
  ['plugin TypeScript', typescriptVersion, pluginPackage.peerDependencies?.typescript],
  ['plugin parser', parserPackage.version, pluginPackage.peerDependencies?.['@typescript-eslint/parser']],
].forEach(([label, version, range]) => {
  if (!version || !range || !semver.satisfies(version, range, { includePrerelease: true })) {
    errors.push(`${label} peer range ${range || '<missing>'} does not accept ${version || '<missing>'}`);
  }
});

Object.entries(installedPackages).forEach(([packageName, installedPackage]) => {
  const nodeEngine = installedPackage.engines?.node;

  if (!nodeEngine || !semver.satisfies(process.version, nodeEngine)) {
    errors.push(`${packageName} Node engine ${nodeEngine || '<missing>'} does not accept ${process.version}`);
  }
});

if (devDependencies['@eslint/js'] !== '10.0.1') {
  errors.push(
    `@eslint/js must stay on 10.0.1 for the ESLint 10 flat-config bridge. Found ${devDependencies['@eslint/js'] || '<missing>'}`,
  );
}

if (devDependencies['@eslint/eslintrc'] !== '3.3.6') {
  errors.push(
    `@eslint/eslintrc must stay on 3.3.6 for the ESLint 10 flat-config bridge. Found ${devDependencies['@eslint/eslintrc'] || '<missing>'}`,
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

try {
  const eslint = new ESLint({ cwd: root });
  const calculatedConfig = await eslint.calculateConfigForFile('src/Navigator.tsx');

  if (!calculatedConfig?.plugins?.['@typescript-eslint']) {
    errors.push('ESLint flat config must load the @typescript-eslint plugin for TypeScript sources');
  }
} catch (error) {
  errors.push(`ESLint flat config failed to load through the ESLint API: ${error.message}`);
}

if (errors.length > 0) {
  console.error('ESLint config compatibility check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('ESLint config compatibility matches the ESLint 10 flat-config bridge baseline.');

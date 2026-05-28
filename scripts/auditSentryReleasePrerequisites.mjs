import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const requiredPropertiesFiles = ['sentry.properties', 'android/sentry.properties', 'ios/sentry.properties'];
const requiredPropertiesKeys = ['defaults.url', 'defaults.org', 'defaults.project', 'auth.token'];
const createScriptPath = path.join(root, 'create-sentry-properties.sh');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const parsePropertiesKeys = content =>
  new Set(
    content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => line.slice(0, line.indexOf('='))),
  );

const missingFiles = requiredPropertiesFiles.filter(relativePath => !existsSync(path.join(root, relativePath)));
const invalidFiles = [];

requiredPropertiesFiles
  .filter(relativePath => !missingFiles.includes(relativePath))
  .forEach(relativePath => {
    const content = read(relativePath);
    const keys = parsePropertiesKeys(content);
    const missingKeys = requiredPropertiesKeys.filter(key => !keys.has(key));
    const authLine = content
      .split(/\r?\n/)
      .find(line => line.trim().startsWith('auth.token='));
    const hasBlankToken = authLine !== undefined && authLine.trim() === 'auth.token=';

    if (missingKeys.length > 0 || hasBlankToken) {
      invalidFiles.push({
        relativePath,
        missingKeys,
        hasBlankToken,
      });
    }
  });

const hasCreateScript = existsSync(createScriptPath);
const createScript = hasCreateScript ? readFileSync(createScriptPath, 'utf8') : '';
const createScriptUsesToken = createScript.includes('SENTRY_AUTH_TOKEN');
const envHasToken = Boolean(process.env.SENTRY_AUTH_TOKEN);
const ready = missingFiles.length === 0 && invalidFiles.length === 0;

console.log('Sentry release prerequisite audit');
console.log(`sentry.properties files present: ${missingFiles.length === 0 ? 'yes' : 'no'}`);

if (missingFiles.length > 0) {
  console.log('Missing files:');
  missingFiles.forEach(relativePath => console.log(`- ${relativePath}`));
}

if (invalidFiles.length > 0) {
  console.log('Invalid files:');
  invalidFiles.forEach(file => {
    const issues = [];

    if (file.missingKeys.length > 0) {
      issues.push(`missing keys: ${file.missingKeys.join(', ')}`);
    }

    if (file.hasBlankToken) {
      issues.push('blank auth.token');
    }

    console.log(`- ${file.relativePath}: ${issues.join('; ')}`);
  });
}

console.log(`create-sentry-properties.sh present: ${hasCreateScript ? 'yes' : 'no'}`);
console.log(`create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: ${createScriptUsesToken ? 'yes' : 'no'}`);
console.log(`SENTRY_AUTH_TOKEN available in current shell: ${envHasToken ? 'yes' : 'no'}`);

if (!ready) {
  console.log('Release source-map validation is not ready locally.');
  console.log('Required before claiming Sentry release validation: generate sentry.properties with SENTRY_AUTH_TOKEN.');
} else {
  console.log('Release source-map prerequisites are present locally.');
}

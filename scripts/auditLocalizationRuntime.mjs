import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const appSource = readFileSync(path.join(root, 'App.tsx'), 'utf8');
const localizationSource = readFileSync(path.join(root, 'loc', 'index.js'), 'utf8');
const reactI18next = require('react-i18next');
const i18next = require('i18next');
const errors = [];

const expectedVersions = {
  i18next: '26.3.6',
  'react-i18next': '17.0.11',
  'react-localization': '2.0.6',
};

for (const [name, version] of Object.entries(expectedVersions)) {
  if (packageJson.dependencies[name] !== version) {
    errors.push(`package.json has ${name}@${packageJson.dependencies[name] || '<missing>'}; expected ${version}`);
  }

  const installedManifest = JSON.parse(
    readFileSync(path.join(root, 'node_modules', ...name.split('/'), 'package.json'), 'utf8'),
  );
  const installedVersion = installedManifest.version;
  if (installedVersion !== version) {
    errors.push(`node_modules has ${name}@${installedVersion}; expected ${version}`);
  }
}

for (const exportName of ['I18nextProvider', 'Trans', 'useTranslation']) {
  if (typeof reactI18next[exportName] !== 'function') {
    errors.push(`react-i18next.${exportName} is not a function`);
  }
}

if (typeof i18next.createInstance !== 'function' || typeof i18next.t !== 'function') {
  errors.push('i18next createInstance/t runtime API is unavailable');
}

for (const snippet of [
  "import { I18nextProvider } from 'react-i18next';",
  '<TypedI18nextProvider i18n={i18n}>',
  '</TypedI18nextProvider>',
]) {
  if (!appSource.includes(snippet)) {
    errors.push(`App.tsx is missing localization provider wiring: ${snippet}`);
  }
}

for (const snippet of [
  "import Localization from 'react-localization';",
  'strings = new Localization({',
  'strings.saveLanguage = async lang =>',
]) {
  if (!localizationSource.includes(snippet)) {
    errors.push(`loc/index.js is missing localization runtime wiring: ${snippet}`);
  }
}

if (errors.length > 0) {
  console.error('Localization runtime audit failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Localization runtime audit');
Object.entries(expectedVersions).forEach(([name, version]) => console.log(`${name}: ${version}`));
console.log('react-i18next exports: passed');
console.log('App provider and react-localization wiring: passed');

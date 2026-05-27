import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getReleaseServiceEnvKeyErrors, parseEnvKeys } from './releaseServiceEnvKeysGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidBuildGradlePath = path.join(root, 'android', 'app', 'build.gradle');
const iosSchemesDir = path.join(root, 'ios', 'GoldWallet.xcodeproj', 'xcshareddata', 'xcschemes');
const schemeFiles = [
  'GoldWallet (Debug).xcscheme',
  'GoldWallet (Release).xcscheme',
  'GoldWallet Beta (Debug).xcscheme',
  'GoldWallet Beta (Release).xcscheme',
  'GoldWallet Dev (Debug).xcscheme',
  'GoldWallet Dev (Release).xcscheme',
  'GoldWallet Stage (Debug).xcscheme',
  'GoldWallet Stage (Release).xcscheme',
];
const read = filePath => readFileSync(filePath, 'utf8');
const normalizeEnvName = envName => envName.replace(/&quot;/g, '"');

const androidEnvFiles = [
  ...read(androidBuildGradlePath).matchAll(/['"](\.env\.[A-Za-z0-9_.-]+)['"]/g),
].map(match => match[1]);
const iosEnvFiles = schemeFiles.flatMap(schemeFile => {
  const scheme = read(path.join(iosSchemesDir, schemeFile));

  return [...scheme.matchAll(/\.env\.[A-Za-z0-9_.-]+/g)].map(match => normalizeEnvName(match[0]));
});
const referencedEnvFiles = [...new Set([...androidEnvFiles, ...iosEnvFiles])].sort();

const envKeyEntries = referencedEnvFiles.map(envFile => ({
  envFile,
  keys: parseEnvKeys(read(path.join(root, envFile))),
}));
const errors = getReleaseServiceEnvKeyErrors(envKeyEntries);

if (errors.length > 0) {
  console.error('Release-service env key guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Release-service env keys are present for ${referencedEnvFiles.length} referenced env files.`);

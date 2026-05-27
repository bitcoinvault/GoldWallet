import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidEnvConfigFilesErrors, parseAndroidEnvConfigFiles } from './androidEnvConfigFilesGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidBuildGradlePath = path.join(root, 'android', 'app', 'build.gradle');
const actualConfigFiles = parseAndroidEnvConfigFiles(readFileSync(androidBuildGradlePath, 'utf8'));
const errors = getAndroidEnvConfigFilesErrors(actualConfigFiles);

if (errors.length > 0) {
  console.error('Android envConfigFiles guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Android envConfigFiles mapping matches the guarded baseline for ${actualConfigFiles.size} variants.`);

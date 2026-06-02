import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const [variant, buildType] = process.argv.slice(2);
const allowedVariants = new Set(['dev', 'stage', 'prod']);
const allowedBuildTypes = new Set(['debug', 'release']);

if (!allowedVariants.has(variant) || !allowedBuildTypes.has(buildType)) {
  console.error('Usage: node scripts/runDetoxAndroidBuild.mjs <dev|stage|prod> <debug|release>');
  process.exit(1);
}

const capitalize = value => `${value[0].toUpperCase()}${value.slice(1)}`;
const variantName = `${capitalize(variant)}${capitalize(buildType)}`;
const env = {
  ...process.env,
  RN_SRC_EXT: 'e2e.tsx',
  CHAMBER_OF_SECRETS: 'true',
};

const result = spawnSync(
  process.execPath,
  [
    path.join(root, 'scripts', 'runAndroidGradle.mjs'),
    `:app:assemble${variantName}`,
    `:app:assemble${variantName}AndroidTest`,
    `-DtestBuildType=${buildType}`,
  ],
  {
    cwd: root,
    env,
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

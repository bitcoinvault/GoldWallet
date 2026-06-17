import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const reactNativeCli = path.join(root, 'node_modules', 'react-native', 'cli.js');
const extraArgs = process.argv.slice(2);

const result = spawnSync(process.execPath, [reactNativeCli, 'start', '--reset-cache', ...extraArgs], {
  cwd: root,
  env: {
    ...process.env,
    LOG_BOX_IGNORE: process.env.LOG_BOX_IGNORE ?? 'true',
    CHAMBER_OF_SECRETS: 'true',
    RN_SRC_EXT: 'e2e.tsx',
  },
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

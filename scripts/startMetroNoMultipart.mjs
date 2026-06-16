import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const reactNativeCli = require.resolve('react-native/cli.js');
const args = ['start', ...process.argv.slice(2)];

const child = spawn(process.execPath, [reactNativeCli, ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    RN_DISABLE_METRO_MULTIPART: 'true',
    LOG_BOX_IGNORE: process.env.LOG_BOX_IGNORE ?? 'true',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

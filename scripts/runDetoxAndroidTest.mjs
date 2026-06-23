import { existsSync } from 'fs';
import { request } from 'http';
import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const [configuration, ...detoxArgs] = process.argv.slice(2);
const detoxCli = path.join(root, 'node_modules', 'detox', 'local-cli', 'cli.js');
const metroScript = path.join(root, 'scripts', 'runDetoxMetro.mjs');
const metroPort = process.env.RCT_METRO_PORT || '8081';
const shouldStartMetro = process.env.DETOX_SKIP_METRO !== 'true';
const shouldReuseExistingMetro = process.env.DETOX_REUSE_METRO === 'true';

const sdkCandidates = [
  process.env.ANDROID_SDK_ROOT,
  process.env.ANDROID_HOME,
  process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : '',
].filter(Boolean);

const androidSdkRoot = sdkCandidates.find(candidate => existsSync(candidate));

if (!configuration) {
  console.error('Usage: node scripts/runDetoxAndroidTest.mjs <detox-configuration> [detox-test-args...]');
  process.exit(1);
}

if (!androidSdkRoot) {
  console.error('Android SDK not found. Set ANDROID_SDK_ROOT, ANDROID_HOME, or install the SDK under %LOCALAPPDATA%\\Android\\Sdk.');
  process.exit(1);
}

const env = {
  ...process.env,
  ANDROID_HOME: process.env.ANDROID_HOME || androidSdkRoot,
  ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || androidSdkRoot,
  DETOX_CONFIGURATION: configuration,
  LOG_BOX_IGNORE: process.env.LOG_BOX_IGNORE ?? 'true',
  CHAMBER_OF_SECRETS: 'true',
  RN_SRC_EXT: 'e2e.tsx',
  RCT_METRO_PORT: metroPort,
};

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const isMetroReady = () =>
  new Promise(resolve => {
    const req = request(
      {
        hostname: '127.0.0.1',
        port: metroPort,
        path: '/status',
        timeout: 2000,
      },
      res => {
        let body = '';

        res.on('data', chunk => {
          body += chunk.toString();
        });

        res.on('end', () => {
          resolve(body.includes('packager-status:running'));
        });
      },
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });

const waitForMetro = async metroProcess => {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await isMetroReady()) {
      return;
    }

    if (metroProcess?.exitCode !== null) {
      throw new Error(`Detox Metro exited before becoming ready, exit code ${metroProcess.exitCode}`);
    }

    await wait(1000);
  }

  throw new Error(`Detox Metro did not become ready on port ${metroPort}`);
};

const stopProcessTree = child => {
  if (!child || child.exitCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }

  child.kill('SIGTERM');
};

const runDetox = () => {
  const result = spawnSync(process.execPath, [detoxCli, 'test', '-c', configuration, ...detoxArgs], {
    cwd: root,
    env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
};

let metroProcess;
let exitCode = 1;

try {
  if (shouldStartMetro) {
    const metroAlreadyRunning = await isMetroReady();

    if (metroAlreadyRunning && !shouldReuseExistingMetro) {
      throw new Error(`Metro is already running on port ${metroPort}. Stop it first, or set DETOX_REUSE_METRO=true if it was started with scripts/runDetoxMetro.mjs.`);
    }

    if (!metroAlreadyRunning) {
      metroProcess = spawn(process.execPath, [metroScript, '--port', metroPort, '--no-interactive'], {
        cwd: root,
        env,
        stdio: 'inherit',
      });
    }

    await waitForMetro(metroProcess);
  }

  exitCode = runDetox();
} catch (error) {
  console.error(error.message);
  exitCode = 1;
} finally {
  stopProcessTree(metroProcess);
}

process.exit(exitCode);

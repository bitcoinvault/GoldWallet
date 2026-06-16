import { spawn, spawnSync } from 'child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const localDocsDir = path.join(root, 'local-docs');
const metroPort = Number(process.env.ANDROID_SMOKE_METRO_PORT || 8081);
const metroHost = process.env.ANDROID_SMOKE_METRO_HOST || '127.0.0.1';
const metroStartupTimeoutMs = Number(process.env.MANAGED_METRO_START_TIMEOUT_MS || 120000);
const metroPollIntervalMs = Number(process.env.MANAGED_METRO_POLL_INTERVAL_MS || 1000);
const reuseExistingMetro = process.env.ANDROID_METRO_REUSE_EXISTING === 'true';
const metroLogPath = path.join(localDocsDir, 'metro-managed-electrum-observation.log');
const metroScriptPath = path.join(root, 'scripts', 'startMetroNoMultipart.mjs');
const yarnScriptName = 'android:dev:create-wallet-electrum-observe:metro';

mkdirSync(localDocsDir, { recursive: true });

const metroLog = createWriteStream(metroLogPath, { flags: 'w' });
let metroProcess;

const writeMetroLog = chunk => {
  metroLog.write(chunk);
};

const statusUrl = `http://${metroHost}:${metroPort}/status`;

const checkMetroStatus = () =>
  new Promise(resolve => {
    const request = http.get(statusUrl, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({
          ok: response.statusCode === 200 && body.includes('packager-status:running'),
          statusCode: response.statusCode,
          body,
        });
      });
    });

    request.setTimeout(2000, () => {
      request.destroy(new Error('timeout'));
    });

    request.on('error', error => {
      resolve({ ok: false, error: error.message });
    });
  });

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const waitForMetro = async () => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < metroStartupTimeoutMs) {
    const status = await checkMetroStatus();
    if (status.ok) {
      return;
    }

    if (metroProcess?.exitCode != null) {
      throw new Error(`Metro exited before readiness check passed. See ${metroLogPath}`);
    }

    await wait(metroPollIntervalMs);
  }

  throw new Error(`Metro did not report packager-status:running within ${metroStartupTimeoutMs}ms. See ${metroLogPath}`);
};

const stopMetro = async () => {
  if (!metroProcess || metroProcess.exitCode != null || metroProcess.killed) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(metroProcess.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    metroProcess.kill('SIGTERM');
  }

  await wait(1000);
};

const getYarnCommand = () => {
  if (process.env.npm_execpath && existsSync(process.env.npm_execpath)) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, yarnScriptName],
      shell: false,
    };
  }

  const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!packageJson.scripts?.[yarnScriptName]) {
    throw new Error(`Missing package.json script: ${yarnScriptName}`);
  }

  return {
    command: process.platform === 'win32' ? 'corepack.cmd' : 'corepack',
    args: ['yarn', yarnScriptName],
    shell: false,
  };
};

const runYarnValidation = () =>
  new Promise((resolve, reject) => {
    const yarn = getYarnCommand();
    const child = spawn(yarn.command, yarn.args, {
      cwd: root,
      stdio: 'inherit',
      shell: yarn.shell,
      env: {
        ...process.env,
        ANDROID_SMOKE_METRO_PORT: String(metroPort),
        ANDROID_SMOKE_REQUIRE_METRO: 'true',
        LOG_BOX_IGNORE: process.env.LOG_BOX_IGNORE ?? 'true',
      },
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${yarnScriptName} exited by signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`${yarnScriptName} exited with code ${code}`));
        return;
      }

      resolve();
    });
  });

try {
  const existingMetro = await checkMetroStatus();
  if (existingMetro.ok && !reuseExistingMetro) {
    throw new Error(
      `Metro is already running on ${statusUrl}. Stop it first or set ANDROID_METRO_REUSE_EXISTING=true if you intentionally want to reuse it.`,
    );
  }

  if (!existingMetro.ok) {
    metroProcess = spawn(process.execPath, [metroScriptPath, '--reset-cache', '--port', String(metroPort)], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        RN_DISABLE_METRO_MULTIPART: 'true',
        LOG_BOX_IGNORE: process.env.LOG_BOX_IGNORE ?? 'true',
      },
    });

    metroProcess.stdout.on('data', writeMetroLog);
    metroProcess.stderr.on('data', writeMetroLog);
    metroProcess.on('error', error => {
      writeMetroLog(`\nMetro process error: ${error.message}\n`);
    });

    console.log(`Started managed Metro no-multipart process pid ${metroProcess.pid}; log: ${metroLogPath}`);
  } else {
    console.log(`Reusing existing Metro on ${statusUrl} because ANDROID_METRO_REUSE_EXISTING=true`);
  }

  await waitForMetro();
  console.log(`Metro no-multipart status ready on ${statusUrl}`);

  await runYarnValidation();
  console.log('Managed Metro Electrum observation completed.');
} finally {
  await stopMetro();
  metroLog.end();
}

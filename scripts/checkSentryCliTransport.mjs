import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const expectedSdkVersion = '8.22.0';
const expectedCliVersion = '3.6.2';
const expectedTransportVersion = '8.10.0';
const expectedJsdomTransportVersion = '8.9.0';
const expectedCliTransportRange = '^6.22.0';

const readPackage = packageName =>
  JSON.parse(readFileSync(path.join(root, 'node_modules', ...packageName.split('/'), 'package.json'), 'utf8'));

const requireFunction = (errors, object, key, owner) => {
  if (typeof object?.[key] !== 'function') {
    errors.push(`${owner}.${key} must be a function`);
  }
};

const runHermeticTransportProbe = transportEntryPath => {
  const probe = `
const http = require('node:http');
const { Readable } = require('node:stream');
const { fetch } = require(process.argv[1]);
const expectedBody = 'sentry-cli-transport-ok';

(async () => {
  const payload = Buffer.from(expectedBody);
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'content-length': String(payload.length) });
    response.end(payload);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const { port } = server.address();
    const response = await fetch(\`http://127.0.0.1:\${port}/sentry-cli-fallback\`, { redirect: 'follow' });
    if (!response.ok) throw new Error(\`unexpected HTTP status \${response.status}\`);

    const chunks = [];
    let downloadedBytes = 0;
    for await (const chunk of Readable.fromWeb(response.body)) {
      chunks.push(chunk);
      downloadedBytes += chunk.length;
    }

    const body = Buffer.concat(chunks).toString('utf8');
    if (downloadedBytes !== payload.length || body !== expectedBody) {
      throw new Error(\`response stream mismatch: bytes=\${downloadedBytes}, body=\${JSON.stringify(body)}\`);
    }

    process.stdout.write(expectedBody);
  } finally {
    server.closeAllConnections?.();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
`;

  return spawnSync(process.execPath, ['--eval', probe, transportEntryPath], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10_000,
    windowsHide: true,
  });
};

export const collectSentryCliTransportState = () => {
  const errors = [];
  const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const sdkPackage = readPackage('@sentry/react-native');
  const cliPackage = readPackage('@sentry/cli');
  const sentryCliRequire = createRequire(path.join(root, 'node_modules', '@sentry', 'cli', 'package.json'));
  const jsdomRequire = createRequire(path.join(root, 'node_modules', 'jsdom', 'package.json'));
  const sentryTransportPackagePath = sentryCliRequire.resolve('undici/package.json');
  const jsdomTransportPackagePath = jsdomRequire.resolve('undici/package.json');
  const sentryTransportEntryPath = sentryCliRequire.resolve('undici');
  const transportPackage = JSON.parse(readFileSync(sentryTransportPackagePath, 'utf8'));
  const jsdomTransportPackage = JSON.parse(readFileSync(jsdomTransportPackagePath, 'utf8'));
  const semver = require('semver');
  const packageResolution = packageJson.resolutions?.['@sentry/**/undici'] || '';
  const sdkCliRange = sdkPackage.dependencies?.['@sentry/cli'] || '';
  const cliTransportRange = cliPackage.dependencies?.undici || '';
  const transportNodeRange = transportPackage.engines?.node || '';
  const cliBinRelative = typeof cliPackage.bin === 'string' ? cliPackage.bin : cliPackage.bin?.['sentry-cli'] || '';
  const expectedFallbackBinaryName = process.platform === 'win32' ? 'sentry-cli.exe' : 'sentry-cli';
  let fallbackBinaryPath = '';
  let activeBinaryPath = '';
  let cliVersionOutput = '';
  let transportProbeOutput = '';

  const exactVersions = [
    ['@sentry/react-native', sdkPackage.version, expectedSdkVersion],
    ['@sentry/cli', cliPackage.version, expectedCliVersion],
    ['undici', transportPackage.version, expectedTransportVersion],
    ['jsdom nested undici', jsdomTransportPackage.version, expectedJsdomTransportVersion],
  ];

  exactVersions.forEach(([name, actual, expected]) => {
    if (actual !== expected) {
      errors.push(`${name} is ${actual || '<missing>'}; expected ${expected}`);
    }
  });

  if (packageResolution !== expectedTransportVersion) {
    errors.push(
      `package.json resolutions.@sentry/**/undici is ${packageResolution || '<missing>'}; expected ${expectedTransportVersion}`,
    );
  }

  if (sdkCliRange !== expectedCliVersion) {
    errors.push(`@sentry/react-native CLI dependency is ${sdkCliRange || '<missing>'}; expected ${expectedCliVersion}`);
  }

  if (cliTransportRange !== expectedCliTransportRange) {
    errors.push(
      `@sentry/cli undici range is ${cliTransportRange || '<missing>'}; reassess the major resolution override`,
    );
  }

  if (!transportNodeRange || !semver.satisfies(process.version, transportNodeRange)) {
    errors.push(
      `Node ${process.version} does not satisfy undici ${expectedTransportVersion} engine ${transportNodeRange || '<missing>'}`,
    );
  }

  try {
    const transport = sentryCliRequire('undici');
    requireFunction(errors, transport, 'fetch', 'undici');
    requireFunction(errors, transport, 'ProxyAgent', 'undici');
    requireFunction(errors, transport, 'request', 'undici');

    const cliHelper = require('@sentry/cli/js/helper');
    requireFunction(errors, cliHelper, 'getFallbackBinaryPath', '@sentry/cli/js/helper');
    requireFunction(errors, cliHelper, 'getPath', '@sentry/cli/js/helper');
    fallbackBinaryPath = cliHelper.getFallbackBinaryPath?.() || '';
    activeBinaryPath = cliHelper.getPath?.() || '';

    if (path.basename(fallbackBinaryPath).toLowerCase() !== expectedFallbackBinaryName) {
      errors.push(
        `Sentry CLI fallback binary is ${fallbackBinaryPath || '<missing>'}; expected ${expectedFallbackBinaryName}`,
      );
    }

    if (!activeBinaryPath || !existsSync(activeBinaryPath)) {
      errors.push(`Sentry CLI active binary is ${activeBinaryPath || '<missing>'}; expected an existing file`);
    }

    const transportProbe = runHermeticTransportProbe(sentryTransportEntryPath);
    transportProbeOutput = `${transportProbe.stdout || ''}${transportProbe.stderr || ''}`.trim();
    if (transportProbe.error) {
      errors.push(`hermetic transport probe failed: ${transportProbe.error.code || transportProbe.error.message}`);
    } else if (transportProbe.status !== 0) {
      errors.push(`hermetic transport probe exited ${transportProbe.status}: ${transportProbeOutput || '<no output>'}`);
    } else if (transportProbeOutput !== 'sentry-cli-transport-ok') {
      errors.push(`hermetic transport probe output is ${transportProbeOutput || '<missing>'}`);
    }

    if (!cliBinRelative) {
      errors.push('@sentry/cli package bin entry is missing');
    } else {
      const cliResult = spawnSync(
        process.execPath,
        [path.join(root, 'node_modules', '@sentry', 'cli', cliBinRelative), '--version'],
        {
          cwd: root,
          encoding: 'utf8',
          windowsHide: true,
        },
      );
      cliVersionOutput = `${cliResult.stdout || ''}${cliResult.stderr || ''}`.trim();

      if (cliResult.error) {
        errors.push(`Sentry CLI version probe failed: ${cliResult.error.code || cliResult.error.message}`);
      } else if (cliResult.status !== 0) {
        errors.push(`Sentry CLI version probe exited ${cliResult.status}: ${cliVersionOutput || '<no output>'}`);
      } else if (cliVersionOutput !== `sentry-cli ${expectedCliVersion}`) {
        errors.push(
          `Sentry CLI version output is ${cliVersionOutput || '<missing>'}; expected sentry-cli ${expectedCliVersion}`,
        );
      }
    }
  } catch (error) {
    errors.push(`runtime probe failed: ${error.code || error.message}`);
  }

  return {
    packageResolution,
    sdkVersion: sdkPackage.version || '',
    sdkCliRange,
    cliVersion: cliPackage.version || '',
    cliTransportRange,
    transportVersion: transportPackage.version || '',
    jsdomTransportVersion: jsdomTransportPackage.version || '',
    sentryTransportPackagePath,
    jsdomTransportPackagePath,
    transportNodeRange,
    fallbackBinaryPath,
    activeBinaryPath,
    cliVersionOutput,
    transportProbeOutput,
    errors,
  };
};

const printReport = state => {
  console.log('Sentry CLI transport owner-path check');
  console.log(`@sentry/react-native: ${state.sdkVersion || '<missing>'}`);
  console.log(`SDK CLI dependency: ${state.sdkCliRange || '<missing>'}`);
  console.log(`@sentry/cli: ${state.cliVersion || '<missing>'}`);
  console.log(`CLI undici range: ${state.cliTransportRange || '<missing>'}`);
  console.log(`package.json resolution: ${state.packageResolution || '<missing>'}`);
  console.log(`Installed undici: ${state.transportVersion || '<missing>'}`);
  console.log(`JSDOM nested undici: ${state.jsdomTransportVersion || '<missing>'}`);
  console.log(`Sentry-resolved undici package: ${state.sentryTransportPackagePath || '<missing>'}`);
  console.log(`JSDOM-resolved undici package: ${state.jsdomTransportPackagePath || '<missing>'}`);
  console.log(`Undici Node engine: ${state.transportNodeRange || '<missing>'}`);
  console.log(`Computed fallback binary: ${state.fallbackBinaryPath || '<missing>'}`);
  console.log(`Active CLI binary: ${state.activeBinaryPath || '<missing>'}`);
  console.log(`CLI version output: ${state.cliVersionOutput || '<missing>'}`);
  console.log(`Hermetic transport probe: ${state.transportProbeOutput || '<missing>'}`);

  if (state.errors.length > 0) {
    console.error('Sentry CLI transport owner-path check failed:');
    state.errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Sentry CLI owner path and fallback transport API surface are compatible with the 8.10.0 resolution.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectSentryCliTransportState());
}

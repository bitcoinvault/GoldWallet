import { existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const normalizeVersion = version => (version || '').trim().replace(/^v/, '');

export const getNpmCommand = (platform = process.platform) => (platform === 'win32' ? 'npm.cmd' : 'npm');

export const getCorepackJsCandidates = ({
  nodeExecPath = process.execPath,
  programFiles = process.env.ProgramFiles,
  corepackJs = process.env.COREPACK_JS,
} = {}) => {
  const candidates = [];

  if (corepackJs) {
    candidates.push(corepackJs);
  }

  if (nodeExecPath) {
    candidates.push(path.join(path.dirname(nodeExecPath), 'node_modules', 'corepack', 'dist', 'corepack.js'));
  }

  if (programFiles) {
    candidates.push(path.join(programFiles, 'nodejs', 'node_modules', 'corepack', 'dist', 'corepack.js'));
  }

  return [...new Set(candidates)];
};

export const findCorepackJsPath = options => getCorepackJsCandidates(options).find(candidate => existsSync(candidate));

export const getYarnWithNvmrcNodeInvocation = ({ expectedVersion, corepackJsPath, yarnArgs = [], platform = process.platform }) => {
  const nodeVersion = normalizeVersion(expectedVersion);

  if (!nodeVersion) {
    throw new Error('Expected Node version is missing; check .nvmrc');
  }

  if (!corepackJsPath) {
    throw new Error('Corepack JS entrypoint is missing; set COREPACK_JS or install Node.js with Corepack');
  }

  const npmCommand = getNpmCommand(platform);
  const npmArgs = ['exec', '--yes', '--package', `node@${nodeVersion}`, '--', 'node', corepackJsPath, 'yarn', ...yarnArgs];

  if (platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', npmCommand, ...npmArgs],
    };
  }

  return {
    command: npmCommand,
    args: npmArgs,
  };
};

const usage = [
  'Usage: corepack yarn node:runtime:yarn <yarn-script> [args...]',
  '',
  'Runs the requested Yarn command under the exact Node version from .nvmrc.',
  'Example: corepack yarn node:runtime:yarn direct-outdated:snapshot:audit',
].join('\n');

const main = () => {
  const yarnArgs = process.argv.slice(2);

  if (yarnArgs.length === 0 || yarnArgs.includes('--help') || yarnArgs.includes('-h')) {
    console.error(usage);
    return yarnArgs.length === 0 ? 1 : 0;
  }

  const expectedVersion = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
  const corepackJsPath = findCorepackJsPath();
  let invocation;

  try {
    invocation = getYarnWithNvmrcNodeInvocation({ expectedVersion, corepackJsPath, yarnArgs });
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  const result = spawnSync(invocation.command, invocation.args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}

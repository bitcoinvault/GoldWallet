import { getCorepackJsCandidates, getNpmCommand, getYarnWithNvmrcNodeInvocation } from './runYarnWithNvmrcNode.mjs';
import { getAndroidGradleEnvironment } from './runAndroidGradle.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const invocation = getYarnWithNvmrcNodeInvocation({
  expectedVersion: '24.16.0',
  corepackJsPath: 'C:\\Program Files\\nodejs\\node_modules\\corepack\\dist\\corepack.js',
  yarnArgs: ['check:node-runtime-version'],
  platform: 'win32',
});

assert(getNpmCommand('win32') === 'npm.cmd', 'Windows npm command must use npm.cmd');
assert(getNpmCommand('linux') === 'npm', 'POSIX npm command must use npm');
assert(invocation.command === 'cmd.exe', 'Windows runner must invoke npm through cmd.exe');
assert(
  invocation.args.slice(0, 4).join(' ') === '/d /s /c npm.cmd',
  'Windows runner must use cmd.exe /d /s /c npm.cmd',
);
assert(invocation.args.includes('--yes'), 'Runner must use --yes for non-interactive npm exec');
assert(invocation.args.includes('--package'), 'Runner must install the requested Node package');
assert(invocation.args.includes('node@24.16.0'), 'Runner must pin the Node package version from .nvmrc');
assert(
  invocation.args.includes('C:\\Program Files\\nodejs\\node_modules\\corepack\\dist\\corepack.js'),
  'Runner must execute Corepack through Node',
);
assert(invocation.args.includes('yarn'), 'Runner must execute Yarn through Corepack');
assert(
  invocation.args[invocation.args.length - 1] === 'check:node-runtime-version',
  'Runner must forward Yarn script arguments',
);

const candidates = getCorepackJsCandidates({
  nodeExecPath: 'C:\\Program Files\\nodejs\\node.exe',
  programFiles: 'C:\\Program Files',
  corepackJs: 'D:\\custom\\corepack.js',
});

assert(candidates[0] === 'D:\\custom\\corepack.js', 'COREPACK_JS override must be the first Corepack candidate');
assert(
  candidates.includes('C:\\Program Files\\nodejs\\node_modules\\corepack\\dist\\corepack.js'),
  'Program Files Corepack candidate must be included',
);

const androidGradleEnvironment = getAndroidGradleEnvironment({
  env: {
    PATH: 'C:\\stale-node',
    Path: 'C:\\Windows\\System32;C:\\Program Files\\nodejs;D:\\NODE-24',
  },
  nodeExecPath: 'D:\\node-24\\node.exe',
  platform: 'win32',
});

assert(
  androidGradleEnvironment.NODE_BINARY === 'D:\\node-24\\node.exe',
  'Android Gradle must receive the current Node executable',
);
assert(
  androidGradleEnvironment.Path.startsWith('D:\\node-24;'),
  'Android Gradle PATH must prefer the current Node executable directory',
);
assert(!('PATH' in androidGradleEnvironment), 'Android Gradle must canonicalize duplicate Windows PATH keys');
assert(
  androidGradleEnvironment.Path.includes('C:\\Windows\\System32') &&
    androidGradleEnvironment.Path.includes('C:\\Program Files\\nodejs') &&
    androidGradleEnvironment.Path.includes('C:\\stale-node'),
  'Android Gradle must merge entries from duplicate Windows PATH keys without dropping tool directories',
);
assert(
  androidGradleEnvironment.Path.split(';').filter(entry => entry.toLowerCase() === 'd:\\node-24').length === 1,
  'Android Gradle Windows PATH must not duplicate the current Node directory with different casing',
);

const posixAndroidGradleEnvironment = getAndroidGradleEnvironment({
  env: { PATH: '/usr/bin:/Opt/Node/Bin', Path: 'unrelated-case-sensitive-variable' },
  nodeExecPath: '/opt/node/bin/node',
  platform: 'linux',
});

assert(
  posixAndroidGradleEnvironment.PATH === '/opt/node/bin:/usr/bin:/Opt/Node/Bin',
  'Android Gradle POSIX PATH handling must preserve case-sensitive path entries',
);
assert(
  posixAndroidGradleEnvironment.Path === 'unrelated-case-sensitive-variable',
  'Android Gradle POSIX environment must not treat Path as PATH',
);

try {
  getYarnWithNvmrcNodeInvocation({ expectedVersion: '', corepackJsPath: 'corepack.js' });
  assert(false, 'Missing Node version must be rejected');
} catch (error) {
  assert(error.message.includes('Expected Node version'), 'Missing Node version rejection message is wrong');
}

try {
  getYarnWithNvmrcNodeInvocation({ expectedVersion: '24.16.0', corepackJsPath: '' });
  assert(false, 'Missing Corepack path must be rejected');
} catch (error) {
  assert(error.message.includes('Corepack JS'), 'Missing Corepack path rejection message is wrong');
}

console.log('Node runtime Yarn runner guard checks are valid.');

import { execFileSync } from 'child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'babel-8-migration-probe-summary.txt');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const expectedNodeVersion = `v${readFileSync(path.join(root, '.nvmrc'), 'utf8').trim().replace(/^v/, '')}`;
const rnBabelPreset = require('@react-native/babel-preset/package.json');
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);
const babel8CohortPackages = [
  ['@babel/cli', 'cli'],
  ['@babel/core', 'core'],
  ['@babel/runtime', 'runtime'],
  ['@babel/plugin-transform-runtime', 'transformRuntime'],
  ['@babel/preset-env', 'presetEnv'],
  ['@babel/preset-react', 'presetReact'],
  ['@babel/preset-typescript', 'presetTypescript'],
  ['@babel/plugin-transform-flow-strip-types', 'flowStripTypes'],
  ['@babel/traverse', 'traverse'],
  ['babel-plugin-polyfill-regenerator', 'polyfillRegenerator'],
];

const npmViewJson = args =>
  JSON.parse(
    execFileSync(npmCommand, npmArgs(['view', ...args, '--json']), {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim(),
  );

const npmViewPackage = packageSpec => {
  const metadata = npmViewJson([packageSpec, 'version', 'engines']);

  if (typeof metadata === 'string') {
    return { version: metadata, engines: {} };
  }

  return metadata;
};

const readInstalledPackage = (tempDir, packageName) =>
  JSON.parse(readFileSync(path.join(tempDir, 'node_modules', packageName, 'package.json'), 'utf8'));

const installAndRunTransformProbe = ({ latest, rnPresetVersion }) => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'goldwallet-babel8-probe-'));
  const result = {
    isolatedInstallCompleted: 'no',
    isolatedCohortPackages: [],
    transformProbeOutcome: 'not run',
    transformErrorCode: 'none',
    transformErrorMessage: 'none',
  };

  try {
    execFileSync(
      npmCommand,
      npmArgs([
        'install',
        '--prefix',
        tempDir,
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        ...babel8CohortPackages.map(([packageName, key]) => `${packageName}@${latest[key].version}`),
        `@react-native/babel-preset@${rnPresetVersion}`,
      ]),
      {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      },
    );

    result.isolatedInstallCompleted = 'yes';
    result.isolatedCohortPackages = babel8CohortPackages.map(([packageName, key]) => {
      const installed = readInstalledPackage(tempDir, packageName).version;
      const expected = latest[key].version;

      return {
        name: packageName,
        installed,
        expected,
        matches: installed === expected ? 'yes' : 'no',
      };
    });

    const probePath = path.join(tempDir, 'probe-babel8.cjs');
    writeFileSync(
      probePath,
      [
        "const babel = require('@babel/core');",
        'try {',
        "  babel.transformSync('const value: number = 1; export default value;', {",
        "    filename: 'Probe.tsx',",
        "    presets: [require('@react-native/babel-preset')],",
        '  });',
        "  console.log(JSON.stringify({ outcome: 'passed', code: 'none', message: 'none' }));",
        '} catch (error) {',
        '  console.log(JSON.stringify({',
        "    outcome: 'failed',",
        "    code: error.code || 'none',",
        "    message: String(error.message || '').split(/\\r?\\n/)[0],",
        '  }));',
        '}',
        '',
      ].join('\n'),
    );

    const probeOutput = execFileSync(process.execPath, [probePath], {
      cwd: tempDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim();
    const probeResult = JSON.parse(probeOutput);

    result.transformProbeOutcome = probeResult.outcome || 'unknown';
    result.transformErrorCode = probeResult.code || 'none';
    result.transformErrorMessage = probeResult.message || 'none';
  } catch (error) {
    result.transformProbeOutcome = 'probe error';
    result.transformErrorCode = error.code || 'none';
    result.transformErrorMessage = String(error.message || '').split(/\r?\n/)[0] || 'unknown error';
  } finally {
    if (tempDir.startsWith(tmpdir())) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  return result;
};

export const collectBabel8MigrationProbe = () => {
  const latest = {
    cli: npmViewPackage('@babel/cli@latest'),
    core: npmViewPackage('@babel/core@latest'),
    runtime: npmViewPackage('@babel/runtime@latest'),
    transformRuntime: npmViewPackage('@babel/plugin-transform-runtime@latest'),
    presetEnv: npmViewPackage('@babel/preset-env@latest'),
    presetReact: npmViewPackage('@babel/preset-react@latest'),
    presetTypescript: npmViewPackage('@babel/preset-typescript@latest'),
    flowStripTypes: npmViewPackage('@babel/plugin-transform-flow-strip-types@latest'),
    traverse: npmViewPackage('@babel/traverse@latest'),
    polyfillRegenerator: npmViewPackage('babel-plugin-polyfill-regenerator@latest'),
  };
  const transformProbe = installAndRunTransformProbe({
    latest,
    rnPresetVersion: rnBabelPreset.version,
  });
  const flowStripTypesRange = rnBabelPreset.dependencies?.['@babel/plugin-transform-flow-strip-types'] || '<missing>';
  const babel8NodeEngine = latest.core.engines?.node || '<missing>';
  const nodeMajorMinorPatch = process.version.replace(/^v/, '').split('.').map(Number);
  const nodeEngineSatisfied =
    nodeMajorMinorPatch[0] > 24 ||
    (nodeMajorMinorPatch[0] === 24 && nodeMajorMinorPatch[1] >= 11) ||
    (nodeMajorMinorPatch[0] === 22 && nodeMajorMinorPatch[1] >= 18)
      ? 'yes'
      : 'no';

  return {
    reactNativeVersion: packageJson.dependencies?.['react-native'] || packageJson.devDependencies?.['react-native'] || '<missing>',
    rnBabelPresetVersion: rnBabelPreset.version,
    repoNodeVersion: process.version,
    expectedNodeVersion,
    repoBabelCore: packageJson.devDependencies?.['@babel/core'] || '<missing>',
    repoBabelRuntime: packageJson.devDependencies?.['@babel/runtime'] || '<missing>',
    latest,
    babel8NodeEngine,
    nodeEngineSatisfied,
    flowStripTypesRange,
    firstPluginPath: '@babel/plugin-transform-flow-strip-types',
    blockerClassification: 'React Native Babel preset plugin-stack blocker',
    ...transformProbe,
  };
};

export const formatBabel8MigrationProbeSummary = (audit, generatedAt = new Date().toISOString()) =>
  [
    'Babel 8 migration probe audit',
    `Generated at: ${generatedAt}`,
    `React Native version: ${audit.reactNativeVersion}`,
    `React Native Babel preset version: ${audit.rnBabelPresetVersion}`,
    `Repo Node version: ${audit.repoNodeVersion}`,
    `Expected Node version: ${audit.expectedNodeVersion}`,
    `Repo @babel/core: ${audit.repoBabelCore}`,
    `Repo @babel/runtime: ${audit.repoBabelRuntime}`,
    `Latest @babel/cli: ${audit.latest.cli.version || '<missing>'}`,
    `Latest @babel/core: ${audit.latest.core.version || '<missing>'}`,
    `Latest @babel/plugin-transform-runtime: ${audit.latest.transformRuntime.version || '<missing>'}`,
    `Latest @babel/preset-env: ${audit.latest.presetEnv.version || '<missing>'}`,
    `Latest @babel/preset-react: ${audit.latest.presetReact.version || '<missing>'}`,
    `Latest @babel/preset-typescript: ${audit.latest.presetTypescript.version || '<missing>'}`,
    `Latest @babel/plugin-transform-flow-strip-types: ${audit.latest.flowStripTypes.version || '<missing>'}`,
    `Latest @babel/runtime: ${audit.latest.runtime.version || '<missing>'}`,
    `Latest @babel/traverse: ${audit.latest.traverse.version || '<missing>'}`,
    `Latest babel-plugin-polyfill-regenerator: ${audit.latest.polyfillRegenerator.version || '<missing>'}`,
    `Babel 8 node engine: ${audit.babel8NodeEngine}`,
    `Node engine satisfied: ${audit.nodeEngineSatisfied}`,
    `RN preset flow-strip-types dependency range: ${audit.flowStripTypesRange}`,
    `Isolated install completed: ${audit.isolatedInstallCompleted}`,
    `Isolated Babel 8 cohort packages: ${audit.isolatedCohortPackages.length}`,
    ...audit.isolatedCohortPackages.map(
      entry => `- ${entry.name}: installed ${entry.installed}, expected ${entry.expected}, matches ${entry.matches}`,
    ),
    `Transform probe outcome: ${audit.transformProbeOutcome}`,
    `Transform error code: ${audit.transformErrorCode}`,
    `Transform error message: ${audit.transformErrorMessage}`,
    `First plugin path: ${audit.firstPluginPath}`,
    `Blocker classification: ${audit.blockerClassification}`,
    'Required action: keep Babel 8 blocked on RN 0.86.2 until a dedicated RN/Metro/Babel branch proves the transform, Jest, Metro bundle, Android build, and emulator smoke paths.',
    '',
  ].join('\n');

const audit = collectBabel8MigrationProbe();
const summary = formatBabel8MigrationProbeSummary(audit);

mkdirSync(path.dirname(summaryPath), { recursive: true });
writeFileSync(summaryPath, summary);
console.log(summary);
console.log(`Babel 8 migration probe summary written to ${path.relative(root, summaryPath)}`);

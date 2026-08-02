import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const babel = require('@babel/core');
const babelTraverse = require('@babel/traverse/package.json');
const rnBabelPreset = require('@react-native/babel-preset/package.json');
const probeDocPath = path.join(root, 'docs', 'babel-8-migration-probe.md');
const errors = [];

const requirePackageVersion = (sectionName, packageName, expectedVersion) => {
  const section = packageJson[sectionName] || {};

  if (section[packageName] !== expectedVersion) {
    errors.push(
      `package.json ${sectionName}.${packageName} must stay on ${expectedVersion} while the Babel 8 blocker is active. Found ${section[packageName] || '<missing>'}`,
    );
  }
};

[
  '@babel/cli',
  '@babel/core',
  '@babel/plugin-transform-runtime',
  '@babel/preset-env',
  '@babel/preset-react',
  '@babel/preset-typescript',
  '@babel/runtime',
].forEach(packageName => requirePackageVersion('devDependencies', packageName, '7.29.7'));

requirePackageVersion('resolutions', '@babel/core', '7.29.7');
requirePackageVersion('resolutions', '@babel/traverse', '7.29.8');

if (babelTraverse.version !== '7.29.8') {
  errors.push(`installed @babel/traverse must match the 7.29.8 resolution. Found ${babelTraverse.version || '<missing>'}`);
}

try {
  const transformOptions = filename => ({
    filename,
    presets: [require.resolve('@react-native/babel-preset')],
    babelrc: false,
    configFile: false,
  });
  const tsxTransform = babel.transformSync(
    "import React from 'react'; import { Text } from 'react-native'; interface Props { label: string } export const Probe = ({ label }: Props) => <Text>{label}</Text>;",
    transformOptions('GoldWalletBabel7TsxProbe.tsx'),
  );
  const flowTransform = babel.transformSync(
    "// @flow\nopaque type WalletId = string; type Props = { +label: string }; const walletId: WalletId = 'wallet'; export { walletId };",
    transformOptions('GoldWalletBabel7FlowProbe.js'),
  );

  if (!tsxTransform?.code?.includes('react/jsx-runtime') || tsxTransform.code.includes('interface Props')) {
    errors.push('current Babel 7 / React Native preset transform did not compile the representative TSX probe');
  }

  if (
    !flowTransform?.code?.includes("'wallet'") ||
    flowTransform.code.includes('opaque type') ||
    flowTransform.code.includes('type Props') ||
    flowTransform.code.includes('+label')
  ) {
    errors.push('current Babel 7 / React Native preset transform did not strip the representative Flow probe');
  }
} catch (error) {
  errors.push(`current Babel 7 / React Native preset transform failed: ${error instanceof Error ? error.message : String(error)}`);
}

if (packageJson.devDependencies?.['@react-native/babel-preset'] !== '0.86.2') {
  errors.push(
    `package.json devDependencies.@react-native/babel-preset must stay on 0.86.2 for this blocker evidence. Found ${
      packageJson.devDependencies?.['@react-native/babel-preset'] || '<missing>'
    }`,
  );
}

const flowStripTypesRange = rnBabelPreset.dependencies?.['@babel/plugin-transform-flow-strip-types'];

if (!flowStripTypesRange?.startsWith('^7.')) {
  errors.push(
    `@react-native/babel-preset@${rnBabelPreset.version} no longer depends on Babel 7 flow-strip plugin range. Re-run the Babel 8 probe before keeping this blocker. Found ${flowStripTypesRange || '<missing>'}`,
  );
}

if (!existsSync(probeDocPath)) {
  errors.push('docs/babel-8-migration-probe.md must document the Babel 8 blocker evidence');
} else {
  const probeDoc = readFileSync(probeDocPath, 'utf8');
  [
    'BABEL_VERSION_UNSUPPORTED',
    'Requires Babel "^7.0.0-0"',
    '@babel/cli@8.0.4',
    '@babel/core@8.0.1',
    '@babel/plugin-transform-runtime@8.0.1',
    '@babel/plugin-transform-flow-strip-types@8.0.1',
    '@babel/traverse@8.0.4',
    'full stable Babel 8 cohort',
    'Node `^22.18.0 || >=24.11.0`',
    'not a Node-runtime blocker',
    '@react-native/babel-preset',
    '@babel/plugin-transform-flow-strip-types',
    'react-native bundle',
    'test:storage-network:focused',
  ].forEach(snippet => {
    if (!probeDoc.includes(snippet)) {
      errors.push(`docs/babel-8-migration-probe.md must include "${snippet}"`);
    }
  });
}

if (errors.length > 0) {
  console.error('Babel 8 migration probe check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Babel 8 migration probe evidence matches the current RN 0.86 Babel 7 blocker.');

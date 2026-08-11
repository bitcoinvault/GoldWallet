import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const expectedResolution = '8.7.2';

const readPackage = packageName =>
  JSON.parse(readFileSync(path.join(root, 'node_modules', ...packageName.split('/'), 'package.json'), 'utf8'));

const requireFunction = (errors, object, key, owner) => {
  if (typeof object?.[key] !== 'function') {
    errors.push(`${owner}.${key} must be a function`);
  }
};

export const collectProtobufjsOwnerPathState = () => {
  const errors = [];
  const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const packageResolution = packageJson.resolutions?.protobufjs || '';
  const ownerPackages = [
    '@react-native-firebase/app',
    'firebase',
    '@firebase/firestore',
    '@grpc/proto-loader',
    'protobufjs',
  ].map(packageName => ({ packageName, packageJson: readPackage(packageName) }));
  const ownerByName = new Map(ownerPackages.map(owner => [owner.packageName, owner.packageJson]));
  const installedVersion = ownerByName.get('protobufjs').version || '';
  const declaredOwnerRange = ownerByName.get('@grpc/proto-loader').dependencies?.protobufjs || '';
  let decodedValue = '';
  let loadedDefinitions = [];

  if (packageResolution !== expectedResolution) {
    errors.push(
      `package.json resolutions.protobufjs is ${packageResolution || '<missing>'}; expected ${expectedResolution}`,
    );
  }

  if (installedVersion !== expectedResolution) {
    errors.push(`installed protobufjs is ${installedVersion || '<missing>'}; expected ${expectedResolution}`);
  }

  const requiredOwnerEdges = [
    ['@react-native-firebase/app', 'firebase'],
    ['firebase', '@firebase/firestore'],
    ['@firebase/firestore', '@grpc/proto-loader'],
    ['@grpc/proto-loader', 'protobufjs'],
  ];

  requiredOwnerEdges.forEach(([owner, dependency]) => {
    if (!ownerByName.get(owner).dependencies?.[dependency]) {
      errors.push(`${owner} must declare the ${dependency} owner-path dependency`);
    }
  });

  if (!/^\^7\./.test(declaredOwnerRange)) {
    errors.push(
      `@grpc/proto-loader protobufjs range is ${declaredOwnerRange || '<missing>'}; reassess the major resolution override`,
    );
  }

  try {
    const protobuf = require('protobufjs');
    requireFunction(errors, protobuf, 'parse', 'protobufjs');
    requireFunction(errors, protobuf, 'load', 'protobufjs');
    requireFunction(errors, protobuf, 'Root', 'protobufjs');
    requireFunction(errors, protobuf, 'Type', 'protobufjs');

    if (!protobuf.util?.Long) {
      errors.push('protobufjs.util.Long must be available');
    }

    const source = [
      'syntax = "proto3";',
      'package goldwallet;',
      'message Ping { string value = 1; }',
      'service WalletProbe { rpc Check(Ping) returns (Ping); }',
    ].join('\n');
    const parsed = protobuf.parse(source);
    const pingType = parsed.root.lookupType('goldwallet.Ping');
    const encoded = pingType.encode(pingType.create({ value: 'owner-path-ok' })).finish();
    decodedValue = pingType.decode(encoded).value;

    if (decodedValue !== 'owner-path-ok') {
      errors.push(`protobufjs encode/decode returned ${decodedValue || '<missing>'}`);
    }

    const protoLoader = require('@grpc/proto-loader');
    requireFunction(errors, protoLoader, 'loadSync', '@grpc/proto-loader');
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'goldwallet-protobufjs-'));

    try {
      const protoPath = path.join(tempDirectory, 'owner-path.proto');
      writeFileSync(protoPath, source, 'utf8');
      loadedDefinitions = Object.keys(protoLoader.loadSync(protoPath)).sort();
    } finally {
      rmSync(tempDirectory, { recursive: true, force: true });
    }

    for (const expectedDefinition of ['goldwallet.Ping', 'goldwallet.WalletProbe']) {
      if (!loadedDefinitions.includes(expectedDefinition)) {
        errors.push(`@grpc/proto-loader output is missing ${expectedDefinition}`);
      }
    }
  } catch (error) {
    errors.push(`runtime probe failed: ${error.code || error.message}`);
  }

  return {
    packageResolution,
    installedVersion,
    declaredOwnerRange,
    ownerPackages: ownerPackages.map(({ packageName, packageJson: ownerPackageJson }) => ({
      packageName,
      version: ownerPackageJson.version || '',
    })),
    decodedValue,
    loadedDefinitions,
    errors,
  };
};

const printReport = state => {
  console.log('Protobufjs Firebase owner-path check');
  console.log(`package.json resolution: ${state.packageResolution || '<missing>'}`);
  console.log(`Installed protobufjs version: ${state.installedVersion || '<missing>'}`);
  console.log(`@grpc/proto-loader declared range: ${state.declaredOwnerRange || '<missing>'}`);
  console.log('Owner path:');
  state.ownerPackages.forEach(owner => console.log(`- ${owner.packageName}@${owner.version || '<missing>'}`));
  console.log(`Encode/decode value: ${state.decodedValue || '<missing>'}`);
  console.log(`Loaded definitions: ${state.loadedDefinitions.join(', ') || '<missing>'}`);

  if (state.errors.length > 0) {
    console.error('Protobufjs Firebase owner-path check failed:');
    state.errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Protobufjs Firebase owner path is compatible with the 8.7.2 resolution.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectProtobufjsOwnerPathState());
}

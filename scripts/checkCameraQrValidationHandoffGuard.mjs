import {
  getCameraQrValidationCommands,
  getCameraQrValidationHandoffErrors,
  getCameraQrValidationReadinessErrors,
  renderCameraQrValidationCommand,
} from './runCameraQrValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const commands = getCameraQrValidationCommands({ includeAndroidSmoke: false });
const rendered = commands.map(renderCameraQrValidationCommand).join('\n');
const smokeCommands = getCameraQrValidationCommands({ includeAndroidSmoke: true });
const smokeRendered = smokeCommands.map(renderCameraQrValidationCommand).join('\n');

[
  'corepack yarn camera:candidate:audit',
  'corepack yarn camera:candidate:check-summary',
  'corepack yarn camera:qr-migration:audit',
  'corepack yarn camera:qr-migration:check-summary',
  'corepack yarn check:camera-usage-guard',
  'corepack yarn check:camera-usage-scope',
  'corepack yarn check:qr-scan-caller-guard',
  'corepack yarn check:qr-scan-callers',
  'corepack yarn check:qr-scanner-validation-scripts',
  'corepack yarn test:qr-scanner:unit',
  'corepack yarn check:qr-render-usage-guard',
  'corepack yarn check:qr-render-usage',
  'corepack yarn check:qr-render-validation-scripts',
  'corepack yarn test:qr-render:unit',
].forEach(expected => {
  assert(rendered.includes(expected), `Expected Camera/QR handoff commands to include: ${expected}`);
});

[
  'corepack yarn android:dev:assemble',
  'corepack yarn android:dev:smoke:embedded',
  'corepack yarn android:dev:check-smoke-summary',
].forEach(expected => {
  assert(smokeRendered.includes(expected), `Expected Camera/QR smoke handoff commands to include: ${expected}`);
  assert(!rendered.includes(expected), `Default Camera/QR handoff must not include Android smoke command: ${expected}`);
});

assert(
  commands.findIndex(step => step.args.includes('camera:candidate:audit')) <
    commands.findIndex(step => step.args.includes('camera:qr-migration:audit')),
  'Camera candidate audit must run before Camera QR migration audit',
);
assert(
  commands.findIndex(step => step.args.includes('check:qr-scanner-validation-scripts')) <
    commands.findIndex(step => step.args.includes('test:qr-scanner:unit')),
  'QR scanner test guard must run before the focused scanner unit test',
);
assert(
  commands.findIndex(step => step.args.includes('check:qr-render-validation-scripts')) <
    commands.findIndex(step => step.args.includes('test:qr-render:unit')),
  'QR render test guard must run before the focused render unit test',
);
assert(
  smokeCommands.findIndex(step => step.args.includes('test:qr-render:unit')) <
    smokeCommands.findIndex(step => step.args.includes('android:dev:assemble')),
  'Android Camera/QR smoke must run after focused QR render unit validation',
);
assert(
  getCameraQrValidationHandoffErrors({ dryRun: 'false' }).some(error => error.includes('dryRun must be a boolean')),
  'Invalid dryRun option must be rejected',
);
assert(
  getCameraQrValidationHandoffErrors({ dryRun: false, includeAndroidSmoke: 'false' }).some(error =>
    error.includes('includeAndroidSmoke must be a boolean'),
  ),
  'Invalid includeAndroidSmoke option must be rejected',
);

const candidateSummary = [
  'Camera candidate audit',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'Metadata checked on: 2026-06-11',
  'Legacy camera latest: react-native-camera@4.2.1',
  'VisionCamera latest: react-native-vision-camera@5.0.11',
  'VisionCamera Nitro peers: yes',
  'VisionCamera required peer packages: react-native-nitro-modules, react-native-nitro-image',
  'VisionCamera peer dependency ranges: react@*, react-native@*, react-native-nitro-image@*, react-native-nitro-modules@*',
  'CameraKit latest: react-native-camera-kit@18.0.0',
  'CameraKit node engine: >=18',
  'CameraKit peer dependency ranges: react@*, react-native@*',
  'QR renderer latest: react-native-qrcode-svg@6.3.21',
  'QR renderer peer dependency ranges: react@*, react-native@>=0.63.4, react-native-svg@>=14.0.0',
  'QR renderer dependencies: prop-types@^15.8.0, qrcode@^1.5.4, text-encoding@^0.7.0',
  'QR native renderer latest: react-native-svg@15.15.5',
  'QR encoder latest: qrcode@1.5.4',
  'Live npm metadata: matched',
  'Live npm metadata issues: 0',
  'Selected proof target: CameraKit selected and installed; VisionCamera deferred because latest line requires Nitro peers',
  'Proof branch: feature/bem-37-camera-kit-qr-proof',
  'Camera candidate baseline stable: yes',
  'Warnings: 0',
  'Errors: 0',
  'Required action: none; CameraKit scanner baseline is stable after the dedicated proof branch.',
].join('\n');

const migrationSummary = [
  'Camera QR migration audit',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'react-native-camera manifest version: <missing>',
  'react-native-camera-kit manifest version: 18.0.0',
  'QR local-image manifest version: <missing>',
  'QR renderer version: 6.3.21',
  'QR native renderer version: 15.15.5',
  'qrcode resolution: 1.5.4',
  'CameraKit latest target: react-native-camera-kit@18.0.0',
  'CameraKit peer dependency ranges: react@*, react-native@*',
  'QR renderer latest target: react-native-qrcode-svg@6.3.21',
  'QR renderer peer dependency ranges: react@*, react-native@>=0.63.4, react-native-svg@>=14.0.0',
  'QR renderer dependencies: prop-types@^15.8.0, qrcode@^1.5.4, text-encoding@^0.7.0',
  'QR native renderer latest target: react-native-svg@15.15.5',
  'QR encoder latest target: qrcode@1.5.4',
  'Live QR targets: matched',
  'Live QR target issues: 0',
  'iOS Podfile.lock refresh required: no',
  'iOS stale removed camera pods: none',
  'Camera QR migration wiring valid: yes',
  'Camera QR migration baseline stable: yes',
  'Warnings: 0',
  'Readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none; camera QR migration baseline is stable after the dedicated scanner replacement branch.',
].join('\n');

assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
  }).length === 0,
  'Camera/QR readiness fixtures must pass',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: '',
    migrationSummaryText: migrationSummary,
  }).some(error => error.includes('Camera candidate summary is missing')),
  'Camera/QR readiness must reject missing candidate summary',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: 'CameraKit latest: react-native-camera-kit@18.0.0',
    migrationSummaryText: migrationSummary,
  }).some(error => error.includes('Camera candidate summary is invalid')),
  'Camera/QR readiness must reject partial candidate summary',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: 'Camera QR migration baseline stable: yes',
  }).some(error => error.includes('Camera QR migration summary is invalid')),
  'Camera/QR readiness must reject partial migration summary',
);

console.log('Camera/QR validation handoff guard checks are valid.');

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};
const errors = [];
const readinessIssues = [];
const warnings = [];

const requireSnippet = (label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

const requireFile = relativePath => {
  if (!exists(relativePath)) {
    errors.push(`${relativePath} is missing`);
    return '';
  }

  return read(relativePath);
};

const cameraVersion = dependencies['react-native-camera'];
const localQrImageVersion = dependencies['@remobile/react-native-qrcode-local-image'];
const qrRendererVersion = dependencies['react-native-qrcode-svg'];
const rootQrcodeVersion = (packageJson.resolutions || {}).qrcode;

if (cameraVersion !== '^3.33.0') {
  readinessIssues.push(`package.json has react-native-camera@${cameraVersion || '<missing>'}; expected the current legacy baseline ^3.33.0`);
}

if (localQrImageVersion !== '1.0.4') {
  readinessIssues.push(
    `package.json has @remobile/react-native-qrcode-local-image@${localQrImageVersion || '<missing>'}; expected current legacy baseline 1.0.4`,
  );
}

if (qrRendererVersion !== '6.1.1') {
  readinessIssues.push(`package.json has react-native-qrcode-svg@${qrRendererVersion || '<missing>'}; expected current QR renderer baseline 6.1.1`);
}

if (rootQrcodeVersion !== '1.4.4') {
  readinessIssues.push(`package.json resolutions has qrcode@${rootQrcodeVersion || '<missing>'}; expected current TextEncoder-safe baseline 1.4.4`);
}

const androidAppGradle = requireFile('android/app/build.gradle');
const androidManifest = requireFile('android/app/src/main/AndroidManifest.xml');
const scanQrScreen = requireFile('src/screens/ScanQrCodeScreen.tsx');
const reactNativeConfig = requireFile('react-native.config.js');
const replacementPlan = requireFile('docs/camera-replacement-plan.md');
const nativeModulePlan = requireFile('docs/native-module-upgrade-plan.md');
const warningBaseline = requireFile('local-docs/android-warning-audit-summary.txt');
const iosInfoPlists = ['ios/GoldWallet/Info.plist', 'ios/GoldWalletDev-Info.plist', 'ios/GoldWalletStage-Info.plist'];

requireSnippet('android/app/build.gradle', androidAppGradle, "missingDimensionStrategy 'react-native-camera', 'general'");
requireSnippet('AndroidManifest.xml', androidManifest, 'android.permission.CAMERA');
requireSnippet('ScanQrCodeScreen.tsx', scanQrScreen, "from 'react-native-camera'");
requireSnippet('ScanQrCodeScreen.tsx', scanQrScreen, 'BarCodeReadEvent');
requireSnippet('ScanQrCodeScreen.tsx', scanQrScreen, 'RNCamera');
requireSnippet('ScanQrCodeScreen.tsx', scanQrScreen, 'onBarCodeRead={this.onBarCodeScanned}');
requireSnippet('ScanQrCodeScreen.tsx', scanQrScreen, 'barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}');
requireSnippet('ScanQrCodeScreen.tsx', scanQrScreen, 'onBarCodeScan(event.data)');
requireSnippet('react-native.config.js', reactNativeConfig, "'@remobile/react-native-qrcode-local-image'");
requireSnippet('react-native.config.js', reactNativeConfig, 'android: null');
requireSnippet('docs/camera-replacement-plan.md', replacementPlan, 'Branch: `feature/bem-camera-qr-scanner-migration`');
requireSnippet('docs/camera-replacement-plan.md', replacementPlan, 'VisionCamera');
requireSnippet('docs/camera-replacement-plan.md', replacementPlan, 'react-native-camera` still contains `jcenter()`');
requireSnippet('docs/native-module-upgrade-plan.md', nativeModulePlan, 'Replace `react-native-camera` only in the dedicated QR scanner migration branch.');

iosInfoPlists.forEach(relativePath => {
  requireSnippet(relativePath, requireFile(relativePath), 'NSCameraUsageDescription');
});

if (warningBaseline && !warningBaseline.includes('react-native-camera') && !warningBaseline.includes('Targeted Android Gradle warnings: 0')) {
  warnings.push('local Android warning audit summary does not mention react-native-camera or a zero-warning target state; refresh the warning audit before migration.');
}

if (cameraVersion) {
  warnings.push('react-native-camera remains installed and deprecated; this audit is a readiness check, not the migration itself.');
}

console.log('Camera QR migration audit');
console.log(`react-native-camera manifest version: ${cameraVersion || '<missing>'}`);
console.log(`QR render pair: react-native-qrcode-svg@${qrRendererVersion || '<missing>'}, qrcode resolution ${rootQrcodeVersion || '<missing>'}`);

if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(warning => console.log(`- ${warning}`));
}

if (errors.length > 0) {
  console.log('Camera QR migration wiring is invalid:');
  errors.forEach(error => console.log(`- ${error}`));
  process.exit(1);
}

if (readinessIssues.length > 0) {
  console.log('Camera QR migration baseline needs review:');
  readinessIssues.forEach(issue => console.log(`- ${issue}`));
} else {
  console.log('Camera QR migration baseline is stable for a dedicated scanner replacement branch.');
}

console.log('Camera QR migration wiring is present for Android/iOS permissions, current scanner runtime, guarded legacy QR image autolinking, and migration documentation.');

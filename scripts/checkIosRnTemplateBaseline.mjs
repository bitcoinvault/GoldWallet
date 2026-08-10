import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getIosRnTemplateBaselineErrors } from './iosRnTemplateBaselineGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const readText = relativePath => read(relativePath).replace(/\r\n?/g, '\n');
const environment = {
  packageJson: JSON.parse(read('package.json')),
  podfile: readText('ios/Podfile'),
  pbxproj: readText('ios/GoldWallet.xcodeproj/project.pbxproj'),
  appDelegate: readText('ios/GoldWallet/AppDelegate.m'),
  xcodeEnv: readText('ios/.xcode.env'),
  macValidationHandoff: readText('scripts/runIosMacValidationHandoff.mjs'),
  detoxIosBuild: readText('scripts/runDetoxIosBuild.mjs'),
  gemfile: readText('Gemfile'),
};
const errors = getIosRnTemplateBaselineErrors(environment);

if (errors.length > 0) {
  console.error('iOS React Native template baseline check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const crlfEnvironment = Object.fromEntries(
  Object.entries(environment).map(([key, value]) => [
    key,
    typeof value === 'string' ? value.replace(/\r\n?/g, '\n').replace(/\n/g, '\r\n') : value,
  ]),
);
const crlfErrors = getIosRnTemplateBaselineErrors(crlfEnvironment);

if (crlfErrors.length > 0) {
  console.error('iOS React Native template baseline guard rejected a valid CRLF checkout:');
  crlfErrors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const mutations = [
  ['legacy native modules helper', { ...environment, podfile: `${environment.podfile}\nrequire_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'` }],
  ['abstract target autolinking', { ...environment, podfile: `${environment.podfile}\nabstract_target 'BrokenShared' do\nend` }],
  ['Firebase SPM enabled before macOS validation', { ...environment, podfile: environment.podfile.replace('$RNFirebaseDisableSPM = true', '$RNFirebaseDisableSPM = false') }],
  ['duplicate Firebase SPM opt-out', { ...environment, podfile: `${environment.podfile}\n$RNFirebaseDisableSPM = true` }],
  ['late Firebase SPM opt-out', { ...environment, podfile: environment.podfile.replace('$RNFirebaseDisableSPM = true\n', '').replace("target 'GoldWallet' do", "target 'GoldWallet' do\n  $RNFirebaseDisableSPM = true") }],
  ['commented early and active late Firebase SPM opt-out', { ...environment, podfile: environment.podfile.replace('$RNFirebaseDisableSPM = true', '# $RNFirebaseDisableSPM = true').replace("target 'GoldWallet' do\n  configure_goldwallet_target\nend", "target 'GoldWallet' do\n  configure_goldwallet_target\nend\n\n$RNFirebaseDisableSPM = true") }],
  ['missing concrete Firebase-safe autolink', { ...environment, podfile: environment.podfile.replace("target 'GoldWallet Dev' do\n  configure_goldwallet_target\nend", "target 'GoldWallet Dev' do\nend") }],
  ['missing app path', { ...environment, podfile: environment.podfile.replace(':app_path => "#{Pod::Config.instance.installation_root}/..",', '') }],
  ['legacy Swift', { ...environment, pbxproj: environment.pbxproj.replace('SWIFT_VERSION = 5.0;', 'SWIFT_VERSION = 4.2;') }],
  ['legacy C++', { ...environment, pbxproj: environment.pbxproj.replace('CLANG_CXX_LANGUAGE_STANDARD = "c++20";', 'CLANG_CXX_LANGUAGE_STANDARD = "gnu++0x";') }],
  ['legacy bridge startup', { ...environment, appDelegate: `${environment.appDelegate}\n[[RCTBridge alloc] initWithDelegate:self launchOptions:nil];` }],
  ['missing dependency provider', { ...environment, appDelegate: environment.appDelegate.replace('dependencyProvider = [RCTAppDependencyProvider new]', 'dependencyProvider = nil') }],
  ['legacy Xcode build system', { ...environment, macValidationHandoff: `${environment.macValidationHandoff}\n-UseNewBuildSystem=NO` }],
  ['legacy Detox Xcode build system', { ...environment, detoxIosBuild: `${environment.detoxIosBuild}\n-UseNewBuildSystem=NO` }],
  ['missing Xcode Node environment', { ...environment, xcodeEnv: '# missing NODE_BINARY' }],
  ['legacy CocoaPods toolchain', { ...environment, gemfile: environment.gemfile.replace("gem 'cocoapods', '1.16.2'", "gem 'cocoapods', '1.15.0'") }],
  ['legacy Sentry bundle phase', { ...environment, pbxproj: environment.pbxproj.replace('../node_modules/@sentry/react-native/scripts/sentry-xcode.sh', '../node_modules/@sentry/cli/bin/sentry-cli') }],
];

mutations.forEach(([label, mutation]) => {
  if (getIosRnTemplateBaselineErrors(mutation).length === 0) {
    console.error(`iOS React Native template baseline guard accepted invalid mutation: ${label}`);
    process.exit(1);
  }
});

console.log('iOS React Native 0.86 template baseline and mutation checks are valid.');

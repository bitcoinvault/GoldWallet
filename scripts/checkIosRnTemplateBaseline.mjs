import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getIosRnTemplateBaselineErrors } from './iosRnTemplateBaselineGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const environment = {
  packageJson: JSON.parse(read('package.json')),
  podfile: read('ios/Podfile'),
  pbxproj: read('ios/GoldWallet.xcodeproj/project.pbxproj'),
  appDelegate: read('ios/GoldWallet/AppDelegate.m'),
  xcodeEnv: read('ios/.xcode.env'),
  macValidationHandoff: read('scripts/runIosMacValidationHandoff.mjs'),
  detoxIosBuild: read('scripts/runDetoxIosBuild.mjs'),
  gemfile: read('Gemfile'),
};
const errors = getIosRnTemplateBaselineErrors(environment);

if (errors.length > 0) {
  console.error('iOS React Native template baseline check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const mutations = [
  ['legacy native modules helper', { ...environment, podfile: `${environment.podfile}\nrequire_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'` }],
  ['abstract target autolinking', { ...environment, podfile: `${environment.podfile}\nabstract_target 'BrokenShared' do\nend` }],
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

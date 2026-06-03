import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const errors = [];

const forbiddenPackages = ['react-native-flipper', 'redux-flipper', 'flipper-plugin-redux-debugger'];
const dependencyGroups = {
  dependencies: packageJson.dependencies || {},
  devDependencies: packageJson.devDependencies || {},
};

Object.entries(dependencyGroups).forEach(([groupName, dependencies]) => {
  forbiddenPackages.forEach(packageName => {
    if (Object.prototype.hasOwnProperty.call(dependencies, packageName)) {
      errors.push(`${packageName} must not be listed in package.json ${groupName}`);
    }
  });
});

const forbiddenFileSnippets = [
  {
    file: 'src/state/store.ts',
    snippets: ['redux-flipper'],
  },
  {
    file: 'android/gradle.properties',
    snippets: ['FLIPPER_VERSION'],
  },
  {
    file: 'android/app/build.gradle',
    snippets: ['com.facebook.flipper', 'flipper-network-plugin', 'flipper-fresco-plugin'],
  },
  {
    file: 'android/app/src/main/AndroidManifest.xml',
    snippets: ['FlipperDiagnosticActivity'],
  },
  {
    file: 'android/app/src/main/java/io/goldwallet/wallet/MainApplication.java',
    snippets: ['ReactNativeFlipper', 'initializeFlipper'],
  },
  {
    file: 'ios/GoldWallet/AppDelegate.m',
    snippets: ['FlipperKit', 'FB_SONARKIT_ENABLED', 'InitializeFlipper'],
  },
  {
    file: 'ios/Podfile',
    snippets: ['use_flipper!', 'FlipperKit'],
  },
];

forbiddenFileSnippets.forEach(({ file, snippets }) => {
  const content = read(file);

  snippets.forEach(snippet => {
    if (content.includes(snippet)) {
      errors.push(`${file} must not contain ${snippet}`);
    }
  });
});

if (existsSync(path.join(root, 'android/app/src/debug/java/io/goldwallet/wallet/ReactNativeFlipper.java'))) {
  errors.push('android/app/src/debug/java/io/goldwallet/wallet/ReactNativeFlipper.java must not exist');
}

if (errors.length > 0) {
  console.error('Flipper removal check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Flipper debug stack remains removed from package, Android, iOS, and Redux wiring.');

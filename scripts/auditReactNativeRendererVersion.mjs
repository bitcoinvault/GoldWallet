import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const requiredReactNativeRendererVersionDocs = [
  'docs/react-package-coupling-audit.md',
  'docs/react-native-upgrade-path.md',
  'docs/wallet-modernization-baseline.md',
];

export const requiredReactNativeRendererVersionSnippets = [
  ['docs/react-package-coupling-audit.md', 'React Native renderer exact-version audit'],
  ['docs/react-package-coupling-audit.md', 'Current bundled React Native renderer: `19.2.3`'],
  ['docs/react-package-coupling-audit.md', 'corepack yarn react:renderer-version:audit'],
  ['docs/react-native-upgrade-path.md', 'React Native renderer exact-version audit is tracked in `docs/react-package-coupling-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'React Native renderer exact-version audit is tracked in `docs/react-package-coupling-audit.md`'],
];

const rendererDirectory = path.join(root, 'node_modules/react-native/Libraries/Renderer/implementations');

export const parseReactNativeRendererVersions = rendererFiles => {
  const rendererVersions = new Set();
  const exactCheckVersions = new Set();

  rendererFiles.forEach(({ content }) => {
    const versionMatches = content.matchAll(/version:\s*"([^"]+)"\s*,\s*rendererPackageName:\s*"react-native-renderer"/g);
    for (const match of versionMatches) {
      rendererVersions.add(match[1]);
    }

    const exactCheckMatches = content.matchAll(/if\s*\(\s*"([^"]+)"\s*!==\s*isomorphicReactPackageVersion\s*\)/g);
    for (const match of exactCheckMatches) {
      exactCheckVersions.add(match[1]);
    }
  });

  return {
    rendererVersions: [...rendererVersions].sort(),
    exactCheckVersions: [...exactCheckVersions].sort(),
  };
};

export const getReactNativeRendererVersionIssues = ({
  dependencies,
  devDependencies,
  scripts,
  rendererFiles,
  docs,
  existingDocs,
}) => {
  const errors = [];
  const { rendererVersions, exactCheckVersions } = parseReactNativeRendererVersions(rendererFiles);
  const expectedRendererVersion = rendererVersions.length === 1 ? rendererVersions[0] : null;

  if (!dependencies.react) {
    errors.push('package.json is missing react dependency');
  }

  if (!dependencies['react-native']) {
    errors.push('package.json is missing react-native dependency');
  }

  if (!devDependencies['react-test-renderer']) {
    errors.push('package.json is missing react-test-renderer devDependency');
  }

  if (rendererFiles.length === 0) {
    errors.push('No React Native renderer implementation files were found under node_modules/react-native');
  }

  if (rendererVersions.length === 0) {
    errors.push('No react-native-renderer version markers were found');
  }

  if (rendererVersions.length > 1) {
    errors.push(`Multiple react-native-renderer versions were found: ${rendererVersions.join(', ')}`);
  }

  if (expectedRendererVersion && exactCheckVersions.some(version => version !== expectedRendererVersion)) {
    errors.push(
      `React Native renderer exact-check versions ${exactCheckVersions.join(', ')} do not match renderer version ${expectedRendererVersion}`,
    );
  }

  if (expectedRendererVersion && dependencies.react !== expectedRendererVersion) {
    errors.push(
      `React package version ${dependencies.react || '<missing>'} does not match React Native renderer exact version ${expectedRendererVersion}`,
    );
  }

  if (devDependencies['react-test-renderer'] && dependencies.react && devDependencies['react-test-renderer'] !== dependencies.react) {
    errors.push(
      `react-test-renderer ${devDependencies['react-test-renderer']} does not match React package version ${dependencies.react}`,
    );
  }

  if (scripts['react:renderer-version:audit'] !== 'node scripts/auditReactNativeRendererVersion.mjs') {
    errors.push('package.json is missing react:renderer-version:audit script');
  }

  if (scripts['check:react-renderer-version-guard'] !== 'node scripts/checkReactNativeRendererVersionGuard.mjs') {
    errors.push('package.json is missing check:react-renderer-version-guard script');
  }

  requiredReactNativeRendererVersionDocs.forEach(relativePath => {
    if (!existingDocs.has(relativePath)) {
      errors.push(`${relativePath} is missing`);
    }
  });

  requiredReactNativeRendererVersionSnippets.forEach(([relativePath, snippet]) => {
    const content = docs[relativePath] || '';
    if (!content.includes(snippet)) {
      errors.push(`${relativePath} is missing "${snippet}"`);
    }
  });

  return {
    errors,
    rendererVersions,
    exactCheckVersions,
    expectedRendererVersion,
  };
};

const collectRendererFiles = () => {
  if (!existsSync(rendererDirectory)) {
    return [];
  }

  return readdirSync(rendererDirectory)
    .filter(fileName => fileName.endsWith('.js'))
    .map(fileName => {
      const relativePath = path.relative(root, path.join(rendererDirectory, fileName));
      return {
        relativePath,
        content: read(relativePath),
      };
    });
};

const collectEnvironment = () => {
  const packageJson = JSON.parse(read('package.json'));
  const docs = {};
  const existingDocs = new Set();

  requiredReactNativeRendererVersionDocs.forEach(relativePath => {
    try {
      docs[relativePath] = read(relativePath);
      existingDocs.add(relativePath);
    } catch {
      docs[relativePath] = '';
    }
  });

  return {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    scripts: packageJson.scripts || {},
    rendererFiles: collectRendererFiles(),
    docs,
    existingDocs,
  };
};

const printReport = environment => {
  const { errors, rendererVersions, exactCheckVersions, expectedRendererVersion } = getReactNativeRendererVersionIssues(environment);

  console.log('React Native renderer exact-version audit');
  console.log(`React Native: ${environment.dependencies['react-native'] || '<missing>'}`);
  console.log(`React: ${environment.dependencies.react || '<missing>'}`);
  console.log(`react-test-renderer: ${environment.devDependencies['react-test-renderer'] || '<missing>'}`);
  console.log(`Renderer implementation files: ${environment.rendererFiles.length}`);
  console.log(`Renderer versions: ${rendererVersions.join(', ') || '<missing>'}`);
  console.log(`Renderer exact-check versions: ${exactCheckVersions.join(', ') || '<missing>'}`);
  console.log(`Expected React from renderer: ${expectedRendererVersion || '<missing>'}`);

  if (errors.length > 0) {
    console.log('React Native renderer exact-version audit is invalid:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('React Native renderer exact-version audit matches the current React/RN baseline.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}

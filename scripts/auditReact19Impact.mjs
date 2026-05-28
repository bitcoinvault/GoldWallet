import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { expectedReactNativeTargetSnapshot } from './auditReactNativeTargetSnapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

const sourceRoots = ['src', 'tests'];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

const walk = dir => {
  const absolute = path.join(root, dir);
  return readdirSync(absolute).flatMap(entry => {
    const entryPath = path.join(absolute, entry);
    const relativePath = path.relative(root, entryPath).replace(/\\/g, '/');
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      return walk(relativePath);
    }

    return sourceExtensions.has(path.extname(entryPath)) ? [relativePath] : [];
  });
};

export const requiredReact19ImpactDocs = [
  'docs/react19-impact-audit.md',
  'docs/react-native-upgrade-path.md',
  'docs/react-native-target-snapshot.md',
  'docs/wallet-modernization-baseline.md',
];

export const requiredReact19ImpactSnippets = [
  ['docs/react19-impact-audit.md', 'Current React: `17.0.2`'],
  ['docs/react19-impact-audit.md', 'Current React types: `^16.9.31`'],
  ['docs/react19-impact-audit.md', 'Current react-test-renderer: `17.0.2`'],
  ['docs/react19-impact-audit.md', 'Target React peer from RN target snapshot: `^19.2.3`'],
  ['docs/react19-impact-audit.md', 'Class component surfaces exist and must be smoke-tested after the React/RN baseline changes.'],
  ['docs/react19-impact-audit.md', 'Default props on class components exist and should be checked against the updated TypeScript/React type behavior.'],
  ['docs/react19-impact-audit.md', 'corepack yarn react19:impact:audit'],
  ['docs/react-native-upgrade-path.md', 'React 19 impact audit is tracked in `docs/react19-impact-audit.md`'],
  ['docs/react-native-target-snapshot.md', 'React 19 impact audit is tracked in `docs/react19-impact-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'React 19 impact audit is tracked in `docs/react19-impact-audit.md`'],
];

export const getReact19ImpactIssues = ({ dependencies, devDependencies, scripts, docs, existingDocs, inventory }) => {
  const errors = [];

  if (dependencies.react !== '17.0.2') {
    errors.push(`package.json has react@${dependencies.react || '<missing>'}; expected current React baseline 17.0.2`);
  }

  if (devDependencies['@types/react'] !== '^16.9.31') {
    errors.push(`package.json has @types/react@${devDependencies['@types/react'] || '<missing>'}; expected current React types baseline ^16.9.31`);
  }

  if (devDependencies['react-test-renderer'] !== '17.0.2') {
    errors.push(`package.json has react-test-renderer@${devDependencies['react-test-renderer'] || '<missing>'}; expected current renderer baseline 17.0.2`);
  }

  if (scripts['react19:impact:audit'] !== 'node scripts/auditReact19Impact.mjs') {
    errors.push('package.json is missing react19:impact:audit script');
  }

  if (expectedReactNativeTargetSnapshot.targetReactPeer !== '^19.2.3') {
    errors.push(`RN target snapshot has React peer ${expectedReactNativeTargetSnapshot.targetReactPeer}; expected ^19.2.3 for this audit`);
  }

  if (inventory.classComponentFiles.length === 0) {
    errors.push('React 19 impact inventory did not find any class component surfaces; refresh the audit if the app was converted');
  }

  if (inventory.staticDefaultPropsFiles.length === 0) {
    errors.push('React 19 impact inventory did not find any static defaultProps surfaces; refresh the audit if they were removed');
  }

  requiredReact19ImpactDocs.forEach(relativePath => {
    if (!existingDocs.has(relativePath)) {
      errors.push(`${relativePath} is missing`);
    }
  });

  requiredReact19ImpactSnippets.forEach(([relativePath, snippet]) => {
    const content = docs[relativePath] || '';
    if (!content.includes(snippet)) {
      errors.push(`${relativePath} is missing "${snippet}"`);
    }
  });

  return { errors };
};

const collectInventory = () => {
  const files = sourceRoots.flatMap(walk);
  const byPattern = pattern =>
    files.filter(relativePath => pattern.test(read(relativePath)));

  return {
    filesScanned: files.length,
    classComponentFiles: byPattern(/extends\s+React\.(PureComponent|Component)/),
    componentWillUnmountFiles: byPattern(/\bcomponentWillUnmount\s*\(/),
    staticDefaultPropsFiles: byPattern(/\bstatic\s+defaultProps\s*=/),
    functionComponentTypeFiles: byPattern(/\bFC\b|React\.FC/),
    createRefFiles: byPattern(/\bReact\.createRef\b|\bcreateRef</),
  };
};

const collectEnvironment = () => {
  const packageJson = JSON.parse(read('package.json'));
  const docs = {};
  const existingDocs = new Set();

  requiredReact19ImpactDocs.forEach(relativePath => {
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
    docs,
    existingDocs,
    inventory: collectInventory(),
  };
};

const printList = (label, files) => {
  console.log(`${label}: ${files.length}`);
  files.slice(0, 12).forEach(file => console.log(`- ${file}`));
  if (files.length > 12) {
    console.log(`- ... ${files.length - 12} more`);
  }
};

const printReport = environment => {
  const { errors } = getReact19ImpactIssues(environment);
  const { inventory } = environment;

  console.log('React 19 impact audit');
  console.log(`Current React: ${environment.dependencies.react || '<missing>'}`);
  console.log(`Current @types/react: ${environment.devDependencies['@types/react'] || '<missing>'}`);
  console.log(`Current react-test-renderer: ${environment.devDependencies['react-test-renderer'] || '<missing>'}`);
  console.log(`Target React peer from RN target snapshot: ${expectedReactNativeTargetSnapshot.targetReactPeer}`);
  console.log(`Source files scanned: ${inventory.filesScanned}`);
  printList('Class component files', inventory.classComponentFiles);
  printList('componentWillUnmount files', inventory.componentWillUnmountFiles);
  printList('static defaultProps files', inventory.staticDefaultPropsFiles);
  printList('Function component type files', inventory.functionComponentTypeFiles);
  printList('createRef files', inventory.createRefFiles);

  if (errors.length > 0) {
    console.log('React 19 impact audit is invalid:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('React 19 impact audit matches the current React 17 baseline and RN target snapshot.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}

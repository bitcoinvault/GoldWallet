import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowPath = '.github/workflows/ios-macos-validation.yml';
const absoluteWorkflowPath = path.join(root, workflowPath);

const approvedActions = [
  'actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0',
  'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
  'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1',
];

const getStepContaining = (workflow, marker) => {
  const lines = workflow.split(/\r?\n/);
  const markerIndex = lines.findIndex(line => line.includes(marker));

  if (markerIndex === -1) return '';

  let startIndex = markerIndex;
  for (let index = markerIndex; index >= 0; index -= 1) {
    if (/^\s*- name:/.test(lines[index])) {
      startIndex = index;
      break;
    }
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^\s*- name:/.test(lines[index])) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join('\n');
};

const validateWorkflow = workflow => {
  const errors = [];
  const requireMatch = (pattern, message) => {
    if (!pattern.test(workflow)) errors.push(message);
  };
  const rejectMatch = (pattern, message) => {
    if (pattern.test(workflow)) errors.push(message);
  };

  requireMatch(/^\s*push:\s*$/m, 'workflow must validate integration-branch pushes');
  requireMatch(
    /branches:\s*\[upgrade\/wallet-modernization\]/,
    'push trigger must be limited to the integration branch',
  );
  requireMatch(/^\s*pull_request:\s*$/m, 'workflow must validate pull requests');
  requireMatch(/^\s*workflow_dispatch:\s*$/m, 'workflow must support explicit dispatch');
  requireMatch(/^\s+all_schemes:\s*$/m, 'workflow dispatch must expose the all_schemes input');
  requireMatch(
    /^permissions:\s*\r?\n\s+contents:\s*read\s*$/m,
    'workflow permissions must be limited to contents: read',
  );
  requireMatch(/^\s+runs-on:\s*macos-15-intel\s*$/m, 'workflow must use the pinned macos-15-intel runner image');
  requireMatch(/^\s+timeout-minutes:\s*[1-9]\d*\s*$/m, 'workflow job must define a positive timeout');
  requireMatch(
    /^\s+DEVELOPER_DIR:\s*\/Applications\/Xcode_16\.4\.app\/Contents\/Developer\s*$/m,
    'workflow must select Xcode 16.4 explicitly',
  );
  requireMatch(/^\s+BUNDLE_PATH:\s*vendor\/bundle\s*$/m, 'workflow must install Ruby gems into the workspace');
  requireMatch(/^\s+SENTRY_DISABLE_AUTO_UPLOAD:\s*['"]true['"]\s*$/m, 'workflow must disable Sentry auto-upload');
  requireMatch(/^\s+node-version-file:\s*\.nvmrc\s*$/m, 'setup-node must use .nvmrc');
  requireMatch(/corepack yarn install --frozen-lockfile/, 'workflow must install the frozen Yarn dependency graph');
  requireMatch(
    /corepack yarn ios:mac-validation:handoff "\$\{args\[@\]\}"/,
    'workflow must execute the project-owned iOS macOS handoff',
  );
  requireMatch(
    /git diff --exit-code -- ios\/Podfile\.lock/,
    'workflow must fail until the generated Podfile.lock is reviewed and committed',
  );
  requireMatch(/args=\(--all-schemes\)/, 'workflow must support complete shared-scheme validation');
  requireMatch(/GITHUB_STEP_SUMMARY/, 'workflow must publish a non-secret job summary');
  const artifactStep = getStepContaining(workflow, 'Retain Podfile and validation evidence');
  if (!/if:\s*always\(\)/.test(artifactStep)) errors.push('artifact upload must run even after validation failure');
  if (!/ios\/Podfile\.lock/.test(artifactStep) || !/local-docs\/ios-\*\.txt/.test(artifactStep)) {
    errors.push('workflow must retain Podfile.lock and iOS summaries');
  }

  const uses = [...workflow.matchAll(/^\s+(?:-\s+)?uses:\s*(\S+(?:\s+#\s*\S+)?)\s*$/gm)].map(match => match[1]);

  approvedActions.forEach(action => {
    if (!uses.includes(action)) errors.push(`workflow must use approved action: ${action}`);
  });
  uses.forEach(action => {
    if (!approvedActions.includes(action)) errors.push(`workflow uses an unapproved action: ${action}`);
  });

  rejectMatch(/^\s*pull_request_target:\s*$/m, 'pull_request_target is forbidden');
  rejectMatch(/^\s*(?:permissions:\s*)?write-all\s*$/m, 'write-all permissions are forbidden');
  rejectMatch(/^\s+[a-z-]+:\s*write\s*$/m, 'write permissions are forbidden');
  rejectMatch(/\$\{\{\s*secrets\./i, 'secret expressions are forbidden');
  rejectMatch(/continue-on-error:\s*true/, 'the iOS build gate must fail closed');
  rejectMatch(/macos-latest/, 'floating macos-latest runners are forbidden');
  rejectMatch(/Xcode_(?:26|27)/, 'unvalidated Xcode major versions are forbidden');

  return errors;
};

if (!existsSync(absoluteWorkflowPath)) {
  console.error(`iOS macOS validation workflow guard failed: missing ${workflowPath}`);
  process.exit(1);
}

const workflow = readFileSync(absoluteWorkflowPath, 'utf8');
const errors = validateWorkflow(workflow);
const mutations = [
  ['floating runner', workflow.replace('runs-on: macos-15-intel', 'runs-on: macos-latest'), 'pinned macos-15-intel'],
  ['write permission', workflow.replace('contents: read', 'contents: write'), 'write permissions'],
  ['secret access', `${workflow}\nenv:\n  TOKEN: \${{ secrets.TOKEN }}\n`, 'secret expressions'],
  ['floating action', `${workflow}\n      - uses: vendor/action@main\n`, 'unapproved action'],
  [
    'unfrozen install',
    workflow.replace('corepack yarn install --frozen-lockfile', 'corepack yarn install'),
    'frozen Yarn',
  ],
  [
    'conditional artifact loss',
    workflow.replace(
      '- name: Retain Podfile and validation evidence\n        if: always()',
      '- name: Retain Podfile and validation evidence\n        if: success()',
    ),
    'even after validation failure',
  ],
  [
    'uncommitted lock accepted',
    workflow.replace('git diff --exit-code -- ios/Podfile.lock', 'git status --short ios/Podfile.lock'),
    'reviewed and committed',
  ],
];

mutations.forEach(([label, fixture, expectedError]) => {
  if (!validateWorkflow(fixture).some(error => error.includes(expectedError))) {
    errors.push(`${label} mutation did not produce ${expectedError}`);
  }
});

if (errors.length > 0) {
  console.error(`iOS macOS validation workflow guard failed with ${errors.length} error(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('iOS macOS validation workflow guard checks passed.');

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowPath = '.github/workflows/electrum-certificate-readiness.yml';
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

  requireMatch(/^\s*schedule:\s*$/m, 'workflow must define a schedule trigger');
  requireMatch(/^\s*workflow_dispatch:\s*$/m, 'workflow must define a workflow_dispatch trigger');
  requireMatch(
    /^permissions:\s*\r?\n\s+contents:\s*read\s*$/m,
    'workflow permissions must be limited to contents: read',
  );
  requireMatch(/^\s+timeout-minutes:\s*[1-9]\d*\s*$/m, 'workflow job must define a positive timeout');
  requireMatch(/^\s+node-version-file:\s*['"]?\.nvmrc['"]?\s*$/m, 'setup-node must use .nvmrc');

  const uses = [...workflow.matchAll(/^\s+(?:-\s+)?uses:\s*(\S+(?:\s+#\s*\S+)?)\s*$/gm)].map(match => match[1]);

  for (const action of approvedActions) {
    if (!uses.includes(action)) errors.push(`workflow must use approved action: ${action}`);
  }
  for (const action of uses) {
    if (!approvedActions.includes(action)) errors.push(`workflow uses an unapproved action: ${action}`);
  }

  const gateStep = getStepContaining(workflow, 'Run strict Electrum readiness gate');
  const artifactStep = getStepContaining(workflow, 'Upload Electrum readiness summary');
  const failureStep = getStepContaining(workflow, 'Enforce readiness gate result');

  requireMatch(/GITHUB_STEP_SUMMARY/, 'workflow must append a non-secret job summary');
  if (!/id:\s*electrum_gate/.test(gateStep)) errors.push('strict gate step must use id: electrum_gate');
  if (!/continue-on-error:\s*true/.test(gateStep))
    errors.push('strict gate must preserve evidence with continue-on-error');
  if (!/run:\s*node scripts\/auditElectrumEndpointReadiness\.mjs --require-ready/.test(gateStep)) {
    errors.push('workflow must run the strict Electrum release gate');
  }
  if (/^\s+if:/m.test(gateStep)) errors.push('strict gate step must not be conditional');
  if (!/if:\s*(?:\$\{\{\s*)?always\(\)(?:\s*\}\})?/.test(artifactStep)) {
    errors.push('artifact upload must run with always()');
  }
  if (!/local-docs\/electrum-endpoint-readiness-summary\.txt/.test(artifactStep)) {
    errors.push('artifact upload must retain the Electrum readiness summary');
  }
  if (
    !/if:\s*\$\{\{\s*always\(\)\s*&&\s*steps\.electrum_gate\.outcome\s*!=\s*['"]success['"]\s*\}\}/.test(failureStep)
  ) {
    errors.push('final failure must explicitly enforce the electrum_gate outcome');
  }
  if (!/run:\s*exit\s+1/.test(failureStep)) errors.push('failed readiness must exit 1');

  rejectMatch(/^\s*pull_request_target:\s*$/m, 'pull_request_target is forbidden');
  rejectMatch(/^\s*(?:permissions:\s*)?write-all\s*$/m, 'write-all permissions are forbidden');
  rejectMatch(/^\s+[a-z-]+:\s*write\s*$/m, 'write permissions are forbidden');
  rejectMatch(/\$\{\{\s*secrets\./i, 'secret expressions are forbidden');
  rejectMatch(
    /^\s*(?:run:\s*)?(?:corepack\s+)?(?:npm\s+(?:ci|install)|(?:yarn|pnpm|bun)\s+install)(?:\s|$)/m,
    'dependency installation is forbidden',
  );
  rejectMatch(
    /--(?:skip|no-)[\w-]*(?:gate|readiness|electrum)|\b(?:bypass|skip)[_-]?(?:gate|readiness|electrum)\b/i,
    'release-gate bypasses are forbidden',
  );

  return errors;
};

if (!existsSync(absoluteWorkflowPath)) {
  console.error(`Electrum certificate workflow guard failed: missing ${workflowPath}`);
  process.exit(1);
}

const workflow = readFileSync(absoluteWorkflowPath, 'utf8');
const errors = validateWorkflow(workflow);
const mutationFixtures = [
  ['floating action', `${workflow}\n      - uses: vendor/action@main\n`, 'unapproved action'],
  [
    'Corepack install',
    workflow.replace(
      'run: node scripts/auditElectrumEndpointReadiness.mjs --require-ready',
      'run: corepack yarn install',
    ),
    'dependency installation',
  ],
  ['secret access', `${workflow}\nenv:\n  TOKEN: \${{ secrets.TOKEN }}\n`, 'secret expressions'],
  ['write permission', workflow.replace('contents: read', 'contents: write'), 'write permissions'],
];

for (const [label, fixture, expectedError] of mutationFixtures) {
  if (!validateWorkflow(fixture).some(error => error.includes(expectedError))) {
    errors.push(`${label} fixture did not produce ${expectedError}`);
  }
}

if (errors.length > 0) {
  console.error(`Electrum certificate workflow guard failed with ${errors.length} error(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Electrum certificate workflow guard checks passed.');

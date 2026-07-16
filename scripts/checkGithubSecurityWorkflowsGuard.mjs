import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const workflowPaths = {
  codeql: '.github/workflows/codeql.yml',
  semgrep: '.github/workflows/semgrep.yml',
  pullRequest: '.github/workflows/pull-request.yml',
};

const approved = {
  checkout: 'actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0',
  codeqlInit: 'github/codeql-action/init@7188fc363630916deb702c7fdcf4e481b751f97a # v4.37.1',
  codeqlAnalyze: 'github/codeql-action/analyze@7188fc363630916deb702c7fdcf4e481b751f97a # v4.37.1',
  codeqlUploadSarif: 'github/codeql-action/upload-sarif@7188fc363630916deb702c7fdcf4e481b751f97a # v4.37.1',
  uploadArtifact: 'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1',
  semanticPullRequest: 'amannn/action-semantic-pull-request@48f256284bd46cdaab1048c3721360e808335d50 # v6.1.1',
  semgrepImage: 'semgrep/semgrep:1.170.0@sha256:c98f8829eea377274ee4b10656458b078b88232469b2ff913f091c2317347c9d',
};

const expectedBranches = ['develop', 'main', 'stage'];

const getIndentedSection = (source, markerPattern, markerIndent = 0) => {
  const lines = source.split(/\r?\n/);
  const markerIndex = lines.findIndex(line => markerPattern.test(line));

  if (markerIndex === -1) return '';

  let endIndex = lines.length;

  for (let index = markerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

    const indent = line.match(/^\s*/)[0].length;

    if (indent <= markerIndent) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(markerIndex, endIndex).join('\n');
};

const getStep = (source, name) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return getIndentedSection(source, new RegExp(`^\\s{6}- name: ${escapedName}\\s*$`), 6);
};

const getTrigger = (source, trigger) => {
  const onSection = getIndentedSection(source, /^on:\s*$/, 0);
  const escapedTrigger = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return getIndentedSection(onSection, new RegExp(`^\\s{2}${escapedTrigger}:\\s*$`), 2);
};

const getTriggerNames = source => {
  const onSection = getIndentedSection(source, /^on:\s*$/, 0);

  return [...onSection.matchAll(/^\s{2}([a-z_]+):\s*$/gm)].map(match => match[1]);
};

const getBranchList = triggerSection => {
  const inline = triggerSection.match(/^\s+branches:\s*\[([^\]]*)\]\s*$/m);

  if (inline) {
    return inline[1]
      .split(',')
      .map(branch => branch.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  const branchesIndex = triggerSection.split(/\r?\n/).findIndex(line => /^\s+branches:\s*$/.test(line));

  if (branchesIndex === -1) return [];

  const lines = triggerSection.split(/\r?\n/);
  const branches = [];

  for (let index = branchesIndex + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s+-\s+(.+?)\s*$/);

    if (!match) break;
    branches.push(match[1].replace(/^['"]|['"]$/g, ''));
  }

  return branches;
};

const sameValues = (actual, expected) =>
  actual.length === expected.length &&
  [...actual].sort().every((value, index) => value === [...expected].sort()[index]);

const collectUses = source => [...source.matchAll(/^\s+(?:-\s+)?uses:\s*(.+?)\s*$/gm)].map(match => match[1]);

const collectImages = source => [...source.matchAll(/^\s+image:\s*(\S+)\s*$/gm)].map(match => match[1]);

const collectJobNames = source => {
  const jobsSection = getIndentedSection(source, /^jobs:\s*$/, 0);

  return [...jobsSection.matchAll(/^\s{2}([a-z][a-z0-9-]*):\s*$/gm)].map(match => match[1]);
};

const collectStepNames = source => [...source.matchAll(/^\s{6}- name:\s*(.+?)\s*$/gm)].map(match => match[1]);

const sameOrder = (actual, expected) =>
  actual.length === expected.length && actual.every((value, index) => value === expected[index]);

const addCommonErrors = (name, source, errors) => {
  const reject = (pattern, message) => {
    if (pattern.test(source)) errors.push(`${name}: ${message}`);
  };

  reject(/^\s*(?:permissions:\s*)?write-all\s*$/m, 'write-all permissions are forbidden');
  reject(/\$\{\{\s*secrets\./i, 'arbitrary secret expressions are forbidden');
  reject(
    /\$(?:default-branch|protected-branches)|<(?:sha|version|digest|branch)>|\b(?:TODO|TBD|CHANGEME)\b/i,
    'placeholders are forbidden',
  );
  reject(/persist-credentials:\s*(?!false\s*$)\S+/m, 'checkout credentials must not persist');
};

const requireExactBranches = (name, source, trigger, errors) => {
  const actual = getBranchList(getTrigger(source, trigger));

  if (!sameValues(actual, expectedBranches)) {
    errors.push(`${name}: ${trigger} branches must be exactly ${expectedBranches.join(', ')}`);
  }
};

const requireExactTriggers = (name, source, expected, errors) => {
  const actual = getTriggerNames(source);

  if (!sameValues(actual, expected)) {
    errors.push(`${name}: triggers must be exactly ${expected.join(', ')}`);
  }
};

const requireExactUses = (name, source, expected, errors) => {
  const actual = collectUses(source);

  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    errors.push(`${name}: actions must match the approved pinned allowlist in exact step order`);
  }
};

const requireExactExecutionShape = (name, source, jobs, steps, permissionBlocks, errors) => {
  if (!sameOrder(collectJobNames(source), jobs)) {
    errors.push(`${name}: jobs must match the approved allowlist in exact order`);
  }
  if (!sameOrder(collectStepNames(source), steps)) {
    errors.push(`${name}: steps must match the approved allowlist in exact order`);
  }
  if ((source.match(/^\s*permissions:\s*(?:#.*)?$/gm) || []).length !== permissionBlocks) {
    errors.push(`${name}: permissions block count is not approved`);
  }
};

const requireConcurrency = (name, source, group, errors) => {
  if (!new RegExp(`^\\s{2}group: ${group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(source)) {
    errors.push(`${name}: concurrency group is missing or incorrect`);
  }
  if (!/^\s{2}cancel-in-progress:\s*true\s*$/m.test(source)) {
    errors.push(`${name}: concurrency must cancel in-progress runs`);
  }
};

const validateCodeql = source => {
  const errors = [];
  const onSection = getIndentedSection(source, /^on:\s*$/, 0);
  const job = getIndentedSection(source, /^\s{2}analyze:\s*$/, 2);
  const initStep = getStep(source, 'Initialize CodeQL');

  addCommonErrors('CodeQL', source, errors);
  if (/^\s*pull_request_target:\s*$/m.test(source)) errors.push('CodeQL: pull_request_target is forbidden');
  requireExactTriggers('CodeQL', source, ['push', 'pull_request', 'schedule', 'workflow_dispatch'], errors);
  requireExactBranches('CodeQL', source, 'push', errors);
  requireExactBranches('CodeQL', source, 'pull_request', errors);
  requireExactUses('CodeQL', source, [approved.checkout, approved.codeqlInit, approved.codeqlAnalyze], errors);
  requireExactExecutionShape(
    'CodeQL',
    source,
    ['analyze'],
    ['Checkout repository', 'Initialize CodeQL', 'Perform CodeQL analysis'],
    2,
    errors,
  );
  requireConcurrency('CodeQL', source, 'codeql-${{ github.workflow }}-${{ github.ref }}', errors);

  const schedules = [...getTrigger(onSection, 'schedule').matchAll(/cron:\s*['"]([^'"]+)['"]/g)].map(match => match[1]);

  if (!sameValues(schedules, ['0 4 * * 1'])) {
    errors.push('CodeQL: weekly Monday schedule must be 0 4 * * 1');
  }
  if (!/^\s{2}workflow_dispatch:\s*$/m.test(onSection)) {
    errors.push('CodeQL: workflow_dispatch trigger is required');
  }
  if (!/^permissions:\s*\r?\n\s{2}contents:\s*read\s*$/m.test(source)) {
    errors.push('CodeQL: top-level permissions must be contents: read only');
  }
  if (!/^\s{4}timeout-minutes:\s*15\s*$/m.test(job)) {
    errors.push('CodeQL: analyze job timeout must be 15 minutes');
  }
  if (!/^\s{4}permissions:\s*\r?\n\s{6}contents:\s*read\s*\r?\n\s{6}security-events:\s*write\s*$/m.test(job)) {
    errors.push('CodeQL: job permissions must be contents: read and security-events: write only');
  }
  if ((source.match(/^\s+security-events:\s*write\s*$/gm) || []).length !== 1) {
    errors.push('CodeQL: exactly one security-events: write permission is allowed');
  }
  if (/^\s+(?!security-events:)[a-z-]+:\s*write\s*$/m.test(source)) {
    errors.push('CodeQL: unapproved write permission detected');
  }
  if (!/persist-credentials:\s*false/.test(getStep(source, 'Checkout repository'))) {
    errors.push('CodeQL: checkout must set persist-credentials: false');
  }
  if (!/^\s{10}languages:\s*javascript-typescript\s*$/m.test(initStep)) {
    errors.push('CodeQL: language must be javascript-typescript');
  }
  if (!/^\s{10}build-mode:\s*none\s*$/m.test(initStep)) {
    errors.push('CodeQL: JavaScript/TypeScript build-mode must be none');
  }
  if (/codeql-action\/autobuild|\bautobuild\b/i.test(source)) {
    errors.push('CodeQL: autobuild is forbidden for build-mode none');
  }
  if (/^\s+upload:/m.test(getStep(source, 'Perform CodeQL analysis'))) {
    errors.push('CodeQL: analyze must retain the default upload behavior for all pull requests');
  }
  if (collectImages(source).length !== 0) errors.push('CodeQL: container images are unapproved');

  return errors;
};

const validateSemgrep = source => {
  const errors = [];
  const onSection = getIndentedSection(source, /^on:\s*$/, 0);
  const job = getIndentedSection(source, /^\s{2}semgrep:\s*$/, 2);
  const scanStep = getStep(source, 'Run Semgrep');
  const uploadStep = getStep(source, 'Upload SARIF to GitHub code scanning');
  const retainStep = getStep(source, 'Retain Semgrep SARIF');
  const failureStep = getStep(source, 'Enforce Semgrep result');
  const scanIndex = source.indexOf('- name: Run Semgrep');
  const uploadIndex = source.indexOf('- name: Upload SARIF to GitHub code scanning');
  const retainIndex = source.indexOf('- name: Retain Semgrep SARIF');
  const failureIndex = source.indexOf('- name: Enforce Semgrep result');

  addCommonErrors('Semgrep', source, errors);
  if (/^\s*pull_request_target:\s*$/m.test(source)) errors.push('Semgrep: pull_request_target is forbidden');
  requireExactTriggers('Semgrep', source, ['push', 'pull_request', 'schedule', 'workflow_dispatch'], errors);
  requireExactBranches('Semgrep', source, 'push', errors);
  requireExactBranches('Semgrep', source, 'pull_request', errors);
  requireExactUses('Semgrep', source, [approved.checkout, approved.codeqlUploadSarif, approved.uploadArtifact], errors);
  requireExactExecutionShape(
    'Semgrep',
    source,
    ['semgrep'],
    [
      'Check out repository',
      'Run Semgrep',
      'Upload SARIF to GitHub code scanning',
      'Retain Semgrep SARIF',
      'Enforce Semgrep result',
    ],
    1,
    errors,
  );
  requireConcurrency('Semgrep', source, 'semgrep-${{ github.workflow }}-${{ github.ref }}', errors);

  const schedules = [...getTrigger(onSection, 'schedule').matchAll(/cron:\s*['"]([^'"]+)['"]/g)].map(match => match[1]);

  if (!sameValues(schedules, ['23 6 * * 1'])) {
    errors.push('Semgrep: weekly Monday schedule must be 23 6 * * 1');
  }
  if (!/^\s{2}workflow_dispatch:\s*$/m.test(onSection)) {
    errors.push('Semgrep: workflow_dispatch trigger is required');
  }
  if (!/^permissions:\s*\r?\n\s{2}contents:\s*read\s*\r?\n\s{2}security-events:\s*write\s*$/m.test(source)) {
    errors.push('Semgrep: permissions must be contents: read and security-events: write only');
  }
  if ((source.match(/^\s+security-events:\s*write\s*$/gm) || []).length !== 1) {
    errors.push('Semgrep: exactly one security-events: write permission is allowed');
  }
  if (/^\s+(?!security-events:)[a-z-]+:\s*write\s*$/m.test(source)) {
    errors.push('Semgrep: unapproved write permission detected');
  }
  if (!/^\s{4}timeout-minutes:\s*30\s*$/m.test(job)) {
    errors.push('Semgrep: scan job timeout must be 30 minutes');
  }
  const images = collectImages(source);

  if (images.length !== 1 || images[0] !== approved.semgrepImage) {
    errors.push('Semgrep: native CLI image must match the approved pinned version and digest');
  }
  if (!/persist-credentials:\s*false/.test(getStep(source, 'Check out repository'))) {
    errors.push('Semgrep: checkout must set persist-credentials: false');
  }
  if (/returntocorp\/semgrep-action|semgrep\/semgrep-action/i.test(source)) {
    errors.push('Semgrep: archived Semgrep GitHub Action is forbidden');
  }
  if (!/^\s{8}id:\s*semgrep\s*$/m.test(scanStep)) {
    errors.push('Semgrep: native CLI scan step must use id: semgrep');
  }
  if (!/^\s{8}continue-on-error:\s*true\s*$/m.test(scanStep)) {
    errors.push('Semgrep: scan must preserve SARIF with continue-on-error');
  }
  if (!/\bsemgrep scan\s+\\/.test(scanStep)) {
    errors.push('Semgrep: scan must use the native semgrep CLI');
  }
  for (const requiredFlag of ['--sarif', '--output semgrep.sarif']) {
    if (!scanStep.includes(requiredFlag)) errors.push(`Semgrep: scan must include ${requiredFlag}`);
  }
  if (scanStep.includes('--error')) {
    errors.push('Semgrep: legacy findings must remain reporting-only until the reviewed baseline is cleared');
  }
  if (!/if:\s*always\(\)\s*&&\s*hashFiles\(['"]semgrep\.sarif['"]\)\s*!=\s*['"]['"]/.test(uploadStep)) {
    errors.push('Semgrep: Code Scanning upload must run for every pull request when SARIF exists');
  }
  if (!/^\s{10}sarif_file:\s*semgrep\.sarif\s*$/m.test(uploadStep)) {
    errors.push('Semgrep: semgrep.sarif must be uploaded to code scanning');
  }
  if (!/if:\s*always\(\)\s*&&\s*hashFiles\(['"]semgrep\.sarif['"]\)\s*!=\s*['"]['"]/.test(retainStep)) {
    errors.push('Semgrep: SARIF artifact retention must run with always()');
  }
  if (!/^\s{10}path:\s*semgrep\.sarif\s*$/m.test(retainStep)) {
    errors.push('Semgrep: retained artifact must contain semgrep.sarif');
  }
  if (!(scanIndex !== -1 && scanIndex < uploadIndex && uploadIndex < retainIndex && retainIndex < failureIndex)) {
    errors.push('Semgrep: scan, Code Scanning upload, and artifact retention must complete before explicit failure');
  }
  if (!/if:\s*always\(\)\s*&&\s*steps\.semgrep\.outcome\s*!=\s*['"]success['"]/.test(failureStep)) {
    errors.push('Semgrep: final failure must explicitly enforce the scan outcome');
  }
  if (!/^\s{8}run:\s*exit\s+1\s*$/m.test(failureStep)) {
    errors.push('Semgrep: failed scan must exit 1 explicitly');
  }

  return errors;
};

const validatePullRequest = source => {
  const errors = [];
  const onSection = getIndentedSection(source, /^on:\s*$/, 0);
  const job = getIndentedSection(source, /^\s{2}validate-title:\s*$/, 2);
  const titleStep = getStep(source, 'Validate pull request title');

  addCommonErrors('Pull request', source, errors);
  requireExactTriggers('Pull request', source, ['pull_request_target'], errors);
  requireExactBranches('Pull request', source, 'pull_request_target', errors);
  requireExactUses('Pull request', source, [approved.semanticPullRequest], errors);
  requireExactExecutionShape('Pull request', source, ['validate-title'], ['Validate pull request title'], 1, errors);
  requireConcurrency('Pull request', source, 'semantic-pr-title-${{ github.event.pull_request.number }}', errors);

  const expectedTypes = ['opened', 'edited', 'synchronize', 'reopened', 'ready_for_review'];
  const typeLines = getTrigger(source, 'pull_request_target')
    .split(/\r?\n/)
    .filter(line => /^\s+-\s+/.test(line))
    .map(line => line.replace(/^\s+-\s+/, '').trim())
    .filter(value => !expectedBranches.includes(value));

  if (!sameValues(typeLines, expectedTypes)) {
    errors.push('Pull request: event types must match the approved lifecycle events');
  }
  if (!/^permissions:\s*\r?\n\s{2}pull-requests:\s*read\s*$/m.test(source)) {
    errors.push('Pull request: permissions must be pull-requests: read only');
  }
  if (/^\s+[a-z-]+:\s*write\s*$/m.test(source)) {
    errors.push('Pull request: write permissions are forbidden');
  }
  if (!/^\s{4}timeout-minutes:\s*5\s*$/m.test(job)) {
    errors.push('Pull request: title validation timeout must be 5 minutes');
  }
  if (collectImages(source).length !== 0) {
    errors.push('Pull request: container images are unapproved');
  }
  if (/actions\/checkout|persist-credentials:/i.test(source)) {
    errors.push('Pull request: checkout is forbidden for semantic title validation');
  }
  if (/^\s+run:/m.test(source)) {
    errors.push('Pull request: shell execution is forbidden for pull_request_target');
  }
  if (/^\s+wip:\s*true\s*$/m.test(titleStep)) {
    errors.push('Pull request: wip mode is forbidden because it requires status write permission');
  }
  const tokens = [...source.matchAll(/\$\{\{\s*([^}]+?)\s*\}\}/g)].map(match => match[1].trim());
  const approvedTokens = ['github.event.pull_request.number', 'github.token'];

  if (tokens.some(token => !approvedTokens.includes(token))) {
    errors.push('Pull request: unapproved context or token expression detected');
  }
  if (!/^\s{10}GITHUB_TOKEN:\s*\$\{\{\s*github\.token\s*\}\}\s*$/m.test(titleStep)) {
    errors.push('Pull request: semantic action must receive only github.token');
  }
  const withSection = getIndentedSection(titleStep, /^\s{8}with:\s*$/, 8).trimEnd();

  if (!/^\s{8}with:\s*\r?\n\s{10}validateSingleCommit:\s*true\s*$/.test(withSection)) {
    errors.push('Pull request: semantic action inputs must be exactly validateSingleCommit: true');
  }

  return errors;
};

const validators = {
  codeql: validateCodeql,
  semgrep: validateSemgrep,
  pullRequest: validatePullRequest,
};

const workflows = {};
const errors = [];

for (const [name, workflowPath] of Object.entries(workflowPaths)) {
  const absolutePath = path.join(root, workflowPath);

  if (!existsSync(absolutePath)) {
    errors.push(`${name}: missing ${workflowPath}`);
    continue;
  }

  workflows[name] = readFileSync(absolutePath, 'utf8');
  errors.push(...validators[name](workflows[name]));
}

for (const [name, source] of Object.entries(workflows)) {
  const lineEndingVariants = {
    LF: source.replace(/\r\n/g, '\n'),
    CRLF: source.replace(/\r?\n/g, '\r\n'),
  };

  for (const [lineEnding, fixture] of Object.entries(lineEndingVariants)) {
    errors.push(...validators[name](fixture).map(error => `${lineEnding} fixture: ${error}`));
  }
}

const mutationFixtures =
  workflows.codeql && workflows.semgrep && workflows.pullRequest
    ? [
        [
          'floating action',
          validateCodeql,
          `${workflows.codeql}\n      - uses: vendor/action@main\n`,
          'approved pinned allowlist',
        ],
        [
          'title workflow event regression',
          validatePullRequest,
          workflows.pullRequest.replace('  pull_request_target:', '  pull_request:'),
          'triggers must be exactly pull_request_target',
        ],
        [
          'write-all',
          validateCodeql,
          workflows.codeql.replace(/permissions:\r?\n  contents: read/, 'permissions: write-all'),
          'write-all permissions are forbidden',
        ],
        [
          'unapproved secret',
          validatePullRequest,
          `${workflows.pullRequest}\nenv:\n  PRIVATE_TOKEN: \${{ secrets.PRIVATE_TOKEN }}\n`,
          'arbitrary secret expressions are forbidden',
        ],
        [
          'archived Semgrep action',
          validateSemgrep,
          `${workflows.semgrep}\n      - uses: returntocorp/semgrep-action@v1\n`,
          'archived Semgrep GitHub Action is forbidden',
        ],
        [
          'checkout credential regression',
          validateSemgrep,
          workflows.semgrep.replace('persist-credentials: false', 'persist-credentials: true'),
          'checkout credentials must not persist',
        ],
        [
          'privileged shell regression',
          validatePullRequest,
          `${workflows.pullRequest}\n      - name: Unsafe shell\n        run: echo unsafe\n`,
          'shell execution is forbidden',
        ],
        [
          'fork upload suppression regression',
          validateCodeql,
          workflows.codeql.replace(
            'uses: github/codeql-action/analyze@7188fc363630916deb702c7fdcf4e481b751f97a # v4.37.1',
            'uses: github/codeql-action/analyze@7188fc363630916deb702c7fdcf4e481b751f97a # v4.37.1\n        with:\n          upload: never',
          ),
          'default upload behavior',
        ],
        [
          'semantic API redirect regression',
          validatePullRequest,
          workflows.pullRequest.replace(
            'validateSingleCommit: true',
            'validateSingleCommit: true\n          githubBaseUrl: https://example.invalid',
          ),
          'inputs must be exactly',
        ],
      ]
    : [];

for (const [label, validate, fixture, expectedError] of mutationFixtures) {
  if (!validate(fixture).some(error => error.includes(expectedError))) {
    errors.push(`${label} mutation fixture did not produce: ${expectedError}`);
  }
}

if (errors.length > 0) {
  console.error(`GitHub security workflows guard failed with ${errors.length} error(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('GitHub security workflows guard checks passed.');

/* eslint-disable no-console */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASELINE_VERSION = 1;
const ID_PREFIX = 'semgrep-v1:';
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowedParserWarningFiles = new Map([
  ['android/app/gradlew', '8c4c04dd98db1f00d49456dd162418a39312c5cb13d6865d783deb483bd1ed22'],
  ['android/gradlew', 'aed171fb114f82e6eaea4970a245a200e0582a7dcc8ec0891ca41b6e4a62b754'],
]);

class InputError extends Error {}

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const requireNonEmptyString = (value, label) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InputError(`${label} must be a non-empty string`);
  }

  return value;
};

export const normalizeSnippet = value =>
  requireNonEmptyString(value, 'snippet').normalize('NFC').replace(/\s+/gu, ' ').trim();

const sha256 = value => createHash('sha256').update(value).digest('hex');

const normalizeFileSource = value => {
  const source = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);

  return source.normalize('NFC').replace(/\r\n?/g, '\n');
};

const decodeUriPath = (value, label) => {
  if (/^file:/i.test(value)) {
    let parsed;

    try {
      parsed = new URL(value);
    } catch {
      throw new InputError(`${label} contains an invalid file URI`);
    }

    if (parsed.hostname && parsed.hostname !== 'localhost') {
      throw new InputError(`${label} must not use a remote file URI`);
    }

    return decodeUriPath(parsed.pathname, label).replace(/^\/[A-Za-z]:\//, match => match.slice(1));
  }
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) && !/^[A-Za-z]:[\\/]/.test(value)) {
    throw new InputError(`${label} must not use a non-file URI scheme`);
  }

  let decoded;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new InputError(`${label} contains invalid URI encoding`);
  }

  return decoded;
};

export const normalizeRepoPath = (value, repoRoot = root) => {
  const label = 'finding path';
  let candidate = decodeUriPath(requireNonEmptyString(value, label), label).replace(/\\/g, '/');
  const normalizedRoot = path.resolve(repoRoot).replace(/\\/g, '/');

  if (/^[A-Za-z]:\//.test(candidate) || candidate.startsWith('/')) {
    const caseInsensitive = /^[A-Za-z]:\//.test(normalizedRoot);
    const comparableCandidate = caseInsensitive ? candidate.toLowerCase() : candidate;
    const comparableRoot = caseInsensitive ? normalizedRoot.toLowerCase() : normalizedRoot;

    if (comparableCandidate === comparableRoot) {
      throw new InputError(`${label} must identify a file, not the repository root`);
    }
    if (!comparableCandidate.startsWith(`${comparableRoot}/`)) {
      throw new InputError(`${label} must stay inside the repository`);
    }

    candidate = candidate.slice(normalizedRoot.length + 1);
  }

  candidate = path.posix.normalize(candidate.replace(/^\.\//, ''));

  if (candidate === '.' || candidate === '..' || candidate.startsWith('../') || path.posix.isAbsolute(candidate)) {
    throw new InputError(`${label} must be a repository-relative path`);
  }
  if (candidate.includes('\0')) {
    throw new InputError(`${label} contains a null byte`);
  }

  return candidate.normalize('NFC');
};

const normalizeRuleId = value => requireNonEmptyString(value, 'ruleId').normalize('NFC').trim();

export const computeStableId = ({ ruleId, path: findingPath, snippetHash, fileHash }) => {
  const identity = JSON.stringify([
    normalizeRuleId(ruleId),
    normalizeRepoPath(findingPath),
    requireSha256(snippetHash, 'snippetHash'),
    requireSha256(fileHash, 'fileHash'),
  ]);
  const digest = sha256(identity);

  return `${ID_PREFIX}${digest}`;
};

const requireSha256 = (value, label) => {
  const normalized = requireNonEmptyString(value, label).trim();

  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new InputError(`${label} must be 64 lowercase hexadecimal characters`);
  }

  return normalized;
};

const readJson = (filePath, label) => {
  let source;

  try {
    source = readFileSync(filePath);
  } catch (error) {
    throw new InputError(`cannot read ${label} ${JSON.stringify(filePath)}: ${error.message}`);
  }

  if (source.length > MAX_INPUT_BYTES) {
    throw new InputError(`${label} exceeds the ${MAX_INPUT_BYTES} byte limit`);
  }

  try {
    return JSON.parse(source.toString('utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new InputError(`${label} is not valid JSON: ${error.message}`);
  }
};

const getRuleId = (result, run, resultLabel) => {
  if (typeof result.ruleId === 'string' && result.ruleId.trim() !== '') {
    return normalizeRuleId(result.ruleId);
  }

  const indexedRule = Number.isInteger(result.ruleIndex) ? run.tool?.driver?.rules?.[result.ruleIndex] : undefined;

  if (typeof indexedRule?.id === 'string' && indexedRule.id.trim() !== '') {
    return normalizeRuleId(indexedRule.id);
  }

  throw new InputError(`${resultLabel} has no ruleId or resolvable ruleIndex`);
};

const getPhysicalLocation = (result, resultLabel) => {
  if (!Array.isArray(result.locations) || result.locations.length === 0) {
    throw new InputError(`${resultLabel}.locations must be a non-empty array`);
  }

  const location = result.locations.find(item => isRecord(item?.physicalLocation))?.physicalLocation;

  if (!location) {
    throw new InputError(`${resultLabel} has no physical location`);
  }

  return location;
};

const rejectFailedExecution = (run, runIndex, repoRoot, sourceReader) => {
  if (!Array.isArray(run.invocations) || run.invocations.length === 0) {
    throw new InputError(`SARIF runs[${runIndex}].invocations must report scanner execution`);
  }

  for (const [invocationIndex, invocation] of run.invocations.entries()) {
    if (!isRecord(invocation) || invocation.executionSuccessful !== true) {
      throw new InputError(`SARIF runs[${runIndex}].invocations[${invocationIndex}] was not successful`);
    }
  }

  const notifications = [
    ...(Array.isArray(run.toolExecutionNotifications) ? run.toolExecutionNotifications : []),
    ...(Array.isArray(run.toolConfigurationNotifications) ? run.toolConfigurationNotifications : []),
    ...run.invocations.flatMap(invocation => [
      ...(Array.isArray(invocation.toolExecutionNotifications) ? invocation.toolExecutionNotifications : []),
      ...(Array.isArray(invocation.toolConfigurationNotifications) ? invocation.toolConfigurationNotifications : []),
    ]),
  ];

  for (const notification of notifications) {
    const descriptorId = notification?.descriptor?.id ?? '';
    const message = notification?.message?.text ?? '';
    const match = message.match(/^Syntax error at line ([^:\r\n]+):\d+:/);
    const warningPath = match ? normalizeRepoPath(match[1], repoRoot) : '';
    const expectedHash = allowedParserWarningFiles.get(warningPath);

    if (notification?.level !== 'warning' || descriptorId !== 'Syntax error' || !expectedHash) {
      throw new InputError(
        `SARIF runs[${runIndex}] contains an unreviewed tool notification: ${descriptorId || 'unknown'}`,
      );
    }

    let source;

    try {
      source = sourceReader(path.resolve(repoRoot, warningPath));
    } catch (error) {
      throw new InputError(`cannot verify parser-warning file ${warningPath}: ${error.message}`);
    }
    if (sha256(normalizeFileSource(source)) !== expectedHash) {
      throw new InputError(`parser-warning file ${warningPath} changed and requires renewed review`);
    }
  }
};

export const parseSarif = (sarif, repoRoot = process.cwd(), sourceReader = readFileSync) => {
  if (!isRecord(sarif) || sarif.version !== '2.1.0' || !Array.isArray(sarif.runs)) {
    throw new InputError('SARIF must be a 2.1.0 object with a runs array');
  }

  const findings = [];

  sarif.runs.forEach((run, runIndex) => {
    if (!isRecord(run)) {
      throw new InputError(`SARIF runs[${runIndex}] must be an object`);
    }
    if (run.results !== undefined && !Array.isArray(run.results)) {
      throw new InputError(`SARIF runs[${runIndex}].results must be an array`);
    }
    rejectFailedExecution(run, runIndex, repoRoot, sourceReader);

    (run.results ?? []).forEach((result, resultIndex) => {
      const resultLabel = `SARIF runs[${runIndex}].results[${resultIndex}]`;

      if (!isRecord(result)) {
        throw new InputError(`${resultLabel} must be an object`);
      }

      const physicalLocation = getPhysicalLocation(result, resultLabel);
      const uri = physicalLocation.artifactLocation?.uri;
      const uriBaseId = physicalLocation.artifactLocation?.uriBaseId;
      const snippet = physicalLocation.region?.snippet?.text;

      if (typeof uri !== 'string' || uri.trim() === '') {
        throw new InputError(`${resultLabel} has no artifactLocation.uri`);
      }
      if (typeof snippet !== 'string' || snippet.trim() === '') {
        throw new InputError(`${resultLabel} has no non-empty region.snippet.text`);
      }
      if (uriBaseId !== undefined && uriBaseId !== '%SRCROOT%') {
        throw new InputError(`${resultLabel} must use %SRCROOT% or no uriBaseId`);
      }

      const findingPath = normalizeRepoPath(uri, repoRoot);
      let fileSource;

      try {
        fileSource = sourceReader(path.resolve(repoRoot, findingPath));
      } catch (error) {
        throw new InputError(`${resultLabel} cannot read ${findingPath}: ${error.message}`);
      }

      const finding = {
        ruleId: getRuleId(result, run, resultLabel),
        path: findingPath,
        snippetHash: sha256(normalizeSnippet(snippet)),
        fileHash: sha256(normalizeFileSource(fileSource)),
      };

      findings.push({ ...finding, id: computeStableId(finding) });
    });
  });

  return findings.sort(
    (left, right) =>
      left.id.localeCompare(right.id) || left.path.localeCompare(right.path) || left.ruleId.localeCompare(right.ruleId),
  );
};

const wildcardPattern = /[*?\[\]{}]/;
const forbiddenBaselineRulePattern = /(?:^|[._-])(?:secret|secrets|credential|credentials)(?:[._-]|$)/i;
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\b(?:gh[opusr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|private[_-]?key)\b\s*[:=]\s*["']?(?!\$\{|<|REDACTED\b)[^\s,"']{8,}/i,
  /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:]+:[^\s/@]{4,}@/i,
];

const assertNoSecretLookingValue = (value, label) => {
  if (secretPatterns.some(pattern => pattern.test(value))) {
    throw new InputError(`${label} contains secret-looking material`);
  }
};

const assertExactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();

  if (actual.length !== sortedExpected.length || actual.some((key, index) => key !== sortedExpected[index])) {
    throw new InputError(`${label} must contain exactly: ${sortedExpected.join(', ')}`);
  }
};

export const parseBaseline = baseline => {
  if (!isRecord(baseline)) {
    throw new InputError('baseline must be a JSON object');
  }

  assertExactKeys(baseline, ['version', 'findings'], 'baseline');

  if (baseline.version !== BASELINE_VERSION) {
    throw new InputError(`baseline.version must be ${BASELINE_VERSION}`);
  }
  if (!Array.isArray(baseline.findings)) {
    throw new InputError('baseline.findings must be an array');
  }

  const seenIds = new Set();

  return baseline.findings
    .map((entry, index) => {
      const label = `baseline.findings[${index}]`;

      if (!isRecord(entry)) {
        throw new InputError(`${label} must be an object`);
      }

      assertExactKeys(entry, ['fileHash', 'id', 'occurrences', 'path', 'rationale', 'ruleId', 'snippetHash'], label);

      const id = requireNonEmptyString(entry.id, `${label}.id`).trim();
      const ruleId = normalizeRuleId(entry.ruleId);
      const findingPath = normalizeRepoPath(entry.path);
      const snippetHash = requireSha256(entry.snippetHash, `${label}.snippetHash`);
      const fileHash = requireSha256(entry.fileHash, `${label}.fileHash`);
      const rationale = requireNonEmptyString(entry.rationale, `${label}.rationale`).normalize('NFC').trim();

      if (!Number.isSafeInteger(entry.occurrences) || entry.occurrences < 1) {
        throw new InputError(`${label}.occurrences must be a positive integer`);
      }
      if (rationale.length < 20 || rationale.length > 500) {
        throw new InputError(`${label}.rationale must contain 20-500 characters`);
      }
      if (forbiddenBaselineRulePattern.test(ruleId)) {
        throw new InputError(`${label}.ruleId identifies a secret or credential finding that cannot be baselined`);
      }

      for (const [field, value] of [
        ['id', id],
        ['ruleId', ruleId],
        ['path', findingPath],
      ]) {
        if (wildcardPattern.test(value)) {
          throw new InputError(`${label}.${field} must not contain wildcard characters`);
        }
      }

      for (const [field, value] of [
        ['ruleId', ruleId],
        ['path', findingPath],
        ['rationale', rationale],
      ]) {
        assertNoSecretLookingValue(value, `${label}.${field}`);
      }

      const normalized = {
        id,
        ruleId,
        path: findingPath,
        snippetHash,
        fileHash,
        occurrences: entry.occurrences,
        rationale,
      };
      const expectedId = computeStableId(normalized);

      if (!new RegExp(`^${ID_PREFIX}[a-f0-9]{64}$`).test(id)) {
        throw new InputError(`${label}.id must use ${ID_PREFIX} followed by 64 lowercase hex characters`);
      }
      if (id !== expectedId) {
        throw new InputError(`${label}.id does not match its normalized ruleId, path, snippet hash, and file hash`);
      }
      if (seenIds.has(id)) {
        throw new InputError(`${label}.id duplicates an earlier baseline entry`);
      }

      seenIds.add(id);
      return normalized;
    })
    .sort((left, right) => left.id.localeCompare(right.id));
};

export const compareFindings = (current, baseline) => {
  const currentById = new Map();

  for (const finding of current) {
    const existing = currentById.get(finding.id);

    currentById.set(
      finding.id,
      existing ? { ...existing, occurrences: existing.occurrences + 1 } : { ...finding, occurrences: 1 },
    );
  }

  const baselineById = new Map(baseline.map(entry => [entry.id, entry]));
  const unreviewed = [...currentById.values()].filter(finding => {
    const accepted = baselineById.get(finding.id);

    return !accepted || accepted.occurrences !== finding.occurrences;
  });
  const stale = baseline.filter(entry => {
    const currentFinding = currentById.get(entry.id);

    return !currentFinding || currentFinding.occurrences !== entry.occurrences;
  });
  const reviewed = [...currentById.values()].filter(finding => {
    const accepted = baselineById.get(finding.id);

    return accepted?.occurrences === finding.occurrences;
  });

  const byId = (left, right) => left.id.localeCompare(right.id);

  return {
    reviewed: reviewed.sort(byId),
    stale: stale.sort(byId),
    unreviewed: unreviewed.sort(byId),
  };
};

const printFinding = finding => {
  const occurrences = finding.occurrences > 1 ? ` (${finding.occurrences} occurrences)` : '';

  console.error(`- ${finding.id} ${finding.ruleId} ${finding.path}${occurrences}`);
};

const makeFinding = (ruleId, findingPath, snippet, fileSource) => {
  const finding = {
    ruleId: normalizeRuleId(ruleId),
    path: normalizeRepoPath(findingPath),
    snippetHash: sha256(normalizeSnippet(snippet)),
    fileHash: sha256(normalizeFileSource(fileSource)),
  };

  return { ...finding, id: computeStableId(finding) };
};

const runSelfTest = () => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const expectInputError = (operation, message) => {
    let rejected = false;

    try {
      operation();
    } catch (error) {
      rejected = error instanceof InputError;
    }
    assert(rejected, message);
  };
  const reviewedSource = Buffer.from('const input = trusted;\ndangerous( value );\n', 'utf8');
  const finding = {
    ...makeFinding('javascript.example.rule', 'src/example.js', '  dangerous( value );\r\n', reviewedSource),
    occurrences: 1,
    rationale: 'Reviewed test-only finding with no untrusted input.',
  };
  const movedLineFinding = parseSarif(
    {
      version: '2.1.0',
      runs: [
        {
          invocations: [{ executionSuccessful: true }],
          results: [
            {
              ruleId: finding.ruleId,
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: './src/example.js', uriBaseId: '%SRCROOT%' },
                    region: { startLine: 900, snippet: { text: '\tdangerous(  value );\n' } },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    root,
    () => reviewedSource,
  )[0];

  assert(movedLineFinding.id === finding.id, 'line and whitespace changes must not change the stable ID');
  const changedSourceFinding = parseSarif(
    {
      version: '2.1.0',
      runs: [
        {
          invocations: [{ executionSuccessful: true }],
          results: [
            {
              ruleId: finding.ruleId,
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: './src/example.js', uriBaseId: '%SRCROOT%' },
                    region: { snippet: { text: 'dangerous( value );' } },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    root,
    () => Buffer.from('const input = untrusted;\ndangerous( value );\n', 'utf8'),
  )[0];

  assert(changedSourceFinding.id !== finding.id, 'any accepted finding file change must require review');
  const sarifFixture = ({
    executionSuccessful = true,
    uriBaseId = '%SRCROOT%',
    notificationLevel,
    notificationDescriptor,
    notificationMessage = 'fixture',
    notificationCollection = 'toolExecutionNotifications',
  } = {}) => ({
    version: '2.1.0',
    runs: [
      {
        invocations: [
          {
            executionSuccessful,
            ...(notificationLevel
              ? {
                  [notificationCollection]: [
                    {
                      level: notificationLevel,
                      ...(notificationDescriptor ? { descriptor: { id: notificationDescriptor } } : {}),
                      message: { text: notificationMessage },
                    },
                  ],
                }
              : {}),
          },
        ],
        results: [
          {
            ruleId: finding.ruleId,
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: './src/example.js', uriBaseId },
                  region: { snippet: { text: 'dangerous( value );' } },
                },
              },
            ],
          },
        ],
      },
    ],
  });
  const crlfFinding = parseSarif(sarifFixture(), root, () =>
    Buffer.from(reviewedSource.toString('utf8').replace(/\n/g, '\r\n'), 'utf8'),
  )[0];

  assert(crlfFinding.id === finding.id, 'CRLF and LF source files must produce the same stable ID');

  expectInputError(
    () => parseSarif(sarifFixture({ executionSuccessful: false }), root, () => reviewedSource),
    'unsuccessful scanner execution must be rejected',
  );
  expectInputError(
    () => parseSarif(sarifFixture({ notificationLevel: 'error' }), root, () => reviewedSource),
    'error-level scanner notification must be rejected',
  );
  expectInputError(
    () =>
      parseSarif(
        sarifFixture({ notificationLevel: 'error', notificationCollection: 'toolConfigurationNotifications' }),
        root,
        () => reviewedSource,
      ),
    'configuration notifications must be rejected',
  );
  expectInputError(
    () =>
      parseSarif(
        sarifFixture({ notificationLevel: 'warning', notificationDescriptor: 'Syntax error' }),
        root,
        () => reviewedSource,
      ),
    'unreviewed parser warning must be rejected regardless of warning level',
  );
  expectInputError(
    () =>
      parseSarif(
        sarifFixture({ notificationLevel: 'warning', notificationDescriptor: 'Timeout' }),
        root,
        () => reviewedSource,
      ),
    'unknown warning notifications must be rejected',
  );
  parseSarif(
    sarifFixture({
      notificationLevel: 'warning',
      notificationDescriptor: 'Syntax error',
      notificationMessage: 'Syntax error at line android/gradlew:175:\nfixture',
    }),
    root,
    filePath => (filePath.endsWith(`${path.sep}android${path.sep}gradlew`) ? readFileSync(filePath) : reviewedSource),
  );
  expectInputError(
    () => parseSarif(sarifFixture({ uriBaseId: 'UNTRUSTED_ROOT' }), root, () => reviewedSource),
    'foreign URI base must be rejected',
  );
  const positive = compareFindings([movedLineFinding], parseBaseline({ version: 1, findings: [finding] }));

  assert(positive.unreviewed.length === 0 && positive.stale.length === 0, 'reviewed finding must pass');

  const negative = compareFindings([finding], []);

  assert(negative.unreviewed.length === 1, 'unreviewed finding must fail comparison');
  const stale = compareFindings([], [finding]);

  assert(stale.stale.length === 1, 'missing current finding must be stale');
  const countMismatch = compareFindings([finding, finding], [finding]);

  assert(
    countMismatch.unreviewed.length === 1 && countMismatch.stale.length === 1,
    'occurrence count changes must fail in both directions',
  );

  for (const invalid of [
    { ...finding, path: 'src/*.js' },
    finding,
    { ...finding, rationale: 'api_key = "this-is-a-real-looking-secret"' },
    { ...finding, ruleId: 'javascript.secrets.detect-api-key' },
  ]) {
    const entries = invalid === finding ? [finding, finding] : [invalid];
    let rejected = false;

    try {
      parseBaseline({ version: 1, findings: entries });
    } catch (error) {
      rejected = error instanceof InputError;
    }
    assert(rejected, 'invalid baseline fixture must be rejected');
  }

  console.log('Semgrep SARIF baseline self-test passed.');
};

const usage = `Usage:
  node scripts/checkSemgrepSarifBaseline.mjs <sarif-path> <baseline-path>
  node scripts/checkSemgrepSarifBaseline.mjs --self-test
  node scripts/checkSemgrepSarifBaseline.mjs --help

Baseline schema:
  {"version":1,"findings":[{"id":"semgrep-v1:<sha256>","ruleId":"...","path":"repo/file","snippetHash":"<sha256>","fileHash":"<sha256>","occurrences":1,"rationale":"..."}]}`;

const main = () => {
  const args = process.argv.slice(2);

  if (args.length === 1 && args[0] === '--self-test') {
    runSelfTest();
    return;
  }
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    console.log(usage);
    return;
  }
  if (args.length !== 2 || args.some(argument => argument.startsWith('-'))) {
    throw new InputError(usage);
  }

  const [sarifPath, baselinePath] = args.map(value => path.resolve(value));
  const current = parseSarif(readJson(sarifPath, 'SARIF file'));
  const baseline = parseBaseline(readJson(baselinePath, 'baseline file'));
  const result = compareFindings(current, baseline);

  if (result.stale.length > 0) {
    console.error(`Stale Semgrep baseline entries (${result.stale.length}):`);
    result.stale.forEach(printFinding);
  }
  if (result.unreviewed.length > 0) {
    console.error(`Unreviewed Semgrep findings (${result.unreviewed.length}):`);
    result.unreviewed.forEach(printFinding);
    process.exitCode = 1;
    return;
  }

  if (result.stale.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(
    `Semgrep SARIF baseline check passed: ${result.reviewed.length} reviewed, ${result.stale.length} stale, 0 unreviewed.`,
  );
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`Semgrep SARIF baseline check failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}

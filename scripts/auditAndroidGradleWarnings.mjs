import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const outputPath = path.join(outputDir, 'android-warning-audit.log');
const summaryOutputPath = path.join(outputDir, 'android-warning-audit-summary.txt');
const auditTimeoutMs = Number(process.env.ANDROID_WARNING_AUDIT_TIMEOUT_MS || 300000);

mkdirSync(outputDir, { recursive: true });

if (!Number.isInteger(auditTimeoutMs) || auditTimeoutMs <= 0) {
  console.error(`ANDROID_WARNING_AUDIT_TIMEOUT_MS must be a positive integer. Received: ${process.env.ANDROID_WARNING_AUDIT_TIMEOUT_MS}`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    path.join(root, 'scripts', 'runAndroidGradle.mjs'),
    ':app:assembleDevDebug',
    '-x',
    'lint',
    '--warning-mode',
    'all',
    '--stacktrace',
  ],
  {
    cwd: root,
    encoding: 'utf8',
    timeout: auditTimeoutMs,
  },
);

const diagnosticLines = [];

if (result.error) {
  diagnosticLines.push(`Android Gradle audit spawn error: ${result.error.message}`);
}

if (result.signal) {
  diagnosticLines.push(`Android Gradle audit signal: ${result.signal}`);
}

const diagnosticOutput = diagnosticLines.length > 0 ? `${diagnosticLines.join('\n')}\n` : '';
const output = `${result.stdout || ''}${result.stderr || ''}${diagnosticOutput}`;
const auditExitCode = result.status ?? 1;
writeFileSync(outputPath, output);

const lines = output.split(/\r?\n/);
const findings = [];

const addFollowingStackFrame = (label, startIndex) => {
  const nearbyStack = lines.slice(startIndex + 1, startIndex + 16);
  const sourceLine =
    nearbyStack.find(line => /\bat .*\.gradle:\d+\)/.test(line)) ||
    nearbyStack.find(line => /\bat .*\.(gradle|java):\d+\)/.test(line));

  findings.push(sourceLine ? `${label}: ${sourceLine.trim()}` : `${label}: source not found in nearby stacktrace`);
};

lines.forEach((line, index) => {
  if (line.includes('RepositoryHandler.jcenter() method has been deprecated')) {
    addFollowingStackFrame('jcenter()', index);
  }

  if (line.includes('AbstractExecTask.execResult property has been deprecated')) {
    addFollowingStackFrame('execResult', index);
  }

  if (line.includes('Android SDK Build Tools version')) {
    findings.push(`buildToolsVersion: ${line.trim()}`);
  }

  if (line.includes('Setting the namespace via a source AndroidManifest.xml')) {
    findings.push('manifest namespace: source AndroidManifest.xml package attribute warning present');
  }
});

console.log(`Android Gradle warning audit written to ${outputPath}`);

const summaryHeader = [
  `Android Gradle audit log path: ${outputPath}`,
  `Android Gradle audit timeout: ${auditTimeoutMs}ms`,
  `Android Gradle audit exit code: ${auditExitCode}`,
  ...diagnosticLines,
];

if (findings.length === 0) {
  writeFileSync(summaryOutputPath, `${summaryHeader.join('\n')}\nTargeted Android Gradle warnings: 0\n`);
  diagnosticLines.forEach(line => console.log(line));
  console.log('No targeted Android Gradle warnings found.');
} else {
  const uniqueFindings = [...new Set(findings)].sort((left, right) => left.localeCompare(right));
  writeFileSync(
    summaryOutputPath,
    `${summaryHeader.join('\n')}\nTargeted Android Gradle warnings: ${uniqueFindings.length}\n${uniqueFindings.map(finding => `- ${finding}`).join('\n')}\n`,
  );
  console.log(`Android Gradle audit timeout: ${auditTimeoutMs}ms`);
  console.log(`Android Gradle audit exit code: ${auditExitCode}`);
  diagnosticLines.forEach(line => console.log(line));
  console.log(`Targeted Android Gradle warnings: ${uniqueFindings.length}`);
  uniqueFindings.forEach(finding => console.log(`- ${finding}`));
}

console.log(`Android Gradle warning audit summary written to ${summaryOutputPath}`);

process.exit(auditExitCode);

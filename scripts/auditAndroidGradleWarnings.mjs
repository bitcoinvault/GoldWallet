import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const outputPath = path.join(outputDir, 'android-warning-audit.log');
const summaryOutputPath = path.join(outputDir, 'android-warning-audit-summary.txt');

mkdirSync(outputDir, { recursive: true });

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
  },
);

const output = `${result.stdout || ''}${result.stderr || ''}`;
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

if (findings.length === 0) {
  writeFileSync(summaryOutputPath, 'No targeted Android Gradle warnings found.\n');
  console.log('No targeted Android Gradle warnings found.');
} else {
  const uniqueFindings = [...new Set(findings)].sort((left, right) => left.localeCompare(right));
  writeFileSync(summaryOutputPath, `Targeted Android Gradle warnings: ${uniqueFindings.length}\n${uniqueFindings.map(finding => `- ${finding}`).join('\n')}\n`);
  console.log(`Targeted Android Gradle warnings: ${uniqueFindings.length}`);
  uniqueFindings.forEach(finding => console.log(`- ${finding}`));
}

console.log(`Android Gradle warning audit summary written to ${summaryOutputPath}`);

process.exit(result.status ?? 1);

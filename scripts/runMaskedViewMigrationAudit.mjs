import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export const maskedViewMigrationAuditSteps = [
  {
    label: 'Refresh Android warning evidence',
    command: 'corepack',
    args: ['yarn', 'android:dev:audit-warnings'],
  },
  {
    label: 'Audit masked-view migration',
    command: process.execPath,
    args: [path.join(root, 'scripts', 'auditMaskedViewMigration.mjs')],
  },
];

const getSpawnInvocation = step => {
  if (process.platform !== 'win32' || step.command === process.execPath) {
    return { command: step.command, args: step.args };
  }

  return { command: 'cmd.exe', args: ['/d', '/s', '/c', step.command, ...step.args] };
};

export const runMaskedViewMigrationAudit = () => {
  for (const step of maskedViewMigrationAuditSteps) {
    console.log(`\n${step.label}`);
    const invocation = getSpawnInvocation(step);
    const result = spawnSync(invocation.command, invocation.args, {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
      windowsHide: true,
    });

    if (result.error) {
      console.error(result.error.message);
      return 1;
    }

    if (result.status !== 0) {
      return result.status ?? 1;
    }
  }

  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runMaskedViewMigrationAudit());
}

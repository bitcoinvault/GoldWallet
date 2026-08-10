import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'docs', 'sentry-release-source-map-plan.md');
const plan = readFileSync(planPath, 'utf8');

const requiredSnippets = [
  '## Credential Handoff Gate',
  'Credential owner input required before claiming release source-map validation:',
  '- provide `SENTRY_AUTH_TOKEN` in the local shell or CI secret store, or use an authenticated official `sentry` CLI through `corepack yarn sentry:release:validation:managed:preflight` for production or `corepack yarn sentry:release:validation:managed:preflight:nonprod` for non-production;',
  '- select the release profile explicitly. The package preflight commands pass `--profile=prod|nonprod`; direct managed-runner use must pass that option or set `SENTRY_RELEASE_PROFILE`. Conflicting argument and environment profiles fail before credential lookup. Use `SENTRY_ORG`, `SENTRY_ANDROID_PROJECT`, and `SENTRY_IOS_PROJECT` overrides only after a confirmed Sentry project move;',
  '- generate local-only `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties` with `corepack yarn sentry:release:create-properties`;',
  '- keep generated Sentry properties files and token values out of commits, screenshots, and handoff artifacts.',
  '- the managed command captures `sentry auth token`, passes it only in the child-process environment, prepares the three ignored properties files, and never prints the credential value;',
  '- managed help, dry-run, unsupported flags, duplicate flags, and incompatible summary modes are resolved before credential lookup; help and dry-run do not materialize local credential files;',
  'Evidence that must be attached to the credential handoff:',
  '- current `check:sentry-properties-generator` output;',
  '- current `sentry:release:validation:preflight:dry-run` output;',
  '- current `sentry:release:prereq-audit` and `sentry:release:prereq-check-summary` output after credentials are generated;',
  '- current Android release build, manifest, and release-smoke evidence;',
  '- current `sentry:android-warning:audit` and `sentry:android-warning:check-summary` output;',
  '- current `sentry:rn-bundle-task-compat:audit` and `sentry:rn-bundle-task-compat:check-summary` output;',
  '- current release-services aggregate summary;',
  '- iOS macOS/Xcode/CocoaPods blocker or validation result.',
  'Do not run or claim production Sentry release upload validation until `SENTRY_AUTH_TOKEN` is present and the three generated properties files are ready. The isolated Android dev canary is a separate transport-only proof and must keep production upload and event symbolication unclaimed.',
  'Do not commit `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, or token-derived output.',
  'Do not print `SENTRY_AUTH_TOKEN` or generated `auth.token` values in handoff artifacts.',
  'Do not claim iOS dSYM/source-map upload validation unless it ran on macOS/Xcode or a real CI equivalent.',
  '## Source Map Upload Acceptance Gate',
  '- run `corepack yarn sentry:release:validation:handoff` with `SENTRY_AUTH_TOKEN` and an explicit `SENTRY_RELEASE_PROFILE` available, or run `corepack yarn sentry:release:validation:managed --profile=prod` with an authenticated official CLI;',
  '- run `corepack yarn sentry:release:validation:production:preflight` first to verify the fixed production project identities, current local release evidence, and upload-disabled handoff state without creating a Sentry release or uploading files;',
  '- keep `SENTRY_DISABLE_AUTO_UPLOAD=true` only for Android release evidence refresh, not for the final upload validation claim;',
  '- prove Android release artifact generation still covers `dev`, `stage`, `prod`, and `beta` variants;',
  '- prove the Sentry release prerequisite summary reports `Release source-map prerequisites: ready`;',
  '- leave release source-map upload as `not claimed` when credentials are missing.',
];

const errors = requiredSnippets.filter(snippet => !plan.includes(snippet));

if (!plan.includes('The active RN `0.86.2` Android warning audit no longer reports Sentry `execResult`')) {
  errors.push('Plan must keep the current RN/Sentry warning state visible.');
}

if (
  !plan.includes(
    'Android release APK generation has now been proven locally for `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease`',
  )
) {
  errors.push('Plan must keep the Android release variant evidence visible.');
}

if (errors.length > 0) {
  console.error('Sentry credential handoff guard failed:');
  errors.forEach(error => console.error(`- Missing or invalid plan item: ${error}`));
  process.exit(1);
}

console.log('Sentry credential handoff guard checks are valid.');

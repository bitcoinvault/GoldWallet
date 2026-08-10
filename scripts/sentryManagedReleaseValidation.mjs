import { sentryReleaseProfiles } from './createSentryProperties.mjs';

const supportedProfiles = Object.keys(sentryReleaseProfiles);
const supportedHandoffArgs = new Set([
  '--dry-run',
  '--preflight-only',
  '--summary-only',
  '--skip-android-release',
  '--help',
  '-h',
]);

export const parseSentryManagedReleaseValidationArgs = ({ argv, env = process.env }) => {
  const handoffArgs = [];
  const normalizedHandoffArgs = new Set();
  let profileArg;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    let value;

    if (arg === '--profile') {
      value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error('--profile requires a value');
      index += 1;
    } else if (arg.startsWith('--profile=')) {
      value = arg.slice('--profile='.length);
      if (!value) throw new Error('--profile requires a value');
    } else {
      if (!supportedHandoffArgs.has(arg)) throw new Error(`Unsupported managed handoff argument: ${arg}`);
      const normalizedArg = arg === '-h' ? '--help' : arg;
      if (normalizedHandoffArgs.has(normalizedArg)) {
        throw new Error(`Managed handoff argument must be provided at most once: ${normalizedArg}`);
      }
      normalizedHandoffArgs.add(normalizedArg);
      handoffArgs.push(arg);
      continue;
    }

    if (profileArg) throw new Error('--profile must be provided at most once');
    profileArg = value;
  }

  const help = normalizedHandoffArgs.has('--help');
  if (help) {
    return { env: { ...env }, handoffArgs, help: true, profile: undefined };
  }
  if (normalizedHandoffArgs.has('--summary-only') && normalizedHandoffArgs.has('--dry-run')) {
    throw new Error('--summary-only cannot be combined with --dry-run');
  }
  if (normalizedHandoffArgs.has('--summary-only') && normalizedHandoffArgs.has('--preflight-only')) {
    throw new Error('--summary-only cannot be combined with --preflight-only');
  }

  const envProfile = env.SENTRY_RELEASE_PROFILE;
  if (profileArg && envProfile && profileArg !== envProfile) {
    throw new Error('--profile conflicts with SENTRY_RELEASE_PROFILE');
  }

  const profile = profileArg || envProfile;
  if (!profile) {
    throw new Error(
      `Select a Sentry release profile with --profile=${supportedProfiles.join('|')} or SENTRY_RELEASE_PROFILE`,
    );
  }
  if (!supportedProfiles.includes(profile)) {
    throw new Error(`Sentry release profile must be one of: ${supportedProfiles.join(', ')}`);
  }

  return {
    env: { ...env, SENTRY_RELEASE_PROFILE: profile },
    dryRun: normalizedHandoffArgs.has('--dry-run'),
    handoffArgs,
    help: false,
    profile,
  };
};

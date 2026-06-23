/**
 * Checks if current configuration includes "beta" word.
 */
export const isBeta = (): boolean => {
  return getDetoxConfiguration().includes('beta');
};

/** Generates random string */
export const randomString = () => Math.random().toString(36).substring(7);

/** Waits x miliseconds */
export const wait = (miliseconds: number) =>
  new Promise(resolve => {
    setTimeout(resolve, miliseconds);
  });

function getDetoxConfiguration() {
  const configuration = process.env.DETOX_CONFIGURATION;

  if (!configuration) {
    throw new Error(
      'DETOX_CONFIGURATION is missing. Use scripts/runDetoxAndroidTest.mjs or set it before running e2e tests.',
    );
  }

  return configuration;
}

export function getBuildEnv() {
  const configurationName = getDetoxConfiguration();
  const flavour = configurationName.match(/dev|stage|prod/);

  if (!flavour) {
    throw new Error(`Unable to determine build environment from Detox configuration: ${configurationName}`);
  }

  return flavour.toString();
}

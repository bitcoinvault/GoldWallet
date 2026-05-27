export const expectedAndroidEnvConfigFiles = new Map([
  ['devdebug', '.env.dev.testnet'],
  ['stagedebug', '.env.stage.mainnet'],
  ['proddebug', '.env.prod.mainnet'],
  ['betadebug', '.env.beta.testnet'],
  ['devrelease', '.env.dev.testnet'],
  ['stagerelease', '.env.stage.mainnet'],
  ['prodrelease', '.env.prod.mainnet'],
  ['betarelease', '.env.beta.mainnet'],
]);

export const parseAndroidEnvConfigFiles = gradleContent => {
  const blockMatch = gradleContent.match(/project\.ext\.envConfigFiles\s*=\s*\[([\s\S]*?)\]/);

  if (!blockMatch) {
    return new Map();
  }

  return new Map(
    [...blockMatch[1].matchAll(/([A-Za-z0-9_]+)\s*:\s*['"]([^'"]+)['"]/g)].map(match => [
      match[1].toLowerCase(),
      match[2],
    ]),
  );
};

export const getAndroidEnvConfigFilesErrors = actualConfigFiles => {
  const errors = [];

  if (actualConfigFiles.size === 0) {
    return ['android/app/build.gradle does not define project.ext.envConfigFiles.'];
  }

  expectedAndroidEnvConfigFiles.forEach((expectedEnvFile, variant) => {
    const actualEnvFile = actualConfigFiles.get(variant);

    if (!actualEnvFile) {
      errors.push(`Missing Android envConfigFiles mapping for ${variant}.`);
      return;
    }

    if (actualEnvFile !== expectedEnvFile) {
      errors.push(`Android envConfigFiles maps ${variant} to ${actualEnvFile}; expected ${expectedEnvFile}.`);
    }
  });

  actualConfigFiles.forEach((_, variant) => {
    if (!expectedAndroidEnvConfigFiles.has(variant)) {
      errors.push(`Unexpected Android envConfigFiles mapping for ${variant}.`);
    }
  });

  return errors;
};

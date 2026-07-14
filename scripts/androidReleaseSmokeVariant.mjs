import path from 'path';

const releaseSmokeVariants = Object.freeze({
  dev: Object.freeze({ packageName: 'io.goldwallet.wallet.dev' }),
  stage: Object.freeze({ packageName: 'io.goldwallet.wallet.stage' }),
  prod: Object.freeze({ packageName: 'io.goldwallet.wallet' }),
  beta: Object.freeze({ packageName: 'io.goldwallet.wallet.beta' }),
});

export const supportedAndroidReleaseSmokeVariants = Object.freeze(Object.keys(releaseSmokeVariants));

const assertSupportedVariant = variant => {
  if (!supportedAndroidReleaseSmokeVariants.includes(variant)) {
    throw new Error(
      `Unsupported Android release smoke variant: ${variant}. Expected one of: ${supportedAndroidReleaseSmokeVariants.join(', ')}`,
    );
  }
};

export const parseAndroidReleaseSmokeVariant = args => {
  const inlineArgument = args.find(argument => argument.startsWith('--variant='));
  const variantArgumentIndex = args.indexOf('--variant');
  let variant = 'dev';

  if (inlineArgument) {
    variant = inlineArgument.slice('--variant='.length);
  } else if (variantArgumentIndex >= 0) {
    variant = args[variantArgumentIndex + 1];
    if (!variant || variant.startsWith('--')) {
      throw new Error('Missing value for --variant');
    }
  }

  assertSupportedVariant(variant);
  return variant;
};

export const getAndroidReleaseSmokeVariantConfig = (root, variant) => {
  assertSupportedVariant(variant);

  const displayName = `${variant}Release`;
  const artifactBase = `android-smoke-${variant}-release`;

  return {
    variant,
    displayName,
    packageName: releaseSmokeVariants[variant].packageName,
    unsignedApkPath: path.join(
      root,
      'android',
      'app',
      'build',
      'outputs',
      'apk',
      variant,
      'release',
      `app-${variant}-release-unsigned.apk`,
    ),
    alignedApkPath: path.join(root, 'local-docs', `${artifactBase}-aligned.apk`),
    signedApkPath: path.join(root, 'local-docs', `${artifactBase}-signed.apk`),
    artifactBase,
  };
};

export const getAndroidReleaseCreateWalletSmokeVariantConfig = (root, variant) => {
  const releaseSmokeConfig = getAndroidReleaseSmokeVariantConfig(root, variant);

  return {
    ...releaseSmokeConfig,
    activityName: `${releaseSmokeConfig.packageName}/io.goldwallet.wallet.MainActivity`,
    artifactBase: `android-create-wallet-smoke-${variant}-release`,
  };
};

export const getAndroidReleaseImportWalletSmokeVariantConfig = (root, variant) => {
  const releaseSmokeConfig = getAndroidReleaseSmokeVariantConfig(root, variant);

  return {
    ...releaseSmokeConfig,
    activityName: `${releaseSmokeConfig.packageName}/io.goldwallet.wallet.MainActivity`,
    artifactBase: `android-import-wallet-smoke-${variant}-release`,
  };
};

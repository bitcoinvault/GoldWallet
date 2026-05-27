export const expectedIosSchemeConfigs = new Map([
  ['GoldWallet (Debug).xcscheme', { envFile: '.env.prod.mainnet', firebasePlist: 'GoogleService-Info-prod.plist' }],
  ['GoldWallet (Release).xcscheme', { envFile: '.env.prod.mainnet', firebasePlist: 'GoogleService-Info-prod.plist' }],
  ['GoldWallet Beta (Debug).xcscheme', { envFile: '.env.beta.testnet', firebasePlist: null }],
  ['GoldWallet Beta (Release).xcscheme', { envFile: '.env.beta.mainnet', firebasePlist: null }],
  ['GoldWallet Dev (Debug).xcscheme', { envFile: '.env.dev.testnet', firebasePlist: 'GoogleService-Info-dev.plist' }],
  ['GoldWallet Dev (Release).xcscheme', { envFile: '.env.dev.testnet', firebasePlist: 'GoogleService-Info-dev.plist' }],
  ['GoldWallet Stage (Debug).xcscheme', { envFile: '.env.dev.testnet', firebasePlist: 'GoogleService-Info-stage.plist' }],
  ['GoldWallet Stage (Release).xcscheme', { envFile: '.env.stage.mainnet', firebasePlist: 'GoogleService-Info-stage.plist' }],
]);

const decodeSchemeScriptText = content =>
  content.replace(/&quot;/g, '"').replace(/&#10;/g, '\n').replace(/&amp;/g, '&');

export const parseIosSchemeConfig = schemeContent => {
  const scriptTextMatch = schemeContent.match(/scriptText = "([\s\S]*?)"/);
  const scriptText = scriptTextMatch ? decodeSchemeScriptText(scriptTextMatch[1]) : '';
  const envFileMatch = scriptText.match(/\.env\.[A-Za-z0-9_.-]+/);
  const firebasePlistMatch = scriptText.match(/GoogleService-Info-[A-Za-z0-9_.-]+\.plist/);

  return {
    envFile: envFileMatch ? envFileMatch[0] : null,
    firebasePlist: firebasePlistMatch ? firebasePlistMatch[0] : null,
  };
};

export const getIosSchemeConfigErrors = actualSchemeConfigs => {
  const errors = [];

  if (actualSchemeConfigs.size === 0) {
    return ['No iOS scheme config entries were found.'];
  }

  expectedIosSchemeConfigs.forEach((expectedConfig, schemeFile) => {
    const actualConfig = actualSchemeConfigs.get(schemeFile);

    if (!actualConfig) {
      errors.push(`Missing iOS scheme config for ${schemeFile}.`);
      return;
    }

    if (actualConfig.envFile !== expectedConfig.envFile) {
      errors.push(`iOS scheme ${schemeFile} copies ${actualConfig.envFile || 'no env file'}; expected ${expectedConfig.envFile}.`);
    }

    if (actualConfig.firebasePlist !== expectedConfig.firebasePlist) {
      errors.push(
        `iOS scheme ${schemeFile} copies ${actualConfig.firebasePlist || 'no Firebase plist'}; expected ${
          expectedConfig.firebasePlist || 'no Firebase plist'
        }.`,
      );
    }
  });

  actualSchemeConfigs.forEach((_, schemeFile) => {
    if (!expectedIosSchemeConfigs.has(schemeFile)) {
      errors.push(`Unexpected iOS scheme config for ${schemeFile}.`);
    }
  });

  return errors;
};

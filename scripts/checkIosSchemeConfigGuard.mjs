import {
  expectedIosSchemeConfigs,
  getIosSchemeConfigErrors,
  parseIosSchemeConfig,
} from './iosSchemeConfigGuard.mjs';

const schemeFixture = (envFile, firebasePlist) => `
<Scheme>
  <BuildAction>
    <PreActions>
      <ExecutionAction>
        <ActionContent
          scriptText = "cp &quot;../${envFile}&quot; &quot;../.env&quot;&#10;${
            firebasePlist
              ? `cp -r &quot;${firebasePlist}&quot; &quot;GoldWallet.app/GoogleService-Info.plist&quot;&#10;`
              : ''
          }">
        </ActionContent>
      </ExecutionAction>
    </PreActions>
  </BuildAction>
</Scheme>
`;

const completeFixture = new Map(
  [...expectedIosSchemeConfigs.entries()].map(([schemeFile, config]) => [
    schemeFile,
    parseIosSchemeConfig(schemeFixture(config.envFile, config.firebasePlist)),
  ]),
);

const changedEnvFixture = new Map(completeFixture);
changedEnvFixture.set('GoldWallet Stage (Debug).xcscheme', {
  ...changedEnvFixture.get('GoldWallet Stage (Debug).xcscheme'),
  envFile: '.env.stage.mainnet',
});

const changedFirebaseFixture = new Map(completeFixture);
changedFirebaseFixture.set('GoldWallet Beta (Debug).xcscheme', {
  ...changedFirebaseFixture.get('GoldWallet Beta (Debug).xcscheme'),
  firebasePlist: 'GoogleService-Info-dev.plist',
});

const missingSchemeFixture = new Map(completeFixture);
missingSchemeFixture.delete('GoldWallet (Release).xcscheme');

const unexpectedSchemeFixture = new Map(completeFixture);
unexpectedSchemeFixture.set('GoldWallet Local (Debug).xcscheme', {
  envFile: '.env.dev.testnet',
  firebasePlist: 'GoogleService-Info-dev.plist',
});

const assertAccepted = (label, actualSchemeConfigs) => {
  const errors = getIosSchemeConfigErrors(actualSchemeConfigs);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, actualSchemeConfigs) => {
  const errors = getIosSchemeConfigErrors(actualSchemeConfigs);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Complete iOS scheme config fixture', completeFixture);
assertRejected('Changed iOS scheme env fixture', changedEnvFixture);
assertRejected('Changed iOS scheme Firebase fixture', changedFirebaseFixture);
assertRejected('Missing iOS scheme fixture', missingSchemeFixture);
assertRejected('Unexpected iOS scheme fixture', unexpectedSchemeFixture);
assertRejected('No iOS scheme configs fixture', new Map());

if (expectedIosSchemeConfigs.size !== 8) {
  console.error(`Expected 8 iOS scheme config baseline entries, got ${expectedIosSchemeConfigs.size}.`);
  process.exit(1);
}

console.log('iOS scheme config guard checks are valid.');

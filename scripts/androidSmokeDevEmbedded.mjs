process.env.ANDROID_SMOKE_REQUIRE_METRO ??= 'false';
process.env.ANDROID_SMOKE_EXPECT_TEXTS ??= 'Wallets,No wallets,Create new wallet,Import wallet';
process.env.ANDROID_SMOKE_EXPECT_RESOURCE_IDS ??=
  'dashboard-header,no-wallets-icon,create-wallet-button,import-wallet-button,navigation-tab-0';
process.env.ANDROID_SMOKE_VALIDATE_EMPTY_DASHBOARD_CTAS ??= 'true';
process.env.ANDROID_SMOKE_WAIT_MS ??= '45000';
process.env.ANDROID_SMOKE_CLEAR_APP_DATA ??= 'true';

await import('./androidSmokeDev.mjs');

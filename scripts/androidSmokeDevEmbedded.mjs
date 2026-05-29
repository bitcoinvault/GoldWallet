process.env.ANDROID_SMOKE_REQUIRE_METRO ??= 'false';
process.env.ANDROID_SMOKE_EXPECT_TEXTS ??= 'Wallets,No wallets,Create new wallet,Import wallet';
process.env.ANDROID_SMOKE_WAIT_MS ??= '45000';

await import('./androidSmokeDev.mjs');

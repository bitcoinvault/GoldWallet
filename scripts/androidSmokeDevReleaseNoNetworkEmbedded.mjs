process.env.ANDROID_SMOKE_REQUIRE_METRO ??= 'false';
process.env.ANDROID_SMOKE_OUTPUT_BASENAME ??= 'android-smoke-dev-release-no-network';
process.env.ANDROID_SMOKE_EXPECT_TEXTS ??= 'No network';
process.env.ANDROID_SMOKE_DATA_STORAGE_MULTIPLIER ??= '2.5';
process.env.ANDROID_SMOKE_EXPECT_RESOURCE_IDS ??= '';
process.env.ANDROID_SMOKE_VALIDATE_EMPTY_DASHBOARD_CTAS ??= 'false';
process.env.ANDROID_SMOKE_VALIDATE_EMPTY_TAB_NAVIGATION ??= 'false';
process.env.ANDROID_SMOKE_VALIDATE_QR_SCANNER ??= 'false';
process.env.ANDROID_SMOKE_VALIDATE_SETTINGS_TERMS_WEBVIEW ??= 'false';
process.env.ANDROID_SMOKE_ALLOW_NETWORK_LOGCAT_FAILURES ??= 'true';
process.env.ANDROID_SMOKE_WAIT_MS ??= '45000';
process.env.ANDROID_SMOKE_CLEAR_APP_DATA ??= 'true';

await import('./androidSmokeDevReleaseEmbedded.mjs');

const legacyMarkers = [
  'com.reactlibrary.securekeystore',
  'RNSecureKeyStorePackage',
  'RNSecureKeyStoreModule',
];
const keychainMarker = 'com.oblador.keychain.KeychainModule';

export const getAndroidReleaseSecureStorageDumpErrors = variantDumps => {
  const errors = [];

  for (const [variant, dump] of Object.entries(variantDumps)) {
    if (!dump.includes(keychainMarker)) {
      errors.push(`Variant ${variant} release APK must contain react-native-keychain marker ${keychainMarker}`);
    }

    const presentLegacyMarkers = legacyMarkers.filter(marker => dump.includes(marker));

    if (presentLegacyMarkers.length > 0) {
      errors.push(
        `Variant ${variant} release APK contains legacy secure-storage package marker(s): ${presentLegacyMarkers.join(', ')}`,
      );
    }
  }

  return errors;
};


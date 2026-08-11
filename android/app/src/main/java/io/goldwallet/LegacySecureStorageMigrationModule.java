package io.goldwallet;

import android.content.SharedPreferences;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class LegacySecureStorageMigrationModule extends ReactContextBaseJavaModule {
  private static final String MODULE_NAME = "GoldWalletLegacySecureStorage";
  private static final String PREFERENCES_NAME = "secret_shared_prefs";
  private static final String READ_ERROR = "LEGACY_SECURE_STORAGE_READ_FAILED";
  private static final String REMOVE_ERROR = "LEGACY_SECURE_STORAGE_REMOVE_FAILED";
  private final ReactApplicationContext reactContext;

  LegacySecureStorageMigrationModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  @SuppressWarnings("deprecation")
  private SharedPreferences getLegacyPreferences() throws Exception {
    MasterKey masterKey = new MasterKey.Builder(reactContext, MasterKey.DEFAULT_MASTER_KEY_ALIAS)
      .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
      .build();

    return EncryptedSharedPreferences.create(
      reactContext,
      PREFERENCES_NAME,
      masterKey,
      EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
      EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    );
  }

  @ReactMethod
  public void get(String key, Promise promise) {
    try {
      promise.resolve(getLegacyPreferences().getString(key, null));
    } catch (Exception error) {
      promise.reject(READ_ERROR, "Unable to read legacy secure storage", error);
    }
  }

  @ReactMethod
  public void remove(String key, Promise promise) {
    try {
      boolean removed = getLegacyPreferences().edit().remove(key).commit();
      if (!removed) {
        promise.reject(REMOVE_ERROR, "Unable to commit legacy secure storage removal");
        return;
      }

      promise.resolve(true);
    } catch (Exception error) {
      promise.reject(REMOVE_ERROR, "Unable to remove legacy secure storage value", error);
    }
  }
}

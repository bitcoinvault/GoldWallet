package io.goldwallet.wallet;

import android.app.Application;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeApplicationEntryPoint;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;
import io.goldwallet.LegacySecureStorageMigrationPackage;
import io.goldwallet.PreventScreenshotPackage;
import java.util.Collections;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {  
  private ReactHost mReactHost;

  private List<ReactPackage> buildPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    // Packages that cannot be autolinked yet can be added manually here, for example:
    // packages.add(new MyReactNativePackage());
    packages.add(new LegacySecureStorageMigrationPackage());
    packages.add(new PreventScreenshotPackage());

    return packages;
  }

  private final ReactNativeHost mReactNativeHost = new DefaultReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return buildPackages();
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }

    @Override
    protected boolean isNewArchEnabled() {
      return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    }

    @Override
    protected boolean isHermesEnabled() {
      return BuildConfig.IS_HERMES_ENABLED;
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public ReactHost getReactHost() {
    if (mReactHost == null) {
      mReactHost =
        DefaultReactHost.getDefaultReactHost(
          getApplicationContext(),
          buildPackages(),
          "index",
          "index.android.bundle",
          null,
          null,
          BuildConfig.DEBUG,
          Collections.emptyList(),
          exception -> {
            throw new RuntimeException(exception);
          },
          null
        );
    }

    return mReactHost;
  }
  
    @Override
    public void onCreate() {
      super.onCreate();
      ReactNativeApplicationEntryPoint.loadReactNative(this);
    }
}

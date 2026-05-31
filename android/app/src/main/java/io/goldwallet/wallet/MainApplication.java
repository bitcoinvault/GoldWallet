package io.goldwallet.wallet;

import android.app.Application;
import android.content.Context;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeApplicationEntryPoint;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.microsoft.codepush.react.CodePush;
import io.goldwallet.PreventScreenshotPackage;
import java.util.Collections;
import java.util.List;
import java.lang.reflect.InvocationTargetException;
import okhttp3.OkHttpClient;

public class MainApplication extends Application implements ReactApplication {  
  private ReactHost mReactHost;

  private List<ReactPackage> buildPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    // Packages that cannot be autolinked yet can be added manually here, for example:
    // packages.add(new MyReactNativePackage());
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
    protected String getJSBundleFile() {
        return getCodePushBundleFile();
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
          getCodePushBundleFile(),
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

  private String getCodePushBundleFile() {
    if (
      !BuildConfig.DEBUG &&
      "true".equals(BuildConfig.CODEPUSH_ENABLED) &&
      BuildConfig.CODEPUSH_DEPLOYMENT_KEY_ANDROID != null &&
      BuildConfig.CODEPUSH_DEPLOYMENT_KEY_ANDROID.length() > 0
    ) {
      return CodePush.getJSBundleFile();
    }

    return null;
  }
  
    @Override
    public void onCreate() {
      super.onCreate();
      ReactNativeApplicationEntryPoint.loadReactNative(this);
      // The legacy Flipper bootstrap references Fresco classes that are no longer
      // bundled by the current RN debug runtime.
    }
  
    /**
     * Loads Flipper in React Native templates. Call this in the onCreate method with something like
     * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
     *
     * @param context
     * @param reactInstanceManager
     */
    private static void initializeFlipper(
        Context context, ReactInstanceManager reactInstanceManager) {
      if (BuildConfig.DEBUG) {
        try {
          /*
           We use reflection here to pick up the class that initializes
           Flipper, since Flipper library is not available in release mode
          */
          Class<?> aClass = Class.forName("io.goldwallet.wallet.ReactNativeFlipper");
          aClass
              .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
              .invoke(null, context, reactInstanceManager);
        } catch (ClassNotFoundException e) {
          e.printStackTrace();
        } catch (NoSuchMethodException e) {
          e.printStackTrace();
        } catch (IllegalAccessException e) {
          e.printStackTrace();
        } catch (InvocationTargetException e) {
          e.printStackTrace();
        }
      }
    }
}

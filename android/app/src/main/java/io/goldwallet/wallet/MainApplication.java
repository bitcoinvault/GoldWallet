package io.goldwallet.wallet;

import android.app.Application;
import android.content.Context;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.soloader.OpenSourceMergedSoMapping;
import com.microsoft.codepush.react.CodePush;
import com.facebook.soloader.SoLoader;
import io.goldwallet.PreventScreenshotPackage;
import java.io.IOException;
import java.util.List;
import java.lang.reflect.InvocationTargetException;
import okhttp3.OkHttpClient;

public class MainApplication extends Application implements ReactApplication {  
  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here, for example:
      // packages.add(new MyReactNativePackage());
      packages.add(new PreventScreenshotPackage());
      
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
    @Override
    protected String getJSBundleFile() {
        return CodePush.getJSBundleFile();
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }
  
    @Override
    public void onCreate() {
      super.onCreate();
      try {
        SoLoader.init(this, OpenSourceMergedSoMapping.INSTANCE);
      } catch (IOException e) {
        throw new RuntimeException("Failed to initialize SoLoader", e);
      }
      // The legacy Flipper bootstrap references Fresco classes that are no longer
      // bundled by the RN 0.76 debug runtime.
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

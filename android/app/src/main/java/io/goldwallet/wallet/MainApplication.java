package io.goldwallet.wallet;

import android.app.Application;
import android.content.Context;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.microsoft.codepush.react.CodePush;
import com.facebook.soloader.SoLoader;
import io.goldwallet.PreventScreenshotPackage;
import java.util.List;
import java.util.ArrayList;
import java.lang.reflect.InvocationTargetException;
import okhttp3.OkHttpClient;

// Importy pakietów
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.reactnativecommunity.clipboard.ClipboardPackage;
import org.reactnative.maskedview.RNCMaskedViewPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.reactnativecommunity.slider.ReactSliderPackage;
import io.invertase.firebase.analytics.ReactNativeFirebaseAnalyticsPackage;
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
import io.invertase.firebase.crashlytics.ReactNativeFirebaseCrashlyticsPackage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage;
import io.sentry.react.RNSentryPackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.rnbiometrics.ReactNativeBiometricsPackage;
import com.zoontek.rnbootsplash.RNBootSplashPackage;
import org.reactnative.camera.RNCameraPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.github.wumke.RNExitApp.RNExitAppPackage;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.reactcommunity.rnlocalize.RNLocalizePackage;
import im.shimo.react.prompt.RNPromptPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.reactnativerate.RNRatePackage;
import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
import com.reactlibrary.securekeystore.RNSecureKeyStorePackage;
import cl.json.RNSharePackage;
import com.horcrux.svg.SvgPackage;
import com.asterinet.react.tcpsocket.TcpSocketPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.apsl.versionnumber.RNVersionNumberPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.gantix.JailMonkey.JailMonkeyPackage;
import com.kevinresol.react_native_default_preference.RNDefaultPreferencePackage;
import com.facebook.flipper.reactnative.FlipperPackage;
import com.facebook.react.shell.MainReactPackage;

public class MainApplication extends Application implements ReactApplication {  
  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      // Zwracamy true dla trybu deweloperskiego
      return true; // BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      List<ReactPackage> packages = new ArrayList<>();
      
      // Dodajemy wszystkie pakiety ręcznie
      packages.add(new MainReactPackage());
      packages.add(new AsyncStoragePackage());
      packages.add(new ClipboardPackage());
      // Pomijamy BlurViewPackage
      packages.add(new RNCMaskedViewPackage());
      packages.add(new NetInfoPackage());
      packages.add(new ReactSliderPackage());
      packages.add(new ReactNativeFirebaseAnalyticsPackage());
      packages.add(new ReactNativeFirebaseAppPackage());
      packages.add(new ReactNativeFirebaseCrashlyticsPackage());
      packages.add(new ReactNativeFirebaseMessagingPackage());
      packages.add(new RNSentryPackage());
      packages.add(new BackgroundTimerPackage());
      packages.add(new ReactNativeBiometricsPackage());
      packages.add(new RNBootSplashPackage());
      packages.add(new RNCameraPackage());
      packages.add(new CodePush("", getApplicationContext(), false)); // Pusty klucz
      packages.add(new ReactNativeConfigPackage());
      packages.add(new RNDeviceInfo());
      packages.add(new RNExitAppPackage());
      packages.add(new FastImageViewPackage());
      packages.add(new RNGestureHandlerPackage());
      packages.add(new LinearGradientPackage());
      packages.add(new RNLocalizePackage());
      packages.add(new RNPromptPackage());
      packages.add(new RandomBytesPackage());
      packages.add(new RNRatePackage());
      packages.add(new SafeAreaContextPackage());
      // Pomijamy RNScreensPackage
      packages.add(new RNSecureKeyStorePackage());
      packages.add(new RNSharePackage());
      packages.add(new SvgPackage());
      packages.add(new TcpSocketPackage());
      packages.add(new VectorIconsPackage());
      packages.add(new RNVersionNumberPackage());
      packages.add(new RNCWebViewPackage());
      packages.add(new JailMonkeyPackage());
      packages.add(new RNDefaultPreferencePackage());
      packages.add(new FlipperPackage());
      
      // Dodajemy własny pakiet
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
      SoLoader.init(this, /* native exopackage */ false);
      initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
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
      // Zawsze używamy trybu deweloperskiego dla Flippera
      boolean enableFlipper = true; // BuildConfig.DEBUG;
      if (enableFlipper) {
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

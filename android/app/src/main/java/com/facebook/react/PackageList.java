package com.facebook.react;

import android.app.Application;
import android.content.Context;
import android.content.res.Resources;

import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainPackage;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

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
import com.microsoft.codepush.react.CodePush;
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
import io.goldwallet.PreventScreenshotPackage;

public class PackageList {
  private Application application;
  private ReactNativeHost reactNativeHost;
  private Resources resources;

  public PackageList(ReactNativeHost reactNativeHost) {
    this.reactNativeHost = reactNativeHost;
    this.application = reactNativeHost.getApplication();
    this.resources = this.application.getResources();
  }

  public PackageList(Application application) {
    this.reactNativeHost = null;
    this.application = application;
    this.resources = this.application.getResources();
  }

  private Resources getResources() {
    return this.resources;
  }

  private Application getApplication() {
    return this.application;
  }

  private ReactNativeHost getReactNativeHost() {
    return this.reactNativeHost;
  }

  public List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new ArrayList<>();
    
    // Dodajemy wszystkie pakiety ręcznie
    packages.add(new MainPackage());
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
    packages.add(new CodePush("", getApplication(), false)); // Pusty klucz
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
} 
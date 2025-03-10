package io.goldwallet.wallet;

import com.facebook.react.ReactActivity;
import android.os.Bundle;
import com.zoontek.rnbootsplash.RNBootSplash;

public class MainActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Tymczasowo wyłączamy inicjalizację RNBootSplash
        // RNBootSplash.init(R.drawable.background_splash, MainActivity.this);
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        // Zwracamy stałą nazwę zamiast odwoływać się do BuildConfig
        return "GoldWallet";
    }
}

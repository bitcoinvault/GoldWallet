import 'react-native-gesture-handler';
import 'react-native-get-random-values';

import 'intl';
import 'intl/locale-data/jsonp/en';
import './shim.js';
import { ImagePropTypes, TextPropTypes, ViewPropTypes } from 'deprecated-react-native-prop-types';
import { AppRegistry, Image, LogBox, Text, View } from 'react-native';

import config from './src/config';

const defineLegacyPropTypes = (Component, propTypes) => {
  if (!Component.propTypes) {
    Object.defineProperty(Component, 'propTypes', {
      configurable: true,
      get: () => propTypes,
    });
  }
};

defineLegacyPropTypes(View, ViewPropTypes);
defineLegacyPropTypes(Text, TextPropTypes);
defineLegacyPropTypes(Image, ImagePropTypes);

const Main = require('./Main').default;

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  '`new NativeEventEmitter()` was called with a non-null argument',
  'without the required `addListener` method',
  'without the required `removeListeners` method',
  'The app is running using the Legacy Architecture',
  'The native module for Flipper seems unavailable',
  'ViewPropTypes will be removed from React Native',
]);

if (!Error.captureStackTrace) {
  // captureStackTrace is only available when debugging
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Error.captureStackTrace = () => {};
}

AppRegistry.registerComponent(config.applicationName, () => Main);

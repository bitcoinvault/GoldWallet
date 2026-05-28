import 'react-native-gesture-handler';
import 'react-native-get-random-values';

import 'intl';
import 'intl/locale-data/jsonp/en';
import './shim.js';
import { AppRegistry, LogBox } from 'react-native';

import Main from './Main';
import config from './src/config';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  '`new NativeEventEmitter()` was called with a non-null argument',
  'ViewPropTypes will be removed from React Native',
]);

if (!Error.captureStackTrace) {
  // captureStackTrace is only available when debugging
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Error.captureStackTrace = () => {};
}

AppRegistry.registerComponent(config.applicationName, () => Main);

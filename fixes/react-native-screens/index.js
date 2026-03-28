// Mock implementation of react-native-screens
export const ScreenContainer = ({ children }) => children;
export const Screen = ({ children }) => children;
export const screensEnabled = () => false;
export default {
  ScreenContainer,
  Screen,
  screensEnabled,
  enableScreens: () => {},
  NativeScreen: ({ children }) => children,
  NativeScreenContainer: ({ children }) => children,
}; 
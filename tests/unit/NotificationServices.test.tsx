jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getToken: jest.fn(),
    requestPermission: jest.fn(),
  })),
}));
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
}));

import {
  POST_NOTIFICATIONS_PERMISSION,
  requestAndroidPostNotificationsPermission,
} from '../../src/services/NotificationServices';

describe('unit - NotificationServices Android notification permission', () => {
  const createPermissionsAndroid = ({ hasPermission = false, requestResult = 'denied' } = {}) =>
    ({
      check: jest.fn().mockResolvedValue(hasPermission),
      request: jest.fn().mockResolvedValue(requestResult),
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
    }) as any;

  it('does not request POST_NOTIFICATIONS outside Android', async () => {
    const permissionsAndroid = createPermissionsAndroid();

    await expect(
      requestAndroidPostNotificationsPermission({
        platformOS: 'ios',
        platformVersion: '17.0',
        permissionsAndroid,
      }),
    ).resolves.toBe(true);
    expect(permissionsAndroid.check).not.toHaveBeenCalled();
    expect(permissionsAndroid.request).not.toHaveBeenCalled();
  });

  it('does not request POST_NOTIFICATIONS before Android 13', async () => {
    const permissionsAndroid = createPermissionsAndroid();

    await expect(
      requestAndroidPostNotificationsPermission({
        platformOS: 'android',
        platformVersion: 32,
        permissionsAndroid,
      }),
    ).resolves.toBe(true);
    expect(permissionsAndroid.check).not.toHaveBeenCalled();
    expect(permissionsAndroid.request).not.toHaveBeenCalled();
  });

  it('keeps existing Android 13 notification permission without requesting again', async () => {
    const permissionsAndroid = createPermissionsAndroid({ hasPermission: true });

    await expect(
      requestAndroidPostNotificationsPermission({
        platformOS: 'android',
        platformVersion: 33,
        permissionsAndroid,
      }),
    ).resolves.toBe(true);
    expect(permissionsAndroid.check).toHaveBeenCalledWith(POST_NOTIFICATIONS_PERMISSION);
    expect(permissionsAndroid.request).not.toHaveBeenCalled();
  });

  it('requests Android 13 notification permission and returns true when granted', async () => {
    const permissionsAndroid = createPermissionsAndroid({ hasPermission: false, requestResult: 'granted' });

    await expect(
      requestAndroidPostNotificationsPermission({
        platformOS: 'android',
        platformVersion: 33,
        permissionsAndroid,
      }),
    ).resolves.toBe(true);
    expect(permissionsAndroid.check).toHaveBeenCalledWith(POST_NOTIFICATIONS_PERMISSION);
    expect(permissionsAndroid.request).toHaveBeenCalledWith(POST_NOTIFICATIONS_PERMISSION);
  });

  it('returns false when Android 13 notification permission is denied', async () => {
    const permissionsAndroid = createPermissionsAndroid({ hasPermission: false, requestResult: 'denied' });

    await expect(
      requestAndroidPostNotificationsPermission({
        platformOS: 'android',
        platformVersion: 33,
        permissionsAndroid,
      }),
    ).resolves.toBe(false);
    expect(permissionsAndroid.check).toHaveBeenCalledWith(POST_NOTIFICATIONS_PERMISSION);
    expect(permissionsAndroid.request).toHaveBeenCalledWith(POST_NOTIFICATIONS_PERMISSION);
  });
});

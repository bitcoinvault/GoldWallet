import { AuthorizationStatus, getMessaging, getToken, requestPermission } from '@react-native-firebase/messaging';
import { useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux';

import { setFCMToken } from 'app/state/appSettings/actions';

export const POST_NOTIFICATIONS_PERMISSION = 'android.permission.POST_NOTIFICATIONS';
const firebaseMessaging = getMessaging();

type AndroidNotificationPermissionOptions = {
  platformOS?: typeof Platform.OS;
  platformVersion?: typeof Platform.Version;
  permissionsAndroid?: Pick<typeof PermissionsAndroid, 'check' | 'request' | 'RESULTS'>;
};

export const requestAndroidPostNotificationsPermission = async ({
  platformOS = Platform.OS,
  platformVersion = Platform.Version,
  permissionsAndroid = PermissionsAndroid,
}: AndroidNotificationPermissionOptions = {}) => {
  if (platformOS !== 'android' || Number(platformVersion) < 33) {
    return true;
  }

  const permission = POST_NOTIFICATIONS_PERMISSION as any;
  const hasPermission = await permissionsAndroid.check(permission);

  if (hasPermission) {
    return true;
  }

  const result = await permissionsAndroid.request(permission);

  return result === permissionsAndroid.RESULTS.GRANTED;
};

const NotificationsServices = () => {
  const dispatch = useDispatch<Dispatch<any>>();

  const getFcmToken = useCallback(async () => {
    const fcmToken = await getToken(firebaseMessaging);

    if (fcmToken) {
      dispatch(setFCMToken(fcmToken));
    }
  }, [dispatch]);

  const requestAndroidNotificationPermission = useCallback(async () => {
    return requestAndroidPostNotificationsPermission();
  }, []);

  const requestUserPermission = useCallback(async () => {
    const androidNotificationsEnabled = await requestAndroidNotificationPermission();

    if (!androidNotificationsEnabled) {
      return;
    }

    const authStatus = await requestPermission(firebaseMessaging, { sound: true, badge: true });
    const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      getFcmToken();
    }
  }, [getFcmToken, requestAndroidNotificationPermission]);

  useEffect(() => {
    requestUserPermission();
  }, [requestUserPermission]);

  return null;
};

export default NotificationsServices;

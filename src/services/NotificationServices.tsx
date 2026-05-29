import messaging from '@react-native-firebase/messaging';
import { useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux';

import { setFCMToken } from 'app/state/appSettings/actions';

const POST_NOTIFICATIONS_PERMISSION = 'android.permission.POST_NOTIFICATIONS';

const NotificationsServices = () => {
  const dispatch = useDispatch<Dispatch<any>>();

  const getFcmToken = useCallback(async () => {
    const fcmToken = await messaging().getToken();

    if (fcmToken) {
      dispatch(setFCMToken(fcmToken));
    }
  }, [dispatch]);

  const requestAndroidNotificationPermission = useCallback(async () => {
    if (Platform.OS !== 'android' || Number(Platform.Version) < 33) {
      return true;
    }

    const permission = POST_NOTIFICATIONS_PERMISSION as any;
    const hasPermission = await PermissionsAndroid.check(permission);

    if (hasPermission) {
      return true;
    }

    const result = await PermissionsAndroid.request(permission);

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const requestUserPermission = useCallback(async () => {
    const androidNotificationsEnabled = await requestAndroidNotificationPermission();

    if (!androidNotificationsEnabled) {
      return;
    }

    const authStatus = await messaging().requestPermission({ sound: true, badge: true });
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

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

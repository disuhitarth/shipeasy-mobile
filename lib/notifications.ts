import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from './api';

// ── Android notification channel ──
export function configureAndroidChannel() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('shipments', {
      name: 'Shipments',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 50, 100],
      lightColor: '#635BFF',
    });
    Notifications.setNotificationChannelAsync('wallet', {
      name: 'Wallet',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    Notifications.setNotificationChannelAsync('system', {
      name: 'System',
      importance: Notifications.AndroidImportance.LOW,
    });
  }
}

// ── Request permission and return Expo push token ──
export async function getExpoPushToken(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = (Constants.expoConfig as any)?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: projectId || undefined,
  });
  return tokenData.data;
}

// ── Register push token with backend ──
export async function registerPushToken(token: string): Promise<void> {
  try {
    await api.post('/auth/push-token', { token });
  } catch {
    // Silently fail — backend may not support push tokens yet
  }
}

// ── Handle notification tap → navigate ──
export type NotificationData = {
  type?: string;
  shipCode?: string;
  url?: string;
};

export function getNotificationData(
  notification: Notifications.Notification,
): NotificationData | null {
  return notification.request.content.data as NotificationData | null;
}

// ── Set up foreground handler (show alert when app is open) ──
export function setupForegroundHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

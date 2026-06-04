import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/store/auth';
import { useBiometric } from '@/store/biometric';
import {
  configureAndroidChannel,
  setupForegroundHandler,
  getExpoPushToken,
  registerPushToken,
  getNotificationData,
} from '@/lib/notifications';

setupForegroundHandler();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function Boot() {
  const loadToken = useAuth((s) => s.loadToken);
  const loadBiometric = useBiometric((s) => s.load);
  const notificationResp = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    loadToken();
    loadBiometric();
    if (Platform.OS !== 'web') configureAndroidChannel();

    // Register push token after auth loads
    const timeout = setTimeout(async () => {
      const token = await getExpoPushToken();
      if (token) registerPushToken(token);
    }, 2000);

    // Handle notification tap when app was killed — native only
    if (Platform.OS !== 'web') {
      Notifications.getLastNotificationResponseAsync().then((resp) => {
        if (resp) handleNotificationTap(resp.notification);
      });

      notificationResp.current = Notifications.addNotificationResponseReceivedListener(
        (resp) => handleNotificationTap(resp.notification),
      );
    }

    return () => {
      clearTimeout(timeout);
      notificationResp.current?.remove();
    };
  }, []);

  return null;
}

function handleNotificationTap(notification: Notifications.Notification) {
  const data = getNotificationData(notification);
  if (data?.shipCode) {
    router.push(`/shipments/${data.shipCode}`);
  } else if (data?.type === 'wallet') {
    router.push('/(tabs)/wallet');
  }
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Boot />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="wizard" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="batch" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="shipments/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="skus" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="addresses" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="ship-now" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </QueryClientProvider>
  );
}

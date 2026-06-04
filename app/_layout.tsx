import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth, setQueryClientRef } from '@/store/auth';
import { useBiometric } from '@/store/biometric';
import { useSettings } from '@/store/settings';
import {
  configureAndroidChannel,
  setupForegroundHandler,
  getExpoPushToken,
  registerPushToken,
  getNotificationData,
} from '@/lib/notifications';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ToastProvider';

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

setQueryClientRef(queryClient);

function Boot() {
  const loadToken = useAuth((s) => s.loadToken);
  const loadBiometric = useBiometric((s) => s.load);
  const loadSettings = useSettings((s) => s.load);
  const settingsLoaded = useSettings((s) => s.loaded);
  const hasOnboarded = useSettings((s) => s.hasOnboarded);
  const notificationResp = useRef<Notifications.EventSubscription | null>(null);
  const didRoute = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadToken();
      if (cancelled) return;
      if (Platform.OS !== 'web') {
        const token = await getExpoPushToken();
        if (!cancelled && token) registerPushToken(token);
      }
    })();

    loadBiometric();
    loadSettings();
    if (Platform.OS !== 'web') configureAndroidChannel();

    if (Platform.OS !== 'web') {
      Notifications.getLastNotificationResponseAsync().then((resp) => {
        if (resp) handleNotificationTap(resp.notification);
      });

      notificationResp.current = Notifications.addNotificationResponseReceivedListener(
        (resp) => handleNotificationTap(resp.notification),
      );
    }

    return () => {
      cancelled = true;
      notificationResp.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (settingsLoaded && !didRoute.current) {
      didRoute.current = true;
      if (!hasOnboarded) {
        router.replace('/onboarding');
      }
    }
  }, [settingsLoaded, hasOnboarded]);

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
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Boot />
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 280,
                gestureEnabled: true,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="auth/login" options={{ animation: 'slide_from_bottom', animationDuration: 320 }} />
              <Stack.Screen name="auth/register" options={{ animation: 'slide_from_bottom', animationDuration: 320 }} />
              <Stack.Screen name="wizard" options={{ animation: 'slide_from_bottom', animationDuration: 360 }} />
              <Stack.Screen name="batch" options={{ animation: 'slide_from_bottom', animationDuration: 360 }} />
              <Stack.Screen name="shipments/[id]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="skus" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="addresses" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="ship-now" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="wallet/topup" options={{ animation: 'slide_from_bottom', animationDuration: 360 }} />
              <Stack.Screen name="wallet/cards" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="profile/personal-details" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="profile/security" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="profile/notifications" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="profile/help" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="profile/appearance" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
              <Stack.Screen name="profile/about" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
            </Stack>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

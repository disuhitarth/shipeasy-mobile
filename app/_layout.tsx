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
import { OfflineBanner } from '@/components/OfflineBanner';
import { TourProvider } from '@/components/Tour';
import { initAnalytics, track, page } from '@/lib/analytics';
import {
  installGlobalErrorHandler,
  setErrorUserId,
  reportError,
} from '@/lib/errorReporting';
import { startConnectionMonitor } from '@/lib/connection';
import { startAutoLock, stopAutoLock } from '@/lib/autoLock';
import { startSessionTimeout, stopSessionTimeout } from '@/lib/sessionTimeout';

setupForegroundHandler();
installGlobalErrorHandler();
startConnectionMonitor();
initAnalytics().catch(() => {});

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
  const user = useAuth((s) => s.user);
  const loadBiometric = useBiometric((s) => s.load);
  const loadSettings = useSettings((s) => s.load);
  const settingsLoaded = useSettings((s) => s.loaded);
  const hasOnboarded = useSettings((s) => s.hasOnboarded);
  const notificationResp = useRef<Notifications.EventSubscription | null>(null);
  const didRoute = useRef(false);
  const didTrackOpen = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadToken();
      } catch (err) {
        void reportError(err, { action: 'loadToken' });
      }
      if (cancelled) return;
      try {
        await track('app_open', {
          platform: Platform.OS,
          version: (require('expo-constants') as any).default?.expoConfig?.version,
        });
      } catch {}
      if (Platform.OS !== 'web') {
        try {
          const token = await getExpoPushToken();
          if (!cancelled && token) await registerPushToken(token);
        } catch (err) {
          void reportError(err, { action: 'getExpoPushToken' });
        }
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

    const stopAuto = startAutoLock();
    const stopSession = startSessionTimeout(() => {
      void track('session_timeout', {});
    });

    return () => {
      cancelled = true;
      notificationResp.current?.remove();
      stopAuto();
      stopSession();
      stopAutoLock();
      stopSessionTimeout();
    };
  }, []);

  useEffect(() => {
    if (user?._id) {
      setErrorUserId(user._id);
    } else {
      setErrorUserId(undefined);
    }
  }, [user?._id]);

  useEffect(() => {
    if (settingsLoaded && !didRoute.current) {
      didRoute.current = true;
      if (!hasOnboarded) {
        router.replace('/onboarding');
      }
    }
  }, [settingsLoaded, hasOnboarded]);

  useEffect(() => {
    if (!didTrackOpen.current) {
      didTrackOpen.current = true;
      void track('app_open', { source: 'mount' });
    }
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
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <TourProvider>
              <Boot />
              <StatusBar style="dark" />
              <OfflineBanner />
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
                <Stack.Screen name="+not-found" options={{ animation: 'fade', gestureEnabled: false }} />
              </Stack>
            </TourProvider>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

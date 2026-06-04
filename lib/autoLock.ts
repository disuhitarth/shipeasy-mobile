import { AppState, AppStateStatus, Platform } from 'react-native';
import { useBiometric } from '@/store/biometric';
import { clearClipboardNow } from './clipboard';

const BACKGROUND_LOCK_DELAY_MS = 30 * 1000;

let appStateSubscription: { remove: () => void } | null = null;
let backgroundTimer: ReturnType<typeof setTimeout> | null = null;
let lastBackgroundAt: number | null = null;

function clearBackgroundTimer() {
  if (backgroundTimer) {
    clearTimeout(backgroundTimer);
    backgroundTimer = null;
  }
}

function handleAppStateChange(nextState: AppStateStatus) {
  if (Platform.OS === 'web') return;
  const { enabled, lockNow, markUnlocked } = useBiometric.getState();

  if (nextState === 'active') {
    clearBackgroundTimer();
    if (lastBackgroundAt != null && enabled) {
      const elapsed = Date.now() - lastBackgroundAt;
      if (elapsed >= BACKGROUND_LOCK_DELAY_MS) {
        lockNow();
        void clearClipboardNow();
      } else {
        markUnlocked();
      }
    }
    lastBackgroundAt = null;
  } else if (nextState === 'background' || nextState === 'inactive') {
    if (enabled) {
      lastBackgroundAt = Date.now();
      clearBackgroundTimer();
      backgroundTimer = setTimeout(() => {
        try {
          useBiometric.getState().lockNow();
        } catch {}
        void clearClipboardNow();
        backgroundTimer = null;
        lastBackgroundAt = null;
      }, BACKGROUND_LOCK_DELAY_MS);
    }
  }
}

export function startAutoLock(): () => void {
  if (Platform.OS === 'web') return () => {};
  if (appStateSubscription) return () => stopAutoLock();
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  return () => stopAutoLock();
}

export function stopAutoLock() {
  if (appStateSubscription) {
    try { appStateSubscription.remove(); } catch {}
    appStateSubscription = null;
  }
  clearBackgroundTimer();
  lastBackgroundAt = null;
}

export const AUTO_LOCK_BACKGROUND_DELAY_MS = BACKGROUND_LOCK_DELAY_MS;

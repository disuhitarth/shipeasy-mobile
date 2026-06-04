import { AppState, AppStateStatus, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/store/auth';
import { useBiometric } from '@/store/biometric';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENT_INTERVAL_MS = 1000;

let lastActivityAt: number = Date.now();
let checkInterval: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;
let activityHandler: (() => void) | null = null;
let onTimeoutHandler: (() => void) | null = null;

function markActive() {
  lastActivityAt = Date.now();
}

function checkInactivity() {
  const { isAuthenticated, isGuest } = useAuth.getState();
  if (!isAuthenticated || isGuest) return;
  const elapsed = Date.now() - lastActivityAt;
  if (elapsed < INACTIVITY_TIMEOUT_MS) return;
  triggerTimeout();
}

function triggerTimeout() {
  if (onTimeoutHandler) {
    try { onTimeoutHandler(); } catch {}
  }
  try { useAuth.getState().logout(); } catch {}
  try { useBiometric.getState().lockNow(); } catch {}
  try { router.replace('/auth/login?reason=timeout'); } catch {}
}

function attachActivityListeners() {
  if (activityHandler) return;
  activityHandler = markActive;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.addEventListener('touchstart', activityHandler, { passive: true });
    document.addEventListener('mousedown', activityHandler, { passive: true });
    document.addEventListener('keydown', activityHandler, { passive: true });
    document.addEventListener('scroll', activityHandler, { passive: true });
  }
}

function detachActivityListeners() {
  if (!activityHandler) return;
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.removeEventListener('touchstart', activityHandler);
    document.removeEventListener('mousedown', activityHandler);
    document.removeEventListener('keydown', activityHandler);
    document.removeEventListener('scroll', activityHandler);
  }
  activityHandler = null;
}

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState === 'active') {
    markActive();
  }
}

export function startSessionTimeout(onTimeout?: () => void): () => void {
  onTimeoutHandler = onTimeout ?? null;
  markActive();
  attachActivityListeners();
  if (!checkInterval) {
    checkInterval = setInterval(checkInactivity, ACTIVITY_EVENT_INTERVAL_MS);
  }
  if (!appStateSub && Platform.OS !== 'web') {
    appStateSub = AppState.addEventListener('change', handleAppStateChange);
  }
  return () => stopSessionTimeout();
}

export function stopSessionTimeout() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  if (appStateSub) {
    try { appStateSub.remove(); } catch {}
    appStateSub = null;
  }
  detachActivityListeners();
  onTimeoutHandler = null;
}

export function notifyActivity() {
  markActive();
}

export const SESSION_TIMEOUT_MS = INACTIVITY_TIMEOUT_MS;

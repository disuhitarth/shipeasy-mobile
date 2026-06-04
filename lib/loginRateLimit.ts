import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ATTEMPT_KEY = 'login_attempts';
const LOCKOUT_KEY = 'login_lockout_until';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 1000;

interface LoginAttemptState {
  count: number;
  firstAt: number;
}

async function getStored(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}

async function setStored(key: string, val: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (val == null) localStorage.removeItem(key);
      else localStorage.setItem(key, val);
    } catch {}
    return;
  }
  try {
    if (val == null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, val);
  } catch {}
}

export async function getLoginLockout(): Promise<{ lockedUntil: number | null; remainingMs: number }> {
  const raw = await getStored(LOCKOUT_KEY);
  if (!raw) return { lockedUntil: null, remainingMs: 0 };
  const until = parseInt(raw, 10);
  if (!Number.isFinite(until)) {
    await setStored(LOCKOUT_KEY, null);
    return { lockedUntil: null, remainingMs: 0 };
  }
  const remainingMs = until - Date.now();
  if (remainingMs <= 0) {
    await setStored(LOCKOUT_KEY, null);
    await setStored(ATTEMPT_KEY, null);
    return { lockedUntil: null, remainingMs: 0 };
  }
  return { lockedUntil: until, remainingMs };
}

export async function isLoginLocked(): Promise<boolean> {
  const { remainingMs } = await getLoginLockout();
  return remainingMs > 0;
}

export async function recordFailedLogin(): Promise<{ attempts: number; lockedUntil: number | null; remainingMs: number }> {
  const raw = await getStored(ATTEMPT_KEY);
  let state: LoginAttemptState;
  try {
    state = raw ? JSON.parse(raw) : { count: 0, firstAt: Date.now() };
  } catch {
    state = { count: 0, firstAt: Date.now() };
  }
  state.count += 1;
  await setStored(ATTEMPT_KEY, JSON.stringify(state));

  if (state.count >= MAX_ATTEMPTS) {
    const until = Date.now() + LOCKOUT_DURATION_MS;
    await setStored(LOCKOUT_KEY, String(until));
    return { attempts: state.count, lockedUntil: until, remainingMs: LOCKOUT_DURATION_MS };
  }

  return { attempts: state.count, lockedUntil: null, remainingMs: 0 };
}

export async function recordSuccessfulLogin(): Promise<void> {
  await setStored(ATTEMPT_KEY, null);
  await setStored(LOCKOUT_KEY, null);
}

export async function getRemainingAttempts(): Promise<number> {
  const raw = await getStored(ATTEMPT_KEY);
  if (!raw) return MAX_ATTEMPTS;
  try {
    const state: LoginAttemptState = JSON.parse(raw);
    return Math.max(0, MAX_ATTEMPTS - state.count);
  } catch {
    return MAX_ATTEMPTS;
  }
}

export const LOGIN_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const LOGIN_LOCKOUT_MS = LOCKOUT_DURATION_MS;

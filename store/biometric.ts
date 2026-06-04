import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'biometric_enabled';
const UNLOCK_DURATION_KEY = 'biometric_unlock_duration';
const PIN_HASH_KEY = 'biometric_pin_hash';
const DEFAULT_UNLOCK_DURATION_MS = 5 * 60 * 1000;

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

function hashPin(pin: string, salt: string): string {
  let h = 0x811c9dc5;
  const combined = `${salt}::${pin}`;
  for (let i = 0; i < combined.length; i++) {
    h ^= combined.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let h2 = 0xdeadbeef;
  for (let i = 0; i < combined.length; i++) {
    h2 ^= combined.charCodeAt(i);
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `${h.toString(16)}-${h2.toString(16)}`;
}

interface BiometricState {
  enabled: boolean;
  loaded: boolean;
  locked: boolean;
  lastUnlockedAt: number | null;
  unlockSessionDuration: number;
  hasPin: boolean;
  load: () => Promise<void>;
  setEnabled: (val: boolean) => Promise<void>;
  lock: () => void;
  unlock: () => void;
  shouldRequireAuth: () => boolean;
  markUnlocked: () => void;
  lockNow: () => void;
  setUnlockDuration: (ms: number) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  clearPin: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
}

export const useBiometric = create<BiometricState>((set, get) => ({
  enabled: false,
  loaded: false,
  locked: false,
  lastUnlockedAt: null,
  unlockSessionDuration: DEFAULT_UNLOCK_DURATION_MS,
  hasPin: false,

  load: async () => {
    const [val, durationStr, pinHash] = await Promise.all([
      getStored(STORAGE_KEY),
      getStored(UNLOCK_DURATION_KEY),
      getStored(PIN_HASH_KEY),
    ]);
    const duration = durationStr ? parseInt(durationStr, 10) : DEFAULT_UNLOCK_DURATION_MS;
    set({
      enabled: val === 'true',
      loaded: true,
      locked: val === 'true',
      lastUnlockedAt: null,
      unlockSessionDuration: Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_UNLOCK_DURATION_MS,
      hasPin: !!pinHash,
    });
  },

  setEnabled: async (val: boolean) => {
    await setStored(STORAGE_KEY, val ? 'true' : 'false');
    set({
      enabled: val,
      locked: val,
      lastUnlockedAt: val ? Date.now() : null,
    });
  },

  lock: () => {
    if (get().enabled) set({ locked: true, lastUnlockedAt: null });
  },

  unlock: () => {
    set({ locked: false, lastUnlockedAt: Date.now() });
  },

  shouldRequireAuth: () => {
    const { enabled, locked, lastUnlockedAt, unlockSessionDuration } = get();
    if (!enabled) return false;
    if (locked) return true;
    if (lastUnlockedAt == null) return true;
    return Date.now() - lastUnlockedAt > unlockSessionDuration;
  },

  markUnlocked: () => {
    set({ locked: false, lastUnlockedAt: Date.now() });
  },

  lockNow: () => {
    set({ locked: true, lastUnlockedAt: null });
  },

  setUnlockDuration: async (ms: number) => {
    await setStored(UNLOCK_DURATION_KEY, String(ms));
    set({ unlockSessionDuration: ms });
  },

  setPin: async (pin: string) => {
    const salt = `se-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const hash = hashPin(pin, salt);
    await setStored(PIN_HASH_KEY, `${salt}::${hash}`);
    set({ hasPin: true });
  },

  clearPin: async () => {
    await setStored(PIN_HASH_KEY, null);
    set({ hasPin: false });
  },

  verifyPin: async (pin: string) => {
    const stored = await getStored(PIN_HASH_KEY);
    if (!stored) return false;
    const [salt, hash] = stored.split('::');
    if (!salt || !hash) return false;
    return hashPin(pin, salt) === hash;
  },
}));

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_PREFS = 'notification_prefs';
const KEY_APPEAR = 'appearance_prefs';
const KEY_ONBOARD = 'has_onboarded';
const KEY_LAST_VERSION = 'last_seen_version';

export interface NotificationPrefs {
  push: boolean;
  labelUpdates: boolean;
  walletAlerts: boolean;
  marketing: boolean;
}

export interface AppearancePrefs {
  darkMode: boolean;
  language: 'en' | 'fr';
}

const DEFAULT_PREFS: NotificationPrefs = {
  push: true,
  labelUpdates: true,
  walletAlerts: true,
  marketing: false,
};

const DEFAULT_APPEAR: AppearancePrefs = {
  darkMode: false,
  language: 'en',
};

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch { return fallback; }
  }
  try {
    const raw = await SecureStore.getItemAsync(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch { return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    return;
  }
  try { await SecureStore.setItemAsync(key, JSON.stringify(value)); } catch {}
}

async function readFlag(key: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  }
  try {
    const v = await SecureStore.getItemAsync(key);
    return v === '1';
  } catch { return false; }
}

async function writeFlag(key: string, value: boolean): Promise<void> {
  if (Platform.OS === 'web') {
    try { value ? localStorage.setItem(key, '1') : localStorage.removeItem(key); } catch {}
    return;
  }
  try {
    if (value) await SecureStore.setItemAsync(key, '1');
    else await SecureStore.deleteItemAsync(key);
  } catch {}
}

async function readString(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}

async function writeString(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, value); } catch {}
    return;
  }
  try { await SecureStore.setItemAsync(key, value); } catch {}
}

interface SettingsState {
  notificationPrefs: NotificationPrefs;
  appearancePrefs: AppearancePrefs;
  hasOnboarded: boolean;
  lastSeenVersion: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  setNotificationPref: (key: keyof NotificationPrefs, value: boolean) => Promise<void>;
  setAppearancePref: <K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) => Promise<void>;
  setOnboarded: (value: boolean) => Promise<void>;
  setLastSeenVersion: (version: string) => Promise<void>;
}

export const useSettings = create<SettingsState>((set) => ({
  notificationPrefs: DEFAULT_PREFS,
  appearancePrefs: DEFAULT_APPEAR,
  hasOnboarded: false,
  lastSeenVersion: null,
  loaded: false,

  load: async () => {
    const [n, a, onboarded, version] = await Promise.all([
      readJSON<NotificationPrefs>(KEY_PREFS, DEFAULT_PREFS),
      readJSON<AppearancePrefs>(KEY_APPEAR, DEFAULT_APPEAR),
      readFlag(KEY_ONBOARD),
      readString(KEY_LAST_VERSION),
    ]);
    set({
      notificationPrefs: n,
      appearancePrefs: a,
      hasOnboarded: onboarded,
      lastSeenVersion: version,
      loaded: true,
    });
  },

  setNotificationPref: async (key, value) => {
    set((s) => {
      const next = { ...s.notificationPrefs, [key]: value };
      writeJSON(KEY_PREFS, next);
      return { notificationPrefs: next };
    });
  },

  setAppearancePref: async (key, value) => {
    set((s) => {
      const next = { ...s.appearancePrefs, [key]: value };
      writeJSON(KEY_APPEAR, next);
      return { appearancePrefs: next };
    });
  },

  setOnboarded: async (value) => {
    set({ hasOnboarded: value });
    await writeFlag(KEY_ONBOARD, value);
  },

  setLastSeenVersion: async (version) => {
    set({ lastSeenVersion: version });
    await writeString(KEY_LAST_VERSION, version);
  },
}));

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'biometric_enabled';

async function getStored(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  }
  try { return (await SecureStore.getItemAsync(STORAGE_KEY)) === 'true'; } catch { return false; }
}

async function setStored(val: boolean): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false'); } catch {} return;
  }
  try { await SecureStore.setItemAsync(STORAGE_KEY, val ? 'true' : 'false'); } catch {}
}

interface BiometricState {
  enabled: boolean;
  loaded: boolean;
  locked: boolean;
  load: () => Promise<void>;
  setEnabled: (val: boolean) => Promise<void>;
  lock: () => void;
  unlock: () => void;
}

export const useBiometric = create<BiometricState>((set, get) => ({
  enabled: false,
  loaded: false,
  locked: false,

  load: async () => {
    const val = await getStored();
    set({ enabled: val, loaded: true, locked: val });
  },

  setEnabled: async (val: boolean) => {
    await setStored(val);
    set({ enabled: val, locked: val });
  },

  lock: () => {
    if (get().enabled) set({ locked: true });
  },

  unlock: () => set({ locked: false }),
}));

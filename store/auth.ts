import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import api, { setUnauthorizedHandler } from '@/lib/api';
import { track, identify, clearIdentity } from '@/lib/analytics';
import { setErrorUserId } from '@/lib/errorReporting';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  enableGuest: () => void;
  loadToken: () => Promise<void>;
}

let queryClientRef: { clear: () => void } | null = null;

export function setQueryClientRef(client: { clear: () => void }) {
  queryClientRef = client;
}

async function handleUnauthorized() {
  await removeToken();
  useAuth.setState({ user: null, isAuthenticated: false, isGuest: false });
  if (queryClientRef) {
    try { queryClientRef.clear(); } catch {}
  }
  try {
    router.replace('/auth/login');
  } catch {}
}

setUnauthorizedHandler(handleUnauthorized);

// SecureStore isn't available on web, provide fallback
async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem('auth_token'); } catch { return null; }
  }
  try { return await SecureStore.getItemAsync('auth_token'); } catch { return null; }
}

async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.setItem('auth_token', token); } catch {} return;
  }
  try { await SecureStore.setItemAsync('auth_token', token); } catch {}
}

async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem('auth_token'); } catch {} return;
  }
  try { await SecureStore.deleteItemAsync('auth_token'); } catch {}
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isGuest: false,

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/mobile-login', { email, password });
    const { token, user } = res.data;
    const normalized: User = { ...user, _id: user._id || user.id };
    await setToken(token);
    set({ user: normalized, isAuthenticated: true, isGuest: false });
    setErrorUserId(normalized._id);
    identify(normalized._id ?? 'unknown', { email: normalized?.email, name: normalized?.name });
    void track('user_login', { method: 'password' });
  },

  register: async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password });
    const res = await api.post('/auth/mobile-login', { email, password });
    const { token, user } = res.data;
    const normalized: User = { ...user, _id: user._id || user.id };
    await setToken(token);
    set({ user: normalized, isAuthenticated: true, isGuest: false });
    setErrorUserId(normalized._id);
    identify(normalized._id ?? 'unknown', { email: normalized?.email, name: normalized?.name });
    void track('user_register', { method: 'password' });
  },

  logout: async () => {
    void track('user_logout', {});
    await removeToken();
    set({ user: null, isAuthenticated: false, isGuest: false });
    clearIdentity();
    setErrorUserId(undefined);
  },

  enableGuest: () => {
    set({ isGuest: true, isAuthenticated: false, isLoading: false });
  },

  loadToken: async () => {
    try {
      const token = await getToken();
      if (!token) {
        return set({ isLoading: false, isGuest: true });
      }
      const res = await api.get('/auth/me');
      const raw = res.data.user;
      const user: User = { ...raw, _id: raw._id || raw.id };
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isGuest: false,
      });
      setErrorUserId(user?._id);
      identify(user?._id ?? 'unknown', { email: user?.email, name: user?.name });
    } catch {
      await removeToken();
      set({ isLoading: false, isGuest: true });
    }
  },
}));

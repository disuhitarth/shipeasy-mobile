import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '@/lib/api';
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
    await setToken(token);
    set({ user, isAuthenticated: true, isGuest: false });
  },

  register: async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password });
    // Log in immediately after registration
    const res = await api.post('/auth/mobile-login', { email, password });
    const { token, user } = res.data;
    await setToken(token);
    set({ user, isAuthenticated: true, isGuest: false });
  },

  logout: async () => {
    await removeToken();
    set({ user: null, isAuthenticated: false, isGuest: false });
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
      // Verify token and load user
      const res = await api.get('/auth/me');
      set({
        user: res.data.user,
        isAuthenticated: true,
        isLoading: false,
        isGuest: false,
      });
    } catch {
      // Token expired or invalid
      await removeToken();
      set({ isLoading: false, isGuest: true });
    }
  },
}));

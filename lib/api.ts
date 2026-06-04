import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_BASE = 'https://shipeasyplus.netlify.app/api';
const DEVICE_ID_KEY = 'shipeasy_device_id';

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

function generateDeviceId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `dev-${Date.now().toString(36)}-${rand}`;
}

async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      return id;
    } catch {
      return 'web-unknown';
    }
  }
  try {
    let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!id) {
      try {
        if (Platform.OS === 'ios') {
          const idfv = await Application.getIosIdForVendorAsync();
          if (idfv) id = `ios-${idfv}`;
        } else if (Platform.OS === 'android') {
          const androidId = (Application as any).getAndroidId?.();
          if (androidId) id = `and-${androidId}`;
        }
      } catch {}
      if (!id) id = generateDeviceId();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'dev-unknown';
  }
}

let deviceIdPromise: Promise<string> | null = null;

export async function getStableDeviceId(): Promise<string> {
  if (!deviceIdPromise) deviceIdPromise = getDeviceId();
  return deviceIdPromise;
}

function getClientVersion(): string {
  const cfg = (Constants.expoConfig as any) || (Constants.manifest as any) || {};
  return (
    cfg?.version ||
    cfg?.extra?.version ||
    Application.nativeApplicationVersion ||
    '1.0.0'
  );
}

function getDeviceName(): string {
  const cfg = (Constants.expoConfig as any) || {};
  return cfg?.deviceName || (Platform.OS === 'ios' ? 'iOS Device' : Platform.OS === 'android' ? 'Android Device' : 'Web Browser');
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}

  try {
    const deviceId = await getStableDeviceId();
    config.headers['X-Device-ID'] = deviceId;
    config.headers['X-Platform'] = Platform.OS;
    config.headers['X-Client-Version'] = getClientVersion();
    config.headers['X-Device-Name'] = getDeviceName();
  } catch {}

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string }>) => {
    if (error.response?.status === 401) {
      SecureStore.deleteItemAsync('auth_token').catch(() => {});
      if (onUnauthorized) {
        try {
          onUnauthorized();
        } catch {}
      }
    }
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    return Promise.reject(new ApiError(message, error.response?.status));
  },
);

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export default api;

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from './api';
import Constants from 'expo-constants';

export type AnalyticsEvent =
  | 'app_open'
  | 'screen_view'
  | 'user_login'
  | 'user_register'
  | 'user_logout'
  | 'shipment_created'
  | 'shipment_voided'
  | 'wallet_topup'
  | 'wallet_low_balance'
  | 'address_added'
  | 'sku_added'
  | 'notification_received'
  | 'notification_tapped'
  | 'error'
  | 'biometric_auth_success'
  | 'biometric_auth_failed'
  | 'suspicious_login'
  | 'login_rate_limited'
  | 'session_timeout'
  | 'screen_capture_blocked'
  | 'pin_lock_used'
  | 'device_revoked';

export interface AnalyticsEventPayload {
  event: AnalyticsEvent;
  props?: Record<string, unknown>;
  ts: number;
  sessionId: string;
  userId?: string;
  appVersion?: string;
  platform?: string;
}

const QUEUE_KEY = 'analytics_queue_v1';
const SESSION_KEY = 'analytics_session_v1';
const MAX_QUEUE = 200;
const FLUSH_THRESHOLD = 10;
const FLUSH_INTERVAL_MS = 30_000;

let userId: string | undefined;
let sessionId: string | undefined;
let userTraits: Record<string, unknown> | undefined;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let listeners: Array<(payload: AnalyticsEventPayload) => void> = [];
let initialized = false;
let queue: AnalyticsEventPayload[] = [];

function uuid(): string {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  );
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

function getClientVersion(): string {
  const cfg = (Constants.expoConfig as any) || (Constants.manifest as any) || {};
  return cfg?.version || cfg?.extra?.version || '1.0.0';
}

function buildPayload(event: AnalyticsEvent, props?: Record<string, unknown>): AnalyticsEventPayload {
  return {
    event,
    props,
    ts: Date.now(),
    sessionId: sessionId || 'unknown',
    userId,
    appVersion: getClientVersion(),
    platform: Platform.OS,
  };
}

async function enqueue(payload: AnalyticsEventPayload): Promise<void> {
  queue.push(payload);
  if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
  listeners.forEach((fn) => {
    try { fn(payload); } catch {}
  });
  try {
    await setStored(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

async function flush(): Promise<void> {
  if (queue.length === 0) return;
  if (Platform.OS === 'web' && (!navigator || !navigator.onLine)) return;
  const toSend = queue.slice();
  try {
    await api.post('/analytics/events', { events: toSend });
    queue = queue.filter((p) => !toSend.includes(p));
    await setStored(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // keep queue; will retry on next flush
  }
}

export async function initAnalytics(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    const stored = await getStored(QUEUE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) queue = parsed.filter(Boolean).slice(-MAX_QUEUE);
    }
    let sid = await getStored(SESSION_KEY);
    if (!sid) {
      sid = uuid();
      await setStored(SESSION_KEY, sid);
    }
    sessionId = sid;
  } catch {
    sessionId = uuid();
  }
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(() => {
    if (queue.length >= FLUSH_THRESHOLD) void flush();
  }, FLUSH_INTERVAL_MS);
}

export async function track(event: AnalyticsEvent, props?: Record<string, unknown>): Promise<void> {
  if (!initialized) await initAnalytics();
  await enqueue(buildPayload(event, props));
  if (queue.length >= FLUSH_THRESHOLD) void flush();
}

export function identify(userIdValue: string, traits?: Record<string, unknown>): void {
  userId = userIdValue;
  userTraits = traits;
}

let currentScreen: string | null = null;

export function setCurrentScreen(name: string): void {
  if (currentScreen === name) return;
  currentScreen = name;
  void page(name);
}

export function clearIdentity(): void {
  userId = undefined;
  userTraits = undefined;
}

export async function page(name: string, props?: Record<string, unknown>): Promise<void> {
  await track('screen_view', { name, ...props });
}

export function subscribe(fn: (payload: AnalyticsEventPayload) => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export async function flushNow(): Promise<void> {
  await flush();
}

export async function resetAnalytics(): Promise<void> {
  queue = [];
  await setStored(QUEUE_KEY, null);
  userId = undefined;
  userTraits = undefined;
  sessionId = uuid();
  await setStored(SESSION_KEY, sessionId);
}

export const __test = { enqueue, get queue() { return queue; } };

const LAST_LOGIN_KEY = 'analytics_last_login';

export interface LoginLocation {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  ip?: string;
  at: number;
}

export interface SuspiciousCheckResult {
  suspicious: boolean;
  reasons: string[];
  current?: LoginLocation;
  previous?: LoginLocation | null;
}

const FREE_GEO_APIS = [
  'https://ipapi.co/json/',
  'https://ipwho.is/',
];

async function fetchGeoFromApi(url: string, timeoutMs: number = 4000): Promise<LoginLocation | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data?.success === false) return null;
    return {
      country: data.country_name || data.country,
      countryCode: data.country_code || data.countryCode,
      region: data.region || data.region_name,
      city: data.city,
      ip: data.ip || data.query,
      at: Date.now(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function getCurrentLoginLocation(): Promise<LoginLocation | null> {
  if (Platform.OS === 'web' && typeof fetch === 'undefined') return null;
  for (const url of FREE_GEO_APIS) {
    try {
      const loc = await fetchGeoFromApi(url);
      if (loc && (loc.country || loc.ip)) return loc;
    } catch {}
  }
  return null;
}

export async function getLastLoginLocation(): Promise<LoginLocation | null> {
  const raw = await getStored(LAST_LOGIN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LoginLocation; } catch { return null; }
}

export async function recordLoginLocation(loc: LoginLocation | null): Promise<void> {
  if (!loc) return;
  try {
    await setStored(LAST_LOGIN_KEY, JSON.stringify(loc));
  } catch {}
}

function isUnusualHour(at: number): boolean {
  const hour = new Date(at).getHours();
  return hour >= 1 && hour <= 5;
}

export async function checkSuspiciousLogin(
  current?: LoginLocation | null,
  previous?: LoginLocation | null,
): Promise<SuspiciousCheckResult> {
  const reasons: string[] = [];
  if (!current) {
    return { suspicious: false, reasons, current: current ?? undefined, previous: previous ?? null };
  }
  if (previous) {
    if (current.countryCode && previous.countryCode && current.countryCode !== previous.countryCode) {
      reasons.push(`Country changed (${previous.countryCode} → ${current.countryCode})`);
    } else if (current.country && previous.country && current.country !== previous.country) {
      reasons.push(`Country changed`);
    }
    const hours = Math.abs(current.at - previous.at) / 3_600_000;
    if (hours < 2) {
      reasons.push('Login from a new location less than 2 hours after the previous one');
    }
  }
  if (isUnusualHour(current.at)) {
    reasons.push('Sign-in at an unusual hour');
  }
  return { suspicious: reasons.length > 0, reasons, current, previous: previous ?? null };
}

export async function checkAndRecordLogin(): Promise<SuspiciousCheckResult> {
  const [current, previous] = await Promise.all([
    getCurrentLoginLocation().catch(() => null),
    getLastLoginLocation().catch(() => null),
  ]);
  const result = await checkSuspiciousLogin(current, previous);
  if (current) await recordLoginLocation(current);
  return result;
}

export function describeLocation(loc: LoginLocation | null | undefined): string {
  if (!loc) return 'Unknown location';
  const parts = [loc.city, loc.region, loc.country].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(', ') : loc.ip || 'Unknown';
}

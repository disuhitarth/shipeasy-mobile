import { Platform, AppState, AppStateStatus } from 'react-native';
import { useEffect, useState } from 'react';

export type ConnectionState = 'online' | 'offline' | 'unknown';

interface Listener {
  (state: ConnectionState): void;
}

let currentState: ConnectionState = 'unknown';
const listeners = new Set<Listener>();
let appStateSub: { remove: () => void } | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;

function notify(state: ConnectionState) {
  if (currentState === state) return;
  currentState = state;
  for (const fn of listeners) {
    try {
      fn(state);
    } catch {}
  }
}

async function probe(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }
  return true;
}

async function check(): Promise<void> {
  const ok = await probe();
  notify(ok ? 'online' : 'offline');
}

function startHeartbeat() {
  if (heartbeat) return;
  heartbeat = setInterval(() => {
    void check();
  }, 15_000);
}

function stopHeartbeat() {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
}

function handleAppStateChange(next: AppStateStatus) {
  if (next === 'active') {
    void check();
  }
}

export function startConnectionMonitor(): () => void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const online = () => notify('online');
      const offline = () => notify('offline');
      window.addEventListener('online', online);
      window.addEventListener('offline', offline);
      void check();
      return () => {
        window.removeEventListener('online', online);
        window.removeEventListener('offline', offline);
      };
    }
  }
  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', handleAppStateChange);
  }
  startHeartbeat();
  void check();
  return () => {
    if (appStateSub) {
      try { appStateSub.remove(); } catch {}
      appStateSub = null;
    }
    stopHeartbeat();
  };
}

export function getConnectionState(): ConnectionState {
  return currentState;
}

export function subscribeConnection(fn: (state: ConnectionState) => void): () => void {
  listeners.add(fn);
  try {
    fn(currentState);
  } catch {}
  return () => {
    listeners.delete(fn);
  };
}

export function useConnectionState(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(currentState);
  useEffect(() => {
    return subscribeConnection(setState);
  }, []);
  return state;
}

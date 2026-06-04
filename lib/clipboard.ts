import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

const DEFAULT_CLEAR_MS = 60 * 1000;
const lastCopiedTokens = new Map<string, ReturnType<typeof setTimeout>>();

let lastSetText: string | null = null;
let lastSetAt = 0;
let pendingClear: ReturnType<typeof setTimeout> | null = null;

export async function copySensitive(text: string, clearMs: number = DEFAULT_CLEAR_MS): Promise<boolean> {
  if (!text) return false;
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(el);
      }
    } else {
      await Clipboard.setStringAsync(text);
    }
  } catch {
    return false;
  }

  lastSetText = text;
  lastSetAt = Date.now();

  const prev = lastCopiedTokens.get(token);
  if (prev) clearTimeout(prev);

  const t = setTimeout(() => {
    void clearClipboardNow();
    lastCopiedTokens.delete(token);
  }, clearMs);
  lastCopiedTokens.set(token, t);
  return true;
}

export async function clearClipboardNow(): Promise<void> {
  if (pendingClear) {
    clearTimeout(pendingClear);
    pendingClear = null;
  }
  lastSetText = null;
  lastSetAt = 0;
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText('');
      }
    } else {
      await Clipboard.setStringAsync('');
    }
  } catch {}
}

export function getLastClipboardInfo(): { text: string | null; at: number } {
  return { text: lastSetText, at: lastSetAt };
}

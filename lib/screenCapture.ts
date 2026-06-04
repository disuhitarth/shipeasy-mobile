import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';

const protectedKeys = new Set<string>();

function getKey(key: string): string {
  return `shipeasy:screencapture:${key}`;
}

export async function preventCapture(key: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const k = getKey(key);
  if (protectedKeys.has(k)) return;
  try {
    await ScreenCapture.preventScreenCaptureAsync(k);
    protectedKeys.add(k);
  } catch {}
}

export async function allowCapture(key: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const k = getKey(key);
  if (!protectedKeys.has(k)) return;
  try {
    await ScreenCapture.allowScreenCaptureAsync(k);
  } catch {}
  protectedKeys.delete(k);
}

export function isCaptureProtected(key: string): boolean {
  return protectedKeys.has(getKey(key));
}

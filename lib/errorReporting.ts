import { Platform } from 'react-native';
import api from './api';
import { track } from './analytics';
import Constants from 'expo-constants';

export type ErrorLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

export interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

export interface ErrorReport {
  name: string;
  message: string;
  stack?: string;
  level: ErrorLevel;
  context?: ErrorContext;
  ts: number;
  appVersion?: string;
  platform?: string;
}

let originalConsoleError: typeof console.error | null = null;
let originalConsoleWarn: typeof console.warn | null = null;
let userId: string | undefined;
let currentScreen: string | undefined;
let initialized = false;

function appVersion(): string | undefined {
  return (Constants.expoConfig as any)?.version;
}

function platformName(): string {
  return Platform.OS;
}

function serializeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  if (typeof err === 'string') {
    return { name: 'StringError', message: err };
  }
  try {
    return { name: 'UnknownError', message: JSON.stringify(err) };
  } catch {
    return { name: 'UnknownError', message: String(err) };
  }
}

async function postReport(report: ErrorReport): Promise<boolean> {
  try {
    await api.post('/errors', { report }, { timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}

function buildContext(): ErrorContext {
  return {
    screen: currentScreen,
    userId,
  };
}

export async function reportError(
  error: unknown,
  context?: ErrorContext | string,
): Promise<void> {
  const ctx: ErrorContext | undefined =
    typeof context === 'string' ? { action: context } : context;
  const { name, message, stack } = serializeError(error);
  const report: ErrorReport = {
    name,
    message,
    stack,
    level: 'error',
    context: { ...buildContext(), ...(ctx ?? {}) },
    ts: Date.now(),
    appVersion: appVersion(),
    platform: platformName(),
  };
  if (__DEV__) {
    console.error('[errorReporting]', name, message, ctx ?? {});
  }
  try {
    await track('error', {
      name,
      message,
      screen: report.context?.screen,
      action: report.context?.action,
    });
  } catch {}
  void postReport(report);
}

export async function reportMessage(message: string, level: ErrorLevel = 'info'): Promise<void> {
  const report: ErrorReport = {
    name: 'Message',
    message,
    level,
    context: buildContext(),
    ts: Date.now(),
    appVersion: appVersion(),
    platform: platformName(),
  };
  if (__DEV__) {
    if (level === 'error' || level === 'fatal') {
      console.error('[errorReporting]', level, message);
    } else {
      console.warn('[errorReporting]', level, message);
    }
  }
  void postReport(report);
}

export function setCurrentScreen(name: string | undefined): void {
  currentScreen = name;
}

export function setErrorUserId(id: string | undefined): void {
  userId = id;
}

export function installGlobalErrorHandler(): void {
  if (initialized) return;
  initialized = true;

  if (typeof globalThis !== 'undefined') {
    const ErrorUtils = (globalThis as any).ErrorUtils;
    if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
      const previous = ErrorUtils.getGlobalHandler?.();
      ErrorUtils.setGlobalHandler(async (err: Error, isFatal?: boolean) => {
        try {
          await reportError(err, { action: isFatal ? 'uncaught_fatal' : 'uncaught' });
        } catch {}
        if (typeof previous === 'function') {
          try {
            previous(err, isFatal);
          } catch {}
        }
      });
    }
  }

  if (Platform.OS !== 'web') {
    const ExceptionsManager = require('react-native/Libraries/Core/ExceptionsManager')
      ?.default;
    if (ExceptionsManager && typeof ExceptionsManager.installErrorFilter === 'function') {
      try {
        ExceptionsManager.installErrorFilter?.();
      } catch {}
    }
  }

  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;
  console.error = (...args: unknown[]) => {
    try {
      const err = args.find((a) => a instanceof Error);
      if (err) {
        void reportError(err, { action: 'console.error' });
      } else {
        const message = args
          .map((a) => (typeof a === 'string' ? a : safeStringify(a)))
          .join(' ');
        void reportMessage(message, 'error');
      }
    } catch {}
    if (originalConsoleError) {
      originalConsoleError.apply(console, args as any);
    } else {
      console.log.apply(console, args as any);
    }
  };
  console.warn = (...args: unknown[]) => {
    try {
      const err = args.find((a) => a instanceof Error);
      if (err) {
        void reportError(err, { action: 'console.warn' });
      } else {
        const message = args
          .map((a) => (typeof a === 'string' ? a : safeStringify(a)))
          .join(' ');
        void reportMessage(message, 'warning');
      }
    } catch {}
    if (originalConsoleWarn) {
      originalConsoleWarn.apply(console, args as any);
    } else {
      console.log.apply(console, args as any);
    }
  };

  if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
    const handleRejection = (event: any) => {
      const reason = event?.reason ?? event;
      void reportError(reason, { action: 'unhandledrejection' });
    };
    try {
      globalThis.addEventListener('unhandledrejection', handleRejection);
    } catch {}
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function uninstallGlobalErrorHandler(): void {
  if (originalConsoleError) {
    console.error = originalConsoleError;
    originalConsoleError = null;
  }
  if (originalConsoleWarn) {
    console.warn = originalConsoleWarn;
    originalConsoleWarn = null;
  }
  initialized = false;
}
